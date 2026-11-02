import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { FeedEntry } from "./types";

interface MemoryCardProps extends FeedEntry {
  /** Fuerza la card a recibir tabIndex para accesibilidad en listas */
  priority?: boolean;
}

export function MemoryCard({
  id,
  occurred_on,
  type,
  place_name,
  place_city,
  thumb_url,
  scores,
  priority = false,
}: MemoryCardProps) {
  const dateLabel = format(parseISO(occurred_on), "d MMM yyyy", { locale: es });
  const altText = `${type === "date" ? "Date" : "Recuerdo"} en ${place_name}, ${dateLabel}`;

  return (
    <Link
      href={`/recuerdos/${id}`}
      className="block rounded-[14px] overflow-hidden bg-card shadow-card active:scale-[0.98] transition-transform duration-150"
      aria-label={altText}
    >
      {/* Foto 4:5 */}
      <div className="aspect-[4/5] bg-paper-2 relative">
        {thumb_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb_url}
            alt={altText}
            loading={priority ? "eager" : "lazy"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-paper-2" aria-hidden="true" />
        )}
      </div>

      {/* Info */}
      <div className="px-3 pt-2 pb-3">
        <p className="text-h3 text-ink truncate">{place_name}</p>
        {place_city && (
          <p className="text-small text-ink-2 truncate -mt-0.5">{place_city}</p>
        )}
        <p className="text-caption text-ink-2 mt-1">{dateLabel.toUpperCase()}</p>

        {/* Puntajes ●7 ●9 */}
        {scores.length > 0 && (
          <div className="flex gap-3 mt-1.5">
            {scores.map((s) => (
              <span
                key={s.user_id}
                className="flex items-center gap-1"
                aria-label={`${s.display_name}: ${s.score}`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: s.color ?? "var(--accent)" }}
                  aria-hidden="true"
                />
                <span className="text-small text-ink-2 font-medium">{s.score}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
