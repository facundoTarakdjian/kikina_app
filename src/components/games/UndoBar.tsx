"use client";

import { RotateCcw } from "lucide-react";

interface UndoBarProps {
  lastActionText: string | null;
  onUndo: () => void;
  disabled?: boolean;
}

export function UndoBar({ lastActionText, onUndo, disabled }: UndoBarProps) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 border-t border-line"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <p className="text-small text-ink-2 flex-1 mr-2 truncate">
        {lastActionText ?? ""}
      </p>
      <button
        onClick={onUndo}
        disabled={disabled ?? !lastActionText}
        aria-label="Deshacer"
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-small text-ink-2 disabled:opacity-30 active:bg-paper-2 shrink-0"
      >
        <RotateCcw size={15} />
        Deshacer
      </button>
    </div>
  );
}
