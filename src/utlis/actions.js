const { pool } = require("./db");
const queries = require("./queries");

const addTask = async (sent_to, message) => {
  await pool.query(queries.addMessage, [sent_to, message]);
};

const getPendingTask = async () => {
  const task = await pool.query(
    "SELECT * FROM messages WHERE status = 'pending' LIMIT 2"
  );

  return task.rows;
};

module.exports = { addTask, getPendingTask };
