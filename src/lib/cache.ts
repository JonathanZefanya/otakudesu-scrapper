import type { Request, Response, NextFunction } from "express";
import { LRUCache } from "lru-cache";

interface CacheEntry {
	body: unknown;
	statusCode: number;
}

/**
 * Factory: server-side LRU cache middleware.
 * Mencegat `res.json()` untuk menyimpan response sebelum dikirim.
 */
export function serverCache(ttlMinutes = 10) {
	const cache = new LRUCache<string, CacheEntry>({
		max: 100,
		ttl: ttlMinutes * 60 * 1000,
	});

	return (req: Request, res: Response, next: NextFunction): void => {
		const key = req.originalUrl;

		const hit = cache.get(key);
		if (hit) {
			res.status(hit.statusCode).json(hit.body);
			return;
		}

		const originalJson = res.json.bind(res);
		res.json = (body: unknown) => {
			if (res.statusCode < 400) {
				cache.set(key, { body, statusCode: res.statusCode });
			}
			return originalJson(body);
		};

		next();
	};
}

/**
 * Client-side cache header.
 */
export function clientCache(maxAgeSeconds = 60) {
	return (_req: Request, res: Response, next: NextFunction): void => {
		res.set("Cache-Control", `public, max-age=${maxAgeSeconds}`);
		next();
	};
}
