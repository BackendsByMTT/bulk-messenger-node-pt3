const { pool } = require("./db");
const queries = require("./queries");

const addTask = async (sent_to, message, fbLoginId, fbLoginPass) => {
  await pool.query(queries.addMessage, [
    sent_to,
    message,
    fbLoginId,
    fbLoginPass,
  ]);
};

const getPendingTask = async () => {
  const task = await pool.query(
    "SELECT * FROM messages WHERE status = 'pending' LIMIT 2"
  );

  return task.rows;
};

const updateTaskStatus = async (data) => {
  const { id, status, user } = data;

  const updatedTask = await pool.query(
    "UPDATE messages SET status = $1 WHERE id = $2 AND sent_to = $3 RETURNING id, sent_to",
    [status, id, user]
  );

  console.log("TASK TO BE UPDAE  : ", updatedTask.rows);
};

module.exports = { addTask, getPendingTask, updateTaskStatus };
