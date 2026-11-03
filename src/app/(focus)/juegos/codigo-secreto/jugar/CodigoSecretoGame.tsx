"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMatchState } from "@/src/lib/match";
import { winnerOnlyScorer } from "@/src/lib/scorers/winner-only";
import type { WinEvent, WinnerOnlyState } from "@/src/lib/scorers/winner-only";
import { MatchLoadingScreen } from "@/src/components/games/MatchLoadingScreen";
import { MatchResumeScreen } from "@/src/components/games/MatchResumeScreen";
import { MatchWinnerScreen } from "@/src/components/games/MatchWinnerScreen";

interface Player {
  id: string;
  display_name: string;
  color: string;
}

interface CodigoSecretoGameProps {
  players: [Player, Player];
  gameId: string;
  coupleId: string;
  userId: string;
}

export function CodigoSecretoGame({
  players,
  gameId,
  coupleId,
  userId,
}: CodigoSecretoGameProps) {
  const router = useRouter();
  const [p1, p2] = players;

  const match = useMatchState<WinnerOnlyState, WinEvent>({
    scorer: winnerOnlyScorer,
    config: {},
    players: [p1.id, p2.id],
    gameId,
    coupleId,
    userId,
    storageKey: "codigo-secreto",
  });

  // Auto-start: este juego no tiene pantalla idle — crear la partida al entrar
  useEffect(() => {
    if (match.phase === "idle") {
      void match.startNew();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.phase]);

  // Confirmación: qué jugador está pendiente de confirmar
  const [pending, setPending] = useState<Player | null>(null);

  function handleTap(player: Player) {
    if (pending?.id === player.id) {
      // Segundo tap: confirmar
      match.dispatch({ t: "win", player: player.id });
      setPending(null);
    } else {
      // Primer tap: pedir confirmación
      setPending(player);
    }
  }

  function handleDismiss() {
    setPending(null);
  }

  const scores = match.result?.scores ?? { [p1.id]: 0, [p2.id]: 0 };

  // ── FASES ──

  if (match.phase === "loading" || match.phase === "idle") return <MatchLoadingScreen />;

  if (match.phase === "offer_resume") {
    return (
      <MatchResumeScreen
        players={players}
        scores={scores}
        onResume={match.resume}
        onNewMatch={() => void match.abandon().then(() => void match.startNew())}
        onBack={() => router.back()}
      />
    );
  }

  if (match.phase === "finished") {
    const winner = match.result?.winner
      ? players.find((p) => p.id === match.result!.winner) ?? null
      : null;
    return (
      <div className="relative">
        <MatchWinnerScreen
          players={players}
          winner={winner}
          scores={scores}
          onRevancha={() => void match.startNew()}
          onDone={() => router.push("/juegos")}
        />
        {match.saveFailed && (
          <div className="fixed bottom-safe-bottom bottom-4 left-4 right-4 z-50 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-paper-2 shadow-1 border border-line">
            <span className="text-small text-ink">No se pudo guardar. Reintentá cuando haya conexión.</span>
            <button
              onClick={() => void match.retryFinish()}
              className="text-small text-accent font-medium shrink-0"
            >
              Reintentar
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── EN CURSO (playing) ──

  return (
    <div
      className="flex flex-col min-h-dvh"
      onClick={pending ? handleDismiss : undefined}
    >
      {players.map((p) => {
        const isPending = pending?.id === p.id;
        return (
          <button
            key={p.id}
            onClick={(e) => {
              e.stopPropagation();
              handleTap(p);
            }}
            className="flex-1 flex flex-col items-center justify-center gap-3 transition-opacity active:opacity-80"
            style={{ backgroundColor: p.color }}
            aria-label={isPending ? `Confirmar: ganó ${p.display_name}` : `Ganó ${p.display_name}`}
          >
            {isPending ? (
              <>
                <span className="text-h1 text-paper opacity-90">¿Seguro?</span>
                <span className="text-small text-paper opacity-70">
                  Tocá de nuevo para confirmar
                </span>
              </>
            ) : (
              <span className="text-h1 text-paper">
                Ganó {p.display_name}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
