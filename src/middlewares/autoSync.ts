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
					count = await syncService.syncAnimeList(source, data) || data.length;
				} else if (data?.ongoing || data?.completed) {
					const homeData = data as any;
					if (Array.isArray(homeData.ongoing)) {
						const c = await syncService.syncAnimeList(source, homeData.ongoing) || 0;
						count += c;
					}
					if (Array.isArray(homeData.completed)) {
						const c = await syncService.syncAnimeList(source, homeData.completed) || 0;
						count += c;
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
					const animeCards = data.map((item: any) => ({
						slug: item.slug || item.animeId || "",
						title: item.title || "",
						poster: item.poster || "",
					})).filter((a) => a.slug && a.title);
					count = await syncService.syncAnimeList(source, animeCards) || animeCards.length;
				}
				break;
		}

		await syncService.logSyncFinish(logId, "success", count);
	} catch (err: any) {
		await syncService.logSyncFinish(logId, "failed", 0, err?.message);
	}
}
