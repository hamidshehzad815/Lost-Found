import express from "express";
import auth from "../middleware/auth.js";
import {
  getUserConversations,
  startConversation,
  getConversationMessages,
  sendMessage,
  updateConversationStatus,
  getUnreadCount,
} from "../controller/messaging.js";

const router = express.Router();


router.get("/conversations", auth, getUserConversations);


router.post("/conversations", auth, startConversation);


router.get(
  "/conversations/:conversation_id/messages",
  auth,
  getConversationMessages
);


router.post("/messages", auth, sendMessage);


router.put(
  "/conversations/:conversation_id/status",
  auth,
  updateConversationStatus
);


router.get("/unread-count", auth, getUnreadCount);

export default router;
