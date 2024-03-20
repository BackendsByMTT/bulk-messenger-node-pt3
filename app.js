const express = require("express");
const healthCheckRoute = require("./src/routes/healthRoute");
const messengerRoute = require("./src/routes/messengerRoute");
const extensionRoute = require("./src/routes/extensionRoute");

require("dotenv").config();
const cors = require("cors");
const wss = require("./src/utlis/socket");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

wss.on("listening", () => {
  console.log("WebSocket server listening on port 8080");
});
app.use("/api/", messengerRoute);
app.use("/", healthCheckRoute);
app.use("/extension", extensionRoute);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// console.log(
//   process.env.DB_USER,
//   process.env.DB_PASSWORD,
//   process.env.DB_DATABASE,
//   process.env.DB_PORT,
//   process.env.DB_HOST
// );
