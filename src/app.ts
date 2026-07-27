import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import syncRouter from "./routes/sync.js";
import dbRouter from "./routes/db.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { sources } from "./config/index.js";
import { isSupabaseReady } from "./lib/supabase.js";

const app = express();

// Middleware global
app.use(cors());
app.use(express.json());

// Root — list available sources
app.get("/", (_req, res) => {
	res.json({
		statusCode: 200,
		statusMessage: "OK",
		message: "superanime API — Indonesian anime subtitle scraper",
		data: {
			sources: Object.entries(sources)
				.filter(([_, s]) => s.enabled)
				.map(([key, s]) => ({
					name: s.name,
					baseUrl: s.baseUrl,
					routes: `/${key}`,
				})),
			database: isSupabaseReady() ? "connected" : "not configured",
			sync: isSupabaseReady() ? "/sync/:source/:type" : null,
		},
	});
});

// Routes — scraping API
app.use("/", routes);

// Sync + Database (hanya aktif jika Supabase terkonfigurasi)
if (isSupabaseReady()) {
	app.use("/sync", syncRouter);
	app.use("/db", dbRouter);
}

// Error handler (harus di akhir)
app.use(errorHandler);

export default app;
