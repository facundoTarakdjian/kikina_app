import { createClient } from "@/src/lib/supabase/server";
import { DadosClient } from "./DadosClient";
import type { DiceFace, DieName } from "@/src/lib/discretion/dice";

export default async function DadosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("discretion_dice_faces")
    .select("id, die, min_level, text");

  const faces: DiceFace[] = (data ?? []).map((row) => ({
    id: row.id,
    die: row.die as DieName,
    min_level: row.min_level,
    text: row.text,
  }));

  return <DadosClient faces={faces} />;
}
