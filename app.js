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
const taskSchedulerIntervalIds = new Map();
const clients = new Map();

app.use(cors());
app.use(express.json());

app.use("/api/", messengerRoute);
app.use("/", healthCheckRoute);
app.use("/extension", extensionRoute);

wss.on("connection", async (ws) => {
  let clientId = null;
  // console.log(`Connected: ${clientId}`);
  // clients.set(clientId, ws);

  ws.send(JSON.stringify({ message: "Hei" }));

  const isMessageTable = await checkTableExists("messages");

  if (!isMessageTable) {
    await pool.query(queries.createMessageTable);
  }

  ws.onmessage = async (message) => {
    try {
      const data = JSON.parse(message.data);

      if (data.action === "clientID") {
        clientId = data.payload;
        console.log(`Client ID received: ${clientId}`);

        if (clients.has(clientId)) {
          clients.set(clientId, ws);
          console.log(
            `Client ID ${clientId} already exists. Updated WebSocket connection.`
          );
        } else {
          clients.set(clientId, ws);
          console.log(`Client ID ${clientId} added to the clients map.`);
        }
      }
      if (data.action === "addTask") {
        await processAddTasks(clientId, data.payload);
      }

      if (data.action === "checkPendingTask") {
        console.log("Checking pending task");
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  };

  ws.on("close", () => {
    console.log(`Disconnedted :  ${clientId}`);
    // clients.delete(clientId);
  });
});

const processAddTasks = async (clientId, payload) => {
  const { message, ids: users, time: interval, count, token } = payload;
  console.log(payload);
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
  const role = decodedToken.role;
  const username = decodedToken.username;

  console.log("role : ", role, username);

  const ws = clients.get(clientId);
  if (!ws) {
    console.error(`WebSocket connection not found for client ${clientId}`);
    return;
  }

  for (let i = 0; i < users.length; i++) {
    await addTask(users[i], message, username);
  }

  scheduleTasks(clientId, ws, interval, count, username);
};

const scheduleTasks = (clientId, ws, interval = 2, count = 2, username) => {
  if (taskSchedulerIntervalIds.has(clientId)) {
    console.log("Task already scheduled for this client");
    return;
  }

  console.log("Tasks Scheduled sucessfully");
  executeTasks(clientId, ws, count, username);

  const intervalId = setInterval(async () => {
    executeTasks(clientId, ws, count, username);
  }, interval * 60000);

  taskSchedulerIntervalIds.set(clientId, intervalId);
};

// When a task is no longer needed, clear its interval
const clearTaskSchedulerInterval = (clientId) => {
  const intervalId = taskSchedulerIntervalIds.get(clientId);
  if (intervalId) {
    clearInterval(intervalId);
    taskSchedulerIntervalIds.delete(clientId);
  }
};

const executeTasks = async (clientId, ws, count, username) => {
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
    clearTaskSchedulerInterval(clientId);
    console.log("No pending tasks : ", username);
  }
};

server.listen(PORT, () => {
  console.log(`Server running on port ${server.address().port}`);
});

// Log WebSocket server's port after it starts listening
wss.on("listening", () => {
  console.log(`WebSocket server running on port ${server.address().port}`);
});
