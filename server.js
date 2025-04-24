const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");
const pool = require("./config/db");
const jwt = require("jsonwebtoken");

const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const signalementRoutes = require("./routes/signalementRoutes");
const signalementAnswerRoutes = require("./routes/signalementAnswerRoutes");

require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Token d'authentification manquant" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token invalide" });
    }
    req.user = user;
    next();
  });
};

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

app.use(cors());
app.use(bodyParser.json());

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/signalements", signalementRoutes);
app.use("/api/signalementAnswers", signalementAnswerRoutes);

app.get("/", (req, res) => {
  res.send("EchoLink API is running!");
});

const users = {};

app.get("/chat/rooms", authenticateToken, async (req, res) => {
  try {
    const [rooms] = await pool.query("SELECT * FROM chat_rooms");
    res.json(rooms);
  } catch (error) {
    console.error("Erreur lors de la récupération des salons :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.post("/chat/rooms", authenticateToken, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Nom du salon requis" });

  try {
    const [result] = await pool.query(
      "INSERT INTO chat_rooms (name) VALUES (?)",
      [name]
    );
    res.json({ id: result.insertId, name });
  } catch (error) {
    console.error("Erreur lors de la création du salon :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.get("/chat/messages/:roomId", authenticateToken, async (req, res) => {
  const { roomId } = req.params;
  try {
    const [messages] = await pool.query(
      "SELECT chat_messages.*, users.name, users.lastName FROM chat_messages " +
        "JOIN users ON chat_messages.user_id = users.id WHERE room_id = ? ORDER BY created_at ASC",
      [roomId]
    );
    res.json(messages);
  } catch (error) {
    console.error("Erreur lors de la récupération des messages :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

io.on("connection", (socket) => {
  socket.on("setUser", async (userId) => {
    try {
      const [result] = await pool.query(
        "SELECT name, lastName FROM users WHERE id = ?",
        [userId]
      );

      if (result.length > 0) {
        const fullName = `${result[0].name} ${result[0].lastName}`;
        users[socket.id] = { name: fullName, room: null, id: userId };
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération du nom d'utilisateur :",
        error
      );
    }
  });

  socket.on("joinRoom", async (roomId) => {
    if (users[socket.id]) {
      const oldRoom = users[socket.id].room;
      if (oldRoom) {
        socket.leave(oldRoom);
      }

      users[socket.id].room = roomId;
      socket.join(roomId);
    }
  });

  socket.on("sendMessage", async ({ roomId, text }) => {
    if (users[socket.id] && users[socket.id].room === roomId) {
      const { id, name } = users[socket.id];

      await pool.query(
        "INSERT INTO chat_messages (room_id, user_id, message) VALUES (?, ?, ?)",
        [roomId, id, text]
      );

      io.to(roomId).emit("receiveMessage", {
        sender: name,
        text,
      });
    }
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
  });

  socket.on('joinSignalement', async ({ signalementId }) => {
    const room = `signalement-${signalementId}`;
    socket.join(room);
    
    try {
      const [messages] = await pool.query(
        `SELECT m.*, u.name, u.lastName 
         FROM chat_messages m
         JOIN users u ON m.user_id = u.id
         WHERE m.signalement_id = ?
         ORDER BY m.created_at ASC`,
        [signalementId]
      );
      socket.emit('chatHistory', messages);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      socket.emit('error', { message: 'Erreur lors de la récupération de l\'historique' });
    }
  });

  socket.on('message', async (data) => {
    const { signalementId, text } = data;
    const room = `signalement-${signalementId}`;
    
    try {
      const messageId = await chatController.saveMessage(socket.user.id, signalementId, text);
      
      const [messageInfo] = await pool.query(
        `SELECT m.*, u.name, u.lastName 
         FROM chat_messages m
         JOIN users u ON m.user_id = u.id
         WHERE m.id = ?`,
        [messageId]
      );

      if (messageInfo.length > 0) {
        const message = {
          text: messageInfo[0].message,
          sender: `${messageInfo[0].name} ${messageInfo[0].lastName}`,
          userId: messageInfo[0].user_id,
          timestamp: messageInfo[0].created_at
        };

        io.to(room).emit('message', message);
      }
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('error', { message: 'Error saving message' });
    }
  });

  socket.on('leaveSignalement', (signalementId) => {
    const room = `signalement-${signalementId}`;
    socket.leave(room);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.user.email);
  });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
