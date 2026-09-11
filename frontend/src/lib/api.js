import { getToken, setToken, clearToken } from "./auth";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (res.status === 401) {
    clearToken();
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      /* ignore */
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  health: () => request("/health"),

  // Auth
  async signup(email, password, name) {
    const data = await request("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    setToken(data.token);
    return data.user;
  },
  async login(email, password) {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data.user;
  },
  me: () => request("/auth/me"),
  logout: () => clearToken(),

  // Conversations
  getConversations: () => request("/conversations"),
  getConversation: (id) => request(`/conversations/${id}`),
  createConversation: () => request("/conversations", { method: "POST" }),
  renameConversation: (id, title) =>
    request(`/conversations/${id}`, { method: "PATCH", body: JSON.stringify({ title }) }),
  deleteConversation: (id) => request(`/conversations/${id}`, { method: "DELETE" }),

  generateImage: (conversationId, prompt) =>
    request("/chat/image", { method: "POST", body: JSON.stringify({ conversationId, prompt }) }),

  /**
   * Streams a chat reply. Calls handlers.onDelta(text) as chunks arrive,
   * handlers.onDone({message, title}) once complete, or handlers.onError(message).
   */
  async streamChat(conversationId, content, handlers) {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ conversationId, content }),
    });

    if (res.status === 401) {
      clearToken();
      handlers.onError?.("Your session expired. Please log in again.");
      return;
    }

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
