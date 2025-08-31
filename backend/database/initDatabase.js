
import { sequelize } from "../models/Index.js";
import verifyConnection from "./verifyConnection.js";

const initializeDatabase = async () => {
  console.log("🚀 Initializing database...");

  try {
    
    console.log("🔗 Step 1: Verifying database connection...");
    await verifyConnection();

    
    console.log("🧪 Step 2: Testing Sequelize connection...");
    await sequelize.authenticate();
    console.log("✅ Database connection authenticated successfully!");

    
    console.log("🔄 Step 3: Syncing models with database...");
    await sequelize.sync({
      alter: true, 
      force: false, 
    });
    console.log("✅ Database models synchronized successfully!");

    
    console.log("🔍 Step 4: Verifying table structures...");
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log(`📊 Found ${tables.length} tables:`, tables.join(", "));

    
    const criticalTables = ["users", "categories", "items", "images"];
    const missingTables = criticalTables.filter(
      (table) => !tables.includes(table)
    );

    if (missingTables.length > 0) {
      console.warn("⚠️  Missing critical tables:", missingTables);
      throw new Error(`Critical tables missing: ${missingTables.join(", ")}`);
    }

    console.log("✅ All critical tables verified!");

    
    console.log("� Step 6: Seeding default data...");
    const { autoSeedIfNeeded } = await import("./seedDefaultData.js");
    const seedResult = await autoSeedIfNeeded();

    if (seedResult.success) {
      console.log("✅ Default data seeding completed!");
      if (seedResult.summary) {
        console.log(
          `📊 Data summary: ${seedResult.summary.categories} categories, ${seedResult.summary.tags} tags, ${seedResult.summary.users} users`
        );
      }
    } else {
      console.warn("⚠️  Default data seeding had issues:", seedResult.error);
    }

    console.log("�🎉 Database initialization completed successfully!");

    return {
      success: true,
      message: "Database initialized successfully",
      tables: tables.length,
      seedResult: seedResult,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    console.error("💡 Please check:");
    console.error("   • Database server is running");
    console.error("   • Connection credentials are correct");
    console.error("   • Database exists and is accessible");
    console.error("   • User has proper permissions");

    throw new Error(`Database initialization failed: ${error.message}`);
  }
};

export default initializeDatabase;
