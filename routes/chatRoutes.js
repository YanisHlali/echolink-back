const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const authenticateToken = require("../middlewares/authMiddleware");

router.get("/messages/:signalementId", authenticateToken, chatController.getMessages);

module.exports = router; 