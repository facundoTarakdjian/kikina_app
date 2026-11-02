import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/src/lib/supabase/server";

const KIND_LABELS: Record<string, string> = {
  cena: "Cena",
  almuerzo: "Almuerzo",
  cine: "Cine",
  plan_en_casa: "En casa",
  evento: "Evento",
  salida: "Salida",
  otro: "Otro",
};
const WOULD_RETURN_LABELS: Record<string, string> = {
  si: "Sí",
  no: "No",
  tal_vez: "Tal vez",
};

export default async function RecuerdoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch entry
  const { data: entry } = await supabase
    .from("entries")
    .select("id, occurred_on, type, cover_media_id, place_id")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!entry) {
    return (
      <main className="min-h-full bg-paper flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-h3 text-ink">Ese recuerdo no existe.</p>
        <Link href="/recuerdos" className="text-body text-accent underline">
          Volver a Recuerdos
        </Link>
      </main>
    );
  }

  // Fetch datos relacionados en paralelo
  const [placeRes, mediaRes, detailsRes, ratingsRes, profilesRes] =
    await Promise.all([
      entry.place_id
        ? supabase
            .from("places")
            .select("name, city, address")
            .eq("id", entry.place_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      entry.cover_media_id
        ? supabase
            .from("media")
            .select("storage_path, thumb_path, width, height")
            .eq("id", entry.cover_media_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("date_details")
        .select("food, kind, would_return")
        .eq("entry_id", id)
        .maybeSingle(),
      supabase
        .from("date_ratings")
        .select("user_id, score")
        .eq("entry_id", id),
      supabase.from("profiles").select("id, display_name, color"),
    ]);

  const place = placeRes.data;
  const media = mediaRes.data;
  const details = detailsRes.data;
  const ratings = ratingsRes.data ?? [];
  const profiles = profilesRes.data ?? [];

  // URL firmada para la imagen completa (1 h)
  let imageUrl: string | null = null;
  if (media?.storage_path) {
    const { data: signed } = await supabase.storage
      .from("media")
      .createSignedUrl(media.storage_path, 3600);
    imageUrl = signed?.signedUrl ?? null;
  }

  const dateLabel = format(parseISO(entry.occurred_on), "EEEE d 'de' MMMM 'de' yyyy", {
    locale: es,
  });
  const altText = `${entry.type === "date" ? "Date" : "Recuerdo"} en ${place?.name ?? "sin lugar"}, ${dateLabel}`;

  return (
    <main className="min-h-full bg-paper pb-8">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-6 pb-4">
        <Link
          href="/recuerdos"
          className="flex items-center gap-1 text-small text-ink-2 active:text-ink transition-colors"
          aria-label="Volver a Recuerdos"
        >
          <ArrowLeft size={16} strokeWidth={1.75} />
          Recuerdos
        </Link>
      </header>

      {/* Imagen */}
      {imageUrl && (
        <div className="w-full bg-paper-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={altText}
            className="w-full object-cover max-h-[70vw] md:max-h-80"
          />
        </div>
      )}

      <div className="px-5 pt-5 space-y-5">
        {/* Lugar + fecha */}
        <div>
          <h1 className="text-h1 text-ink">{place?.name ?? "Sin lugar"}</h1>
          {place?.city && (
            <p className="text-small text-ink-2 mt-0.5">{place.city}</p>
          )}
          <p className="text-caption text-ink-2 mt-2">
            {dateLabel.toUpperCase()}
          </p>
        </div>

        {/* Puntajes */}
        {ratings.length > 0 && (
          <div className="flex gap-6">
            {ratings.map((r) => {
              const profile = profiles.find((p) => p.id === r.user_id);
              return (
                <div key={r.user_id} className="flex flex-col items-center gap-1">
                  <span
                    className="text-score text-ink"
                    style={{
                      color: profile?.color ?? "var(--accent)",
                    }}
                  >
                    {r.score}
                  </span>
                  <span className="text-small text-ink-2">
                    {profile?.display_name ?? ""}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Detalles del date */}
        {details && (
          <div className="space-y-3">
            {details.food && (
              <div>
                <p className="text-caption text-ink-2">QUÉ COMIERON</p>
                <p className="text-body text-ink mt-0.5">{details.food}</p>
              </div>
            )}
            {details.kind && (
              <div>
                <p className="text-caption text-ink-2">TIPO</p>
                <p className="text-body text-ink mt-0.5">
                  {KIND_LABELS[details.kind] ?? details.kind}
                </p>
              </div>
            )}
            {details.would_return && (
              <div>
                <p className="text-caption text-ink-2">¿VOLVERÍAMOS?</p>
                <p className="text-body text-ink mt-0.5">
                  {WOULD_RETURN_LABELS[details.would_return] ?? details.would_return}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
