import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { Wordmark } from "@/src/components/ui/Wordmark";
import { Avatar } from "@/src/components/ui/Avatar";
import { DayCounter } from "@/src/components/ui/DayCounter";

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

  return (
    <main className="min-h-full bg-paper px-6 pt-6">
      {/* Header: wordmark + avatar → ajustes */}
      <header className="flex items-center justify-between mb-10">
        <Wordmark className="text-[1.5rem]" />
        <Link href="/ajustes" aria-label="Ajustes">
          <Avatar name={name} color={color} size={40} />
        </Link>
      </header>

      {/* DayCounter */}
      <div className="flex justify-center mt-8">
        {couple ? (
          <DayCounter
            metOn={couple.met_on}
            togetherOn={couple.together_on ?? null}
          />
        ) : (
          <p className="text-small text-ink-2">Hola, {name} 👋</p>
        )}
      </div>

      {/* Accesos rápidos */}
      <div className="mt-10 flex flex-col gap-3">
        <Link
          href="/preguntas"
          className="flex items-center gap-4 px-4 py-4 rounded-card bg-card shadow-1 active:bg-paper-2 transition-colors"
        >
          <span className="text-2xl leading-none" aria-hidden="true">🎲</span>
          <span className="text-h3 text-ink">Tirar pregunta</span>
        </Link>
      </div>
    </main>
  );
}
