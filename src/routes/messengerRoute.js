const express = require("express");
const {
  sendMessage,
  getAllMessages,
  getAllMessagesByUsername,
} = require("../controllers/messengerController");
const {
  registerUser,
  loginUser,
  getAllUsers,
  getUserByUsername,
  getAllAgents,
  getAgentByUsername,
  blockAgentByUsername,
  deleteAgent,
  updateAgent,
} = require("../controllers/authController");
const { authenticate, isAdmin } = require("../middleware.js/middleware");
const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).send({ message: "I'm Bulk Messenger" });
});

// LOGIN
router.post("/auth/users/login", loginUser);

// REGISTER
router.post("/auth/users/register", authenticate, registerUser);

// GET ALL USERS
router.get("/users", isAdmin, getAllUsers);

// GET A USER BY USERNAME
router.get("/users/:username", isAdmin, getUserByUsername);

// GET ALL AGENTS
router.get("/agents", isAdmin, getAllAgents);

// GET AGENT BY USERNAME
router.get("/agents/:username", isAdmin, getAgentByUsername);

// DELETE A USER BY USERNAME
router.delete("/agents/:username", isAdmin, deleteAgent);

// UPDATE A USER BY USERNAME
router.put("/agents/:username", isAdmin, updateAgent);

// BLOCK AGENT BY USERNAME
router.get("/disable/users/:username", isAdmin, blockAgentByUsername);

// SEND A MESSAGE
router.post("/send", sendMessage);

// GET ALL MESSAGES
router.get("/messages", authenticate, getAllMessages);

// GET ALL AGENT's MESSAGE
router.get("/messages/:agent", authenticate, getAllMessagesByUsername);

module.exports = router;
