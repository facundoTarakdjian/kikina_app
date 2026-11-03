"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { rollDie } from "@/src/lib/discretion/dice";
import type { DiceFace, DieName } from "@/src/lib/discretion/dice";

const LS_KEY = "kk:d:level";

const DICE_DEFS: { die: DieName; label: string }[] = [
  { die: "accion", label: "ACCIÓN" },
  { die: "zona", label: "ZONA" },
  { die: "modo", label: "MODO" },
];

const LEVELS = [
  { n: 1, name: "Chispa", emoji: "🌶️", color: "var(--d-level-1)" },
  { n: 2, name: "Calentito", emoji: "🌶️🌶️", color: "var(--d-level-2)" },
  { n: 3, name: "Fuego", emoji: "🌶️🌶️🌶️", color: "var(--d-level-3)" },
  { n: 4, name: "Sin discreción", emoji: "🌶️🌶️🌶️🌶️", color: "var(--d-level-4-border, var(--d-glow))" },
] as const;

type LevelN = 1 | 2 | 3 | 4;

interface DiceResult {
  accion: DiceFace;
  zona: DiceFace;
  modo: DiceFace;
}

interface Props {
  faces: DiceFace[];
}

export function DadosClient({ faces }: Props) {
  const [level, setLevel] = useState<LevelN>(1);
  const [result, setResult] = useState<DiceResult | null>(null);
  const [shuffleTexts, setShuffleTexts] = useState<Record<DieName, string>>({
    accion: "",
    zona: "",
    modo: "",
  });
  const [isRolling, setIsRolling] = useState(false);
  // Cambia cada tirada para disparar la animación de rebote
  const [settleKey, setSettleKey] = useState(0);
  const lastFaceIds = useRef<Partial<Record<DieName, string>>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reduced = useReducedMotion();

  // Leer nivel guardado de sessionStorage en RAF (evita set-state-in-effect)
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      const saved = sessionStorage.getItem(LS_KEY);
      if (saved) {
        const n = Number(saved);
        if (n === 1 || n === 2 || n === 3 || n === 4) setLevel(n as LevelN);
      }
    });
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Limpiar interval al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, []);

  function handleLevel(n: LevelN) {
    setLevel(n);
    sessionStorage.setItem(LS_KEY, String(n));
  }

  function handleRoll() {
    if (isRolling || faces.length === 0) return;

    const facesFor = (die: DieName) => faces.filter((f) => f.die === die);

    const newAccion = rollDie(facesFor("accion"), level, lastFaceIds.current.accion);
    const newZona = rollDie(facesFor("zona"), level, lastFaceIds.current.zona);
    const newModo = rollDie(facesFor("modo"), level, lastFaceIds.current.modo);

    lastFaceIds.current = {
      accion: newAccion.id,
      zona: newZona.id,
      modo: newModo.id,
    };

    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(10);
    }

    if (reduced) {
      setResult({ accion: newAccion, zona: newZona, modo: newModo });
      setSettleKey((k) => k + 1);
      return;
    }

    setIsRolling(true);
    const startTime = Date.now();
    const validFaces = {
      accion: faces.filter((f) => f.die === "accion" && f.min_level <= level),
      zona: faces.filter((f) => f.die === "zona" && f.min_level <= level),
      modo: faces.filter((f) => f.die === "modo" && f.min_level <= level),
    };

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= 600) {
        if (intervalRef.current !== null) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsRolling(false);
        setResult({ accion: newAccion, zona: newZona, modo: newModo });
        setShuffleTexts({
          accion: newAccion.text,
          zona: newZona.text,
          modo: newModo.text,
        });
        setSettleKey((k) => k + 1);
        return;
      }
      const pick = (arr: DiceFace[]) =>
        arr[Math.floor(Math.random() * arr.length)]?.text ?? "";
      setShuffleTexts({
        accion: pick(validFaces.accion),
        zona: pick(validFaces.zona),
        modo: pick(validFaces.modo),
      });
    }, 80);
  }

  const displayedTexts: Record<DieName, string> = isRolling
    ? shuffleTexts
    : result
      ? { accion: result.accion.text, zona: result.zona.text, modo: result.modo.text }
      : { accion: "", zona: "", modo: "" };

  const hasResult = !isRolling && result !== null;

  return (
    <div className="flex flex-col flex-1">
      {/* Header: ✕ → /discrecion */}
      <header
        className="flex items-center px-4 pb-2"
        style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}
      >
        <Link
          href="/discrecion"
          aria-label="Volver a Discreción"
          className="p-2 -ml-2"
          style={{ color: "var(--d-ink-2)" }}
        >
          <X size={20} />
        </Link>
      </header>

      <main className="flex-1 flex flex-col px-5 gap-6 overflow-y-auto">
        {/* Chips de nivel */}
        <div className="flex gap-2 flex-wrap">
          {LEVELS.map((lvl) => {
            const active = level === lvl.n;
            return (
              <button
                key={lvl.n}
                onClick={() => handleLevel(lvl.n as LevelN)}
                aria-pressed={active}
                className="flex items-center gap-1.5 px-3 rounded-full text-caption transition-colors"
                style={{
                  minHeight: "44px",
                  backgroundColor: active
                    ? `color-mix(in srgb, ${lvl.color} 15%, var(--d-surface))`
                    : "var(--d-surface)",
                  border: `1px solid ${active ? lvl.color : "var(--d-line)"}`,
                  color: active ? lvl.color : "var(--d-ink-2)",
                }}
              >
                <span aria-hidden="true">{lvl.emoji}</span>
                <span>{lvl.name}</span>
              </button>
            );
          })}
        </div>

        {/* Tres dados en fila */}
        <div className="flex gap-3">
          {DICE_DEFS.map(({ die, label }) => {
            const text = displayedTexts[die];
            return (
              <div key={die} className="flex flex-col items-center gap-1 flex-1">
                <motion.div
                  key={hasResult ? settleKey : "rolling"}
                  initial={hasResult ? { scale: 0.95 } : false}
                  animate={{ scale: 1 }}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 500, damping: 25 }
                  }
                  className="w-full rounded-xl flex items-center justify-center p-3 text-center"
                  style={{
                    minHeight: "96px",
                    backgroundColor: "var(--d-surface)",
                    border: `2px solid ${hasResult ? "var(--d-glow)" : "var(--d-line)"}`,
                    boxShadow: hasResult
                      ? "0 0 16px color-mix(in srgb, var(--d-glow) 35%, transparent)"
                      : "none",
                    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                  }}
                >
                  <span
                    className="text-small text-center"
                    style={{ color: "var(--d-ink)" }}
                  >
                    {text}
                  </span>
                </motion.div>
                <span className="text-caption" style={{ color: "var(--d-ink-2)" }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Frase resultado o prompt inicial */}
        <div className="min-h-[4rem] flex items-center justify-center px-2">
          {hasResult ? (
            <p
              className="text-h2 text-center"
              style={{ color: "var(--d-ink)" }}
            >
              {result.accion.text} · {result.zona.text} · {result.modo.text}
            </p>
          ) : !isRolling ? (
            <p className="text-body text-center" style={{ color: "var(--d-ink-2)" }}>
              Tirá los dados
            </p>
          ) : null}
        </div>
      </main>

      {/* Botón Tirar */}
      <div
        className="px-5"
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={handleRoll}
          disabled={isRolling}
          className="w-full text-h3 transition-opacity active:opacity-80 disabled:opacity-60"
          style={{
            minHeight: "64px",
            borderRadius: "14px",
            backgroundColor: "var(--d-accent)",
            color: "#ffffff",
          }}
        >
          {isRolling ? "Rodando…" : "Tirar"}
        </button>
      </div>
    </div>
  );
}
