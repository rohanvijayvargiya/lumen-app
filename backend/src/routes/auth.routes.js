const express = require("express");
const bcrypt = require("bcryptjs");
const { readAll, writeAll } = require("../db");
const { signToken } = require("../utils/jwt");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function publicUser(user) {
  return { id: user.id, email: user.email, name: user.name };
}

// POST /api/auth/signup  { email, password, name }
router.post("/signup", (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const db = readAll();

  if (db.users.some((u) => u.email === cleanEmail)) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  const user = {
    id: `u${Date.now()}`,
    email: cleanEmail,
    name: (name && name.trim()) || cleanEmail.split("@")[0],
    passwordHash: bcrypt.hashSync(password, 10),
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  writeAll(db);

  const token = signToken(user.id);
  res.status(201).json({ token, user: publicUser(user) });
});

// POST /api/auth/login  { email, password }
router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const db = readAll();
  const user = db.users.find((u) => u.email === cleanEmail);

  // Deliberately vague error for both cases — don't reveal whether the
  // email exists, that just helps someone guessing accounts.
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }

  const token = signToken(user.id);
  res.json({ token, user: publicUser(user) });
});

// GET /api/auth/me — used on page load to restore a session from a saved token
router.get("/me", requireAuth, (req, res) => {
  const { users } = readAll();
  const user = users.find((u) => u.id === req.userId);
  if (!user) return res.status(401).json({ error: "Account no longer exists." });
  res.json(publicUser(user));
});

module.exports = router;
