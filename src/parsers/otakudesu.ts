import type { HTMLElement } from "node-html-parser";
import { NotFoundError } from "../lib/errors.js";
import { Text, Id, Src, Num, Attr, AnimeSrc } from "./utils.js";
import type { Otakudesu, UrlLink, Quality, Format, Server, Pagination } from "../types/index.js";
import { sources } from "../config/index.js";

const baseUrl = sources.otakudesu.baseUrl;

/**
 * Blok info anime berbentuk `<p><span><b>Label</b>: nilai</span></p>` di dalam
 * `.infozingle`. Dibaca berdasarkan label — bukan urutan — supaya tidak pecah
 * ketika Otakudesu menambah atau menghapus baris.
 */
function parseInfoMap(doc: HTMLElement): Record<string, string> {
	const map: Record<string, string> = {};

	for (const row of doc.querySelectorAll(".infozingle p")) {
		const labelEl = row.querySelector("b");
		if (!labelEl) continue;

		const label = Text(labelEl).replace(/:\s*$/, "").trim().toLowerCase();
		if (!label) continue;

		const value = Text(row).slice(Text(labelEl).length).replace(/^\s*:\s*/, "").trim();
		map[label] = value;
	}

	return map;
}

/** Ambil nilai info pertama yang cocok dari beberapa kemungkinan label. */
function pickInfo(map: Record<string, string>, ...labels: string[]): string {
	for (const label of labels) {
		const value = map[label];
		if (value) return value;
	}
	return "";
}

function parseOngoingCard(el: HTMLElement): Otakudesu.OngoingCard {
	const titleEl = el.querySelector(".thumbz h2");
	if (!titleEl) throw new NotFoundError("Ongoing card title not found");

	return {
		title: Text(titleEl),
		poster: Src(el.querySelector(".thumbz img")),
		episodes: Text(el.querySelector(".epz")),
		releaseDay: Text(el.querySelector(".epztipe")),
		releaseDate: Text(el.querySelector(".newnime")),
		animeId: Id(el.querySelector("a")),
		sourceUrl: AnimeSrc(el.querySelector("a"), baseUrl),
	};
}

function parseCompletedCard(el: HTMLElement): Otakudesu.CompletedCard {
	const titleEl = el.querySelector(".thumbz h2");
	if (!titleEl) throw new NotFoundError("Completed card title not found");

	return {
		title: Text(titleEl),
		poster: Src(el.querySelector(".thumbz img")),
		episodes: Text(el.querySelector(".epz")),
		score: Text(el.querySelector(".epztipe")),
		lastRelease: Text(el.querySelector(".newnime")),
		animeId: Id(el.querySelector("a")),
		sourceUrl: AnimeSrc(el.querySelector("a"), baseUrl),
	};
}

export function parseHome(doc: HTMLElement): Otakudesu.Home {
	const venzContainers = doc.querySelectorAll(".venz");

	const ongoing: Otakudesu.OngoingCard[] = [];
	const ongoingEls = venzContainers[0]?.querySelectorAll("ul li") ?? [];
	for (const el of ongoingEls) {
		ongoing.push(parseOngoingCard(el));
	}

	const completed: Otakudesu.CompletedCard[] = [];
	const completedEls = venzContainers[1]?.querySelectorAll("ul li") ?? [];
	for (const el of completedEls) {
		completed.push(parseCompletedCard(el));
	}

	if (!ongoing.length && !completed.length) {
		throw new NotFoundError("No anime found on home page");
	}

	return { ongoing, completed };
}

export function parseSchedules(doc: HTMLElement): Otakudesu.ScheduleCollection[] {
	const dayContainers = doc.querySelectorAll(".kglist321");
	if (!dayContainers.length) throw new NotFoundError("No schedule data found");

	const result: Otakudesu.ScheduleCollection[] = [];
	for (const container of dayContainers) {
		const dayEl = container.querySelector("h2");
		if (!dayEl) continue;

		const animeList: UrlLink[] = [];
		const linkEls = container.querySelectorAll("ul li a");
		for (const link of linkEls) {
			animeList.push({
				title: Text(link),
				url: AnimeSrc(link, baseUrl) || "",
			});
		}

		if (animeList.length) {
			result.push({ day: Text(dayEl), animeList });
		}
	}

	if (!result.length) throw new NotFoundError("No schedule data found");
	return result;
}

export function parseAllAnimes(doc: HTMLElement): Otakudesu.AnimeCollection[] {
	const letterContainers = doc.querySelectorAll(".bariskelom");
	if (!letterContainers.length) throw new NotFoundError("No anime list found");

	const result: Otakudesu.AnimeCollection[] = [];
	for (const container of letterContainers) {
		const initialEl = container.querySelector(".barispenz a, b");
		if (!initialEl) continue;

		const animeList: UrlLink[] = [];
		const linkEls = container.querySelectorAll("ul li a");
		for (const link of linkEls) {
			animeList.push({
				title: Text(link),
				url: AnimeSrc(link, baseUrl) || "",
			});
		}

		if (animeList.length) {
			result.push({ initial: Text(initialEl), animeList });
		}
	}

	if (!result.length) throw new NotFoundError("No anime list found");
	return result;
}

export function parseAllGenres(doc: HTMLElement): Otakudesu.GenreCard[] {
	const genreLinks = doc.querySelectorAll("ul.genres li a");
	if (!genreLinks.length) throw new NotFoundError("No genres found");

	const result: Otakudesu.GenreCard[] = [];
	for (const el of genreLinks) {
		result.push({
			title: Text(el),
			genreId: Id(el),
			sourceUrl: AnimeSrc(el, baseUrl),
		});
	}

	return result;
}

export function parseOngoingAnimes(doc: HTMLElement): Otakudesu.OngoingCard[] {
	const items = doc.querySelectorAll(".venz ul li");
	if (!items.length) throw new NotFoundError("No ongoing anime found");

	const result: Otakudesu.OngoingCard[] = [];
	for (const el of items) {
		result.push(parseOngoingCard(el));
	}

	return result;
}

export function parseCompletedAnimes(doc: HTMLElement): Otakudesu.CompletedCard[] {
	const items = doc.querySelectorAll(".venz ul li");
	if (!items.length) throw new NotFoundError("No completed anime found");

	const result: Otakudesu.CompletedCard[] = [];
	for (const el of items) {
		result.push(parseCompletedCard(el));
	}

	return result;
}

export function parseSearchedAnimes(doc: HTMLElement): Otakudesu.SearchedAnime[] {
	const items = doc.querySelectorAll("ul.chivsrc li");
	if (!items.length) throw new NotFoundError("No search results found");

	const result: Otakudesu.SearchedAnime[] = [];
	for (const el of items) {
		const titleEl = el.querySelector("h2 a");
		if (!titleEl) continue;

		const img = el.querySelector("img");
		// `.set` sendiri adalah div berisi label — bukan pembungkus div lain.
		const setDivs = el.querySelectorAll(".set");

		let score = "";
		let status = "";
		const genres: string[] = [];

		for (const div of setDivs) {
			const labelEl = div.querySelector("b");
			if (!labelEl) continue;
			const label = Text(labelEl);
			const value = Text(div).replace(Text(labelEl), "").replace(":", "").trim();

			if (/^(skrip|score|rating)/i.test(label)) {
				score = value;
			} else if (/^status/i.test(label)) {
				status = value;
			} else if (/^genre/i.test(label)) {
				const genreLinks = div.querySelectorAll("a");
				for (const g of genreLinks) {
					genres.push(Text(g));
				}
			}
		}

		result.push({
			title: Text(titleEl),
			poster: Src(img),
			score,
			status,
			genres,
			animeId: Id(titleEl),
			sourceUrl: AnimeSrc(titleEl, baseUrl),
		});
	}

	if (!result.length) throw new NotFoundError("No search results found");
	return result;
}

export function parseAnimesByGenre(doc: HTMLElement): Otakudesu.GenreFilteredAnime[] {
	const items = doc.querySelectorAll(".col-anime");
	if (!items.length) throw new NotFoundError("No anime found for this genre");

	const result: Otakudesu.GenreFilteredAnime[] = [];
	for (const el of items) {
		const titleEl = el.querySelector(".col-anime-title a");
		const posterEl = el.querySelector(".col-anime-cover img");
		const synopsisEl = el.querySelector(".col-synopsis, .col-anime-sinopsis");
		const studiosEl = el.querySelector(".col-anime-studio");
		const seasonEl = el.querySelector(".col-anime-date");
		const scoreEl = el.querySelector(".col-anime-rating");
		// Halaman genre tidak menampilkan status; jumlah episode yang tersedia.
		const statusEl = el.querySelector(".col-anime-eps");
		if (!titleEl) continue;

		const synopsisText = Text(synopsisEl);
		const genres: UrlLink[] = [];
		const genreLinks = el.querySelectorAll(".col-anime-genre a, .col-anime-genres a");
		for (const g of genreLinks) {
			genres.push({
				title: Text(g),
				url: AnimeSrc(g, baseUrl) || "",
			});
		}

		result.push({
			title: Text(titleEl),
			poster: Src(posterEl),
			synopsis: synopsisText,
			studios: Text(studiosEl),
			season: Text(seasonEl),
			score: Text(scoreEl),
			status: Text(statusEl),
			genres,
			animeId: Id(titleEl),
			sourceUrl: AnimeSrc(titleEl, baseUrl),
		});
	}

	if (!result.length) throw new NotFoundError("No anime found for this genre");
	return result;
}

export function parseAnimeDetails(doc: HTMLElement): Otakudesu.AnimeDetails {
	const headingEl = doc.querySelector(".jdlrx h1, .venutama h1");
	const info = parseInfoMap(doc);

	const title = pickInfo(info, "judul") || Text(headingEl);
	if (!title) throw new NotFoundError("Anime detail title not found");

	const posterEl = doc.querySelector(".fotoanime img");

	const paragraphList: string[] = [];
	for (const p of doc.querySelectorAll(".sinopc p")) {
		const t = Text(p);
		if (t) paragraphList.push(t);
	}

	// Satu-satunya tautan di dalam blok info adalah genre.
	const genreList: UrlLink[] = [];
	for (const g of doc.querySelectorAll(".infozingle p a")) {
		genreList.push({
			title: Text(g),
			url: AnimeSrc(g, baseUrl) || "",
		});
	}

	// Halaman memuat beberapa blok `.episodelist`: batch, daftar episode, dan
	// kadang lens/movie. Dipisahkan lewat judul blok (`.monktit`).
	const episodeList: UrlLink[] = [];
	let batchLink: UrlLink | null = null;

	for (const block of doc.querySelectorAll(".episodelist")) {
		const blockTitle = Text(block.querySelector(".monktit"));
		const links = block.querySelectorAll("ul li a");
		const isBatch = /batch/i.test(blockTitle);

		for (const link of links) {
			const entry = { title: Text(link), url: AnimeSrc(link, baseUrl) || "" };

			if (isBatch) {
				batchLink ??= entry;
			} else {
				episodeList.push(entry);
			}
		}
	}

	const recommendedAnimeList: Otakudesu.RecommendedAnime[] = [];
	for (const card of doc.querySelectorAll("#recommend-anime-series .isi-konten")) {
		const linkEl = card.querySelector(".judul-anime a");
		if (!linkEl) continue;

		recommendedAnimeList.push({
			title: Text(linkEl),
			url: AnimeSrc(linkEl, baseUrl) || "",
			poster: Src(card.querySelector("img")),
			animeId: Id(linkEl),
		});
	}

	return {
		title,
		japanese: pickInfo(info, "japanese"),
		score: pickInfo(info, "skor", "score", "rating"),
		producers: pickInfo(info, "produser", "producers"),
		type: pickInfo(info, "tipe", "type"),
		status: pickInfo(info, "status"),
		episodes: pickInfo(info, "total episode", "episodes"),
		duration: pickInfo(info, "durasi", "duration"),
		aired: pickInfo(info, "tanggal rilis", "aired"),
		studios: pickInfo(info, "studio", "studios"),
		poster: Src(posterEl),
		synopsis: {
			paragraphList,
		},
		batchLink,
		genreList,
		episodeList,
		recommendedAnimeList,
	};
}

function parseQualityList(container: HTMLElement, linkSelector: string): Quality[] {
	const qualityList: Quality[] = [];
	const paragraphs = container.querySelectorAll(linkSelector);
	for (const p of paragraphs) {
		const pText = Text(p);
		const sizeMatch = pText.match(/([\d.]+)\s*(Mb|MB|GB|KB)/i);
		const strong = p.querySelector("strong");
		const quality = strong ? Text(strong) : pText.split(" - ")[0]?.trim() || "";
		const size = sizeMatch ? sizeMatch[0] : "";

		const urlList: UrlLink[] = [];
		const links = p.querySelectorAll("a");
		for (const link of links) {
			urlList.push({
				title: Text(link),
				url: AnimeSrc(link, baseUrl) || "",
			});
		}

		qualityList.push({ title: quality, size, urlList });
	}
	return qualityList;
}

/**
 * Blok unduhan berbentuk satu `<h4>` diikuti beberapa `<ul>` berurutan (satu
 * per wadah file, mis. Mp4 lalu MKV). Semua sibling sampai `<h4>` berikutnya
 * dikumpulkan — kalau hanya `nextElementSibling` yang dibaca, daftar kedua
 * (MKV) akan hilang.
 */
function parseFormats(container: HTMLElement): Format[] {
	const formats: Format[] = [];

	for (const header of container.querySelectorAll("h4")) {
		const qualityList: Quality[] = [];

		let sibling = header.nextElementSibling;
		while (sibling && sibling.rawTagName?.toLowerCase() !== "h4") {
			qualityList.push(...parseQualityList(sibling as HTMLElement, "p, li"));
			sibling = sibling.nextElementSibling;
		}

		if (!qualityList.length) continue;

		formats.push({ title: Text(header), qualityList });
	}

	return formats;
}

export function parseBatchDetails(doc: HTMLElement): Otakudesu.BatchDetails {
	const titleEl = doc.querySelector(".batchlogo h1, .posttl h1, .info-spe h1");
	if (!titleEl) throw new NotFoundError("Batch title not found");

	const posterEl = doc.querySelector(".batchlogo img, .poster img");
	const genreLinks = doc.querySelectorAll(".genre-list a, .info-spe .genre-list a");

	const genreList: UrlLink[] = [];
	for (const g of genreLinks) {
		genreList.push({
			title: Text(g),
			url: AnimeSrc(g, baseUrl) || "",
		});
	}

	const formatList: Format[] = [];
	const batchContainers = doc.querySelectorAll(".batchlink");
	for (const container of batchContainers) {
		const formatTitleEl = container.querySelector("h4");
		if (!formatTitleEl) continue;

		const qualityList = parseQualityList(container, "ul li");

		formatList.push({
			title: Text(formatTitleEl),
			qualityList,
		});
	}

	if (!formatList.length && !genreList.length) {
		throw new NotFoundError("No batch content found");
	}

	if (!formatList.length) {
		for (const container of doc.querySelectorAll(".download")) {
			formatList.push(...parseFormats(container));
		}
	}

	return {
		title: Text(titleEl),
		poster: Src(posterEl),
		genreList,
		formatList,
	};
}

export function parseEpisodeDetails(doc: HTMLElement): Otakudesu.EpisodeDetails {
	const titleEl = doc.querySelector("h1.posttl, .venutama h1.posttl");
	if (!titleEl) throw new NotFoundError("Episode title not found");

	// Blok `.flir` memuat "Previous Eps.", "Next Eps.", dan "See All Episodes"
	// dalam urutan yang tidak tetap, jadi dibedakan lewat teksnya.
	let prev: UrlLink | null = null;
	let next: UrlLink | null = null;
	let animeLink: UrlLink | null = null;

	for (const link of doc.querySelectorAll(".flir a, #navigasi a")) {
		const href = Attr(link, "href");
		if (!href || href.includes("javascript")) continue;

		const label = Text(link);
		const entry = { title: label, url: AnimeSrc(link, baseUrl) || "" };

		if (/previous/i.test(label)) {
			prev ??= entry;
		} else if (/next/i.test(label)) {
			next ??= entry;
		} else if (/all episode/i.test(label) || /\/anime\//.test(href)) {
			animeLink ??= entry;
		}
	}

	const defaultEmbed = doc.querySelector(
		".responsive-embed-stream iframe, #pembed iframe, #embed iframe, .responsive-embed iframe",
	);
	const defaultStreaming = Src(defaultEmbed);

	const downloadLinks: Format[] = [];
	const downloadContainers = doc.querySelectorAll(".download");
	for (const container of downloadContainers) {
		downloadLinks.push(...parseFormats(container));
	}

	// Mirror dikelompokkan per kualitas: `<ul class="m360p"><li><a data-content="base64">`.
	// `data-content` adalah payload yang dipakai halaman untuk memanggil AJAX,
	// jadi itulah yang dipakai sebagai serverId.
	//
	// Dicari lewat class `ul`-nya sendiri, bukan lewat `.mirrorstream ul`:
	// markup Otakudesu cukup rusak sehingga pembungkusnya hilang dari pohon DOM
	// hasil parse dan selektor turunan tidak pernah cocok.
	const serverList: Server[] = [];
	for (const group of doc.querySelectorAll("ul")) {
		const quality = (group.classNames || "").match(/^m(\d+p)$/i)?.[1];
		if (!quality) continue;

		for (const s of group.querySelectorAll("li a")) {
			const content = Attr(s, "data-content");
			if (!content) continue;

			serverList.push({
				title: `${Text(s)} ${quality}`,
				serverId: content,
			});
		}
	}

	const infoEl = doc.querySelector("#info, .info");
	const info = Text(infoEl);

	const genreList: UrlLink[] = [];
	const genreLinks = doc.querySelectorAll("#genre a, .genre a");
	for (const g of genreLinks) {
		genreList.push({
			title: Text(g),
			url: AnimeSrc(g, baseUrl) || "",
		});
	}

	const episodeList: UrlLink[] = [];
	const episodeLinks = doc.querySelectorAll(".episodelist li a, #episode-list li a, .list-episode li a");
	if (episodeLinks.length) {
		for (const ep of episodeLinks) {
			episodeList.push({
				title: Text(ep),
				url: AnimeSrc(ep, baseUrl) || "",
			});
		}
	}

	return {
		title: Text(titleEl),
		navigation: { prev, next },
		defaultStreaming,
		downloadLinks,
		serverList,
		info,
		genreList,
		episodeList,
		animeId: animeLink ? (animeLink.url.split("/").filter(Boolean).pop() ?? "") : "",
		animeUrl: animeLink?.url,
	};
}

export function parseServerDetails(doc: HTMLElement): Otakudesu.ServerDetails {
	const titleEl = doc.querySelector("title");
	const iframe = doc.querySelector("iframe");
	const url = Src(iframe);

	if (!url) throw new NotFoundError("Server stream URL not found");

	return {
		title: titleEl ? Text(titleEl) : "",
		url,
	};
}

export function parsePagination(doc: HTMLElement): Pagination | null {
	const nav = doc.querySelector(".pagination .pagenavix, .pagenavix");
	if (!nav) return null;

	const links = nav.querySelectorAll("a");
	if (!links.length) return null;

	let currentPage = 1;
	let totalPages = 1;
	let hasPrev = false;
	let hasNext = false;

	// Halaman aktif dirender sebagai `<span class="page-numbers current">`,
	// bukan anchor — jadi harus dibaca terpisah dari daftar link.
	for (const span of nav.querySelectorAll("span")) {
		if (!(span.classNames || "").includes("current")) continue;

		const num = parseInt(Text(span), 10);
		if (!isNaN(num)) {
			currentPage = num;
			if (num > totalPages) totalPages = num;
		}
	}

	for (const link of links) {
		const cls = link.classNames || "";
		const text = Text(link);
		const href = Attr(link, "href");

		if (cls.includes("current") || cls.includes("active")) {
			currentPage = parseInt(text, 10) || 1;
		}

		if (/prev/i.test(text) || /previous/i.test(text) || cls.includes("prev")) {
			hasPrev = !!href;
		}

		if (/next/i.test(text) || cls.includes("next")) {
			hasNext = !!href;
		}

		const num = parseInt(text, 10);
		if (!isNaN(num) && num > totalPages) {
			totalPages = num;
		}
	}

	if (hasPrev || hasNext || totalPages > 1) {
		// Diturunkan dari halaman aktif supaya tidak pernah menghasilkan
		// halaman 0 atau melewati halaman terakhir.
		const prevAvailable = currentPage > 1;
		const nextAvailable = hasNext || currentPage < totalPages;

		return {
			currentPage,
			prevPage: prevAvailable ? currentPage - 1 : null,
			nextPage: nextAvailable ? currentPage + 1 : null,
			totalPages,
			hasPrevPage: prevAvailable,
			hasNextPage: nextAvailable,
		};
	}

	return null;
}
