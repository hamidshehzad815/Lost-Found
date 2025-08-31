import connection from "./connectDatabase.js";

const verifyDatabaseConnection = async () => {
  try {
    await connection.authenticate();
    console.log("✅ Database Connected 😊");
  } catch (error) {
    connection.log("❌ Database Connection Failed : ", error.message);
  }
};

export default verifyDatabaseConnection;
