const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const crypto = require("crypto");
const emailService = require("../services/emailService");

exports.register = async (req, res) => {
  const { email, name, lastName, password, longitude, latitude } = req.body;

  if (!email || !name || !lastName || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const [existingUser] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "This email is already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    await pool.query(
      "INSERT INTO users (email, name, lastName, password, longitude, latitude, verification_token) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [email, name, lastName, hashedPassword, longitude || 0, latitude || 0, verificationToken]
    );

    // Send verification email
    await emailService.sendVerificationEmail(email, verificationToken);

    res.status(201).json({ message: "User registered. Please verify your email." });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];

    if (!user.is_verified) {
      return res.status(403).json({ message: "Please verify your email before logging in." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, lastName: user.lastName },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getProfile = async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, email, name, lastName, longitude, latitude, created_at FROM users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(users[0]);
  } catch (error) {
    console.error("Error retrieving user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Invalid token" });
  }

  try {
    const [user] = await pool.query("SELECT * FROM users WHERE verification_token = ?", [token]);

    if (user.length === 0) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    await pool.query("UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = ?", [user[0].id]);

    res.json({ message: "Email verified successfully!" });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUserInfo = async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, email, name, lastName FROM users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json(users[0]);
  } catch (error) {
    console.error("Erreur lors de la récupération des infos utilisateur :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
