import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/types/database";
import type { FeedEntry, FeedProfile } from "@/src/components/memories/types";

export const FEED_PAGE_SIZE = 20;

/**
 * Fetches a page of feed entries with signed thumbnail URLs and scores.
 * Works with both the server client and the browser client.
 */
export async function fetchFeedPage(
  supabase: SupabaseClient<Database>,
  offset: number,
  profiles: FeedProfile[],
): Promise<{ entries: FeedEntry[]; hasMore: boolean }> {
  // 1. Entries con lugares
  const { data: rawEntries } = await supabase
    .from("entries")
    .select("id, occurred_on, type, cover_media_id, places ( name, city )")
    .is("deleted_at", null)
    .order("occurred_on", { ascending: false })
    .range(offset, offset + FEED_PAGE_SIZE - 1);

  if (!rawEntries || rawEntries.length === 0) {
    return { entries: [], hasMore: false };
  }

  // 2. Media de portadas (thumb_path)
  const coverIds = rawEntries
    .map((e) => e.cover_media_id)
    .filter((id): id is string => !!id);

  const thumbPathById = new Map<string, string | null>();
  if (coverIds.length > 0) {
    const { data: mediaRows } = await supabase
      .from("media")
      .select("id, thumb_path")
      .in("id", coverIds);
    mediaRows?.forEach((m) => thumbPathById.set(m.id, m.thumb_path ?? null));
  }

  // 3. URLs firmadas en lote (1 h)
  const signedMap = new Map<string, string>();
  const thumbPaths = [
    ...new Set([...thumbPathById.values()].filter((p): p is string => p !== null)),
  ];
  if (thumbPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("media")
      .createSignedUrls(thumbPaths, 3600);
    signed?.forEach((s) => {
      const url = s.signedUrl;
      const path = s.path;
      if (url && path) signedMap.set(path, url);
    });
  }

  // 4. Ratings para estos entries
  const entryIds = rawEntries.map((e) => e.id);
  const { data: ratings } = await supabase
    .from("date_ratings")
    .select("entry_id, user_id, score")
    .in("entry_id", entryIds);

  // 5. Merge
  const entries: FeedEntry[] = rawEntries.map((raw) => {
    const place = Array.isArray(raw.places) ? raw.places[0] : raw.places;
    const thumbPath = raw.cover_media_id
      ? (thumbPathById.get(raw.cover_media_id) ?? null)
      : null;
    const thumbUrl = thumbPath ? (signedMap.get(thumbPath) ?? null) : null;
    const entryScores = (ratings ?? [])
      .filter((r) => r.entry_id === raw.id)
      .map((r) => {
        const profile = profiles.find((p) => p.id === r.user_id);
        return {
          user_id: r.user_id,
          score: r.score,
          display_name: profile?.display_name ?? "",
          color: profile?.color ?? null,
        };
      });

    return {
      id: raw.id,
      occurred_on: raw.occurred_on,
      type: raw.type,
      place_name: (place as { name: string } | null)?.name ?? "Sin lugar",
      place_city: (place as { city: string | null } | null)?.city ?? null,
      thumb_url: thumbUrl,
      scores: entryScores,
    };
  });

  return { entries, hasMore: rawEntries.length === FEED_PAGE_SIZE };
}
