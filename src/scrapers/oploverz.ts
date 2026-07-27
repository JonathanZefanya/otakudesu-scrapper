import { fetchDOM } from "../lib/fetcher.js";
import { sources } from "../config/index.js";
import type { HTMLElement } from "node-html-parser";
import { postJSON } from "../lib/fetcher.js";

const BASE = sources.oploverz.baseUrl;

export async function scrapeDOM(
	pathname: string,
	ref?: string,
	sanitize = false,
): Promise<HTMLElement> {
	return fetchDOM(`${BASE}${pathname}`, { ref, sanitize });
}

export async function scrapeTooltip(
	postId: string,
	referer: string,
): Promise<string> {
	const data = await postJSON<{ content: string }>(
		`${BASE}/wp-admin/admin-ajax.php`,
		{ action: "tooltip_action", id: postId },
		referer,
	);
	return data.content;
}
