const express = require("express");
const { Readable } = require("stream");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

// GET /api/image-proxy?url=<pollinations image URL>
// Public (no login required) — this just re-serves a public image, it
// doesn't touch any user data. Restricted to Pollinations URLs only, so
// this can't be abused as a general-purpose proxy for other sites.
//
// Why this exists: asking the browser to load the Pollinations image
// directly (a plain <img src="https://image.pollinations.ai/...">) was
// occasionally hanging indefinitely for some users even though visiting
// that same URL directly worked fine — likely something about how it
// behaves when embedded cross-origin. Routing the request through our
// own server sidesteps that entirely.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { url } = req.query;
    if (!url || !url.startsWith("https://image.pollinations.ai/")) {
      return res.status(400).json({ error: "Invalid image URL" });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    let upstream;
    try {
      upstream = await fetch(url, { signal: controller.signal });
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        return res.status(504).json({ error: "Image generation timed out. Try again." });
      }
      throw err;
    }
    clearTimeout(timeout);

    if (!upstream.ok || !upstream.body) {
      return res.status(502).json({ error: "The image service returned an error." });
    }

    res.setHeader("Content-Type", upstream.headers.get("content-type") || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    Readable.fromWeb(upstream.body).pipe(res);
  })
);

module.exports = router;
