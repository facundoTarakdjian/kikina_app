import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { ChinchonGame } from "./ChinchonGame";

const DEFAULT_COLORS: [string, string] = ["var(--facu)", "var(--kiki)"];

export default async function ChinchonJugarPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, display_name, color, couple_id")
    .limit(2);

  if (!profileRows || profileRows.length < 2) {
    redirect("/juegos");
  }

  const coupleId = profileRows[0]!.couple_id;

  const { data: game } = await supabase
    .from("games")
    .select("id")
    .eq("slug", "chinchon")
    .eq("couple_id", coupleId)
    .maybeSingle();

  if (!game) {
    redirect("/juegos");
  }

  const players = profileRows.map((p, i) => ({
    id: p.id,
    display_name: p.display_name,
    color: p.color ?? DEFAULT_COLORS[i % 2]!,
  })) as [
    { id: string; display_name: string; color: string },
    { id: string; display_name: string; color: string },
  ];

  return (
    <ChinchonGame
      players={players}
      gameId={game.id}
      coupleId={coupleId}
      userId={user.id}
    />
  );
}
