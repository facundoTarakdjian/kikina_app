"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useMatchState } from "@/src/lib/match";
import { chinchonScorer, chinchonRows } from "@/src/lib/scorers/chinchon";
import type { ChinchonEvent, ChinchonState } from "@/src/lib/scorers/chinchon";
import { UndoBar } from "@/src/components/games/UndoBar";
import { NumberPad } from "@/src/components/games/NumberPad";
import { MatchLoadingScreen } from "@/src/components/games/MatchLoadingScreen";
import { MatchResumeScreen } from "@/src/components/games/MatchResumeScreen";
import { MatchIdleScreen } from "@/src/components/games/MatchIdleScreen";
import { MatchWinnerScreen } from "@/src/components/games/MatchWinnerScreen";

interface Player {
  id: string;
  display_name: string;
  color: string;
}

interface ChinchonGameProps {
  players: [Player, Player];
  gameId: string;
  coupleId: string;
  userId: string;
}

const LIMIT = 101;

function formatInput(raw: string): number {
  const n = parseInt(raw, 10);
  return isNaN(n) ? 0 : n;
}

export function ChinchonGame({ players, gameId, coupleId, userId }: ChinchonGameProps) {
  const router = useRouter();
  const [p1, p2] = players;
  const listRef = useRef<HTMLDivElement>(null);

  const match = useMatchState<ChinchonState, ChinchonEvent>({
    scorer: chinchonScorer,
    config: {},
    players: [p1.id, p2.id],
    gameId,
    coupleId,
    userId,
    storageKey: "chinchon",
  });

  // BottomSheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [inputs, setInputs] = useState<Record<string, string>>({
    [p1.id]: "",
    [p2.id]: "",
  });
  const [activePlayer, setActivePlayer] = useState<string>(p1.id);
  const [chinchonConfirm, setChinchonConfirm] = useState<string | null>(null);

  // Scroll to bottom when new hand added
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [match.gameState?.events.length]);

  function openSheet() {
    setInputs({ [p1.id]: "", [p2.id]: "" });
    setActivePlayer(p1.id);
    setChinchonConfirm(null);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setChinchonConfirm(null);
  }

  // NumberPad handlers (operate on inputs[activePlayer])
  function handleDigit(d: string) {
    setInputs((prev) => {
      const cur = prev[activePlayer] ?? "";
      const isNeg = cur.startsWith("-");
      const digits = cur.replace("-", "");
      if (digits.length >= 4) return prev;
      const next = (isNeg ? "-" : "") + (digits === "0" ? d : digits + d);
      return { ...prev, [activePlayer]: next === "" ? "" : next };
    });
  }

  function handleDelete() {
    setInputs((prev) => {
      const cur = prev[activePlayer] ?? "";
      if (cur === "" || cur === "-") return { ...prev, [activePlayer]: "" };
      return { ...prev, [activePlayer]: cur.slice(0, -1) };
    });
  }

  function handleToggleSign() {
    setInputs((prev) => {
      const cur = prev[activePlayer] ?? "";
      if (cur === "" || cur === "0") return prev;
      const next = cur.startsWith("-") ? cur.slice(1) : "-" + cur;
      return { ...prev, [activePlayer]: next };
    });
  }

  function handleMinusTen(pid: string) {
    setActivePlayer(pid);
    setInputs((prev) => ({ ...prev, [pid]: "-10" }));
    setChinchonConfirm(null);
  }

  function handleChinchonButton(pid: string) {
    if (chinchonConfirm === pid) {
      // Second tap: confirm
      match.dispatch({ t: "chinchon", player: pid });
      closeSheet();
    } else {
      setChinchonConfirm(pid);
    }
  }

  function handleSelectPlayer(pid: string) {
    setActivePlayer(pid);
    if (chinchonConfirm !== null && chinchonConfirm !== pid) {
      setChinchonConfirm(null);
    }
  }

  const p1Input = inputs[p1.id] ?? "";
  const p2Input = inputs[p2.id] ?? "";
  const p1Filled = p1Input !== "" && p1Input !== "-";
  const p2Filled = p2Input !== "" && p2Input !== "-";

  function handleAnnotateHand() {
    if (!p1Filled || !p2Filled) return;
    match.dispatch({
      t: "hand",
      scores: {
        [p1.id]: formatInput(p1Input),
        [p2.id]: formatInput(p2Input),
      },
    });
    closeSheet();
  }

  // Determine action button for sheet
  let actionButtonText = "Nueva mano";
  let actionButtonEnabled = false;
  if (p1Filled && p2Filled) {
    actionButtonText = "Anotar mano";
    actionButtonEnabled = true;
  } else if (p1Filled && !p2Filled) {
    actionButtonText = `Seguir con ${p2.display_name} →`;
    actionButtonEnabled = false;
  } else if (!p1Filled && p2Filled) {
    actionButtonText = `Seguir con ${p1.display_name} →`;
    actionButtonEnabled = false;
  }

  const scores = match.result?.scores ?? { [p1.id]: 0, [p2.id]: 0 };
  const rows = match.gameState ? chinchonRows(match.gameState) : [];
  const lastEvent = match.gameState?.events.at(-1) ?? null;

  // UndoBar text
  let undoText: string | null = null;
  if (lastEvent) {
    const handIndex = match.gameState!.events.filter((e) => e.t === "hand").length;
    if (lastEvent.t === "chinchon") {
      const winner = players.find((p) => p.id === lastEvent.player);
      undoText = `Chinchón de ${winner?.display_name ?? ""}`;
    } else if (lastEvent.t === "hand") {
      const p1Score = lastEvent.scores[p1.id] ?? 0;
      const p2Score = lastEvent.scores[p2.id] ?? 0;
      undoText = `Mano ${handIndex}: ${p1.display_name} ${p1Score >= 0 ? "+" : ""}${p1Score} · ${p2.display_name} ${p2Score >= 0 ? "+" : ""}${p2Score}`;
    }
  }

  // Winner note
  let winnerNote: string | undefined;
  if (match.phase === "finished" && match.gameState) {
    const lastEv = match.gameState.events.at(-1);
    if (lastEv?.t === "chinchon") {
      winnerNote = "¡Con chinchón!";
    } else {
      const s1Over = (scores[p1.id] ?? 0) > LIMIT;
      const s2Over = (scores[p2.id] ?? 0) > LIMIT;
      if (s1Over && s2Over) {
        winnerNote = "Los dos pasaron los 101";
      } else if (s1Over) {
        winnerNote = `${p1.display_name} pasó los 101`;
      } else if (s2Over) {
        winnerNote = `${p2.display_name} pasó los 101`;
      }
    }
  }

  // ── PHASES ──

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
        title="Chinchón"
        subtitle="Hasta 101 puntos"
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

  // ── PLAYING ──

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
        <span className="text-h3 text-ink">Chinchón</span>
        <div className="w-8" />
      </header>

      {/* Totales */}
      <div className="flex border-b border-line">
        {players.map((p) => {
          const total = scores[p.id] ?? 0;
          const remaining = LIMIT - total;
          const dangerRemaining = remaining <= 15;
          return (
            <div key={p.id} className="flex-1 flex flex-col items-center py-5 gap-1">
              <span className="text-small text-ink-2">{p.display_name}</span>
              <span className="text-score leading-none" style={{ color: p.color }}>
                {total}
              </span>
              <span
                className={`text-caption ${dangerRemaining ? "text-danger" : "text-ink-2"}`}
              >
                le quedan {remaining}
              </span>
            </div>
          );
        })}
      </div>

      {/* Lista de manos */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-0"
      >
        {rows.length === 0 && (
          <p className="text-small text-ink-2 text-center py-8">
            Anotá la primera mano
          </p>
        )}
        {/* Header de columnas */}
        {rows.length > 0 && (
          <div className="flex items-center gap-2 pb-2 border-b border-line mb-1">
            <span className="text-caption text-ink-2 w-12">MANO</span>
            {players.map((p) => (
              <span key={p.id} className="text-caption flex-1 text-center" style={{ color: p.color }}>
                {p.display_name.toUpperCase()}
              </span>
            ))}
          </div>
        )}
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2 py-2.5 border-b border-line last:border-0">
            <span className="text-small text-ink-2 w-12">{i + 1}</span>
            {players.map((p) => {
              const made = row.made[p.id] ?? 0;
              const total = row.total[p.id] ?? 0;
              return (
                <div key={p.id} className="flex-1 flex flex-col items-center">
                  <span className="text-caption text-ink-2">
                    {made >= 0 ? `+${made}` : `${made}`}
                  </span>
                  <span
                    className="text-h3 tabular-nums"
                    style={{
                      fontFamily: "var(--font-fraunces), ui-serif, Georgia, serif",
                      color: total > LIMIT ? "var(--danger)" : p.color,
                    }}
                  >
                    {total}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer: Nueva mano + UndoBar */}
      <div className="border-t border-line">
        <div className="px-4 pt-3 pb-2">
          <button
            onClick={openSheet}
            className="w-full min-h-[64px] rounded-xl bg-accent text-paper text-ui active:opacity-90 transition-opacity"
          >
            Nueva mano
          </button>
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
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={closeSheet}
            aria-hidden="true"
          />
          {/* Sheet */}
          <div
            className="relative bg-card rounded-t-2xl shadow-xl flex flex-col"
            style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-line" />
            </div>

            <p className="text-h3 text-ink text-center pb-4">Nueva mano</p>

            {/* Two player inputs */}
            <div className="flex gap-2 px-4 pb-3">
              {players.map((p) => {
                const isActive = activePlayer === p.id;
                const val = inputs[p.id] ?? "";
                const currentTotal = scores[p.id] ?? 0;
                const previewTotal =
                  val !== "" && val !== "-"
                    ? currentTotal + parseInt(val, 10)
                    : null;

                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPlayer(p.id)}
                    className={`flex-1 rounded-xl p-3 flex flex-col items-center gap-1 transition-colors ${
                      isActive ? "bg-accent-soft" : "bg-paper-2"
                    }`}
                  >
                    <span
                      className="text-caption"
                      style={{ color: p.color }}
                    >
                      {p.display_name.toUpperCase()}
                    </span>
                    <span
                      className="text-h1 tabular-nums leading-tight"
                      style={{
                        fontFamily: "var(--font-fraunces), ui-serif, Georgia, serif",
                        color: isActive ? "var(--accent)" : "var(--ink)",
                        minHeight: "2.25rem",
                      }}
                    >
                      {val === "" ? "—" : val}
                    </span>
                    {previewTotal !== null && (
                      <span className="text-caption text-ink-2">
                        → {previewTotal}
                      </span>
                    )}
                    {/* Buttons: −10 and ¡Chinchón! */}
                    <div className="flex gap-1.5 mt-1 w-full">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMinusTen(p.id);
                        }}
                        className="flex-1 py-2 rounded-lg bg-paper text-small text-ink-2 active:bg-line transition-colors"
                      >
                        −10
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChinchonButton(p.id);
                        }}
                        className={`flex-1 py-2 rounded-lg text-small font-medium transition-colors ${
                          chinchonConfirm === p.id
                            ? "bg-accent text-paper"
                            : "bg-paper text-accent active:bg-line"
                        }`}
                      >
                        {chinchonConfirm === p.id ? "¿Seguro?" : "¡Chinchón!"}
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* NumberPad */}
            <NumberPad
              onDigit={handleDigit}
              onDelete={handleDelete}
              onToggleSign={handleToggleSign}
            />

            {/* Action button */}
            <div className="px-4 pt-1">
              <button
                onClick={handleAnnotateHand}
                disabled={!actionButtonEnabled}
                className="w-full py-4 rounded-xl bg-accent text-paper text-ui disabled:opacity-40 transition-opacity"
              >
                {actionButtonText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
