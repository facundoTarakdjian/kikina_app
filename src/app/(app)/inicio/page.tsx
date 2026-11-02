import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { Wordmark } from "@/src/components/ui/Wordmark";
import { Avatar } from "@/src/components/ui/Avatar";

export default async function InicioPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, color")
    .eq("id", user.id)
    .single();

  const name = profile?.display_name ?? "vos";
  const color = profile?.color ?? null;

  return (
    <main className="min-h-full bg-paper px-6 pt-6">
      {/* Header: wordmark + avatar → ajustes */}
      <header className="flex items-center justify-between mb-8">
        <Wordmark className="text-[1.5rem]" />
        <Link href="/ajustes" aria-label="Ajustes">
          <Avatar name={name} color={color} size={40} />
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
