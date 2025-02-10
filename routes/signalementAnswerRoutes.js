const express = require("express");
const signalementAnswerController = require("../controllers/signalementAnswerController");
const authenticateToken = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", authenticateToken, signalementAnswerController.createSignalementAnswer);
router.get("/:signalementId", signalementAnswerController.getAnswersForSignalement);
router.get("/answer/:id", signalementAnswerController.getAnswerById);
router.put("/:id", authenticateToken, signalementAnswerController.updateSignalementAnswer);
router.delete("/:id", authenticateToken, signalementAnswerController.deleteSignalementAnswer);

module.exports = router;
