const WebSocket = require("ws");
const { pool } = require("./db");
const { addTask, getPendingTask, updateTaskStatus } = require("./actions");
const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ message: "connected" }));

  ws.on("message", async (message) => {
    const data = JSON.parse(message);
    if (data.action === "addTask") {
      const {
        message,
        ids: users,
        time,
        count,
        fbLoginId,
        fbLoginPass,
      } = data.payload;

      // Add tasks to table
      for (let i = 0; i < users.length; i++) {
        await addTask(users[i], message, fbLoginId, fbLoginPass);
      }

      const tasks = await getPendingTask();
      for (let i = 0; i < tasks.length; i++) {
        ws.send(
          JSON.stringify({ message: "sendMessageToUser", task: tasks[i] })
        );
      }
    }

    if (data.action === "updateTaskStatus") {
      const task = data.task.res;
      updateTaskStatus(task);
    }
  });

  ws.on("close", () => {
    console.log(`deleted`);
  });
});

module.exports = wss;
