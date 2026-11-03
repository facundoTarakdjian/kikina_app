"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { DiscardMenu } from "@/src/components/games/DiscardMenu";
import { useMatchState } from "@/src/lib/match";
import {
  scrabbleScorer,
  scrabbleTurns,
  scrabbleNextPlayer,
} from "@/src/lib/scorers/scrabble";
import type { ScrabbleEvent, ScrabbleState } from "@/src/lib/scorers/scrabble";
import { UndoBar } from "@/src/components/games/UndoBar";
import { NumberPad } from "@/src/components/games/NumberPad";
import { WordInput } from "@/src/components/games/WordInput";
import { MatchLoadingScreen } from "@/src/components/games/MatchLoadingScreen";
import { MatchResumeScreen } from "@/src/components/games/MatchResumeScreen";
import { MatchIdleScreen } from "@/src/components/games/MatchIdleScreen";
import { MatchWinnerScreen } from "@/src/components/games/MatchWinnerScreen";

interface Player {
  id: string;
  display_name: string;
  color: string;
}

interface ScrabbleGameProps {
  players: [Player, Player];
  gameId: string;
  coupleId: string;
  userId: string;
}

function parsePoints(raw: string): number {
  const n = parseInt(raw, 10);
  return isNaN(n) ? 0 : n;
}

interface DisplayCell {
  points: number;
  word?: string;
  total: number;
}

interface DisplayRow {
  round: number;
  cells: Partial<Record<string, DisplayCell>>;
}

function buildDisplayRows(
  turns: ReturnType<typeof scrabbleTurns>,
): DisplayRow[] {
  const rows: DisplayRow[] = [];
  for (let i = 0; i < turns.length; i += 2) {
    const a = turns[i]!;
    const b = turns[i + 1];
    const cells: Partial<Record<string, DisplayCell>> = {};
    cells[a.player] = { points: a.points, word: a.word, total: a.total };
    if (b) cells[b.player] = { points: b.points, word: b.word, total: b.total };
    rows.push({ round: Math.floor(i / 2) + 1, cells });
  }
  return rows;
}

export function ScrabbleGame({
  players,
  gameId,
  coupleId,
  userId,
}: ScrabbleGameProps) {
  const router = useRouter();
  const [p1, p2] = players;
  const listRef = useRef<HTMLDivElement>(null);

  const match = useMatchState<ScrabbleState, ScrabbleEvent>({
    scorer: scrabbleScorer,
    config: {},
    players: [p1.id, p2.id],
    gameId,
    coupleId,
    userId,
    storageKey: "scrabble",
  });

  // BottomSheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetPlayer, setSheetPlayer] = useState<Player>(p1);
  const [pointsInput, setPointsInput] = useState("");
  const [wordInput, setWordInput] = useState("");

  // Terminar confirm
  const [endConfirm, setEndConfirm] = useState(false);

  // Scroll a la última jugada al agregar una nueva
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [match.gameState?.events.length]);

  function openSheet(player: Player) {
    setSheetPlayer(player);
    setPointsInput("");
    setWordInput("");
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
  }

  // NumberPad handlers
  function handleDigit(d: string) {
    setPointsInput((cur) => {
      const isNeg = cur.startsWith("-");
      const digits = cur.replace("-", "");
      if (digits.length >= 4) return cur;
      const next = (isNeg ? "-" : "") + (digits === "0" ? d : digits + d);
      return next;
    });
  }

  function handleDelete() {
    setPointsInput((cur) => {
      if (cur === "" || cur === "-") return "";
      return cur.slice(0, -1);
    });
  }

  function handleToggleSign() {
    setPointsInput((cur) => {
      if (cur === "" || cur === "0") return cur;
      return cur.startsWith("-") ? cur.slice(1) : "-" + cur;
    });
  }

  function handlePaso() {
    match.dispatch({ t: "turn", player: sheetPlayer.id, points: 0 });
    closeSheet();
  }

  function handleAnotar() {
    const points = parsePoints(pointsInput);
    const word = wordInput.trim().toUpperCase() || undefined;
    match.dispatch({ t: "turn", player: sheetPlayer.id, points, word });
    closeSheet();
  }

  function handleEndButton() {
    if (!hasTurns) return;
    if (endConfirm) {
      match.dispatch({ t: "end" });
      setEndConfirm(false);
    } else {
      setEndConfirm(true);
    }
  }

  const scores = match.result?.scores ?? { [p1.id]: 0, [p2.id]: 0 };
  const turns = match.gameState ? scrabbleTurns(match.gameState) : [];
  const displayRows = buildDisplayRows(turns);
  const nextPlayer = match.gameState
    ? scrabbleNextPlayer(match.gameState)
    : null;
  const nextPlayerObj =
    nextPlayer === null
      ? null
      : players.find((p) => p.id === nextPlayer) ?? p1;
  const hasTurns = turns.length > 0;
  const lastEvent = match.gameState?.events.at(-1) ?? null;

  // UndoBar text
  let undoText: string | null = null;
  if (lastEvent) {
    if (lastEvent.t === "end") {
      undoText = "Partida terminada";
    } else {
      const pName =
        players.find((p) => p.id === lastEvent.player)?.display_name ?? "";
      const pts = lastEvent.points;
      const pointsStr = pts === 0 ? "pasó" : `${pts > 0 ? "+" : ""}${pts}`;
      undoText = lastEvent.word
        ? `${pName} ${pointsStr} · ${lastEvent.word}`
        : `${pName} ${pointsStr}`;
    }
  }

  // Preview para el sheet
  const currentTotal = scores[sheetPlayer.id] ?? 0;
  const previewTotal =
    pointsInput !== "" && pointsInput !== "-"
      ? currentTotal + parsePoints(pointsInput)
      : null;
  const annotateEnabled = pointsInput !== "" && pointsInput !== "-";

  // Winner note
  let winnerNote: string | undefined;
  if (match.phase === "finished" && match.gameState) {
    const extra = match.result?.extra;
    // Buscar la mejor palabra entre los dos jugadores
    let bestWord: string | null = null;
    let bestWordPts = 0;
    for (const p of players) {
      const ex = extra?.[p.id] as Record<string, unknown> | undefined;
      const w = ex?.best_word as string | null;
      const pts = (ex?.best_word_points as number | null) ?? 0;
      if (w && pts >= bestWordPts) {
        bestWord = w;
        bestWordPts = pts;
      }
    }
    if (bestWord) {
      winnerNote = `Mejor palabra: ${bestWord} (${bestWordPts})`;
    }
  }

  // ── FASES ──

  if (match.phase === "loading") return <MatchLoadingScreen />;

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

  if (match.phase === "idle") {
    return (
      <MatchIdleScreen
        title="Scrabble"
        subtitle="Turnos alternados, mayor total gana"
        onStart={() => void match.startNew()}
        onBack={() => router.back()}
      />
    );
  }

  if (match.phase === "finished") {
    const winner = match.result?.winner
      ? players.find((p) => p.id === match.result!.winner) ?? null
      : null;
    return (
      <MatchWinnerScreen
        players={players}
        winner={winner}
        scores={scores}
        note={winnerNote}
        onRevancha={() => void match.startNew()}
        onDone={() => router.push("/juegos")}
      />
    );
  }

  // ── EN CURSO ──

  return (
    <div
      className="flex flex-col min-h-dvh bg-paper"
      onClick={() => { if (endConfirm) setEndConfirm(false); }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-safe-top pt-4 pb-3">
        <button
          onClick={(e) => { e.stopPropagation(); router.push("/juegos"); }}
          aria-label="Volver a juegos"
          className="p-2 -ml-2 text-ink-2"
        >
          <X size={20} />
        </button>
        <span className="text-h3 text-ink">Scrabble</span>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleEndButton(); }}
            disabled={!hasTurns}
            className={`px-3 py-1.5 rounded-lg text-small font-medium transition-colors disabled:opacity-30 ${
              endConfirm
                ? "bg-accent text-paper"
                : "text-ink-2 active:bg-paper-2"
            }`}
          >
            {endConfirm ? "¿Terminamos?" : "Terminar"}
          </button>
          <DiscardMenu onDiscard={() => { void match.abandon().then(() => router.push("/juegos")); }} />
        </div>
      </header>

      {/* Totales */}
      <div className="flex border-b border-line">
        {players.map((p) => {
          const isNext = nextPlayerObj?.id === p.id;
          return (
            <div
              key={p.id}
              className="flex-1 flex flex-col items-center py-5 gap-1"
            >
              <span className="text-small text-ink-2">{p.display_name}</span>
              <span
                className="text-score leading-none"
                style={{ color: p.color }}
              >
                {scores[p.id] ?? 0}
              </span>
              {isNext && (
                <span className="text-caption text-accent">le toca</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Lista de jugadas */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-3 flex flex-col"
      >
        {displayRows.length === 0 && (
          <p className="text-small text-ink-2 text-center py-8">
            Elegí quién empieza
          </p>
        )}

        {displayRows.length > 0 && (
          <div className="flex items-center gap-2 pb-2 border-b border-line mb-1">
            <span className="text-caption text-ink-2 w-8">#</span>
            {players.map((p) => (
              <span
                key={p.id}
                className="text-caption flex-1 text-center"
                style={{ color: p.color }}
              >
                {p.display_name.toUpperCase()}
              </span>
            ))}
          </div>
        )}

        {displayRows.map((row) => (
          <div
            key={row.round}
            className="flex items-center gap-2 py-3 border-b border-line last:border-0"
          >
            <span className="text-caption text-ink-2 w-8">{row.round}</span>
            {players.map((p) => {
              const cell = row.cells[p.id];
              if (!cell) {
                return (
                  <div key={p.id} className="flex-1 flex justify-center">
                    <span className="text-caption text-ink-2">—</span>
                  </div>
                );
              }
              return (
                <div
                  key={p.id}
                  className="flex-1 flex flex-col items-center gap-0.5"
                >
                  <span className="text-caption text-ink-2">
                    {cell.points === 0
                      ? "pasó"
                      : `${cell.points > 0 ? "+" : ""}${cell.points}`}
                  </span>
                  {cell.word && (
                    <span className="text-caption text-ink-2 tracking-wide">
                      {cell.word}
                    </span>
                  )}
                  <span
                    className="text-h3 tabular-nums"
                    style={{
                      fontFamily:
                        "var(--font-fraunces), ui-serif, Georgia, serif",
                      color: p.color,
                    }}
                  >
                    {cell.total}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-line">
        <div className="px-4 pt-3 pb-2 flex gap-2">
          {nextPlayerObj === null ? (
            /* Sin jugadas: dos botones "Empieza…" */
            players.map((p) => (
              <button
                key={p.id}
                onClick={() => openSheet(p)}
                className="flex-1 min-h-[64px] rounded-xl bg-paper-2 text-ink text-ui active:bg-line transition-colors"
              >
                <span className="text-small text-ink-2 block mb-0.5">
                  Empieza
                </span>
                <span style={{ color: p.color }}>{p.display_name}</span>
              </button>
            ))
          ) : (
            /* Tiene jugadas: un botón para el siguiente */
            <button
              onClick={() => openSheet(nextPlayerObj)}
              className="flex-1 min-h-[64px] rounded-xl bg-accent text-paper text-ui active:opacity-90 transition-opacity"
            >
              Jugada de {nextPlayerObj.display_name}
            </button>
          )}
        </div>
        <UndoBar
          lastActionText={undoText}
          onUndo={match.undo}
          disabled={!lastEvent}
        />
      </div>

      {/* BottomSheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={closeSheet}
            aria-hidden="true"
          />
          <div
            className="relative bg-card rounded-t-2xl shadow-xl flex flex-col"
            style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-line" />
            </div>

            <p className="text-h3 text-ink text-center pb-1">
              Jugada de{" "}
              <span style={{ color: sheetPlayer.color }}>
                {sheetPlayer.display_name}
              </span>
            </p>

            {/* Puntos + preview */}
            <div className="flex items-center justify-between px-6 py-3">
              <span
                className="text-score tabular-nums leading-none"
                style={{
                  color:
                    pointsInput === "" || pointsInput === "-"
                      ? "var(--ink-2)"
                      : sheetPlayer.color,
                  opacity: pointsInput === "" || pointsInput === "-" ? 0.4 : 1,
                }}
              >
                {pointsInput === "" || pointsInput === "-"
                  ? "0"
                  : pointsInput}
              </span>
              {previewTotal !== null && (
                <span className="text-small text-ink-2">
                  va {currentTotal} →{" "}
                  <span
                    className="font-medium"
                    style={{ color: sheetPlayer.color }}
                  >
                    {previewTotal}
                  </span>
                </span>
              )}
            </div>

            {/* WordInput */}
            <div className="px-4 pb-2">
              <WordInput
                value={wordInput}
                onChange={setWordInput}
              />
            </div>

            {/* NumberPad */}
            <NumberPad
              onDigit={handleDigit}
              onDelete={handleDelete}
              onToggleSign={handleToggleSign}
            />

            {/* Botones */}
            <div className="flex gap-2 px-4 pt-1">
              <button
                onClick={handlePaso}
                className="flex-1 py-4 rounded-xl bg-paper-2 text-ink text-ui active:bg-line transition-colors"
              >
                Pasó
              </button>
              <button
                onClick={handleAnotar}
                disabled={!annotateEnabled}
                className="flex-[2] py-4 rounded-xl bg-accent text-paper text-ui disabled:opacity-40 transition-opacity"
              >
                Anotar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
