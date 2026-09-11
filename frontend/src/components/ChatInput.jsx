import React, { useRef } from "react";
import { ArrowUp, Square } from "lucide-react";

export function ChatInput({ value, onChange, onSend, onStop, disabled, isStreaming }) {
  const textareaRef = useRef(null);

  function handleInput(e) {
    onChange(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 180) + "px";
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  }

  return (
    <div className="border-t border-border bg-white px-4 py-4 md:px-8">
      <div className="max-w-3xl mx-auto flex items-end gap-2 rounded-2xl border border-border px-3 py-2 bg-white shadow-sm">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Message Lumen… (try /image a description)"
          rows={1}
          className="flex-1 resize-none outline-none text-sm py-1.5 max-h-[180px] bg-transparent"
        />
        {isStreaming ? (
          <button
            onClick={onStop}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-inktext text-white"
            title="Stop generating"
          >
            <Square size={13} fill="white" />
          </button>
        ) : (
          <button
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white disabled:opacity-30 bg-accent"
            title="Send"
          >
            <ArrowUp size={17} />
          </button>
        )}
      </div>
      <div className="text-center text-[11px] text-muted mt-2">
        Lumen can make mistakes. Check important information.
      </div>
    </div>
  );
}
