import requireAuth from "../middleware/auth.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import db from "../db.js";
import express from "express";

const router = express.Router();





router.post("/login", async (req, res) => {
  console.log("🔥 LOGIN START");   // ✅
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const [rows] = await db.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    console.log("🔥 DB OK");       // ✅

    if (rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    const user = rows[0];

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: "Wrong password" });
    }

    const token = crypto.randomUUID();

    await db.query(
      "UPDATE users SET session_token = ? WHERE id = ?",
      [token, user.id]
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name
      }
    });

  } catch (err) {
    console.log("❌ ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


router.get("/me", requireAuth, (req, res) => {
  console.log("✅ /me HIT");
  res.json({
    id: req.user.id,
    username: req.user.username,
    name: req.user.name
  });
});


router.get("/users", async (req, res) => {
  res.json([
    { username: "niklas" },
    { username: "test" }
  ]);
});



export default router;