// Vercel serverless entry point.
//
// Aplikasi dimuat lewat dynamic import di dalam handler, bukan import statis di
// puncak modul. Bedanya penting di serverless: kalau pemuatan gagal (dependensi
// tidak ikut ter-bundle, error saat inisialisasi modul, dan sejenisnya), import
// statis membuat seluruh fungsi mati dengan FUNCTION_INVOCATION_FAILED yang
// tidak menyebut penyebabnya. Dengan cara ini errornya tertangkap dan
// dikembalikan sebagai JSON yang bisa dibaca langsung dari browser.
import type { IncomingMessage, ServerResponse } from "node:http";

type NodeHandler = (req: IncomingMessage, res: ServerResponse) => void;

let appPromise: Promise<NodeHandler> | null = null;

function loadApp(): Promise<NodeHandler> {
	appPromise ??= import("../src/app.js").then((mod) => mod.default as NodeHandler);
	return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
	try {
		const app = await loadApp();
		app(req, res);
	} catch (err) {
		// Buang promise yang gagal supaya invocation berikutnya memuat ulang,
		// bukan memakai kembali kegagalan yang sama.
		appPromise = null;

		const error = err instanceof Error ? err : new Error(String(err));
		console.error("[boot] gagal memuat aplikasi:", error);

		res.statusCode = 500;
		res.setHeader("content-type", "application/json; charset=utf-8");
		res.end(
			JSON.stringify(
				{
					statusCode: 500,
					statusMessage: "Internal Server Error",
					message: "Gagal memuat aplikasi",
					error: error.message,
					stack: error.stack?.split("\n").slice(0, 8),
				},
				null,
				2,
			),
		);
	}
}
