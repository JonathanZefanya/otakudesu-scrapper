import { Router } from "express";
import * as ctrl from "../controllers/sync.js";

const router = Router();

// Query anime from Supabase
router.get("/anime", ctrl.getAnimeFromDB);

export default router;
