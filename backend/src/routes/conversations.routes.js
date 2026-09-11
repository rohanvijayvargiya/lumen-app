const express = require("express");
const { readAll, writeAll } = require("../db");

const router = express.Router();

// GET /api/conversations — list (no message bodies, just metadata) newest first
router.get("/", (req, res) => {
  const { conversations } = readAll();
  const list = conversations
    .map((c) => ({ id: c.id, title: c.title, createdAt: c.createdAt, updatedAt: c.updatedAt }))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  res.json(list);
});

// GET /api/conversations/:id — full conversation with messages
router.get("/:id", (req, res) => {
  const { conversations } = readAll();
  const convo = conversations.find((c) => c.id === req.params.id);
  if (!convo) return res.status(404).json({ error: "Conversation not found" });
  res.json(convo);
});

// POST /api/conversations — create a new empty conversation
router.post("/", (req, res) => {
  const db = readAll();
  const now = new Date().toISOString();
  const convo = { id: `conv${Date.now()}`, title: "New chat", messages: [], createdAt: now, updatedAt: now };
  db.conversations.unshift(convo);
  writeAll(db);
  res.status(201).json(convo);
});

// PATCH /api/conversations/:id — rename
router.patch("/:id", (req, res) => {
  const db = readAll();
  const convo = db.conversations.find((c) => c.id === req.params.id);
  if (!convo) return res.status(404).json({ error: "Conversation not found" });
  if (typeof req.body?.title === "string" && req.body.title.trim()) {
    convo.title = req.body.title.trim();
  }
  convo.updatedAt = new Date().toISOString();
  writeAll(db);
  res.json(convo);
});

// DELETE /api/conversations/:id
router.delete("/:id", (req, res) => {
  const db = readAll();
  const exists = db.conversations.some((c) => c.id === req.params.id);
  if (!exists) return res.status(404).json({ error: "Conversation not found" });
  db.conversations = db.conversations.filter((c) => c.id !== req.params.id);
  writeAll(db);
  res.status(204).end();
});

module.exports = router;
