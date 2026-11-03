import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { Wordmark } from "@/src/components/ui/Wordmark";
import { Avatar } from "@/src/components/ui/Avatar";
import { DayCounter } from "@/src/components/ui/DayCounter";
import { computeMilestones, diffDays, todayInBA } from "@/src/lib/milestones";

export default async function InicioPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, color, couple_id")
    .eq("id", user.id)
    .single();

  const name = profile?.display_name ?? "vos";
  const color = profile?.color ?? null;

  const { data: couple } = profile?.couple_id
    ? await supabase
        .from("couples")
        .select("met_on, together_on")
        .eq("id", profile.couple_id)
        .single()
    : { data: null };

  // ── Hitos ────────────────────────────────────────────────────────────────────

  const today = todayInBA();

  let dayCounterProps: {
    days: number;
    label: string;
    milestones: ReturnType<typeof computeMilestones>;
  } | null = null;

  if (couple) {
    const metOn = couple.met_on;
    const togetherOn = couple.together_on ?? null;
    const milestones = computeMilestones(metOn, togetherOn ?? metOn, today);
    const baseDate = togetherOn ?? metOn;
    const days = diffDays(baseDate, today);
    const label = togetherOn ? "DÍAS JUNTOS" : "DÍAS DESDE QUE NOS CONOCIMOS";
    dayCounterProps = { days, label, milestones };
  }

  // ── Partida en curso (cualquier juego) ───────────────────────────────────────

  let inProgressGame: { slug: string; name: string } | null = null;
  if (profile?.couple_id) {
    const { data: ipMatch } = await supabase
      .from("matches")
      .select("game_id, games!inner(slug, name)")
      .eq("couple_id", profile.couple_id)
      .eq("status", "in_progress")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (ipMatch) {
      // games is a joined object
      const game = (ipMatch as unknown as { games: { slug: string; name: string } }).games;
      if (game) {
        inProgressGame = { slug: game.slug, name: game.name };
      }
    }
  }

  return (
    <main className="min-h-full bg-paper px-6 pt-6 pb-8">
      {/* Header: wordmark + avatar → ajustes */}
      <header className="flex items-center justify-between mb-8">
        <Wordmark className="text-[1.5rem]" />
        <Link href="/ajustes" aria-label="Ajustes">
          <Avatar name={name} color={color} size={40} />
        </Link>
      </header>

      {/* DayCounter */}
      <div className="flex justify-center mt-4 mb-8">
        {dayCounterProps ? (
          <DayCounter
            days={dayCounterProps.days}
            label={dayCounterProps.label}
            milestones={dayCounterProps.milestones}
          />
        ) : (
          <p className="text-small text-ink-2">Hola, {name}</p>
        )}
      </div>

      {/* Accesos rápidos */}
      <div className="flex flex-col gap-3">
        <Link
          href="/preguntas"
          className="flex items-center gap-4 px-4 py-4 rounded-card bg-card shadow-1 active:bg-paper-2 transition-colors"
        >
          <span className="text-2xl leading-none" aria-hidden="true">🎲</span>
          <span className="text-h3 text-ink">Tirar pregunta</span>
        </Link>

        {inProgressGame && (
          <Link
            href={`/juegos/${inProgressGame.slug}/jugar`}
            className="flex items-center gap-4 px-4 py-4 rounded-card bg-card shadow-1 active:bg-paper-2 transition-colors"
          >
            <span className="text-2xl leading-none" aria-hidden="true">🎮</span>
            <div className="flex flex-col gap-0.5">
              <span className="text-h3 text-ink">Seguir partida</span>
              <span className="text-small text-ink-2">{inProgressGame.name} en curso</span>
            </div>
          </Link>
        )}

        <Link
          href="/discrecion"
          className="flex items-center gap-4 px-4 py-4 rounded-card bg-card shadow-1 active:bg-paper-2 transition-colors"
        >
          <span className="text-2xl leading-none" aria-hidden="true">🌶️</span>
          <span className="text-h3 text-ink">Discreción</span>
        </Link>
      </div>
    </main>
  );
}
