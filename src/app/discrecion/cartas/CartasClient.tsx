"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  cardSessionReducer,
  initSession,
} from "@/src/lib/discretion/cards";
import type { CardSession, DiscretionCard, PlayerProfile } from "@/src/lib/discretion/cards";

const SS_CARDS_KEY = "kk:d:cartas";
const SS_LEVEL_KEY = "kk:d:level";

type LevelN = 1 | 2 | 3 | 4;

const LEVELS = [
  { n: 1 as LevelN, name: "Chispa",          emoji: "🌶️",           color: "var(--d-level-1)" },
  { n: 2 as LevelN, name: "Calentito",        emoji: "🌶️🌶️",         color: "var(--d-level-2)" },
  { n: 3 as LevelN, name: "Fuego",            emoji: "🌶️🌶️🌶️",       color: "var(--d-level-3)" },
  { n: 4 as LevelN, name: "Sin discreción",   emoji: "🌶️🌶️🌶️🌶️",     color: "var(--d-level-4-border, var(--d-glow))" },
] as const;

const LEVEL_BORDER: Record<LevelN, string> = {
  1: "var(--d-level-1)",
  2: "var(--d-level-2)",
  3: "var(--d-level-3)",
  4: "var(--d-glow)",
};

interface Props {
  cards: DiscretionCard[];
  players: [PlayerProfile, PlayerProfile];
}

type UIPhase = "card" | "level-up" | "exhausted";

export function CartasClient({ cards, players }: Props) {
  const [session, setSession] = useState<CardSession | null>(null);
  // showLevelUp: true después de cada 5 Listo (si level < 4)
  const [showLevelUp, setShowLevelUp] = useState(false);
  // animKey cambia con cada carta nueva para disparar la transición de AnimatePresence
  const [animKey, setAnimKey] = useState(0);
  const reduced = useReducedMotion();
  // Usamos refs para acceder a los props dentro del effect sin incluirlos en deps
  // (vienen de un Server Component y no cambian nunca)
  const playersRef = useRef(players);
  const cardsRef = useRef(cards);
  const hydrated = useRef(false);

  // Hidratar desde sessionStorage en RAF (evita set-state-in-effect)
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const rafId = requestAnimationFrame(() => {
      let restored: CardSession | null = null;

      const saved = sessionStorage.getItem(SS_CARDS_KEY);
      if (saved) {
        try {
          restored = JSON.parse(saved) as CardSession;
          // Actualizar los perfiles con los datos frescos del servidor
          restored = { ...restored, players: playersRef.current };
        } catch {
          restored = null;
        }
      }

      if (!restored) {
        const levelStr = sessionStorage.getItem(SS_LEVEL_KEY);
        const n = Number(levelStr);
        const level: LevelN = n === 1 || n === 2 || n === 3 || n === 4 ? n : 1;
        restored = initSession(playersRef.current, level, [], cardsRef.current);
      }

      setSession(restored);
    });

    return () => cancelAnimationFrame(rafId);
  }, []);

  // Persistir la sesión cada vez que cambia
  useEffect(() => {
    if (session !== null) {
      sessionStorage.setItem(SS_CARDS_KEY, JSON.stringify(session));
    }
  }, [session]);

  // --- handlers ---

  function handleListo() {
    if (!session?.currentCard) return;

    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(10);
    }

    const newSession = cardSessionReducer(session, { type: "LISTO" }, cards);
    setSession(newSession);
    setAnimKey((k) => k + 1);

    if (
      !newSession.exhausted &&
      newSession.level < 4 &&
      newSession.listoCount > 0 &&
      newSession.listoCount % 5 === 0
    ) {
      setShowLevelUp(true);
    }
  }

  function handlePasar() {
    if (!session?.currentCard) return;
    const newSession = cardSessionReducer(session, { type: "PASAR" }, cards);
    setSession(newSession);
    setAnimKey((k) => k + 1);
  }

  function handleAcceptLevelUp() {
    if (!session) return;
    const newSession = cardSessionReducer(session, { type: "ACCEPT_LEVEL_UP" }, cards);
    setSession(newSession);
    setShowLevelUp(false);
    setAnimKey((k) => k + 1);
    sessionStorage.setItem(SS_LEVEL_KEY, String(newSession.level));
  }

  function handleStay() {
    setShowLevelUp(false);
  }

  function handleLevelChip(n: LevelN) {
    if (!session) return;
    if (n === session.level && !session.exhausted) return;
    const newSession = cardSessionReducer(session, { type: "CHANGE_LEVEL", level: n }, cards);
    setSession(newSession);
    setShowLevelUp(false);
    setAnimKey((k) => k + 1);
    sessionStorage.setItem(SS_LEVEL_KEY, String(n));
  }

  function handleReset() {
    if (!session) return;
    const newSession = cardSessionReducer(session, { type: "RESET" }, cards);
    setSession(newSession);
    setAnimKey((k) => k + 1);
  }

  // --- derivados ---

  const phase: UIPhase = showLevelUp
    ? "level-up"
    : session?.exhausted
      ? "exhausted"
      : "card";

  const currentLevel = session?.level ?? 1;
  const levelInfo = LEVELS.find((l) => l.n === currentLevel) ?? LEVELS[0];
  const nextLevelInfo = LEVELS.find((l) => l.n === currentLevel + 1);

  const actor = session ? session.players[session.turnIndex] : null;
  const receiver = session ? session.players[1 - session.turnIndex] : null;

  // Clave para AnimatePresence: cambia con animKey (cartas) y con phase
  const areaKey =
    phase === "level-up" ? "level-up" : phase === "exhausted" ? "exhausted" : `card-${animKey}`;

  // --- render ---

  if (!session) {
    // Brief loading antes de leer sessionStorage
    return (
      <div className="flex flex-col flex-1">
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
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
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

      <div className="flex flex-col flex-1 px-5 gap-4">
        {/* Chips de nivel */}
        <div className="flex gap-2 flex-wrap">
          {LEVELS.map((lvl) => {
            const active = currentLevel === lvl.n;
            return (
              <button
                key={lvl.n}
                onClick={() => handleLevelChip(lvl.n)}
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

        {/* Banner de turno — solo cuando hay carta activa */}
        {phase === "card" && actor && receiver && (
          <p className="text-small text-center" style={{ color: "var(--d-ink-2)" }}>
            Turno de{" "}
            <span style={{ color: actor.color ?? "var(--d-ink)", fontWeight: 600 }}>
              {actor.display_name}
            </span>
            {" → "}
            <span style={{ color: receiver.color ?? "var(--d-ink)", fontWeight: 600 }}>
              {receiver.display_name}
            </span>
          </p>
        )}

        {/* Área central: carta / panel de nivel / panel agotado */}
        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={areaKey}
              initial={reduced ? false : { opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, x: -40 }}
              transition={{ duration: 0.2 }}
            >
              {phase === "card" && session.currentCard && (
                <div
                  className="rounded-2xl p-6 flex flex-col gap-5"
                  style={{
                    backgroundColor: "var(--d-surface)",
                    border: `2px solid ${LEVEL_BORDER[currentLevel as LevelN]}`,
                    boxShadow: `0 0 24px color-mix(in srgb, ${LEVEL_BORDER[currentLevel as LevelN]} 25%, transparent)`,
                    minHeight: "260px",
                  }}
                >
                  <span
                    className="text-caption"
                    style={{ color: "var(--d-ink-2)" }}
                  >
                    {session.currentCard.kind === "verdad" ? "VERDAD" : "RETO"}
                  </span>
                  <p
                    className="text-h2 flex-1"
                    style={{ color: "var(--d-ink)" }}
                  >
                    {session.currentCard.text}
                  </p>
                </div>
              )}

              {phase === "level-up" && nextLevelInfo && (
                <div
                  className="rounded-2xl p-6 flex flex-col gap-5 items-center text-center"
                  style={{
                    backgroundColor: "var(--d-surface)",
                    border: `2px solid ${nextLevelInfo.color}`,
                    minHeight: "260px",
                    justifyContent: "center",
                  }}
                >
                  <span className="text-4xl" aria-hidden="true">{nextLevelInfo.emoji}</span>
                  <p className="text-h2" style={{ color: "var(--d-ink)" }}>
                    ¿Suben a {nextLevelInfo.name}?
                  </p>
                  <p className="text-small" style={{ color: "var(--d-ink-2)" }}>
                    {session.listoCount} cartas completadas
                  </p>
                </div>
              )}

              {phase === "exhausted" && (
                <div
                  className="rounded-2xl p-6 flex flex-col gap-3 items-center text-center"
                  style={{
                    backgroundColor: "var(--d-surface)",
                    border: "2px solid var(--d-line)",
                    minHeight: "260px",
                    justifyContent: "center",
                  }}
                >
                  <p className="text-h3" style={{ color: "var(--d-ink)" }}>
                    Se terminaron las cartas de {levelInfo.name}
                  </p>
                  <p className="text-small" style={{ color: "var(--d-ink-2)" }}>
                    Elegí otro nivel o empezá de nuevo
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Botones */}
        <div
          className="flex gap-3"
          style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
        >
          {phase === "card" && (
            <>
              <button
                onClick={handlePasar}
                className="flex-1 text-h3 transition-opacity active:opacity-80"
                style={{
                  minHeight: "64px",
                  borderRadius: "14px",
                  backgroundColor: "var(--d-surface)",
                  border: "2px solid var(--d-line)",
                  color: "var(--d-ink-2)",
                }}
              >
                Pasar
              </button>
              <button
                onClick={handleListo}
                className="flex-[2] text-h3 transition-opacity active:opacity-80"
                style={{
                  minHeight: "64px",
                  borderRadius: "14px",
                  backgroundColor: "var(--d-accent)",
                  color: "#ffffff",
                }}
              >
                Listo
              </button>
            </>
          )}

          {phase === "level-up" && (
            <>
              <button
                onClick={handleStay}
                className="flex-1 text-h3 transition-opacity active:opacity-80"
                style={{
                  minHeight: "64px",
                  borderRadius: "14px",
                  backgroundColor: "var(--d-surface)",
                  border: "2px solid var(--d-line)",
                  color: "var(--d-ink-2)",
                }}
              >
                Seguimos acá
              </button>
              <button
                onClick={handleAcceptLevelUp}
                className="flex-[2] text-h3 transition-opacity active:opacity-80"
                style={{
                  minHeight: "64px",
                  borderRadius: "14px",
                  backgroundColor: nextLevelInfo?.color ?? "var(--d-accent)",
                  color: "#ffffff",
                }}
              >
                Sí
              </button>
            </>
          )}

          {phase === "exhausted" && (
            <>
              <button
                onClick={handleReset}
                className="flex-1 text-h3 transition-opacity active:opacity-80"
                style={{
                  minHeight: "64px",
                  borderRadius: "14px",
                  backgroundColor: "var(--d-surface)",
                  border: "2px solid var(--d-line)",
                  color: "var(--d-ink-2)",
                }}
              >
                Empezar de nuevo
              </button>
              <button
                onClick={() => {
                  // Muestra los chips resaltados llevando el foco visual a la selección de nivel.
                  // El usuario tapa el chip que quiera: handleLevelChip se encarga del resto.
                  const firstChip = document.querySelector<HTMLButtonElement>(
                    "[data-level-chip]",
                  );
                  firstChip?.focus();
                }}
                className="flex-[2] text-h3 transition-opacity active:opacity-80"
                style={{
                  minHeight: "64px",
                  borderRadius: "14px",
                  backgroundColor: "var(--d-accent)",
                  color: "#ffffff",
                }}
              >
                Cambiar de nivel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
