require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { requireAuth } = require("./middleware/auth");
const authRoutes = require("./routes/auth.routes");
const conversationsRoutes = require("./routes/conversations.routes");
const chatRoutes = require("./routes/chat.routes");

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: CORS_ORIGIN.split(",").map((s) => s.trim()) }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", aiConfigured: Boolean(process.env.GROQ_API_KEY) });
});

// Signup/login are public. Everything else requires a valid session.
app.use("/api/auth", authRoutes);
app.use("/api/conversations", requireAuth, conversationsRoutes);
app.use("/api/chat", requireAuth, chatRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Lumen API listening on http://localhost:${PORT}`);
  if (!process.env.GROQ_API_KEY) {
    console.log("WARNING: GROQ_API_KEY is not set — chatting will fail until it's added.");
  }
});
