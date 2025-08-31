


import express from "express";
import auth from "../middleware/auth.js";
import {
  createSearchAlert,
  getUserSearchAlerts,
  updateSearchAlert,
  deleteSearchAlert,
  getItemMatches,
  createItemMatch,
  getUserItemMatches,
  updateMatchStatus,
} from "../controller/search.js";

const router = express.Router();



router.post("/alerts", auth, createSearchAlert);


router.get("/alerts", auth, getUserSearchAlerts);


router.put("/alerts/:alert_id", auth, updateSearchAlert);


router.delete("/alerts/:alert_id", auth, deleteSearchAlert);



router.get("/matches/item/:item_id", auth, getItemMatches);


router.post("/matches", auth, createItemMatch);


router.get("/matches", auth, getUserItemMatches);


router.put("/matches/:match_id/status", auth, updateMatchStatus);

export default router;
