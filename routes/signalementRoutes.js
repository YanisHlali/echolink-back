const express = require("express");
const router = express.Router();
const signalementController = require("../controllers/signalementController");
const authenticateToken = require("../middlewares/authMiddleware");

router.get("/", signalementController.getSignalements);
router.get("/categories", signalementController.getCategories);
router.get("/:id", signalementController.getSignalement);

router.post("/", authenticateToken, signalementController.createSignalement);
router.put("/:id", authenticateToken, signalementController.updateSignalement);
router.delete("/:id", authenticateToken, signalementController.deleteSignalement);
router.post("/:id/close", authenticateToken, signalementController.closeSignalement);

module.exports = router;
