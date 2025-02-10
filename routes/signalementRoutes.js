const express = require("express");
const signalementController = require("../controllers/signalementController");
const authenticateToken = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", authenticateToken, signalementController.createSignalement);
router.get("/", signalementController.getSignalements);
router.get("/:id", signalementController.getSignalementById);
router.put("/:id", authenticateToken, signalementController.updateSignalement);
router.delete("/:id", authenticateToken, signalementController.deleteSignalement);

module.exports = router;
