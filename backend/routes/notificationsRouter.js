import express from "express";
import auth from "../middleware/auth.js";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationCount,
  getUserPreferences,
  updateUserPreferences,
} from "../controller/notifications.js";

const router = express.Router();


router.get("/", auth, getUserNotifications);


router.get("/count", auth, getNotificationCount);


router.put("/:notification_id/read", auth, markAsRead);


router.put("/read-all", auth, markAllAsRead);


router.delete("/:notification_id", auth, deleteNotification);


router.get("/preferences", auth, getUserPreferences);


router.put("/preferences", auth, updateUserPreferences);

export default router;
