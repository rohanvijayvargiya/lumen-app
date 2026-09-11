const { Readable } = require("stream");

const SYSTEM_PROMPT =
  "You are Lumen, a helpful, friendly AI assistant inside a minimal chat app. " +
  "Answer clearly and concisely. Use markdown (bold, code blocks, lists) when it " +
  "genuinely helps readability, but don't overuse it.";

/**
 * Calls the Anthropic Messages API with streaming enabled and yields each
 * parsed SSE event as a JS object, as they arrive.
 *
 * @param {{role: 'user'|'assistant', content: string}[]} messages
 */
async function* streamClaude(messages) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error(
      "ANTHROPIC_API_KEY is not configured on the server. Add it in your backend's environment variables."
    );
    err.code = "NO_API_KEY";
    throw err;
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      stream: true,
      messages,
    }),
  });

  if (!response.ok || !response.body) {
    const bodyText = await response.text().catch(() => "");
    throw new Error(`Anthropic API error ${response.status}: ${bodyText.slice(0, 300)}`);
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
      if (!jsonStr) continue;
      try {
        yield JSON.parse(jsonStr);
      } catch {
        // Ignore malformed/partial SSE fragments
      }
    }
  }
}

module.exports = { streamClaude };
