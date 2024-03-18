require("dotenv").config();
const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV === "production";

//Pro
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  host: process.env.DB_HOST,
});

// Dev-DB
// const pool = new Pool({
//   user: process.env.DB_DEV_USER,
//   password: process.env.DB_DEV_PASSWORD,
//   database: process.env.DB_DEV_DATABASE,
//   port: 5432,
//   host: process.env.DB_DEV_HOST,
// });

pool.on("connect", () => {
  console.log("Database connected");
});

module.exports = { pool };
