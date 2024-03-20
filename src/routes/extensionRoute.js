const express = require("express");
const { addBatch } = require("../controllers/extensionController");
const router = express.Router();

router.post("/", addBatch);

module.exports = router;
