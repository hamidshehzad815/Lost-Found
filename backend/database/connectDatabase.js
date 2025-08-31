import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const connection = new Sequelize(process.env.DB_URI, {
  dialect: "postgres",
  protocol: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

export default connection;
