import { fetchDOM } from "../lib/fetcher.js";
import { sources } from "../config/index.js";
import type { HTMLElement } from "node-html-parser";

const BASE = sources.nimegami.baseUrl;

export async function scrapeDOM(
	pathname: string,
	ref?: string,
	sanitize = false,
): Promise<HTMLElement> {
	return fetchDOM(`${BASE}${pathname}`, { ref, sanitize });
}
