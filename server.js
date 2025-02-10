const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const signalementRoutes = require("./routes/signalementRoutes");
const signalementAnswerRoutes = require("./routes/signalementAnswerRoutes");


require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/auth", authRoutes);
app.use("/categories", categoryRoutes);
app.use("/signalements", signalementRoutes);
app.use("/signalementAnswers", signalementAnswerRoutes);



app.get("/", (req, res) => {
  res.send("EchoLink API is running!");
});

app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS result");
    res.json({ success: true, result: rows[0].result });
  } catch (error) {
    console.error("Erreur de connexion à la BDD:", error);
    res.status(500).json({ success: false, message: "Connexion à MySQL échouée", error });
  }
});

// Pour exécuter les tests sans lancer le serveur
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;