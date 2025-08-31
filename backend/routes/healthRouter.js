
import express from "express";
import { performHealthCheck } from "../database/healthCheck.js";

const router = express.Router();


router.get("/health", async (req, res) => {
  try {
    const healthStatus = await performHealthCheck();

    const statusCode =
      healthStatus.database.connected && healthStatus.database.synchronized
        ? 200
        : 503;

    res.status(statusCode).json({
      status: statusCode === 200 ? "healthy" : "unhealthy",
      ...healthStatus,
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});


router.post("/sync", async (req, res) => {
  try {
    const { sequelize } = await import("../models/Index.js");

    console.log("🔄 Manual database sync triggered...");
    await sequelize.sync({ alter: true });

    res.json({
      status: "success",
      message: "Database synchronized successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Manual sync failed:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});


router.post("/seed", async (req, res) => {
  try {
    const { seedDefaultData } = await import("../database/seedDefaultData.js");

    console.log("🌱 Manual seeding triggered...");
    const result = await seedDefaultData();

    const statusCode = result.success ? 200 : 500;
    res.status(statusCode).json({
      status: result.success ? "success" : "error",
      message: result.message || result.error,
      summary: result.summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Manual seeding failed:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});


router.get("/seed-status", async (req, res) => {
  try {
    const { needsSeeding } = await import("../database/seedDefaultData.js");
    const { Category, Tag, User } = await import("../models/Index.js");

    const needsSeed = await needsSeeding();
    const categoriesCount = await Category.count();
    const tagsCount = await Tag.count();
    const usersCount = await User.count();

    res.json({
      status: "success",
      needsSeeding: needsSeed,
      currentData: {
        categories: categoriesCount,
        tags: tagsCount,
        users: usersCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error checking seed status:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
