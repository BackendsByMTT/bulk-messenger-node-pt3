const { pool } = require("./db");
const queries = require("./queries");

const checkTableExists = async (database) => {
  const query = `SELECT to_regclass('public.${database}')`;
  const { rows } = await pool.query(query);
  return rows[0].to_regclass !== null;
};

const addTask = async (sent_to, message, username) => {
  await pool.query(queries.addMessage, [sent_to, message, username]);
};

const getPendingTask = async (count, username) => {
  const task = await pool.query(
    "SELECT * FROM messages WHERE status = 'pending' AND agent = $1 ORDER BY created_at DESC LIMIT $2;",
    [username, count]
  );
  return task.rows;
};

const getAgentsPendingTask = async (username) => {
  const tasks = await pool.query(
    "SELECT * FROM messages WHERE status = 'pending' AND agent = $1 ORDER BY created_at DESC",
    [username]
  );

  return tasks.rows;
};

const updateTaskStatus = async (id, status, user) => {
  const updatedTask = await pool.query(
    "UPDATE messages SET status = $1, created_at = NOW() WHERE id = $2 AND sent_to = $3 RETURNING id, sent_to, created_at",
    [status, id, user]
  );

  console.log("TASK TO BE UPDAE  : ", updatedTask.rows);
};

function generateUniqueId() {
  // Generate a random string
  const randomStr = Math.random().toString(36).substring(2, 12);

  // Get the current timestamp
  const timestamp = new Date().getTime();

  // Combine the random string and timestamp to create a unique ID
  const uniqueId = randomStr + "-" + timestamp;

  return uniqueId;
}

module.exports = {
  addTask,
  getPendingTask,
  updateTaskStatus,
  generateUniqueId,
  checkTableExists,
  getAgentsPendingTask,
};
