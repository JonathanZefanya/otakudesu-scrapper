import type { HTMLElement } from "node-html-parser";
import { appConfig } from "../config/index.js";

/** Ambil teks yang sudah di-trim dari element */
export function Text(el: HTMLElement | null, regexp?: RegExp): string {
	if (!el) return "";
	const raw = el.textContent?.trim() || "";
	return regexp ? raw.match(regexp)?.[1]?.trim() || raw : raw;
}

/** Ambil ID dari href (segmen terakhir URL) */
export function Id(el: HTMLElement | null): string {
	if (!el) return "";
	const href = el.getAttribute("href") || "";
	return href.split("/").filter(Boolean).pop() || "";
}

/** Ambil src (data-src fallback) */
export function Src(el: HTMLElement | null): string {
	if (!el) return "";
	return el.getAttribute("data-src") || el.getAttribute("src") || "";
}

/** Ambil angka dari teks element */
export function Num(el: HTMLElement | null, regexp?: RegExp): number {
	if (!el) return 0;
	const raw = Text(el, regexp);
	const num = parseInt(raw.replace(/\D/g, ""), 10);
	return isNaN(num) ? 0 : num;
}

/** Ambil attribute element */
export function Attr(el: HTMLElement | null, attr: string): string {
	if (!el) return "";
	return el.getAttribute(attr) || "";
}

/** Ambil href, optional prepend baseUrl menjadi absolute URL */
export function AnimeSrc(el: HTMLElement | null, baseUrl?: string): string | undefined {
	if (!el) return undefined;
	const href = el.getAttribute("href") || "";
	if (!appConfig.sourceUrl) return undefined;
	if (baseUrl && href.startsWith("/")) return `${baseUrl}${href}`;
	return href;
}
