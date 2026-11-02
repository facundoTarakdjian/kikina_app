import Link from "next/link";
import { BookImage } from "lucide-react";
import { createClient } from "@/src/lib/supabase/server";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export default async function RecuerdosPage() {
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("entries")
    .select(`
      id,
      occurred_on,
      type,
      places ( name, city )
    `)
    .is("deleted_at", null)
    .order("occurred_on", { ascending: false })
    .limit(50);

  const hasEntries = entries && entries.length > 0;

  return (
    <main className="min-h-full bg-paper flex flex-col px-5 pt-6">
      <h1 className="text-h1 text-ink mb-6">Recuerdos</h1>

      {!hasEntries && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center pb-8">
          <BookImage size={48} strokeWidth={1.25} className="text-ink-2" />
          <p className="text-h3 text-ink">Todavía no hay nada.</p>
          <p className="text-small text-ink-2">Empecemos por la última salida.</p>
        </div>
      )}

      {hasEntries && (
        <ul className="flex flex-col gap-2 pb-8">
          {entries.map((e) => {
            const place = Array.isArray(e.places) ? e.places[0] : e.places;
            const dateLabel = format(parseISO(e.occurred_on), "d 'de' MMMM 'de' yyyy", {
              locale: es,
            });

            return (
              <li key={e.id}>
                <Link
                  href={`/recuerdos/${e.id}`}
                  className="
                    flex flex-col gap-0.5 px-4 py-3 rounded-xl
                    bg-card border border-line
                    active:scale-[0.99] transition-transform
                  "
                >
                  <span className="text-body text-ink font-medium">
                    {place?.name ?? "Sin lugar"}
                  </span>
                  <span className="text-small text-ink-2">
                    {dateLabel}
                    {place?.city ? ` · ${place.city}` : ""}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
