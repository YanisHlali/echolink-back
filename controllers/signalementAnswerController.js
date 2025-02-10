const pool = require("../config/db");

exports.createSignalementAnswer = async (req, res) => {
  const { signalementId, rating } = req.body;

  if (!signalementId ) {
    return res.status(400).json({ message: "Signalement ID  is required" });
  }

  try {
    // Check if the signalement exists
    const [signalementExists] = await pool.query("SELECT * FROM signalement WHERE id = ?", [signalementId]);
    if (signalementExists.length === 0) {
      return res.status(404).json({ message: "Signalement not found" });
    }

    await pool.query(
      "INSERT INTO signalementAnswer (userId, signalementId, rating, created_at) VALUES (?, ?, ?, NOW())",
      [req.user.id, signalementId, rating]
    );
    res.status(201).json({ message: "Answer added successfully" });
  } catch (error) {
    console.error("Error creating signalement answer:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAnswersForSignalement = async (req, res) => {
  const { signalementId } = req.params;

  try {
    const [answers] = await pool.query("SELECT * FROM signalementAnswer WHERE signalementId = ?", [signalementId]);
    res.json(answers);
  } catch (error) {
    console.error("Error fetching answers for signalement:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAnswerById = async (req, res) => {
  const { id } = req.params;

  try {
    const [answers] = await pool.query("SELECT * FROM signalementAnswer WHERE id = ?", [id]);
    if (answers.length === 0) {
      return res.status(404).json({ message: "Answer not found" });
    }
    res.json(answers[0]);
  } catch (error) {
    console.error("Error fetching signalement answer:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateSignalementAnswer = async (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;

  if (!rating) {
    return res.status(400).json({ message: "Rating is required" });
  }

  try {
    // Update the signalement answer only if it belongs to the user
    const [result] = await pool.query(
      "UPDATE signalementAnswer SET rating = ? WHERE id = ? AND userId = ?",
      [rating, id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Answer not found or you are not the owner" });
    }

    res.json({ message: "Answer updated successfully" });
  } catch (error) {
    console.error("Error updating signalement answer:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteSignalementAnswer = async (req, res) => {
  const { id } = req.params;

  try {
    // Delete the signalement answer only if it belongs to the user
    const [result] = await pool.query("DELETE FROM signalementAnswer WHERE id = ? AND userId = ?", [id, req.user.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Answer not found or you are not the owner" });
    }

    res.json({ message: "Answer deleted successfully" });
  } catch (error) {
    console.error("Error deleting signalement answer:", error);
    res.status(500).json({ message: "Server error" });
  }
};
