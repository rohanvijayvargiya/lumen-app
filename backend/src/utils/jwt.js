const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// If you don't set JWT_SECRET yourself, we generate a random one at startup
// so the app still works — but it means everyone's login session is
// invalidated whenever the server restarts (Render redeploys, sleeps, etc).
// Set JWT_SECRET in your environment variables for real, persistent logins.
let cachedSecret = process.env.JWT_SECRET;
if (!cachedSecret) {
  cachedSecret = crypto.randomBytes(32).toString("hex");
  console.warn(
    "WARNING: JWT_SECRET is not set. Using a random secret for this run only — " +
      "everyone will be logged out on the next restart. Set JWT_SECRET in your " +
      "environment variables to fix this permanently."
  );
}

function signToken(userId) {
  return jwt.sign({ sub: userId }, cachedSecret, { expiresIn: "30d" });
}

function verifyToken(token) {
  const payload = jwt.verify(token, cachedSecret);
  return payload.sub;
}

module.exports = { signToken, verifyToken };
