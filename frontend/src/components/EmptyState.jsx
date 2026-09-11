import React from "react";
import { Sparkles } from "lucide-react";

const PROMPTS = [
  "Explain quantum computing simply",
  "Write a short poem about the sea",
  "/image a fox reading a book under starlight",
  "What's a good icebreaker for a team meeting?",
];

export function EmptyState({ onPrompt }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-accent/10">
        <Sparkles size={22} color="#D97757" />
      </div>
      <h1 className="text-2xl font-semibold font-display mb-1">How can I help you today?</h1>
      <p className="text-muted text-sm mb-2">Ask me anything — I'll respond as I think, word by word.</p>
      <p className="text-muted text-xs mb-8">
        Tip: start a message with <code className="md-code">/image</code> to generate a picture instead of text.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        {PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => onPrompt(p)}
            className="text-left text-sm px-4 py-3 rounded-xl border border-border hover:bg-panel transition-colors"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
