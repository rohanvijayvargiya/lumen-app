/**
 * Lightweight JSON-file data store — same approach as the ATS project.
 * Swap readAll/writeAll for a real database later; nothing else needs to change.
 */
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "data", "db.json");

function ensureDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify({ conversations: [] }, null, 2));
  }
}

function readAll() {
  ensureDB();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function writeAll(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { readAll, writeAll };
