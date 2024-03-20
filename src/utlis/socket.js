const WebSocket = require("ws");
const { pool } = require("./db");
const { addTask, getPendingTask } = require("./actions");
const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ message: "connected" }));

  ws.on("message", async (message) => {
    const data = JSON.parse(message);
    if (data.action === "sendMessage") {
      const message = data.payload.message;
      const users = data.payload.ids;

      for (let i = 0; i < users.length; i++) {
        await addTask(users[i], message);
      }

      // [
      //   {
      //     id: 1,
      //     sent_to: 'Gaurav',
      //     message: 'Hello',
      //     status: 'pending',
      //     created_at: 2024-03-20T06:45:18.336Z
      //   },
      //   {
      //     id: 2,
      //     sent_to: ' rahul',
      //     message: 'Hello',
      //     status: 'pending',
      //     created_at: 2024-03-20T06:45:18.343Z
      //   }
      // ]

      // while (true) {
      const tasks = await getPendingTask();

      // if (tasks.length <= 0) {
      //   break;
      // }

      for (let i = 0; i < tasks.length; i++) {
        ws.send(
          JSON.stringify({ message: "sendMessageToUser", task: tasks[i] })
        );
      }
      // }
    }
  });

  ws.on("close", () => {
    console.log(`deleted`);
  });
});

module.exports = wss;
