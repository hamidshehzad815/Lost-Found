
import { sequelize } from "../models/Index.js";

const performHealthCheck = async () => {
  const healthStatus = {
    timestamp: new Date().toISOString(),
    database: {
      connected: false,
      synchronized: false,
      tables: [],
      models: [],
      errors: [],
    },
  };

  try {
    
    await sequelize.authenticate();
    healthStatus.database.connected = true;

    
    const tables = await sequelize.getQueryInterface().showAllTables();
    healthStatus.database.tables = tables;

    
    const models = Object.keys(sequelize.models);
    healthStatus.database.models = models;

    
    const criticalModels = ["User", "Category", "Item", "Image"];
    const criticalTables = ["users", "categories", "items", "images"];

    const missingTables = criticalTables.filter(
      (table) => !tables.includes(table)
    );
    const missingModels = criticalModels.filter(
      (model) => !models.includes(model)
    );

    if (missingTables.length === 0 && missingModels.length === 0) {
      healthStatus.database.synchronized = true;
    } else {
      if (missingTables.length > 0) {
        healthStatus.database.errors.push(
          `Missing tables: ${missingTables.join(", ")}`
        );
      }
      if (missingModels.length > 0) {
        healthStatus.database.errors.push(
          `Missing models: ${missingModels.join(", ")}`
        );
      }
    }
  } catch (error) {
    healthStatus.database.errors.push(error.message);
  }

  return healthStatus;
};

export { performHealthCheck };
