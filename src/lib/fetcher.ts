import { parse as parseHtml, type HTMLElement } from "node-html-parser";
import sanitizeHtml from "sanitize-html";
import { BadGatewayError } from "./errors.js";

const DEFAULT_USER_AGENT =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0";

export interface FetchOptions {
	ref?: string;
	sanitize?: boolean;
	timeout?: number;
}

/**
 * Fetch URL, parse HTML, return DOM root.
 */
export async function fetchDOM(
	url: string,
	options: FetchOptions = {},
): Promise<HTMLElement> {
	const { ref, sanitize = false, timeout = 15_000 } = options;

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeout);

	try {
		const headers: Record<string, string> = {
			"User-Agent": DEFAULT_USER_AGENT,
		};
		if (ref) headers.Referer = ref;

		const res = await fetch(url, { headers, signal: controller.signal });

		if (!res.ok) {
			throw new BadGatewayError(
				`Upstream returned ${res.status} for ${url}`,
			);
		}

		let html = await res.text();
		if (!html || html.length < 50) {
			throw new BadGatewayError("Empty or too short response from upstream");
		}

		if (sanitize) {
			html = sanitizeHtml(html, {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat([
					"img", "video", "source", "iframe", "script",
				]),
				allowVulnerableTags: true,
				allowedAttributes: {
					"*": ["class", "id", "style"],
					...sanitizeHtml.defaults.allowedAttributes,
					img: ["src", "data-src", "alt", "title", "width", "height", "class"],
					a: ["href", "title", "target", "class", "rel"],
					iframe: ["src", "width", "height", "allowfullscreen"],
					source: ["src", "type"],
					video: ["src", "controls", "width", "height"],
					div: ["class", "id"],
					span: ["class"],
					ul: ["class"],
					li: ["class"],
					h1: ["class"], h2: ["class"], h3: ["class"], h4: ["class"], h5: ["class"],
				},
			});
		}

		return parseHtml(html);
	} finally {
		clearTimeout(timer);
	}
}

/**
 * POST request ke endpoint, parse response sebagai JSON.
 */
export async function postJSON<T>(
	url: string,
	body: Record<string, string>,
	ref?: string,
	timeout = 15_000,
): Promise<T> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeout);

	try {
		const headers: Record<string, string> = {
			"User-Agent": DEFAULT_USER_AGENT,
			"Content-Type": "application/x-www-form-urlencoded",
		};
		if (ref) headers.Referer = ref;

		const params = new URLSearchParams(body).toString();

		const res = await fetch(url, {
			method: "POST",
			headers,
			body: params,
			signal: controller.signal,
		});

		if (!res.ok) {
			throw new BadGatewayError(`POST ${url} returned ${res.status}`);
		}

		return (await res.json()) as T;
	} finally {
		clearTimeout(timer);
	}
}

/**
 * Fetch raw text dari URL.
 */
export async function fetchText(
	url: string,
	ref?: string,
	timeout = 15_000,
): Promise<string> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeout);

	try {
		const headers: Record<string, string> = {
			"User-Agent": DEFAULT_USER_AGENT,
		};
		if (ref) headers.Referer = ref;

		const res = await fetch(url, { headers, signal: controller.signal });
		if (!res.ok) {
			throw new BadGatewayError(`Fetch ${url} returned ${res.status}`);
		}
		return await res.text();
	} finally {
		clearTimeout(timer);
	}
}
