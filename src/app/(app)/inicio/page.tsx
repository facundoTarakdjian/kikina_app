import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { createClient } from "@/src/lib/supabase/server";
import { Wordmark } from "@/src/components/ui/Wordmark";

export default async function InicioPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const name = profile?.display_name ?? "vos";

  return (
    <main className="min-h-full bg-paper px-6 pt-6">
      {/* Header: wordmark + avatar */}
      <header className="flex items-center justify-between mb-8">
        <Wordmark className="text-[1.5rem]" />
        <Link
          href="/ajustes"
          aria-label="Ajustes"
          className="
            w-11 h-11 rounded-full bg-paper-2 border border-line
            flex items-center justify-center
            hover:bg-line transition-colors duration-150
          "
        >
          <Settings size={20} strokeWidth={1.75} className="text-ink-2" />
        </Link>
      </header>

      {/* Contenido provisorio */}
      <div className="flex flex-col items-center justify-center gap-4 mt-16">
        <p className="text-h2 text-ink">Hola, {name} 👋</p>
        <p className="text-small text-ink-2 text-center">
          Acá va a vivir el inicio: días juntos, último recuerdo y accesos rápidos.
        </p>
      </div>
    </main>
  );
}
