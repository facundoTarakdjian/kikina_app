import { createClient } from "@/src/lib/supabase/server";
import { CartasClient } from "./CartasClient";
import type { DiscretionCard, PlayerProfile } from "@/src/lib/discretion/cards";

export default async function CartasPage() {
  const supabase = await createClient();

  const [{ data: cardsData }, { data: profilesData }] = await Promise.all([
    supabase.from("discretion_cards").select("id, level, kind, text"),
    supabase.from("profiles").select("id, display_name, color"),
  ]);

  const cards: DiscretionCard[] = (cardsData ?? []).map((row) => ({
    id: row.id,
    level: row.level,
    kind: row.kind as "verdad" | "reto",
    text: row.text,
  }));

  // La pareja siempre tiene exactamente 2 perfiles. Si por alguna razón no
  // se cargan, usamos nombres genéricos para no romper la UI.
  const rawProfiles = profilesData ?? [];
  const players: [PlayerProfile, PlayerProfile] = [
    {
      id: rawProfiles[0]?.id ?? "p1",
      display_name: rawProfiles[0]?.display_name ?? "Jugador 1",
      color: rawProfiles[0]?.color ?? null,
    },
    {
      id: rawProfiles[1]?.id ?? "p2",
      display_name: rawProfiles[1]?.display_name ?? "Jugador 2",
      color: rawProfiles[1]?.color ?? null,
    },
  ];

  return <CartasClient cards={cards} players={players} />;
}
