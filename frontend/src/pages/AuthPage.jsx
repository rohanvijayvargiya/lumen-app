import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { api } from "../lib/api";

export function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user =
        mode === "login" ? await api.login(email, password) : await api.signup(email, password, name);
      onAuth(user);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-panel px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3 bg-accent">
            <Sparkles size={20} color="white" />
          </div>
          <h1 className="text-2xl font-semibold font-display">Lumen</h1>
          <p className="text-sm text-muted mt-1">
            {mode === "login" ? "Log in to your account" : "Create your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-6 shadow-sm">
          {mode === "signup" && (
            <div className="mb-4">
              <label className="text-xs font-medium block mb-1 text-muted">Name (optional)</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none border border-border"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="text-xs font-medium block mb-1 text-muted">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none border border-border"
            />
          </div>

          <div className="mb-5">
            <label className="text-xs font-medium block mb-1 text-muted">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none border border-border"
            />
          </div>

          {error && <div className="text-xs text-red-600 mb-4">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-accent disabled:opacity-50"
          >
            {loading ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-5">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
            }}
            className="font-medium text-accentdeep underline"
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
