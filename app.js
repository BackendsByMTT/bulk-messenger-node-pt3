const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const healthCheckRoute = require("./src/routes/healthRoute");
const messengerRoute = require("./src/routes/messengerRoute");
const extensionRoute = require("./src/routes/extensionRoute");
const jwt = require("jsonwebtoken");

require("dotenv").config();
const cors = require("cors");
const {
  addTask,
  getPendingTask,
  updateTaskStatus,
  generateUniqueId,
  checkTableExists,
} = require("./src/utlis/actions");
const { pool } = require("./src/utlis/db");
const queries = require("./src/utlis/queries");

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

wss.on("connection", async (ws) => {
  const isMessageTable = await checkTableExists("messages");

  if (!isMessageTable) {
    await pool.query(queries.createMessageTable);
  }

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);
      if (data.action === "addTask") {
        await processAddTasks(ws, data.payload);
      }

      if (data.action === "checkPendingTask") {
        console.log("Checking pending task");
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
  const { message, ids: users, time: interval, count, token } = payload;
  console.log(payload);
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
  const role = decodedToken.role;
  const username = decodedToken.username;

  console.log("role : ", role, username);

  for (let i = 0; i < users.length; i++) {
    await addTask(users[i], message, username);
  }

  scheduleTasks(ws, interval, count, username);
};

const scheduleTasks = (ws, interval = 2, count = 2, username) => {
  if (!taskSchedulerIntervalId) {
    console.log("Tasks Scheduled sucessfully");
    executeTasks(ws, count, username);
    taskSchedulerIntervalId = setInterval(async () => {
      executeTasks(ws, count, username);
    }, interval * 60000);
    // Start a countdown to send time left to execute the next task every 30 seconds
    let timeLeft = interval * 60; // Convert interval to seconds
    const countdownIntervalId = setInterval(() => {
      if (timeLeft > 0) {
        // Send time left to the client
        ws.send(JSON.stringify({ action: "timeLeft", seconds: timeLeft }));
        timeLeft -= 30; // Decrease by 30 seconds every 30 seconds
      } else {
        // Clear the countdown interval when the countdown is finished
        clearInterval(countdownIntervalId);
      }
    }, 30000); // 30 seconds
  } else {
    console.log("Already Scheduled");
  }
};

const executeTasks = async (ws, count, username) => {
  const tasks = await getPendingTask(count, username);
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
};

server.listen(PORT, () => {
  console.log(`Server running on port ${server.address().port}`);
});

// Log WebSocket server's port after it starts listening
wss.on("listening", () => {
  console.log(`WebSocket server running on port ${server.address().port}`);
});
