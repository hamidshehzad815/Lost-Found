import express from "express";
import auth from "../middleware/auth.js";
import upload from "../middleware/mutlerUpload.js";
import {
  uploadItem,
  allItems,
  itemByCategory,
  itemByStatus,
  updateStatus,
  updateItem,
  getItemById,
  myItems,
  getStatusInfo,
  getHomepageStats,
  addSampleData,
} from "../controller/items.js";
const router = express.Router();

router.post("/uploadItem", auth, upload.any(), uploadItem);
router.get("/allItem", auth, allItems);
router.get("/itemByCategory", auth, itemByCategory);
router.get("/itemByStatus", auth, itemByStatus);
router.get("/item/:item_id", auth, getItemById);
router.get("/myItems", auth, myItems);
router.get("/statusInfo", auth, getStatusInfo);
router.get("/stats", getHomepageStats); // No auth required for public stats
router.post("/addSampleData", addSampleData); // Test endpoint - remove in production
router.post("/updateStatus", auth, updateStatus);
router.put("/updateItem", auth, upload.any(), updateItem);
export default router;
