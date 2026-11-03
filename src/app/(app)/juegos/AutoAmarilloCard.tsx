"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { canUndo } from "@/src/lib/counter";

interface Player {
  id: string;
  display_name: string;
  color: string;
}

interface AutoAmarilloCardProps {
  players: [Player, Player];
  gameId: string;
  coupleId: string;
  initialTotals: Record<string, number>;
}

interface Toast {
  id: number;
  text: string;
  error?: boolean;
}

const LONG_PRESS_MS = 600;

export function AutoAmarilloCard({
  players,
  gameId,
  coupleId,
  initialTotals,
}: AutoAmarilloCardProps) {
  const [totals, setTotals] = useState<Record<string, number>>(initialTotals);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const longPressRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── Refetch al volver a la pantalla ─────────────────────────────────────────

  const fetchTotals = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("counter_totals")
      .select("user_id, total")
      .eq("game_id", gameId);

    if (!data) return;
    const fresh: Record<string, number> = {};
    for (const row of data) {
      if (row.user_id) fresh[row.user_id] = row.total ?? 0;
    }
    setTotals((prev) => ({ ...prev, ...fresh }));
  }, [gameId]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void fetchTotals();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchTotals]);

  // ── Toasts ───────────────────────────────────────────────────────────────────

  function addToast(text: string, error = false) {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, text, error }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2000);
  }

  // ── Insertar evento ──────────────────────────────────────────────────────────

  async function insertEvent(userId: string, delta: 1 | -1): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from("counter_events").insert({
      couple_id: coupleId,
      game_id: gameId,
      user_id: userId,
      delta,
      source: "app",
    });
    return !error;
  }

  // ── Tap corto: +1 ───────────────────────────────────────────────────────────

  async function handleAdd(player: Player) {
    // Háptico
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
    // Optimistic
    setTotals((prev) => ({ ...prev, [player.id]: (prev[player.id] ?? 0) + 1 }));
    const ok = await insertEvent(player.id, 1);
    if (!ok) {
      setTotals((prev) => ({ ...prev, [player.id]: Math.max(0, (prev[player.id] ?? 1) - 1) }));
      addToast("No se pudo guardar", true);
    }
  }

  // ── Long press: anular último (+1 → −1) ─────────────────────────────────────

  async function handleUndo(player: Player) {
    if (!canUndo(totals[player.id] ?? 0)) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
    // Optimistic
    setTotals((prev) => ({ ...prev, [player.id]: Math.max(0, (prev[player.id] ?? 0) - 1) }));
    addToast("Anulado");
    const ok = await insertEvent(player.id, -1);
    if (!ok) {
      setTotals((prev) => ({ ...prev, [player.id]: (prev[player.id] ?? 0) + 1 }));
      addToast("No se pudo guardar", true);
    }
  }

  // ── Long press handlers ──────────────────────────────────────────────────────

  function onPointerDown(player: Player) {
    longPressRef.current[player.id] = setTimeout(() => {
      void handleUndo(player);
    }, LONG_PRESS_MS);
  }

  function onPointerUp(player: Player) {
    clearTimeout(longPressRef.current[player.id]);
  }

  // Cleanup on unmount
  useEffect(() => {
    const ref = longPressRef.current;
    return () => {
      for (const t of Object.values(ref)) clearTimeout(t);
    };
  }, []);

  return (
    <div className="rounded-card bg-card shadow-1 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-line">
        <span className="text-2xl leading-none" aria-hidden="true">🚕</span>
        <span className="text-h3 text-ink flex-1">Auto amarillo</span>
      </div>

      {/* Botones +1 */}
      <div className="flex relative">
        {players.map((p) => (
          <button
            key={p.id}
            onPointerDown={() => onPointerDown(p)}
            onPointerUp={() => onPointerUp(p)}
            onPointerLeave={() => onPointerUp(p)}
            onPointerCancel={() => onPointerUp(p)}
            onClick={() => void handleAdd(p)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-5 min-h-[64px] select-none active:opacity-80 transition-opacity touch-none"
            aria-label={`+1 auto amarillo para ${p.display_name}`}
          >
            <span
              className="text-score leading-none tabular-nums"
              style={{ color: p.color }}
            >
              {totals[p.id] ?? 0}
            </span>
            <span className="text-small text-ink-2">{p.display_name}</span>
          </button>
        ))}

        {/* Divisor central */}
        <div className="absolute inset-y-0 left-1/2 w-px bg-line" aria-hidden="true" />

        {/* Toasts */}
        {toasts.length > 0 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none">
            {toasts.map((t) => (
              <span
                key={t.id}
                className={`px-3 py-1 rounded-full text-small font-medium shadow-1 ${
                  t.error
                    ? "bg-paper text-accent border border-line"
                    : "bg-ink text-paper"
                }`}
              >
                {t.text}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hint */}
      <p className="text-caption text-ink-2 text-center pb-2">
        Mantené apretado para anular
      </p>
    </div>
  );
}
