const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const healthCheckRoute = require("./src/routes/healthRoute");
const messengerRoute = require("./src/routes/messengerRoute");
const extensionRoute = require("./src/routes/extensionRoute");

require("dotenv").config();
const cors = require("cors");
const {
  addTask,
  getPendingTask,
  updateTaskStatus,
  generateUniqueId,
} = require("./src/utlis/actions");

const app = express();
const server = http.createServer(app); // Create an HTTP server
const wss = new WebSocket.Server({ server }); // Create a WebSocket server
const PORT = process.env.PORT || 3001;
let taskSchedulerIntervalId = null;

app.use(cors());
app.use(express.json());

app.use("/api/", messengerRoute);
app.use("/", healthCheckRoute);
app.use("/extension", extensionRoute);

wss.on("connection", (ws) => {

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);
      if (data.action === "addTask") {
        await processAddTasks(ws, data.payload);
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  ws.on("close", () => {
    console.log(`WebSocket connection closed`);
  });
});

const processAddTasks = async (ws, payload) => {
  const { message, ids: users, time: interval, count } = payload;

  console.log("payload : ", payload);

  await Promise.all(users.map((user) => addTask(user, message)));

  scheduleTasks(ws, interval, count);
};

const scheduleTasks = (ws, interval = 2, count = 2) => {
  if (!taskSchedulerIntervalId) {
    console.log("Tasks Scheduled sucessfully");
    taskSchedulerIntervalId = setInterval(async () => {
      const tasks = await getPendingTask(count);
      console.log("TASK : ", tasks);
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
  } else {
    console.log("Already Scheduled");
  }
};

server.listen(PORT, () => {
  console.log(`Server running on port ${server.address().port}`);
});

// Log WebSocket server's port after it starts listening
wss.on("listening", () => {
  console.log(`WebSocket server running on port ${server.address().port}`);
});
