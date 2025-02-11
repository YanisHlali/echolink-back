const pool = require("../config/db");

exports.createSignalement = async (req, res) => {
  const { catId, description, priorityLevel, longitude, latitude } = req.body;

  if (!catId || !description || !priorityLevel) {
    return res.status(400).json({ message: "Category, description, and priority level are required" });
  }

  try {
    await pool.query(
      "INSERT INTO signalement (userId, catId, description, priorityLevel, longitude, latitude, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
      [req.user.id, catId, description, priorityLevel, longitude || 0, latitude || 0]
    );
    res.status(201).json({ message: "Signalement created successfully" });
  } catch (error) {
    console.error("Error creating signalement:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getSignalements = async (req, res) => {
  try {
    const [signalements] = await pool.query(`
      SELECT 
        s.id, 
        s.description, 
        s.priorityLevel, 
        s.longitude, 
        s.latitude, 
        s.created_at, 
        s.closed_at,

        u.id AS userId, 
        u.name AS userName, 
        u.lastName AS userLastName, 
        u.email AS userEmail,

        c.id AS categoryId, 
        c.name AS categoryName
      FROM signalement s
      JOIN users u ON s.userId = u.id
      JOIN category c ON s.catId = c.id
      ORDER BY s.created_at DESC
    `);
      res.json(signalements);
  } catch (error) {
    console.error("Error fetching signalements:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getSignalementById = async (req, res) => {
  const { id } = req.params;

  try {

    const [signalements] = await pool.query(`
      SELECT 
        s.id, 
        s.description, 
        s.priorityLevel, 
        s.longitude, 
        s.latitude, 
        s.created_at, 
        s.closed_at,
        -- Détails de l'utilisateur
        u.id AS userId, 
        u.name AS userName, 
        u.lastName AS userLastName, 
        u.email AS userEmail,
        -- Détails de la catégorie
        c.id AS categoryId, 
        c.name AS categoryName
      FROM signalement s
      JOIN users u ON s.userId = u.id
      JOIN category c ON s.catId = c.id
      WHERE s.id = ?
    `, [id]);
    if (signalements.length === 0) {
      return res.status(404).json({ message: "Signalement not found" });
    }
    res.json(signalements[0]);
  } catch (error) {
    console.error("Error fetching signalement:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateSignalement = async (req, res) => {
  const { id } = req.params;
  const { catId, description, priorityLevel, longitude, latitude } = req.body;

  if (!catId || !description || !priorityLevel) {
    return res.status(400).json({ message: "Category, description, and priority level are required" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE signalement SET catId = ?, description = ?, priorityLevel = ?, longitude = ?, latitude = ? WHERE id = ? AND userId = ?",
      [catId, description, priorityLevel, longitude, latitude, id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Signalement not found or you are not the owner" });
    }

    res.json({ message: "Signalement updated successfully" });
  } catch (error) {
    console.error("Error updating signalement:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteSignalement = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query("DELETE FROM signalement WHERE id = ? AND userId = ?", [id, req.user.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Signalement not found or you are not the owner" });
    }

    res.json({ message: "Signalement deleted successfully" });
  } catch (error) {
    console.error("Error deleting signalement:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.closeSignalement = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if the signalement exists and belongs to the user
    const [signalement] = await pool.query("SELECT userId, closed_at FROM signalement WHERE id = ?", [id]);

    if (signalement.length === 0) {
      return res.status(404).json({ message: "Signalement not found" });
    }


    if (signalement[0].closed_at !== null) {
      return res.status(400).json({ message: "Signalement is already closed" });
    }

    // Close the signalement
    await pool.query("UPDATE signalement SET closed_at = NOW() WHERE id = ?", [id]);

    res.json({ message: "Signalement closed successfully" });
  } catch (error) {
    console.error("Error closing signalement:", error);
    res.status(500).json({ message: "Server error" });
  }
};

