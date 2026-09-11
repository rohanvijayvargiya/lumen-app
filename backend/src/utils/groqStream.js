const { Readable } = require("stream");

const SYSTEM_PROMPT =
  "You are Lumen, a helpful, friendly AI assistant inside a minimal chat app. " +
  "Answer clearly and concisely. Use markdown (bold, code blocks, lists) when it " +
  "genuinely helps readability, but don't overuse it.";

// Groq's free tier — swap this for another model ID from console.groq.com/docs/models
// if you want a different one (e.g. a smaller/faster model, or a newer release).
const MODEL = "llama-3.3-70b-versatile";

/**
 * Calls Groq's OpenAI-compatible chat completions endpoint with streaming
 * enabled and yields each parsed SSE event as a JS object, as it arrives.
 *
 * @param {{role: 'user'|'assistant', content: string}[]} messages
 */
async function* streamGroq(messages) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const err = new Error(
      "GROQ_API_KEY is not configured on the server. Add it in your backend's environment variables."
    );
    err.code = "NO_API_KEY";
    throw err;
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    }),
  });

  if (!response.ok || !response.body) {
    const bodyText = await response.text().catch(() => "");
    throw new Error(`Groq API error ${response.status}: ${bodyText.slice(0, 300)}`);
  }

  const nodeStream = Readable.fromWeb(response.body);
  let buffer = "";

  for await (const chunk of nodeStream) {
    buffer += chunk.toString("utf-8");
    let boundary;
    while ((boundary = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const dataLine = rawEvent.split("\n").find((l) => l.startsWith("data:"));
      if (!dataLine) continue;
      const jsonStr = dataLine.slice(5).trim();
      if (!jsonStr || jsonStr === "[DONE]") continue;
      try {
        yield JSON.parse(jsonStr);
      } catch {
        // Ignore malformed/partial SSE fragments
      }
    }
  }
}

module.exports = { streamGroq };
