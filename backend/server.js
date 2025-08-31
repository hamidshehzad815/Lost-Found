import express from "express";
import { config } from "dotenv";
import routes from "./start/routes.js";
import initializeDatabase from "./database/initDatabase.js";

config();

const app = express();
const PORT = process.env.SERVER_PORT;

// Initialize database before starting server
const startServer = async () => {
  try {
    // Initialize database (connect + sync)
    await initializeDatabase();

    // Setup routes
    routes(app);

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`🎉 Enhanced LostFound API ready with new features:`);
      console.log(`   • User verification system`);
      console.log(`   • Extended item tracking with 'returned' status`);
      console.log(`   • Complete messaging system`);
      console.log(`   • Smart notifications`);
      console.log(`   • Advanced search & matching`);
      console.log(`   • Trust & review system`);
      console.log(`   • Flexible tagging`);
      console.log(`   • Comprehensive analytics`);
    });
  } catch (error) {
    console.error("💥 Failed to start server:", error.message);
    console.error(
      "🔧 Server startup aborted. Please fix database issues and try again."
    );
    process.exit(1);
  }
};

// Start the application
startServer();
