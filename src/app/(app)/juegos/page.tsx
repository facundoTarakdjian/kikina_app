import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/src/lib/supabase/server";
import { trucoScorer } from "@/src/lib/scorers/truco";
import type { TrucoState } from "@/src/lib/scorers/truco";
import { chinchonScorer } from "@/src/lib/scorers/chinchon";
import type { ChinchonState } from "@/src/lib/scorers/chinchon";
import { scrabbleScorer } from "@/src/lib/scorers/scrabble";
import type { ScrabbleState } from "@/src/lib/scorers/scrabble";
import { winnerOnlyScorer } from "@/src/lib/scorers/winner-only";
import type { WinnerOnlyState } from "@/src/lib/scorers/winner-only";
import type { Scorer } from "@/src/lib/scorers/types";
import { AutoAmarilloCard } from "./AutoAmarilloCard";

interface Profile {
  id: string;
  display_name: string;
  color: string;
}

interface GameData {
  winsA: number;
  winsB: number;
  inProgress: {
    matchId: string;
    scoreA: number;
    scoreB: number;
  } | null;
}

async function fetchGameData<S>(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slug: string,
  scorer: Scorer<S, never>,
  coupleId: string,
  players: [Profile, Profile],
): Promise<GameData> {
  const { data: game } = await supabase
    .from("games")
    .select("id")
    .eq("slug", slug)
    .eq("couple_id", coupleId)
    .maybeSingle();

  if (!game) return { winsA: 0, winsB: 0, inProgress: null };

  const [finishedRes, ipRes] = await Promise.all([
    supabase
      .from("matches")
      .select("winner_id")
      .eq("game_id", game.id)
      .eq("couple_id", coupleId)
      .eq("status", "finished"),
    supabase
      .from("matches")
      .select("id, state")
      .eq("game_id", game.id)
      .eq("couple_id", coupleId)
      .eq("status", "in_progress")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const [pA, pB] = players;
  let winsA = 0;
  let winsB = 0;
  for (const m of finishedRes.data ?? []) {
    if (m.winner_id === pA.id) winsA++;
    else if (m.winner_id === pB.id) winsB++;
  }

  let inProgress: GameData["inProgress"] = null;
  if (ipRes.data?.state) {
    try {
      const state = ipRes.data.state as unknown as S;
      const res = scorer.result(state);
      inProgress = {
        matchId: ipRes.data.id,
        scoreA: res.scores[pA.id] ?? 0,
        scoreB: res.scores[pB.id] ?? 0,
      };
    } catch {
      // state malformed, ignore
    }
  }

  return { winsA, winsB, inProgress };
}


export default async function JuegosPage() {
  const supabase = await createClient();

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, display_name, color, couple_id")
    .limit(2);

  if (!profileRows || profileRows.length < 2) {
    return (
      <main className="min-h-full bg-paper px-4 pt-6 pb-4">
        <h1 className="text-h1 text-ink mb-6 px-1">Juegos</h1>
        <p className="text-body text-ink-2 px-1">Cargando juegos…</p>
      </main>
    );
  }

  const coupleId = profileRows[0]!.couple_id;
  const players: [Profile, Profile] = [
    {
      id: profileRows[0]!.id,
      display_name: profileRows[0]!.display_name,
      color: profileRows[0]!.color ?? "var(--facu)",
    },
    {
      id: profileRows[1]!.id,
      display_name: profileRows[1]!.display_name,
      color: profileRows[1]!.color ?? "var(--kiki)",
    },
  ];

  // Auto amarillo: buscar el game id y los totales actuales
  const { data: autoAmarilloGame } = await supabase
    .from("games")
    .select("id")
    .eq("slug", "auto-amarillo")
    .eq("couple_id", coupleId)
    .maybeSingle();

  const [truco, chinchon, scrabble, codigoSecreto, autoAmarilloTotalsRaw] = await Promise.all([
    fetchGameData(supabase, "truco", trucoScorer as Scorer<TrucoState, never>, coupleId, players),
    fetchGameData(supabase, "chinchon", chinchonScorer as Scorer<ChinchonState, never>, coupleId, players),
    fetchGameData(supabase, "scrabble", scrabbleScorer as Scorer<ScrabbleState, never>, coupleId, players),
    fetchGameData(supabase, "codigo-secreto", winnerOnlyScorer as Scorer<WinnerOnlyState, never>, coupleId, players),
    autoAmarilloGame
      ? supabase
          .from("counter_totals")
          .select("user_id, total")
          .eq("game_id", autoAmarilloGame.id)
      : Promise.resolve({ data: [] }),
  ]);

  const autoAmarilloInitialTotals: Record<string, number> = {};
  for (const row of autoAmarilloTotalsRaw.data ?? []) {
    if (row.user_id) autoAmarilloInitialTotals[row.user_id] = row.total ?? 0;
  }

  const [pA, pB] = players;

  return (
    <main className="min-h-full bg-paper px-4 pt-6 pb-4">
      <h1 className="text-h1 text-ink mb-6 px-1">Juegos</h1>

      <div className="flex flex-col gap-3">
        {/* Truco */}
        <div className="rounded-card bg-card shadow-1 overflow-hidden">
          <Link
            href="/juegos/truco/jugar"
            className="flex items-center gap-4 px-4 py-4 min-h-[72px] active:bg-paper-2 transition-colors"
          >
            <span className="text-2xl leading-none" aria-hidden="true">🃏</span>
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-h3 text-ink">Truco</span>
              <span className="text-small text-ink-2">
                <span style={{ color: pA.color }}>{pA.display_name} {truco.winsA}</span>
                <span className="mx-1 text-ink-2">–</span>
                <span style={{ color: pB.color }}>{truco.winsB} {pB.display_name}</span>
              </span>
            </div>
            <ChevronRight size={18} className="text-ink-2 shrink-0" />
          </Link>
          {truco.inProgress && (
            <Link
              href="/juegos/truco/jugar"
              className="flex items-center justify-between px-4 py-3 border-t border-line bg-accent-soft active:bg-paper-2 transition-colors"
            >
              <span className="text-small text-ink">
                Truco en curso ·{" "}
                <span style={{ color: pA.color }}>{truco.inProgress.scoreA}</span>
                <span className="text-ink-2 mx-1">a</span>
                <span style={{ color: pB.color }}>{truco.inProgress.scoreB}</span>
              </span>
              <span className="text-small text-accent font-medium">Seguir →</span>
            </Link>
          )}
        </div>

        {/* Chinchón — habilitado */}
        <div className="rounded-card bg-card shadow-1 overflow-hidden">
          <Link
            href="/juegos/chinchon/jugar"
            className="flex items-center gap-4 px-4 py-4 min-h-[72px] active:bg-paper-2 transition-colors"
          >
            <span className="text-2xl leading-none" aria-hidden="true">🂡</span>
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-h3 text-ink">Chinchón</span>
              <span className="text-small text-ink-2">
                <span style={{ color: pA.color }}>{pA.display_name} {chinchon.winsA}</span>
                <span className="mx-1 text-ink-2">–</span>
                <span style={{ color: pB.color }}>{chinchon.winsB} {pB.display_name}</span>
              </span>
            </div>
            <ChevronRight size={18} className="text-ink-2 shrink-0" />
          </Link>
          {chinchon.inProgress && (
            <Link
              href="/juegos/chinchon/jugar"
              className="flex items-center justify-between px-4 py-3 border-t border-line bg-accent-soft active:bg-paper-2 transition-colors"
            >
              <span className="text-small text-ink">
                Chinchón en curso ·{" "}
                <span style={{ color: pA.color }}>{chinchon.inProgress.scoreA}</span>
                <span className="text-ink-2 mx-1">a</span>
                <span style={{ color: pB.color }}>{chinchon.inProgress.scoreB}</span>
              </span>
              <span className="text-small text-accent font-medium">Seguir →</span>
            </Link>
          )}
        </div>

        {/* Scrabble — habilitado */}
        <div className="rounded-card bg-card shadow-1 overflow-hidden">
          <Link
            href="/juegos/scrabble/jugar"
            className="flex items-center gap-4 px-4 py-4 min-h-[72px] active:bg-paper-2 transition-colors"
          >
            <span className="text-2xl leading-none" aria-hidden="true">🔤</span>
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-h3 text-ink">Scrabble</span>
              <span className="text-small text-ink-2">
                <span style={{ color: pA.color }}>{pA.display_name} {scrabble.winsA}</span>
                <span className="mx-1 text-ink-2">–</span>
                <span style={{ color: pB.color }}>{scrabble.winsB} {pB.display_name}</span>
              </span>
            </div>
            <ChevronRight size={18} className="text-ink-2 shrink-0" />
          </Link>
          {scrabble.inProgress && (
            <Link
              href="/juegos/scrabble/jugar"
              className="flex items-center justify-between px-4 py-3 border-t border-line bg-accent-soft active:bg-paper-2 transition-colors"
            >
              <span className="text-small text-ink">
                Scrabble en curso ·{" "}
                <span style={{ color: pA.color }}>{scrabble.inProgress.scoreA}</span>
                <span className="text-ink-2 mx-1">a</span>
                <span style={{ color: pB.color }}>{scrabble.inProgress.scoreB}</span>
              </span>
              <span className="text-small text-accent font-medium">Seguir →</span>
            </Link>
          )}
        </div>

        {/* Auto amarillo */}
        {autoAmarilloGame && (
          <AutoAmarilloCard
            players={players}
            gameId={autoAmarilloGame.id}
            coupleId={coupleId}
            initialTotals={autoAmarilloInitialTotals}
          />
        )}

        {/* Código Secreto */}
        <div className="rounded-card bg-card shadow-1 overflow-hidden">
          <Link
            href="/juegos/codigo-secreto/jugar"
            className="flex items-center gap-4 px-4 py-4 min-h-[72px] active:bg-paper-2 transition-colors"
          >
            <span className="text-2xl leading-none" aria-hidden="true">🕵️</span>
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-h3 text-ink">Código Secreto</span>
              <span className="text-small text-ink-2">
                <span style={{ color: pA.color }}>{pA.display_name} {codigoSecreto.winsA}</span>
                <span className="mx-1 text-ink-2">–</span>
                <span style={{ color: pB.color }}>{codigoSecreto.winsB} {pB.display_name}</span>
              </span>
            </div>
            <ChevronRight size={18} className="text-ink-2 shrink-0" />
          </Link>
          {codigoSecreto.inProgress && (
            <Link
              href="/juegos/codigo-secreto/jugar"
              className="flex items-center justify-between px-4 py-3 border-t border-line bg-accent-soft active:bg-paper-2 transition-colors"
            >
              <span className="text-small text-ink">Código Secreto en curso</span>
              <span className="text-small text-accent font-medium">Seguir →</span>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
