"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { createClient } from "@/src/lib/supabase/client";

export interface Question {
  id: number;
  text: string;
  category: string;
}

export interface PreguntasClientProps {
  allQuestions: Question[];
  initialDrawnIds: number[];
  coupleId: string;
  userId: string;
}

const ALL_CATEGORIES = [
  "gustos",
  "dilemas",
  "divertidas",
  "profundas",
  "pasado",
  "futuro",
  "nosotros",
  "amor",
  "picante",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  gustos: "Gustos",
  dilemas: "Dilemas",
  divertidas: "Divertidas",
  profundas: "Profundas",
  pasado: "Pasado",
  futuro: "Futuro",
  nosotros: "Nosotros",
  amor: "Amor",
  picante: "🌶️ Picante",
};

export function PreguntasClient({
  allQuestions,
  initialDrawnIds,
  coupleId,
  userId,
}: PreguntasClientProps) {
  const reducedMotion = useReducedMotion();

  // Categorías seleccionadas — vacío = todas
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [drawnIds, setDrawnIds] = useState<Set<number>>(() => new Set(initialDrawnIds));
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [dieKey, setDieKey] = useState(0); // fuerza re-animación
  const rolling = useRef(false);

  // Pool activo = preguntas del filtro no sorteadas aún
  const { activeQuestions, pool } = useMemo(() => {
    const active = allQuestions.filter(
      (q) => selectedCats.length === 0 || selectedCats.includes(q.category),
    );
    const available = active.filter((q) => !drawnIds.has(q.id));
    return { activeQuestions: active, pool: available };
  }, [allQuestions, selectedCats, drawnIds]);

  function toggleCategory(cat: string) {
    setExhausted(false);
    setSelectedCats((prev) => {
      if (prev.includes(cat)) {
        const next = prev.filter((c) => c !== cat);
        return next;
      }
      return [...prev, cat];
    });
  }

  function selectAll() {
    setExhausted(false);
    setSelectedCats([]);
  }

  const isAllSelected = selectedCats.length === 0;

  async function insertDraw(questionId: number) {
    const supabase = createClient();
    await supabase.from("question_draws").insert({
      couple_id: coupleId,
      drawn_by: userId,
      question_id: questionId,
    });
  }

  async function resetDraws() {
    const idsToDelete = activeQuestions.map((q) => q.id);
    const supabase = createClient();
    // Borrar los draws de las preguntas activas para esta pareja
    await supabase
      .from("question_draws")
      .delete()
      .eq("couple_id", coupleId)
      .in("question_id", idsToDelete);
    setDrawnIds((prev) => {
      const next = new Set(prev);
      idsToDelete.forEach((id) => next.delete(id));
      return next;
    });
    setExhausted(false);
  }

  const handleRoll = useCallback(async () => {
    if (rolling.current || isRolling) return;

    if (pool.length === 0) {
      setExhausted(true);
      return;
    }

    rolling.current = true;
    setIsRolling(true);
    setDieKey((k) => k + 1);

    // Elegir pregunta ya antes de la animación
    const picked = pool[Math.floor(Math.random() * pool.length)]!;

    // Esperar la animación (600 ms) antes de mostrar la pregunta
    await new Promise<void>((resolve) => setTimeout(resolve, reducedMotion ? 0 : 620));

    setCurrentQuestion(picked);
    setDrawnIds((prev) => new Set([...prev, picked.id]));
    setIsRolling(false);
    rolling.current = false;

    void insertDraw(picked.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, isRolling, reducedMotion]);

  const dieVariants = reducedMotion
    ? undefined
    : {
        roll: {
          rotate: [0, -12, 14, -10, 8, -4, 0],
          scale: [1, 0.92, 1.06, 0.97, 1.02, 1],
          transition: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] },
        },
        idle: { rotate: 0, scale: 1 },
      };

  return (
    <div className="flex flex-col min-h-full">
      {/* Chips de categoría */}
      <div className="flex flex-wrap gap-2 px-4 pt-4 pb-3">
        <button
          onClick={selectAll}
          className={`px-3 py-1.5 rounded-full text-small font-medium transition-colors ${
            isAllSelected
              ? "bg-accent text-paper"
              : "bg-paper-2 text-ink-2 active:bg-line"
          }`}
        >
          Todas
        </button>
        {ALL_CATEGORIES.map((cat) => {
          const active = selectedCats.includes(cat);
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-small font-medium transition-colors ${
                active
                  ? "bg-accent text-paper"
                  : "bg-paper-2 text-ink-2 active:bg-line"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          );
        })}
      </div>

      {/* Die + pregunta */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 py-4">
        {/* Estado: agotadas */}
        {exhausted ? (
          <div className="flex flex-col items-center gap-5 text-center">
            <p className="text-h2 text-ink">Ya salieron todas.</p>
            <p className="text-body text-ink-2">¿Arrancamos de nuevo?</p>
            <button
              onClick={() => void resetDraws()}
              className="px-6 py-3 rounded-xl bg-accent text-paper text-ui"
            >
              Empezar de nuevo
            </button>
          </div>
        ) : (
          <>
            {/* Die */}
            <button
              onClick={() => void handleRoll()}
              disabled={isRolling}
              aria-label="Tirar el dado"
              className="focus-visible:outline-none"
            >
              <motion.div
                key={dieKey}
                variants={dieVariants}
                animate={isRolling ? "roll" : "idle"}
                className="
                  w-40 h-40 rounded-[28px] bg-paper-2 border border-line
                  flex items-center justify-center
                  shadow-1 select-none
                  active:scale-95 transition-transform duration-100
                "
                style={{ willChange: "transform" }}
              >
                {currentQuestion && !isRolling ? (
                  <span className="text-caption text-ink-2 text-center px-3">
                    {CATEGORY_LABELS[currentQuestion.category]?.toUpperCase()}
                  </span>
                ) : (
                  <span className="text-[56px] leading-none" aria-hidden="true">
                    🎲
                  </span>
                )}
              </motion.div>
            </button>

            {/* Pregunta actual */}
            {currentQuestion && !isRolling && (
              <div className="flex flex-col items-center gap-2 text-center max-w-sm">
                <p className="text-h1 text-ink">{currentQuestion.text}</p>
                <p className="text-caption text-ink-2">
                  {CATEGORY_LABELS[currentQuestion.category]?.toUpperCase()}
                </p>
              </div>
            )}

            {!currentQuestion && !isRolling && (
              <p className="text-body text-ink-2 text-center">
                Tocá el dado para tirar
              </p>
            )}
          </>
        )}
      </div>

      {/* Barra inferior: Otra + contador */}
      {!exhausted && (
        <div
          className="flex items-center justify-between px-4 py-3 border-t border-line"
          style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
        >
          <button
            onClick={() => void handleRoll()}
            disabled={isRolling || pool.length === 0}
            className="px-5 py-2.5 rounded-xl bg-accent text-paper text-ui disabled:opacity-40"
          >
            Otra
          </button>
          <p className="text-caption text-ink-2">
            Quedan {pool.length} sin salir
          </p>
        </div>
      )}
    </div>
  );
}
