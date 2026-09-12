/**
 * Persistent data store.
 *
 * If UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are set, everything
 * is stored in a free Upstash Redis database (one JSON blob under the key
 * "lumen-db") — this survives server restarts, which matters because
 * Render's free tier wipes its local disk every time the service spins
 * down from inactivity and back up.
 *
 * If those env vars aren't set, we fall back to a local JSON file so the
 * app still runs for local development without extra signup — but this
 * fallback does NOT persist reliably once deployed to Render's free tier.
 */
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "data", "db.json");
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const useUpstash = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

if (!useUpstash) {
  console.warn(
    "WARNING: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set. " +
      "Falling back to a local JSON file, which does NOT persist on Render's " +
      "free tier across restarts — accounts and chats will periodically " +
      "disappear. Set up a free Upstash Redis database (see README) to fix " +
      "this permanently."
  );
}

function normalize(data) {
  if (!data || typeof data !== "object") data = {};
  if (!Array.isArray(data.users)) data.users = [];
  if (!Array.isArray(data.conversations)) data.conversations = [];
  return data;
}

function ensureLocalDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], conversations: [] }, null, 2));
  }
}

async function readAll() {
  if (useUpstash) {
    const res = await fetch(`${UPSTASH_URL}/get/lumen-db`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    });
    if (!res.ok) throw new Error(`Upstash read failed (${res.status})`);
    const json = await res.json();
    if (!json.result) return { users: [], conversations: [] };
    try {
      return normalize(JSON.parse(json.result));
    } catch {
      return { users: [], conversations: [] };
    }
  }
  ensureLocalDB();
  return normalize(JSON.parse(fs.readFileSync(DB_PATH, "utf-8")));
}

async function writeAll(data) {
  if (useUpstash) {
    const res = await fetch(`${UPSTASH_URL}/set/lumen-db`, {
      method: "POST",
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Upstash write failed (${res.status})`);
    return;
  }
  ensureLocalDB();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { readAll, writeAll };
