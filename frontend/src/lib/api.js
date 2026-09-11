const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  health: () => request("/health"),

  getConversations: () => request("/conversations"),
  getConversation: (id) => request(`/conversations/${id}`),
  createConversation: () => request("/conversations", { method: "POST" }),
  renameConversation: (id, title) =>
    request(`/conversations/${id}`, { method: "PATCH", body: JSON.stringify({ title }) }),
  deleteConversation: (id) => request(`/conversations/${id}`, { method: "DELETE" }),

  /**
   * Streams a chat reply. Calls handlers.onDelta(text) as chunks arrive,
   * handlers.onDone({message, title}) once complete, or handlers.onError(message).
   */
  async streamChat(conversationId, content, handlers) {
    const res = await fetch(`${BASE_URL}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, content }),
    });

    if (!res.ok || !res.body) {
      let message = `Request failed (${res.status})`;
      try {
        const body = await res.json();
        if (body.error) message = body.error;
      } catch {
        /* ignore */
      }
      handlers.onError?.(message);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let boundary;
      while ((boundary = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const dataLine = rawEvent.split("\n").find((l) => l.startsWith("data:"));
        if (!dataLine) continue;
        const jsonStr = dataLine.slice(5).trim();
        if (!jsonStr) continue;
        let evt;
        try {
          evt = JSON.parse(jsonStr);
        } catch {
          continue;
        }
        if (evt.type === "delta") handlers.onDelta?.(evt.text);
        else if (evt.type === "done") handlers.onDone?.(evt);
        else if (evt.type === "error") handlers.onError?.(evt.message);
      }
    }
  },
};
