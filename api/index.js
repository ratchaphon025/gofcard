require("dotenv").config();

const app = require("../server/src/app");
const connectDB = require("../server/src/config/db");

let databaseConnection;

module.exports = async (req, res) => {
  databaseConnection ||= connectDB();
  await databaseConnection;
  return app(req, res);
};