"use client";

import { useRouter } from "next/navigation";
import { RotateCcw, X } from "lucide-react";
import { useMatchState } from "@/src/lib/match";
import { trucoScorer } from "@/src/lib/scorers/truco";
import type { TrucoEvent } from "@/src/lib/scorers/truco";
import { MatchstickColumn } from "@/src/components/games/MatchstickColumn";

interface Player {
  id: string;
  display_name: string;
  color: string;
}

interface TrucoGameProps {
  players: [Player, Player];
  gameId: string;
  coupleId: string;
  userId: string;
}

export function TrucoGame({ players, gameId, coupleId, userId }: TrucoGameProps) {
  const router = useRouter();
  const [p1, p2] = players;

  const match = useMatchState<ReturnType<typeof trucoScorer.init>, TrucoEvent>({
    scorer: trucoScorer,
    config: {},
    players: [p1.id, p2.id],
    gameId,
    coupleId,
    userId,
    storageKey: "truco",
  });

  function vibrate(ms: number) {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  }

  function handlePoint(playerId: string) {
    match.dispatch({ t: "point", player: playerId });
    vibrate(10);
  }

  function handleUndo() {
    match.undo();
  }

  function handleRevancha() {
    void match.startNew();
  }

  const scores = match.result?.scores ?? { [p1.id]: 0, [p2.id]: 0 };
  const lastEvent = match.gameState?.events.at(-1);

  // --- Pantalla de carga ---
  if (match.phase === "loading") {
    return (
      <div className="flex flex-col min-h-dvh bg-paper items-center justify-center">
        <p className="text-body text-ink-2">Cargando…</p>
      </div>
    );
  }

  // --- Ofrecer retomar partida ---
  if (match.phase === "offer_resume") {
    const resumeScores = match.result?.scores;
    return (
      <div className="flex flex-col min-h-dvh bg-paper items-center justify-center gap-6 px-8 text-center">
        <p className="text-h2 text-ink">Hay una partida en curso.</p>
        {resumeScores && (
          <div className="flex items-center gap-3">
            {players.map((p, i) => (
              <span key={p.id}>
                <span className="text-h2" style={{ color: p.color }}>
                  {resumeScores[p.id] ?? 0}
                </span>
                {i === 0 && <span className="text-h2 text-ink-2 mx-2">–</span>}
              </span>
            ))}
          </div>
        )}
        <p className="text-body text-ink-2">¿La retomamos o empezamos de cero?</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={match.resume}
            className="w-full py-4 rounded-xl bg-accent text-paper text-ui"
          >
            Retomar
          </button>
          <button
            onClick={() => void match.abandon().then(() => void match.startNew())}
            className="w-full py-4 rounded-xl bg-paper-2 text-ink text-ui"
          >
            Nueva partida
          </button>
          <button
            onClick={() => router.back()}
            className="w-full py-4 rounded-xl text-ink-2 text-small"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // --- Pantalla de ganador ---
  if (match.phase === "finished" && match.result?.winner) {
    const winner = players.find((p) => p.id === match.result!.winner);
    return (
      <div className="flex flex-col min-h-dvh bg-paper items-center justify-center gap-6 px-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <p className="text-caption text-ink-2">GANÓ</p>
          <p
            className="text-display"
            style={{ color: winner?.color ?? "var(--accent)" }}
          >
            {winner?.display_name ?? ""}
          </p>
        </div>

        {/* Puntajes finales */}
        <div className="flex gap-10 mt-2">
          {players.map((p) => (
            <div key={p.id} className="flex flex-col items-center gap-1">
              <span
                className="text-score tabular-nums"
                style={{ color: p.color }}
              >
                {scores[p.id] ?? 0}
              </span>
              <span className="text-small text-ink-2">{p.display_name}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
          <button
            onClick={handleRevancha}
            className="w-full py-4 rounded-xl bg-accent text-paper text-ui"
          >
            Revancha
          </button>
          <button
            onClick={() => router.push("/juegos")}
            className="w-full py-4 rounded-xl bg-paper-2 text-ink text-ui"
          >
            Volver a juegos
          </button>
        </div>
      </div>
    );
  }

  // --- Idle: iniciar partida ---
  if (match.phase === "idle") {
    return (
      <div className="flex flex-col min-h-dvh bg-paper">
        <header className="flex items-center justify-between px-4 pt-safe-top pt-4 pb-3">
          <button
            onClick={() => router.back()}
            aria-label="Volver"
            className="p-2 -ml-2 text-ink-2"
          >
            <X size={20} />
          </button>
          <span className="text-h3 text-ink">Truco</span>
          <div className="w-8" />
        </header>
        <div className="flex flex-col items-center justify-center flex-1 gap-6 px-6">
          <p className="text-body text-ink-2 text-center">
            A 30 puntos · sin flor
          </p>
          <button
            onClick={() => void match.startNew()}
            className="px-8 py-4 rounded-xl bg-accent text-paper text-ui"
          >
            Empezar partida
          </button>
        </div>
      </div>
    );
  }

  // --- Partida en curso ---
  return (
    <div className="flex flex-col min-h-dvh bg-paper">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-safe-top pt-4 pb-3">
        <button
          onClick={() => router.push("/juegos")}
          aria-label="Volver a juegos"
          className="p-2 -ml-2 text-ink-2"
        >
          <X size={20} />
        </button>
        <span className="text-h3 text-ink">Truco</span>
        <div className="w-8" />
      </header>

      {/* Anotadores */}
      <div className="flex flex-1 divide-x divide-line">
        {players.map((player) => (
          <button
            key={player.id}
            onClick={() => handlePoint(player.id)}
            aria-label={`+1 para ${player.display_name}`}
            className="flex-1 flex flex-col items-center justify-center gap-6 py-8 min-h-[64px] active:bg-paper-2 transition-colors"
          >
            <MatchstickColumn
              score={scores[player.id] ?? 0}
              label={player.display_name}
              color={player.color}
            />
          </button>
        ))}
      </div>

      {/* UndoBar */}
      <div
        className="flex items-center justify-between px-4 py-3 border-t border-line"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        {lastEvent ? (
          <p className="text-small text-ink-2">
            +1 {players.find((p) => p.id === lastEvent.player)?.display_name ?? ""}
          </p>
        ) : (
          <p className="text-small text-ink-2">Tocá el lado del que sumó</p>
        )}
        <button
          onClick={handleUndo}
          disabled={!lastEvent}
          aria-label="Deshacer último punto"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-small text-ink-2 disabled:opacity-30 active:bg-paper-2"
        >
          <RotateCcw size={15} />
          Deshacer
        </button>
      </div>
    </div>
  );
}
