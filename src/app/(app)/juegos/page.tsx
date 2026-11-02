import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/src/lib/supabase/server";
import { trucoScorer } from "@/src/lib/scorers/truco";
import type { TrucoState } from "@/src/lib/scorers/truco";

interface Profile {
  id: string;
  display_name: string;
  color: string;
}

interface TrucoGameData {
  winsA: number;
  winsB: number;
  inProgress: {
    matchId: string;
    scoreA: number;
    scoreB: number;
  } | null;
}

async function fetchTrucoData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  coupleId: string,
  players: [Profile, Profile],
): Promise<TrucoGameData> {
  // Fetch truco game_id
  const { data: game } = await supabase
    .from("games")
    .select("id")
    .eq("slug", "truco")
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

  // Contar victorias
  const [pA, pB] = players;
  let winsA = 0;
  let winsB = 0;
  for (const m of finishedRes.data ?? []) {
    if (m.winner_id === pA.id) winsA++;
    else if (m.winner_id === pB.id) winsB++;
  }

  // Partida en curso
  let inProgress: TrucoGameData["inProgress"] = null;
  if (ipRes.data) {
    const raw = ipRes.data.state;
    let scoreA = 0;
    let scoreB = 0;
    if (raw && typeof raw === "object" && "events" in raw) {
      const state = raw as unknown as TrucoState;
      const res = trucoScorer.result(state);
      scoreA = res.scores[pA.id] ?? 0;
      scoreB = res.scores[pB.id] ?? 0;
    }
    inProgress = { matchId: ipRes.data.id, scoreA, scoreB };
  }

  return { winsA, winsB, inProgress };
}

interface OtherGame {
  emoji: string;
  name: string;
  description: string;
}

const OTHER_GAMES: OtherGame[] = [
  { emoji: "🂡", name: "Chinchón", description: "Hasta 101" },
  { emoji: "📝", name: "Scrabble", description: "Acumulado" },
  { emoji: "🕵️", name: "Código Secreto", description: "Solo el ganador" },
];

export default async function JuegosPage() {
  const supabase = await createClient();

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, display_name, color, couple_id")
    .limit(2);

  // Sin datos suficientes: página mínima
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

  const truco = await fetchTrucoData(supabase, coupleId, players);
  const [pA, pB] = players;

  return (
    <main className="min-h-full bg-paper px-4 pt-6 pb-4">
      <h1 className="text-h1 text-ink mb-6 px-1">Juegos</h1>

      <div className="flex flex-col gap-3">
        {/* Truco — habilitado */}
        <div className="rounded-card bg-card shadow-1 overflow-hidden">
          <Link
            href="/juegos/truco/jugar"
            className="flex items-center gap-4 px-4 py-4 min-h-[72px] active:bg-paper-2 transition-colors"
          >
            <span className="text-2xl leading-none" aria-hidden="true">🃏</span>
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-h3 text-ink">Truco</span>
              {/* Marcador histórico */}
              <span className="text-small text-ink-2">
                <span style={{ color: pA.color }}>{pA.display_name} {truco.winsA}</span>
                <span className="mx-1 text-ink-2">–</span>
                <span style={{ color: pB.color }}>{truco.winsB} {pB.display_name}</span>
              </span>
            </div>
            <ChevronRight size={18} className="text-ink-2 shrink-0" />
          </Link>

          {/* Banda "en curso" */}
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

        {/* Otros juegos — deshabilitados */}
        {OTHER_GAMES.map(({ emoji, name, description }) => (
          <div
            key={name}
            className="flex items-center gap-4 px-4 py-4 rounded-card bg-card shadow-1 min-h-[72px] opacity-40"
            aria-disabled="true"
          >
            <span className="text-2xl leading-none" aria-hidden="true">{emoji}</span>
            <div className="flex flex-col gap-0.5">
              <span className="text-h3 text-ink">{name}</span>
              <span className="text-small text-ink-2">{description}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
