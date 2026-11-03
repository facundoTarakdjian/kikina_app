"use client";

interface Player {
  id: string;
  display_name: string;
  color: string;
}

interface MatchResumeScreenProps {
  players: [Player, Player];
  scores: Record<string, number>;
  onResume: () => void;
  onNewMatch: () => void;
  onBack: () => void;
}

export function MatchResumeScreen({
  players,
  scores,
  onResume,
  onNewMatch,
  onBack,
}: MatchResumeScreenProps) {
  return (
    <div className="flex flex-col min-h-dvh bg-paper items-center justify-center gap-6 px-8 text-center">
      <p className="text-h2 text-ink">Hay una partida en curso.</p>
      <div className="flex items-center gap-3">
        {players.map((p, i) => (
          <span key={p.id}>
            <span className="text-h2" style={{ color: p.color }}>
              {scores[p.id] ?? 0}
            </span>
            {i === 0 && <span className="text-h2 text-ink-2 mx-2">–</span>}
          </span>
        ))}
      </div>
      <p className="text-body text-ink-2">¿La retomamos o empezamos de cero?</p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={onResume}
          className="w-full py-4 rounded-xl bg-accent text-paper text-ui"
        >
          Retomar
        </button>
        <button
          onClick={onNewMatch}
          className="w-full py-4 rounded-xl bg-paper-2 text-ink text-ui"
        >
          Descartar y empezar de cero
        </button>
        <button
          onClick={onBack}
          className="w-full py-4 rounded-xl text-ink-2 text-small"
        >
          Volver
        </button>
      </div>
    </div>
  );
}
