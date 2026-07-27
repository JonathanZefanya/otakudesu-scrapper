import { fetchDOM, fetchText } from "../lib/fetcher.js";
import { sources } from "../config/index.js";
import type { HTMLElement } from "node-html-parser";

const BASE = sources.kuramanime.baseUrl;

/** Scrape HTML DOM dari path Kuramanime */
export async function scrapeDOM(
	pathname: string,
	ref?: string,
	sanitize = false,
): Promise<HTMLElement> {
	return fetchDOM(`${BASE}${pathname}`, { ref, sanitize });
}

/** Ambil secret key dari file assets (digunakan untuk akses halaman protected) */
export async function scrapeSecret(ref?: string): Promise<string> {
	const text = await fetchText(`${BASE}/assets/Ks6sqSgloPTlHMl.txt`, ref);
	return text.trim();
}
