import React, { useState } from "react";
import { Menu, Plus, X, MessageSquare, Trash2 } from "lucide-react";

export function MobileHeader({ conversations, activeId, onSelect, onNew, onDelete }) {
  const [open, setOpen] = useState(false);
  const active = conversations.find((c) => c.id === activeId);

  return (
    <div className="md:hidden sticky top-0 z-30 bg-ink text-white">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setOpen(true)}>
          <Menu size={20} />
        </button>
        <div className="flex-1 truncate text-sm font-medium">{active?.title || "Lumen"}</div>
        <button onClick={onNew}>
          <Plus size={20} />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 bg-ink flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2B2F3B]">
            <div className="font-semibold font-display">Chats</div>
            <button onClick={() => setOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  onSelect(c.id);
                  setOpen(false);
                }}
                className="group flex items-center gap-2 px-3 py-3 rounded-lg text-sm"
                style={{ background: c.id === activeId ? "#2B2F3B" : "transparent" }}
              >
                <MessageSquare size={14} color={c.id === activeId ? "#D97757" : "#8A8F9C"} />
                <span className="flex-1 truncate">{c.title || "New chat"}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(c.id);
                  }}
                >
                  <Trash2 size={14} color="#8A8F9C" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
