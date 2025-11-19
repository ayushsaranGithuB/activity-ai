// API Routes Configuration

import express from "express";
import { categorize } from "./categorize.js";
import { insights } from "./insights.js";
import { mergeCategories } from "./merge-categories.js";
import { health } from "./health.js";

const router = express.Router();

router.post("/categorize", categorize);
router.post("/insights", insights);
router.post("/merge-categories", mergeCategories);
router.get("/health", health);

export default router;
