const { Client } = require("pg");
const { pool } = require("../utlis/db");
const bcrypt = require("bcrypt");

const checkDBExists = async (database) => {
  console.log("CHECKING DB EXISTS");
  const query = `SELECT datname FROM pg_database WHERE datname = $1`;
  const { rows } = await pool.query(query, [database]);
  return rows.length > 0;
};

const createDB = async (database) => {
  const query = `CREATE DATABASE ${database}`;
  await pool.query(query);
};

const checkTableExists = async (database) => {
  console.log("CHECKING TABLE EXISTS");

  const query = `SELECT to_regclass('public.${database}')`;
  const { rows } = await pool.query(query);
  return rows[0].to_regclass !== null;
};

const createUsersTable = async () => {
  console.log("CREATE USER TABLE ");

  const query = `CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL
  )`;
  await pool.query(query);
};

const ensureDBAndTable = async () => {
  const messageDBExists = await checkDBExists("messenger");
  if (!messageDBExists) {
    await createDB("messenger");
  }

  const userTableExists = await checkTableExists("users");
  if (!userTableExists) {
    await createUsersTable();
  }
};

const registerUser = async (req, res) => {
  const { username, name, password, role } = req.body;

  console.log(req.body);
  // await ensureDBAndTable();

  // try {
  //   const userExistsQuery = `SELECT * FROM users WHERE username = $1`;
  //   const { rows } = await pool.query(userExistsQuery, [username]);

  //   if (rows.length > 0) {
  //     return res.status(400).json({ error: "User aleady exists" });
  //   }

  //   const insertUserQuery = `INSERT INTO users (username, password, role) VALUES ($1, $2, $3)`;
  //   await pool.query(insertUserQuery, [username, password, role]);

  //   return res.status(201).json({ message: "User created successfully" });
  // } catch (error) {
  //   console.error("Error creating user:", error);
  //   return res.status(500).json({ error: "Internal server error." });
  // }
};

// Login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const agent = await userModule.Agent.findOne({ email });
    if (!agent) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const isPasswordValid = await agent.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = jwt.sign({ _id: agent._id }, process.env.JWT_SECRET_KEY, {});
    res.status(200).json({ token, agentName: agent.name, id: agent._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { registerUser, loginUser };
