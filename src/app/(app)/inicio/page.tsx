import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { Wordmark } from "@/src/components/ui/Wordmark";
import { SignOutButton } from "./SignOutButton";

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
    <main className="min-h-screen bg-paper flex flex-col items-center justify-center gap-8 px-6">
      <Wordmark />
      <p className="text-h2 text-ink">Hola, {name} 👋</p>
      <SignOutButton />
    </main>
  );
}
