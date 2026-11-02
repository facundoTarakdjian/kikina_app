"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Plus } from "lucide-react";
import { MemoryCard } from "./MemoryCard";
import { createClient } from "@/src/lib/supabase/client";
import { fetchFeedPage, FEED_PAGE_SIZE } from "@/src/lib/feed";
import type { FeedEntry, FeedProfile } from "./types";

interface RecuerdosFeedProps {
  initialEntries: FeedEntry[];
  profiles: FeedProfile[];
  initialHasMore: boolean;
}

function monthKey(dateStr: string) {
  return dateStr.substring(0, 7);
}

function monthLabel(dateStr: string) {
  return format(parseISO(dateStr.substring(0, 7) + "-15"), "MMMM yyyy", {
    locale: es,
  }).toUpperCase();
}

type RenderItem =
  | { kind: "sep"; label: string; key: string }
  | { kind: "card"; entry: FeedEntry };

export function RecuerdosFeed({
  initialEntries,
  profiles,
  initialHasMore,
}: RecuerdosFeedProps) {
  const [entries, setEntries] = useState<FeedEntry[]>(initialEntries);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const newEntryId = searchParams.get("new") ?? undefined;

  // Precomputar lista con separadores de mes
  const renderList = useMemo<RenderItem[]>(() => {
    const list: RenderItem[] = [];
    let prevMonth = "";
    for (const entry of entries) {
      const month = monthKey(entry.occurred_on);
      if (month !== prevMonth) {
        list.push({ kind: "sep", label: monthLabel(entry.occurred_on), key: month });
        prevMonth = month;
      }
      list.push({ kind: "card", entry });
    }
    return list;
  }, [entries]);

  async function loadMore() {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      const supabase = createClient();
      const { entries: more, hasMore: moreAvail } = await fetchFeedPage(
        supabase,
        entries.length,
        profiles,
      );
      setEntries((prev) => [...prev, ...more]);
      setHasMore(moreAvail);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  // Infinite scroll con IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (observedEntries) => {
        if (
          observedEntries[0].isIntersecting &&
          hasMore &&
          !loadingRef.current
        ) {
          void loadMore();
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore]);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-center py-16">
        <p className="text-h3 text-ink">Todavía no hay nada.</p>
        <p className="text-small text-ink-2">Empecemos por la última salida.</p>
        <Link
          href="/dates/nuevo"
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-paper text-ui"
        >
          <Plus size={16} />
          Nuevo date
        </Link>
      </div>
    );
  }

  const cardVariants = reducedMotion
    ? undefined
    : {
        hidden: { opacity: 0 },
        visible: (i: number) => ({
          opacity: 1,
          transition: { delay: Math.min(i * 0.04, 0.3), duration: 0.25 },
        }),
      };

  return (
    <>
      <div className="flex flex-col gap-1 pb-6">
        {renderList.map((item, i) => {
          if (item.kind === "sep") {
            return (
              <div key={item.key} className="px-1 pt-5 pb-2 first:pt-0">
                <span className="text-caption text-ink-2">{item.label}</span>
              </div>
            );
          }
          const { entry } = item;
          const isNew = entry.id === newEntryId;

          return (
            <motion.div
              key={entry.id}
              custom={i}
              initial={reducedMotion ? false : "hidden"}
              animate="visible"
              variants={cardVariants}
              // Nueva card: breve destello de fondo
              className={isNew ? "ring-2 ring-accent/40 rounded-[14px]" : ""}
            >
              <MemoryCard {...entry} priority={i < 3} />
            </motion.div>
          );
        })}
      </div>

      {/* Sentinel para infinite scroll */}
      <div ref={sentinelRef} className="h-1" aria-hidden="true" />
      {loading && (
        <p className="text-center text-small text-ink-2 py-4">Cargando…</p>
      )}
      {!hasMore && entries.length >= FEED_PAGE_SIZE && (
        <p className="text-center text-caption text-ink-2 py-4">
          — Todo al día —
        </p>
      )}
    </>
  );
}
