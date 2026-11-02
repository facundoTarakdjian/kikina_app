import { Suspense } from "react";
import { createClient } from "@/src/lib/supabase/server";
import { RecuerdosFeed } from "@/src/components/memories/RecuerdosFeed";
import { fetchFeedPage } from "@/src/lib/feed";
import type { FeedProfile } from "@/src/components/memories/types";

export default async function RecuerdosPage() {
  const supabase = await createClient();

  // Perfiles de la pareja (para colores en puntajes)
  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, display_name, color");

  const profiles: FeedProfile[] = (profileRows ?? []).map((p) => ({
    id: p.id,
    display_name: p.display_name,
    color: p.color ?? null,
  }));

  const { entries, hasMore } = await fetchFeedPage(supabase, 0, profiles);

  return (
    <main className="min-h-full bg-paper px-4 pt-6 pb-4">
      <h1 className="text-h1 text-ink mb-6 px-1">Recuerdos</h1>

      {/* Suspense porque RecuerdosFeed usa useSearchParams() */}
      <Suspense>
        <RecuerdosFeed
          initialEntries={entries}
          profiles={profiles}
          initialHasMore={hasMore}
        />
      </Suspense>
    </main>
  );
}
