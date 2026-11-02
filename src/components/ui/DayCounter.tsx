"use client";

import { useState } from "react";
import { differenceInCalendarDays, parseISO, format } from "date-fns";
import { es } from "date-fns/locale";

interface DayCounterProps {
  metOn: string;       // YYYY-MM-DD — fecha en que se conocieron
  togetherOn: string | null;  // YYYY-MM-DD — fecha de novios, o null
}

type Mode = "together" | "met";

function daysFrom(dateStr: string): number {
  return differenceInCalendarDays(new Date(), parseISO(dateStr));
}

function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "d 'de' MMMM 'de' yyyy", { locale: es });
}

export function DayCounter({ metOn, togetherOn }: DayCounterProps) {
  const initial: Mode = togetherOn ? "together" : "met";
  const [mode, setMode] = useState<Mode>(initial);

  const activeDate = mode === "together" && togetherOn ? togetherOn : metOn;
  const days = daysFrom(activeDate);

  const canToggle = !!togetherOn;

  function handleToggle() {
    if (!canToggle) return;
    setMode((m) => (m === "together" ? "met" : "together"));
  }

  const caption =
    mode === "together"
      ? "DÍAS JUNTOS"
      : "DÍAS DESDE QUE NOS CONOCIMOS";

  const subtitle = formatDate(activeDate);

  return (
    <button
      onClick={handleToggle}
      disabled={!canToggle}
      aria-label={`${days} ${caption} — ${subtitle}${canToggle ? ". Tocá para alternar." : ""}`}
      className="
        flex flex-col items-center gap-1 select-none
        disabled:pointer-events-none
        active:scale-95 transition-transform duration-100
      "
    >
      <span className="text-score text-ink" aria-hidden="true">
        {days}
      </span>
      <span className="text-caption text-ink-2">{caption}</span>
      {canToggle && (
        <span className="text-caption text-ink-2 normal-case tracking-normal">
          {subtitle}
        </span>
      )}
    </button>
  );
}
