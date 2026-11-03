"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LevelPicker } from "@/src/components/discretion/LevelPicker";

const LS_KEY = "kk:d:level";

const MODES_ACTIVE = [
  { href: "/discrecion/dados", emoji: "🎲", name: "Dados" },
  { href: "/discrecion/cartas", emoji: "🃏", name: "Cartas" },
] as const;

const MODES_SOON = [
  { emoji: "💘", name: "¿Lo probamos?" },
  { emoji: "✍️", name: "Nuestro mazo" },
] as const;

export default function DiscrecionPage() {
  const [level, setLevel] = useState(1);

  // Leer nivel guardado. Se hace en RAF para no llamar setState sincrónicamente
  // en el body del effect (misma regla que prohíbe el patrón en CountUp).
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      const saved = sessionStorage.getItem(LS_KEY);
      if (saved) {
        const n = Number(saved);
        if (n >= 1 && n <= 4) setLevel(n);
      }
    });
    return () => cancelAnimationFrame(rafId);
  }, []);

  function handleLevel(n: number) {
    setLevel(n);
    sessionStorage.setItem(LS_KEY, String(n));
  }

  return (
    <main className="flex-1 px-5 pb-8 overflow-y-auto">
      {/* Título */}
      <h1
        className="mb-6"
        style={{
          fontFamily: "var(--font-fraunces), ui-serif, Georgia, serif",
          fontSize: "2rem",
          lineHeight: "2.5rem",
          fontWeight: 500,
          color: "var(--d-ink)",
        }}
      >
        Discreción
      </h1>

      {/* LevelPicker */}
      <section className="mb-8">
        <p
          className="text-caption mb-3"
          style={{ color: "var(--d-ink-2)" }}
        >
          NIVEL
        </p>
        <LevelPicker value={level} onChange={handleLevel} />
      </section>

      {/* Modos */}
      <section>
        <p
          className="text-caption mb-3"
          style={{ color: "var(--d-ink-2)" }}
        >
          MODOS
        </p>
        <div className="flex flex-col gap-2">
          {MODES_ACTIVE.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex items-center gap-4 px-4 min-h-[64px] rounded-xl active:opacity-80 transition-opacity"
              style={{
                backgroundColor: "var(--d-surface)",
                border: "2px solid var(--d-line)",
              }}
            >
              <span className="text-2xl leading-none" aria-hidden="true">
                {m.emoji}
              </span>
              <span
                className="text-h3 flex-1"
                style={{ color: "var(--d-ink)" }}
              >
                {m.name}
              </span>
            </Link>
          ))}

          {MODES_SOON.map((m) => (
            <div
              key={m.name}
              className="flex items-center gap-4 px-4 min-h-[64px] rounded-xl opacity-40"
              style={{
                backgroundColor: "var(--d-surface)",
                border: "2px solid var(--d-line)",
              }}
              aria-disabled="true"
            >
              <span className="text-2xl leading-none" aria-hidden="true">
                {m.emoji}
              </span>
              <span
                className="text-h3 flex-1"
                style={{ color: "var(--d-ink)" }}
              >
                {m.name}
              </span>
              <span
                className="text-caption px-2 py-0.5 rounded-full"
                style={{
                  color: "var(--d-ink-2)",
                  border: "1px solid var(--d-line)",
                }}
              >
                PRONTO
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
