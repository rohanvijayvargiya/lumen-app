const express = require("express");
const { readAll, writeAll } = require("../db");

const router = express.Router();

// GET /api/conversations — this user's conversations, newest first
router.get("/", async (req, res) => {
  const { conversations } = await readAll();
  const list = conversations
    .filter((c) => c.userId === req.userId)
    .map((c) => ({ id: c.id, title: c.title, createdAt: c.createdAt, updatedAt: c.updatedAt }))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  res.json(list);
});

// GET /api/conversations/:id
router.get("/:id", async (req, res) => {
  const { conversations } = await readAll();
  const convo = conversations.find((c) => c.id === req.params.id && c.userId === req.userId);
  if (!convo) return res.status(404).json({ error: "Conversation not found" });
  res.json(convo);
});

// POST /api/conversations
router.post("/", async (req, res) => {
  const db = await readAll();
  const now = new Date().toISOString();
  const convo = {
    id: `conv${Date.now()}`,
    userId: req.userId,
    title: "New chat",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  db.conversations.unshift(convo);
  await writeAll(db);
  res.status(201).json(convo);
});

// PATCH /api/conversations/:id
router.patch("/:id", async (req, res) => {
  const db = await readAll();
  const convo = db.conversations.find((c) => c.id === req.params.id && c.userId === req.userId);
  if (!convo) return res.status(404).json({ error: "Conversation not found" });
  if (typeof req.body?.title === "string" && req.body.title.trim()) {
    convo.title = req.body.title.trim();
  }
  convo.updatedAt = new Date().toISOString();
  await writeAll(db);
  res.json(convo);
});

// DELETE /api/conversations/:id
router.delete("/:id", async (req, res) => {
  const db = await readAll();
  const exists = db.conversations.some((c) => c.id === req.params.id && c.userId === req.userId);
  if (!exists) return res.status(404).json({ error: "Conversation not found" });
  db.conversations = db.conversations.filter((c) => c.id !== req.params.id);
  await writeAll(db);
  res.status(204).end();
});

module.exports = router;
