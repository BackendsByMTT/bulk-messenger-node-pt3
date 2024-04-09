const { pool } = require("../utlis/db");
const queries = require("../utlis/queries");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticate = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is missing.",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Something went wrong with Authorization token",
    });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is missing.",
      });
    }

    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const admin = decodedToken.username;
    const checkForAdmin = await pool.query(queries.checkForAdmin, [admin]);

    if (checkForAdmin.rows.length <= 0) {
      return res
        .status(401)
        .json({ success: false, message: "You are not an Admin" });
    } else {
      console.log("YOU ARE ADMIN");
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Admin Authentication Failed",
    });
  }
};

const checkUserStatus = async (req, res, next) => {
  const { username } = req.body;

  try {
    const result = await pool.query(
      "SELECT status FROM users WHERE username = $1",
      [username]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const userStatus = result.rows[0].status;
    if (userStatus === "inactive") {
      return res.status(401).json({
        success: false,
        message: "User is inactive and cannot log in",
      });
    }

    next();
  } catch (error) {
    console.error("Error checking user status:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = { authenticate, isAdmin, checkUserStatus };
