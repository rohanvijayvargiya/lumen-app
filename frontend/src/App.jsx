import React, { useCallback, useEffect, useRef, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { MobileHeader } from "./components/MobileHeader";
import { MessageBubble } from "./components/MessageBubble";
import { ChatInput } from "./components/ChatInput";
import { EmptyState } from "./components/EmptyState";
import { AuthPage } from "./pages/AuthPage";
import { api } from "./lib/api";
import { getToken, clearToken } from "./lib/auth";

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [errorBanner, setErrorBanner] = useState("");
  const bottomRef = useRef(null);
  const stopRequested = useRef(false);

  // On first load, see if a saved login token is still valid.
  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      if (!getToken()) {
        setAuthChecked(true);
        return;
      }
      try {
        const me = await api.me();
        if (!cancelled) setUser(me);
      } catch {
        clearToken();
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    }
    checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  // Once logged in, load this user's conversations.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      try {
        const list = await api.getConversations();
        if (!cancelled) setConversations(list);
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Couldn't reach the API server.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleLogout() {
    api.logout();
    setUser(null);
    setConversations([]);
    setActiveId(null);
    setMessages([]);
  }

  const selectConversation = useCallback(async (id) => {
    setActiveId(id);
    try {
      const convo = await api.getConversation(id);
      setMessages(convo.messages || []);
    } catch (err) {
      setErrorBanner(err.message);
    }
  }, []);

  async function handleNewChat() {
    try {
      const convo = await api.createConversation();
      setConversations((prev) => [{ id: convo.id, title: convo.title, updatedAt: convo.updatedAt }, ...prev]);
      setActiveId(convo.id);
      setMessages([]);
    } catch (err) {
      setErrorBanner(err.message);
    }
  }

  async function handleDeleteConversation(id) {
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (id === activeId) {
        setActiveId(null);
        setMessages([]);
      }
    } catch (err) {
      setErrorBanner(err.message);
    }
  }

  async function sendMessage(text) {
    const content = (text ?? input).trim();
    if (!content || isStreaming) return;

    let conversationId = activeId;
    if (!conversationId) {
      try {
        const convo = await api.createConversation();
        setConversations((prev) => [{ id: convo.id, title: convo.title, updatedAt: convo.updatedAt }, ...prev]);
        conversationId = convo.id;
        setActiveId(convo.id);
      } catch (err) {
        setErrorBanner(err.message);
        return;
      }
    }

    const userMsg = { id: `local-${Date.now()}`, role: "user", content };
    const assistantMsg = { id: `local-${Date.now() + 1}`, role: "assistant", content: "" };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsStreaming(true);
    setErrorBanner("");
    stopRequested.current = false;

    let fullText = "";
    await api.streamChat(conversationId, content, {
      onDelta: (chunk) => {
        if (stopRequested.current) return;
        fullText += chunk;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: fullText } : m))
        );
      },
      onDone: (evt) => {
        setIsStreaming(false);
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, id: evt.message?.id || m.id } : m))
        );
        setConversations((prev) =>
          prev
            .map((c) =>
              c.id === conversationId ? { ...c, title: evt.title || c.title, updatedAt: new Date().toISOString() } : c
            )
            .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
        );
      },
      onError: (message) => {
        setIsStreaming(false);
        setErrorBanner(message);
        if (message && message.toLowerCase().includes("session expired")) {
          handleLogout();
          return;
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: fullText || "_Something went wrong generating a reply._" } : m
          )
        );
      },
    });
  }

  function handleStop() {
    stopRequested.current = true;
    setIsStreaming(false);
  }

  if (!authChecked) {
    return <div className="flex items-center justify-center min-h-screen text-muted text-sm">Loading…</div>;
  }

  if (!user) {
    return <AuthPage onAuth={setUser} />;
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold font-display mb-2">Can't reach the API</h1>
          <p className="text-sm text-muted mb-1">{loadError}</p>
          <p className="text-sm text-muted">
            Make sure the backend is running (<code>cd backend && npm run dev</code>) and that{" "}
            <code>VITE_API_URL</code> points to it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-white text-inktext">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        onNew={handleNewChat}
        onDelete={handleDeleteConversation}
        user={user}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <MobileHeader
          conversations={conversations}
          activeId={activeId}
          onSelect={selectConversation}
          onNew={handleNewChat}
          onDelete={handleDeleteConversation}
          user={user}
          onLogout={handleLogout}
        />

        {errorBanner && (
          <div className="bg-red-50 text-red-700 text-xs px-4 py-2 text-center">{errorBanner}</div>
        )}

        {!activeId && messages.length === 0 ? (
          <EmptyState onPrompt={(p) => sendMessage(p)} />
        ) : (
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
            <div className="max-w-3xl mx-auto">
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  role={m.role}
                  content={m.content}
                  isStreaming={isStreaming && m.role === "assistant" && m.id === messages[messages.length - 1]?.id}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          </div>
        )}

        <ChatInput
          value={input}
          onChange={setInput}
          onSend={() => sendMessage()}
          onStop={handleStop}
          disabled={isStreaming}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
}
