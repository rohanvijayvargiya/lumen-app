import React from "react";
import { Plus, MessageSquare, Trash2 } from "lucide-react";

export function Sidebar({ conversations, activeId, onSelect, onNew, onDelete }) {
  return (
    <div className="hidden md:flex flex-col w-72 shrink-0 h-screen sticky top-0 bg-ink text-white">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-5 px-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold bg-accent text-white font-display">
            L
          </div>
          <div className="text-lg font-semibold font-display">Lumen</div>
        </div>

        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-inksoft hover:bg-[#2B2F3B] transition-colors"
        >
          <Plus size={16} /> New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {conversations.length === 0 && (
          <div className="text-xs text-[#8A8F9C] px-3 py-4">No conversations yet.</div>
        )}
        {conversations.map((c) => {
          const active = c.id === activeId;
          return (
            <div
              key={c.id}
              onClick={() => onSelect(c.id)}
              className="group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-sm mb-0.5"
              style={{ background: active ? "#2B2F3B" : "transparent" }}
            >
              <MessageSquare size={14} className="shrink-0" color={active ? "#D97757" : "#8A8F9C"} />
              <span
                className="flex-1 truncate"
                style={{ color: active ? "#fff" : "#C7CAD3", fontWeight: active ? 600 : 400 }}
              >
                {c.title || "New chat"}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/20 shrink-0"
              >
                <Trash2 size={13} color="#8A8F9C" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
