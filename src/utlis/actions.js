const { pool } = require("./db");
const queries = require("./queries");

const checkTableExists = async (database) => {
  const query = `SELECT to_regclass('public.${database}')`;
  const { rows } = await pool.query(query);
  return rows[0].to_regclass !== null;
};

const addTask = async (sent_to, message) => {
  const isMessageTable = await checkTableExists("messages");
  if (!isMessageTable) {
    await pool.query(queries.createMessageTable);
    console.log("DB CREATED");
  }
  await pool.query(queries.addMessage, [sent_to, message]);
};

const getPendingTask = async (count) => {
  const task = await pool.query(
    "SELECT * FROM messages WHERE status = 'pending' LIMIT $1",
    [count]
  );

  return task.rows;
};

const updateTaskStatus = async (id, status, user) => {
  const updatedTask = await pool.query(
    "UPDATE messages SET status = $1, created_at = NOW() WHERE id = $2 AND sent_to = $3 RETURNING id, sent_to, created_at",
    [status, id, user]
  );

  console.log("TASK TO BE UPDAE  : ", updatedTask.rows);
};

function generateUniqueId() {
  return Date.now(); // Simple example, use a more robust method in production
}
module.exports = {
  addTask,
  getPendingTask,
  updateTaskStatus,
  generateUniqueId,
};
