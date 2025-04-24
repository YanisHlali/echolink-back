const pool = require("../config/db");

exports.getMessages = async (req, res) => {
  const { signalementId } = req.params;
  try {
    const [messages] = await pool.query(
      `SELECT m.*, u.name, u.lastName 
       FROM chat_messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.signalement_id = ?
       ORDER BY m.created_at ASC`,
      [signalementId]
    );
    res.json(messages);
  } catch (error) {
    console.error("Erreur lors de la récupération des messages:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.saveMessage = async (userId, signalementId, message) => {
  try {
    const [result] = await pool.query(
      "INSERT INTO chat_messages (user_id, signalement_id, message, created_at) VALUES (?, ?, ?, NOW())",
      [userId, signalementId, message]
    );
    return result.insertId;
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du message:", error);
    throw error;
  }
};

exports.closeChat = async (signalementId) => {
  try {
    await pool.query(
      "UPDATE chat_messages SET closed_at = NOW() WHERE signalement_id = ?",
      [signalementId]
    );
  } catch (error) {
    console.error("Erreur lors de la fermeture du chat:", error);
    throw error;
  }
}; 