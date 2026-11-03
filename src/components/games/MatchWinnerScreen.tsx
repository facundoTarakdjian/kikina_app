"use client";

interface Player {
  id: string;
  display_name: string;
  color: string;
}

interface MatchWinnerScreenProps {
  players: [Player, Player];
  winner: Player | null; // null = tie
  scores: Record<string, number>;
  note?: string; // e.g. "Con chinchón" or "Facu pasó los 101"
  onRevancha: () => void;
  onDone: () => void;
}

export function MatchWinnerScreen({
  players,
  winner,
  scores,
  note,
  onRevancha,
  onDone,
}: MatchWinnerScreenProps) {
  return (
    <div className="flex flex-col min-h-dvh bg-paper items-center justify-center gap-6 px-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <p className="text-caption text-ink-2">{winner ? "GANÓ" : "EMPATE"}</p>
        {winner ? (
          <p className="text-display" style={{ color: winner.color }}>
            {winner.display_name}
          </p>
        ) : (
          <p className="text-display text-ink">Empate</p>
        )}
        {note && <p className="text-small text-ink-2 mt-1">{note}</p>}
      </div>

      <div className="flex gap-10 mt-2">
        {players.map((p) => (
          <div key={p.id} className="flex flex-col items-center gap-1">
            <span className="text-score tabular-nums" style={{ color: p.color }}>
              {scores[p.id] ?? 0}
            </span>
            <span className="text-small text-ink-2">{p.display_name}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
        <button
          onClick={onRevancha}
          className="w-full py-4 rounded-xl bg-accent text-paper text-ui"
        >
          Revancha
        </button>
        <button
          onClick={onDone}
          className="w-full py-4 rounded-xl bg-paper-2 text-ink text-ui"
        >
          Listo
        </button>
      </div>
    </div>
  );
}
