import express from "express";
import auth from "../middleware/auth.js";
import {
  trackItemView,
  trackItemInteraction,
  getItemAnalytics,
  getUserDashboard,
  getPlatformAnalytics,
  getPopularItems,
} from "../controller/analytics.js";

const router = express.Router();

router.post("/track/view/:item_id", auth, trackItemView);

router.post("/track/interaction/:item_id", auth, trackItemInteraction);

router.get("/item/:item_id", auth, getItemAnalytics);

router.get("/dashboard", auth, getUserDashboard);

router.get("/platform", getPlatformAnalytics);

router.get("/popular", getPopularItems);

export default router;
