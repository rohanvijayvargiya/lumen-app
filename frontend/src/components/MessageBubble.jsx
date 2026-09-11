import React, { useEffect, useRef } from "react";
import { renderMarkdown } from "../lib/markdown";

function renderMathIfReady(el) {
  if (!el || typeof window === "undefined" || !window.renderMathInElement) return false;
  window.renderMathInElement(el, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "\\[", right: "\\]", display: true },
      { left: "\\(", right: "\\)", display: false },
    ],
    throwOnError: false,
  });
  return true;
}

export function MessageBubble({ role, content, isStreaming }) {
  const isUser = role === "user";
  const contentRef = useRef(null);

  useEffect(() => {
    if (isUser) return;
    if (renderMathIfReady(contentRef.current)) return;
    // KaTeX loads via a deferred <script> tag, so on a very fast first
    // paint it might not be ready yet — retry briefly until it is.
    const interval = setInterval(() => {
      if (renderMathIfReady(contentRef.current)) clearInterval(interval);
    }, 150);
    const timeout = setTimeout(() => clearInterval(interval), 3000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [content, isUser]);

  if (isUser) {
    return (
      <div className="flex justify-end mb-5">
        <div className="max-w-[75%] rounded-2xl rounded-br-sm px-4 py-2.5 bg-accent text-white text-sm whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-5">
      <div className="max-w-[75%] rounded-2xl rounded-bl-sm px-4 py-2.5 bg-panel text-inktext text-sm leading-relaxed">
        <span ref={contentRef} dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
        {isStreaming && <span className="cursor-blink" />}
      </div>
    </div>
  );
}
