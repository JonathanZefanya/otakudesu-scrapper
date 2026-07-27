import { Router } from "express";
import * as ctrl from "../controllers/sync.js";

const router = Router();

// Manual sync trigger
router.post("/:source/:type", ctrl.syncSource);

// Sync status history
router.get("/status", ctrl.getSyncStatus);

// Query anime from database
router.get("/anime", ctrl.getAnimeFromDB);

export default router;
