"use client";

import { X } from "lucide-react";

interface MatchIdleScreenProps {
  title: string;
  subtitle: string;
  onStart: () => void;
  onBack: () => void;
}

export function MatchIdleScreen({
  title,
  subtitle,
  onStart,
  onBack,
}: MatchIdleScreenProps) {
  return (
    <div className="flex flex-col min-h-dvh bg-paper">
      <header className="flex items-center justify-between px-4 pt-safe-top pt-4 pb-3">
        <button
          onClick={onBack}
          aria-label="Volver"
          className="p-2 -ml-2 text-ink-2"
        >
          <X size={20} />
        </button>
        <span className="text-h3 text-ink">{title}</span>
        <div className="w-8" />
      </header>
      <div className="flex flex-col items-center justify-center flex-1 gap-6 px-6">
        <p className="text-body text-ink-2 text-center">{subtitle}</p>
        <button
          onClick={onStart}
          className="px-8 py-4 rounded-xl bg-accent text-paper text-ui"
        >
          Empezar partida
        </button>
      </div>
    </div>
  );
}
