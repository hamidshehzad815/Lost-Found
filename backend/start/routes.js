import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import passport from "passport";
import error from "../middleware/errorHandler.js";
import users from "../routes/usersRouter.js";
import items from "../routes/itemsRouter.js";
import category from "../routes/categoryRouter.js";
import messaging from "../routes/messagingRouter.js";
import notifications from "../routes/notificationsRouter.js";
import reviews from "../routes/reviewsRouter.js";
import search from "../routes/searchRouter.js";
import tags from "../routes/tagsRouter.js";
import analytics from "../routes/analyticsRouter.js";
import contact from "../routes/contactRouter.js";
import googleAuthRoutes from "../routes/googleAuthRoutes.js";
import health from "../routes/healthRouter.js";
import initializePassport from "../config/passport.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const setupRoutes = (app) => {
  // CORS configuration
  app.use(
    cors({
      origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
      ], // Allow multiple frontend ports
      credentials: true, // Allow cookies to be sent
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Session configuration for Google OAuth
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "your_session_secret_key_here",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Initialize Passport
  initializePassport();
  app.use(passport.initialize());
  app.use(passport.session());

  app.use(express.json());

  // Serve static files from uploads directory
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

  // === Core Routes ===
  app.use("/users", users);
  app.use("/items", items);
  app.use("/category", category);
  app.use("/contact", contact);

  // === Google OAuth Routes ===
  app.use("/", googleAuthRoutes);

  // === Health Check Routes ===
  app.use("/health", health);

  // === Enhanced Features Routes ===
  app.use("/messaging", messaging);
  app.use("/notifications", notifications);
  app.use("/reviews", reviews);
  app.use("/search", search);
  app.use("/tags", tags);
  app.use("/analytics", analytics);

  // === Health Check ===
  app.use("/", (req, res) => {
    res.send({
      message: "🎉 Enhanced LostFound API is running!",
      version: "2.0.0",
      features: [
        "User Management & Authentication",
        "Item Management with 'returned' status",
        "Real-time Messaging System",
        "Smart Notifications",
        "Advanced Search & Matching",
        "Trust & Review System",
        "Flexible Tagging System",
        "Comprehensive Analytics",
      ],
      endpoints: {
        core: ["/users", "/items", "/category"],
        messaging: ["/messaging"],
        notifications: ["/notifications"],
        reviews: ["/reviews"],
        search: ["/search"],
        tags: ["/tags"],
        analytics: ["/analytics"],
      },
    });
  });

  app.use(error);
};

export default setupRoutes;
