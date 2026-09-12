const express = require("express");
const { readAll, writeAll } = require("../db");
const { streamGroq } = require("../utils/groqStream");

const router = express.Router();

function truncateTitle(text) {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 48 ? clean.slice(0, 48) + "…" : clean;
}

// POST /api/chat/image  { conversationId, prompt }
// Generates an image via Pollinations.ai — a free, no-API-key image API.
// We don't proxy the actual image bytes through our server: we just build
// the URL (with a fixed seed so it's reproducible on reload) and store it;
// the browser's <img> tag fetches the picture directly from Pollinations.
router.post("/image", async (req, res) => {
  const { conversationId, prompt } = req.body || {};
  if (!conversationId || !prompt || !prompt.trim()) {
    return res.status(400).json({ error: "conversationId and prompt are required" });
  }

  const db = await readAll();
  const convo = db.conversations.find((c) => c.id === conversationId && c.userId === req.userId);
  if (!convo) return res.status(404).json({ error: "Conversation not found" });

  const seed = Date.now();
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt.trim()
  )}?width=1024&height=1024&seed=${seed}`;

  const userMessage = {
    id: `m${Date.now()}`,
    role: "user",
    contentType: "text",
    content: prompt.trim(),
    createdAt: new Date().toISOString(),
  };
  const assistantMessage = {
    id: `m${Date.now() + 1}`,
    role: "assistant",
    contentType: "image",
    content: imageUrl,
    createdAt: new Date().toISOString(),
  };

  convo.messages.push(userMessage, assistantMessage);
  if (convo.title === "New chat") convo.title = truncateTitle(prompt);
  convo.updatedAt = new Date().toISOString();
  await writeAll(db);

  res.json({ userMessage, assistantMessage, title: convo.title });
});

// POST /api/chat/stream  { conversationId, content }
// Streams the assistant's reply back as it's generated, using Server-Sent
// Events. Each chunk looks like: data: {"type":"delta","text":"..."}\n\n
router.post("/stream", async (req, res) => {
  const { conversationId, content } = req.body || {};
  if (!conversationId || !content || !content.trim()) {
    return res.status(400).json({ error: "conversationId and content are required" });
  }

  const db = await readAll();
  const convo = db.conversations.find((c) => c.id === conversationId && c.userId === req.userId);
  if (!convo) return res.status(404).json({ error: "Conversation not found" });

  const userMessage = {
    id: `m${Date.now()}`,
    role: "user",
    contentType: "text",
    content,
    createdAt: new Date().toISOString(),
  };
  convo.messages.push(userMessage);
  if (convo.title === "New chat") convo.title = truncateTitle(content);
  convo.updatedAt = new Date().toISOString();
  await writeAll(db);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const apiMessages = convo.messages
    .filter((m) => (m.contentType || "text") === "text")
    .map((m) => ({ role: m.role, content: m.content }));
  let assistantText = "";

  try {
    for await (const evt of streamGroq(apiMessages)) {
      const delta = evt.choices?.[0]?.delta?.content;
      if (delta) {
        assistantText += delta;
        res.write(`data: ${JSON.stringify({ type: "delta", text: delta })}\n\n`);
      }
      if (evt.choices?.[0]?.finish_reason) break;
    }

    const assistantMessage = {
      id: `m${Date.now() + 1}`,
      role: "assistant",
      contentType: "text",
      content: assistantText,
      createdAt: new Date().toISOString(),
    };

    // Re-read fresh in case anything else changed the file while we streamed.
    const freshDb = await readAll();
    const freshConvo = freshDb.conversations.find((c) => c.id === conversationId);
    if (freshConvo) {
      freshConvo.messages.push(assistantMessage);
      freshConvo.updatedAt = new Date().toISOString();
      await writeAll(freshDb);
    }

    res.write(`data: ${JSON.stringify({ type: "done", message: assistantMessage, title: convo.title })}\n\n`);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`);
  } finally {
    res.end();
  }
});

module.exports = router;
