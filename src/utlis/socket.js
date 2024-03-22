const WebSocket = require("ws");
const { pool } = require("./db");
const {
  addTask,
  getPendingTask,
  updateTaskStatus,
  generateUniqueId,
} = require("./actions");
const wss = new WebSocket.Server({ port: 8080 });
let taskSchedulerIntervalId = null;

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ action: "connected" }));

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);
      if (data.action === "addTask") {
        await processAddTasks(ws, data.payload);
      }
    } catch (error) {}
  });

  ws.on("close", () => {
    console.log(`deleted`);
  });
});

const processAddTasks = async (ws, payload) => {
  const { message, ids: users, time: interval, count } = payload;

  console.log("payload : ", payload);

  await Promise.all(users.map((user) => addTask(user, message)));

  scheduleTasks(ws, interval, count);
};

const scheduleTasks = (ws, interval, count) => {
  if (!taskSchedulerIntervalId) {
    taskSchedulerIntervalId = setInterval(async () => {
      const tasks = await getPendingTask(count);
      if (tasks.length > 0) {
        tasks.forEach((task) => {
          const requestId = generateUniqueId();
          const payload = {
            action: "sendMessageToUser",
            task: task,
            requestId: requestId,
          };
          ws.send(JSON.stringify(payload));
        });
      } else {
        console.log("No pending tasks");
        clearInterval(taskSchedulerIntervalId);
        taskSchedulerIntervalId = null;
      }
    }, interval * 60000);
  }
};

module.exports = wss;
