"use client";

import Link from "next/link";

// Opciones del sheet "+". Las rutas que no existen todavía están deshabilitadas.
const ITEMS = [
  { emoji: "📸", label: "Date", href: "/dates/nuevo", enabled: true },
  { emoji: "🖼️", label: "Fotos", href: "/recuerdos/fotos/nuevo", enabled: false },
  { emoji: "💭", label: "Pensé en vos", href: "/pensamientos/nuevo", enabled: false },
  { emoji: "✉️", label: "Sobre", href: "/sobres/nuevo", enabled: false },
  { emoji: "🎲", label: "Partida", href: "/juegos/truco/jugar", enabled: true },
  { emoji: "🚕", label: "+1 auto amarillo", href: "/juegos/auto-amarillo", enabled: false },
] as const;

export function AddSheetItems({ onClose }: { onClose: () => void }) {
  return (
    <ul className="flex flex-col gap-1" role="list">
      {ITEMS.map(({ emoji, label, href, enabled }) => {
        const baseClass =
          "flex items-center gap-4 px-4 py-4 rounded-card min-h-[56px] w-full text-left transition-colors duration-100";

        if (enabled) {
          return (
            <li key={label}>
              <Link
                href={href}
                onClick={onClose}
                className={`${baseClass} hover:bg-paper-2 active:bg-paper-2`}
              >
                <span className="text-2xl leading-none" aria-hidden="true">
                  {emoji}
                </span>
                <span className="text-h3 text-ink">{label}</span>
              </Link>
            </li>
          );
        }

        return (
          <li key={label}>
            <button
              disabled
              aria-disabled="true"
              className={`${baseClass} opacity-40 cursor-not-allowed`}
            >
              <span className="text-2xl leading-none" aria-hidden="true">
                {emoji}
              </span>
              <span className="text-h3 text-ink-2">{label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
