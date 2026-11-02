import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/src/lib/supabase/server";
import { PreguntasClient } from "@/src/components/questions/PreguntasClient";
import type { Question } from "@/src/components/questions/PreguntasClient";

export default async function PreguntasPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("couple_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const coupleId = profile.couple_id;

  // Todas las preguntas activas
  const { data: questionRows } = await supabase
    .from("questions")
    .select("id, text, category")
    .eq("active", true)
    .order("id");

  const allQuestions: Question[] = (questionRows ?? []).map((q) => ({
    id: q.id,
    text: q.text,
    category: q.category,
  }));

  // Preguntas ya sorteadas por esta pareja
  const { data: drawRows } = await supabase
    .from("question_draws")
    .select("question_id")
    .eq("couple_id", coupleId);

  const drawnIds: number[] = (drawRows ?? []).map((d) => d.question_id);

  return (
    <main className="flex flex-col min-h-full bg-paper">
      <header className="flex items-center gap-3 px-4 pt-6 pb-2">
        <Link
          href="/juntos"
          className="flex items-center gap-1 text-small text-ink-2 active:text-ink transition-colors"
          aria-label="Volver a Juntos"
        >
          <ArrowLeft size={16} strokeWidth={1.75} />
          Juntos
        </Link>
      </header>

      <PreguntasClient
        allQuestions={allQuestions}
        initialDrawnIds={drawnIds}
        coupleId={coupleId}
        userId={user.id}
      />
    </main>
  );
}
