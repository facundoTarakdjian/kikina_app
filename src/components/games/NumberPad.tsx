"use client";

import { Delete } from "lucide-react";

interface NumberPadProps {
  onDigit: (d: string) => void;
  onDelete: () => void;
  onToggleSign: () => void;
}

const DIGITS = ["7", "8", "9", "4", "5", "6", "1", "2", "3"];

export function NumberPad({ onDigit, onDelete, onToggleSign }: NumberPadProps) {
  return (
    <div className="grid grid-cols-3 gap-2 p-3">
      {DIGITS.map((d) => (
        <button
          key={d}
          onClick={() => onDigit(d)}
          className="h-14 rounded-xl bg-paper-2 text-h2 text-ink active:bg-line transition-colors"
        >
          {d}
        </button>
      ))}
      {/* Bottom row: ±, 0, backspace */}
      <button
        onClick={onToggleSign}
        className="h-14 rounded-xl bg-paper-2 text-h3 text-ink-2 active:bg-line transition-colors"
        aria-label="Cambiar signo"
      >
        ±
      </button>
      <button
        onClick={() => onDigit("0")}
        className="h-14 rounded-xl bg-paper-2 text-h2 text-ink active:bg-line transition-colors"
      >
        0
      </button>
      <button
        onClick={onDelete}
        className="h-14 rounded-xl bg-paper-2 text-ink-2 active:bg-line transition-colors flex items-center justify-center"
        aria-label="Borrar"
      >
        <Delete size={22} />
      </button>
    </div>
  );
}
