let io;
function setSocket(socketIO) {
  io = socketIO;
}

const pool = require("../config/db");
const chatController = require("./chatController");

const signalementController = {
  createSignalement: async (req, res) => {
    try {
      const { title, description, latitude, longitude, category_id, priority_level } = req.body;
      const user_id = req.user.id;

      if (!title || !description || !latitude || !longitude || !category_id || !priority_level || !user_id) {
        console.error('Données manquantes:', {
          title: !title,
          description: !description,
          latitude: !latitude,
          longitude: !longitude,
          category_id: !category_id,
          priority_level: !priority_level,
          user_id: !user_id
        });
        return res.status(400).json({ message: "Données manquantes" });
      }

      const [result] = await pool.query(
        `INSERT INTO signalements (title, description, latitude, longitude, category_id, priority_level, user_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'open')`,
        [title, description, latitude, longitude, category_id, priority_level, user_id]
      );

      const [newSignalement] = await pool.query(
        `SELECT s.*, c.name as category_name, u.name as user_name, u.lastName as user_lastName
         FROM signalements s
         LEFT JOIN categories c ON s.category_id = c.id
         LEFT JOIN users u ON s.user_id = u.id
         WHERE s.id = ?`,
        [result.insertId]
      );

      const socketId = req.headers['x-socket-id'];

      if (socketId && io.sockets.sockets.get(socketId)) {
        io.sockets.sockets.get(socketId).broadcast.emit('newSignalement', newSignalement[0]);
      } else {
        io.emit('newSignalement', newSignalement[0]);
      }

      res.status(201).json(newSignalement[0]);
    } catch (error) {
      console.error("Erreur détaillée lors de la création du signalement:", error);
      console.error("Stack trace:", error.stack);
      res.status(500).json({
        message: "Erreur lors de la création du signalement",
        details: error.message
      });
    }
  },

  getSignalements: async (req, res) => {
    try {
      const [signalements] = await pool.query(
        `SELECT s.*, 
                c.name as categoryName,
                u.name as userName, 
                u.lastName as userLastName
         FROM signalements s
         LEFT JOIN categories c ON s.category_id = c.id
         LEFT JOIN users u ON s.user_id = u.id
         ORDER BY s.created_at DESC`
      );
      res.json(signalements);
    } catch (error) {
      console.error('Erreur lors de la récupération des signalements:', error);
      res.status(500).json({ message: "Erreur lors de la récupération des signalements" });
    }
  },

  getSignalement: async (req, res) => {
    const { id } = req.params;
    try {
      const [signalements] = await pool.query(
        `SELECT s.*, 
                c.name as categoryName,
                c.id as category_id,
                u.name as userName, 
                u.lastName as userLastName
         FROM signalements s
         LEFT JOIN categories c ON s.category_id = c.id
         LEFT JOIN users u ON s.user_id = u.id
         WHERE s.id = ?`,
        [id]
      );

      if (signalements.length === 0) {
        return res.status(404).json({ message: "Signalement non trouvé" });
      }
      res.json(signalements[0]);
    } catch (error) {
      console.error('Erreur lors de la récupération du signalement:', error);
      res.status(500).json({ message: "Erreur lors de la récupération du signalement" });
    }
  },

  updateSignalement: async (req, res) => {
    try {
      const { title, description, status, priority_level, latitude, longitude } = req.body;
      const signalementId = req.params.id;

      const [signalement] = await pool.query(
        "SELECT user_id FROM signalements WHERE id = ?",
        [signalementId]
      );

      if (signalement.length === 0) {
        return res.status(404).json({ message: "Signalement non trouvé" });
      }

      if (signalement[0].user_id !== req.user.id) {
        return res.status(403).json({ message: "Non autorisé à modifier ce signalement" });
      }

      await pool.query(
        `UPDATE signalements 
         SET title = COALESCE(?, title),
             description = COALESCE(?, description),
             status = COALESCE(?, status),
             priority_level = COALESCE(?, priority_level),
             latitude = COALESCE(?, latitude),
             longitude = COALESCE(?, longitude),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [title, description, status, priority_level, latitude, longitude, signalementId]
      );

      const [updatedSignalement] = await pool.query(
        `SELECT s.*, 
                c.name as category_name,
                u.name as user_name,
                u.lastName as user_lastName
         FROM signalements s
         LEFT JOIN categories c ON s.category_id = c.id
         LEFT JOIN users u ON s.user_id = u.id
         WHERE s.id = ?`,
        [signalementId]
      );

      res.json(updatedSignalement[0]);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du signalement:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour du signalement" });
    }
  },

  deleteSignalement: async (req, res) => {
    try {
      const signalementId = req.params.id;

      const [signalement] = await pool.query(
        "SELECT user_id FROM signalements WHERE id = ?",
        [signalementId]
      );

      if (signalement.length === 0) {
        return res.status(404).json({ message: "Signalement non trouvé" });
      }

      if (signalement[0].user_id !== req.user.id) {
        return res.status(403).json({ message: "Non autorisé à supprimer ce signalement" });
      }

      await pool.query("DELETE FROM signalements WHERE id = ?", [signalementId]);

      res.json({ message: "Signalement supprimé avec succès" });
    } catch (error) {
      console.error("Erreur lors de la suppression du signalement:", error);
      res.status(500).json({ message: "Erreur lors de la suppression du signalement" });
    }
  },

  getCategories: async (req, res) => {
    try {
      const [categories] = await pool.query("SELECT * FROM categories");
      res.json(categories);
    } catch (error) {
      console.error("Erreur lors de la récupération des catégories:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des catégories" });
    }
  },

  closeSignalement: async (req, res) => {
    const { id } = req.params;
    try {
      const [signalement] = await pool.query(
        "SELECT user_id FROM signalements WHERE id = ?",
        [id]
      );

      if (signalement.length === 0) {
        return res.status(404).json({ message: "Signalement non trouvé" });
      }

      if (signalement[0].user_id !== req.user.id) {
        return res.status(403).json({ message: "Non autorisé à fermer ce signalement" });
      }

      await pool.query(
        "UPDATE signalements SET status = 'closed', closed_at = NOW() WHERE id = ?",
        [id]
      );

      await chatController.closeChat(id);

      res.json({ message: "Signalement fermé avec succès" });
    } catch (error) {
      console.error("Erreur lors de la fermeture du signalement:", error);
      res.status(500).json({ message: "Erreur lors de la fermeture du signalement" });
    }
  }
};

module.exports = {
  ...signalementController,
  setSocket,
};