import React from "react";
import { renderMarkdown } from "../lib/markdown";

export function MessageBubble({ role, content, isStreaming }) {
  const isUser = role === "user";

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
        <span dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
        {isStreaming && <span className="cursor-blink" />}
      </div>
    </div>
  );
}
