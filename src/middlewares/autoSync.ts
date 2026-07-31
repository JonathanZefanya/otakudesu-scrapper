import type { Request, Response, NextFunction } from "express";
import { isSupabaseReady } from "../lib/supabase.js";
import * as syncService from "../lib/sync-service.js";

/**
 * Map route path → sync type
 */
function getSyncType(path: string): string | null {
	if (path === "/home") return "home";
	if (path.startsWith("/schedule")) return "schedule";
	if (path === "/anime" || path.startsWith("/anime/")) return "anime";
	if (path.startsWith("/genre") || path.startsWith("/genres")) return "genres";
	if (path === "/ongoing") return "ongoing";
	if (path === "/completed") return "completed";
	if (path.startsWith("/search")) return "search";
	return null;
}

/**
 * Auto-sync middleware.
 * Mencegat `res.json()` — setelah response terkirim, simpan data ke Supabase.
 * Hanya aktif jika Supabase terkonfigurasi.
 *
 * Usage:
 *   router.use(autoSync("otakudesu"));
 */
export function autoSync(sourceId: string) {
	// Deteksi source dari file config
	const sourceMap: Record<string, string> = {
		otakudesu: "otakudesu",
		kuramanime: "kuramanime",
		oploverz: "oploverz",
		nimegami: "nimegami",
	};
	const source = sourceMap[sourceId] || sourceId;

	return (req: Request, res: Response, next: NextFunction): void => {
		if (!isSupabaseReady()) {
			next();
			return;
		}

		const syncType = getSyncType(req.path);
		if (!syncType) {
			next();
			return;
		}

		const originalJson = res.json.bind(res);
		res.json = function (body: unknown) {
			// Kirim response dulu
			const result = originalJson(body);

			// Lalu sync ke database (async, jangan blokir response)
			if (res.statusCode >= 200 && res.statusCode < 300) {
				syncResponse(source, syncType, body).catch((err) => {
					console.error(`[autoSync] ${source}/${syncType}:`, err?.message || err);
				});
			}

			return result;
		};

		next();
	};
}

/** Slug dari URL anime, dipakai untuk item yang hanya membawa tautan. */
function slugFromUrl(url: unknown): string {
	if (typeof url !== "string" || !url) return "";

	return url.split("?")[0]!.split("/").filter(Boolean).pop() ?? "";
}

/**
 * Normalkan kartu anime dari response menjadi baris tabel `anime`.
 *
 * Bentuk response tidak seragam:
 * - nama field slug berbeda per sumber — otakudesu memakai `animeId`,
 *   sumber lain `slug`, dan sebagian hanya punya `url`;
 * - endpoint A-Z dan jadwal rilis mengembalikan kelompok berisi `animeList`,
 *   bukan kartu anime langsung.
 *
 * Kolom `slug` dan `title` NOT NULL di database dan satu batch upsert ditolak
 * seluruhnya kalau ada satu baris kosong, jadi entri tak lengkap dibuang di
 * sini alih-alih diserahkan ke Postgres.
 */
function toAnimeRows(items: unknown[]): Array<{
	slug: string;
	title: string;
	poster?: string;
	type?: string;
	status?: string;
	score?: string;
	episode?: string;
}> {
	const flat = items.flatMap((raw) => {
		const item = (raw ?? {}) as Record<string, any>;
		return Array.isArray(item.animeList) ? item.animeList : [item];
	});

	return flat
		.map((raw) => {
			const item = (raw ?? {}) as Record<string, any>;
			const slug =
				String(item.slug ?? item.animeId ?? item.anime_id ?? "").trim() ||
				slugFromUrl(item.url ?? item.sourceUrl);

			return {
				slug,
				title: String(item.title ?? "").trim(),
				poster: item.poster || undefined,
				type: item.type || undefined,
				status: item.status || undefined,
				score: item.score || item.rating || undefined,
				episode: item.episodes || item.episode || undefined,
			};
		})
		.filter((item) => item.slug && item.title);
}

/**
 * Sync response body ke Supabase berdasarkan type.
 */
async function syncResponse(source: string, type: string, body: unknown): Promise<void> {
	const data = (body as any)?.data;
	if (!data) return;

	const logId = await syncService.logSyncStart(source, type);

	try {
		let count = 0;

		switch (type) {
			case "home":
				await syncService.syncHome(source, data);
				count = typeof data === "object" ? Object.keys(data).length : 0;
				break;

			case "ongoing":
			case "completed":
			case "search":
			case "anime": {
				if (Array.isArray(data)) {
					count = await syncService.syncAnimeList(source, toAnimeRows(data));
				} else if (data?.ongoing || data?.completed) {
					const homeData = data as any;
					if (Array.isArray(homeData.ongoing)) {
						count += await syncService.syncAnimeList(source, toAnimeRows(homeData.ongoing));
					}
					if (Array.isArray(homeData.completed)) {
						count += await syncService.syncAnimeList(source, toAnimeRows(homeData.completed));
					}
				}
				break;
			}

			case "genres": {
				if (Array.isArray(data)) {
					const genres = data.map((g: any) => ({
						name: g.title || g.name || "",
						slug: g.genreId || g.slug || "",
					})).filter((g) => g.name && g.slug);
					await syncService.syncGenres(source, genres);
					count = genres.length;
				}
				break;
			}

			case "schedule":
				// Schedule items usually contain anime references
				if (Array.isArray(data)) {
					count = await syncService.syncAnimeList(source, toAnimeRows(data));
				}
				break;
		}

		await syncService.logSyncFinish(logId, "success", count);
	} catch (err: any) {
		await syncService.logSyncFinish(logId, "failed", 0, err?.message);
	}
}
