import React, { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";
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

function ImageMessage({ src }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    setTimedOut(false);
    const timer = setTimeout(() => setTimedOut(true), 25000);
    return () => clearTimeout(timer);
  }, [src]);

  const showError = failed || timedOut;

  return (
    <div className="max-w-[75%] rounded-2xl rounded-bl-sm overflow-hidden bg-panel">
      {!loaded && !showError && (
        <div className="w-72 h-72 flex flex-col items-center justify-center gap-2 text-xs text-muted">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Generating image… can take up to 15s
        </div>
      )}
      {showError && (
        <div className="w-72 h-72 flex flex-col items-center justify-center gap-2 text-xs text-muted p-4 text-center">
          <ImageOff size={20} />
          {timedOut && !failed
            ? "This is taking too long — the image service may be busy. Try again in a bit."
            : "Couldn't generate that image. Try rephrasing the prompt."}
        </div>
      )}
      {!showError && (
        <img
          src={src}
          alt="AI generated"
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className="max-w-full block"
          style={{ display: loaded ? "block" : "none" }}
        />
      )}
    </div>
  );
}

export function MessageBubble({ role, content, contentType = "text", isStreaming }) {
  const isUser = role === "user";
  const contentRef = useRef(null);

  useEffect(() => {
    if (isUser || contentType !== "text") return;
    if (renderMathIfReady(contentRef.current)) return;
    const interval = setInterval(() => {
      if (renderMathIfReady(contentRef.current)) clearInterval(interval);
    }, 150);
    const timeout = setTimeout(() => clearInterval(interval), 3000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [content, isUser, contentType]);

  if (isUser) {
    return (
      <div className="flex justify-end mb-5">
        <div className="max-w-[75%] rounded-2xl rounded-br-sm px-4 py-2.5 bg-accent text-white text-sm whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
      </div>
    );
  }

  if (contentType === "image") {
    return (
      <div className="flex justify-start mb-5">
        <ImageMessage src={content} />
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
