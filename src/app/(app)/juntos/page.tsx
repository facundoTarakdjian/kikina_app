import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function JuntosPage() {
  return (
    <main className="min-h-full bg-paper px-4 pt-6 pb-4">
      <h1 className="text-h1 text-ink mb-6 px-1">Juntos</h1>

      <div className="flex flex-col gap-4">
        {/* Preguntas — habilitada */}
        <Link
          href="/preguntas"
          className="flex items-center gap-5 px-5 py-6 rounded-card bg-card shadow-1 min-h-[96px] active:bg-paper-2 transition-colors"
        >
          <span className="text-4xl leading-none" aria-hidden="true">🎲</span>
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-h2 text-ink">Preguntas</span>
            <span className="text-small text-ink-2">400 preguntas para charlar</span>
          </div>
          <ChevronRight size={20} className="text-ink-2 shrink-0" />
        </Link>

        {/* Discreción */}
        <Link
          href="/discrecion"
          className="flex items-center gap-5 px-5 py-6 rounded-card min-h-[96px] active:opacity-80 transition-opacity"
          style={{ backgroundColor: "var(--d-surface)" }}
        >
          <span className="text-4xl leading-none" aria-hidden="true">🔥</span>
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-h2" style={{ color: "var(--d-ink)" }}>Discreción</span>
            <span className="text-small" style={{ color: "var(--d-ink-2)" }}>Dados y cartas para dos</span>
          </div>
        </Link>

        {/* Sobres — deshabilitados hasta E2 */}
        <div
          className="flex items-center gap-5 px-5 py-6 rounded-card bg-card shadow-1 min-h-[96px] opacity-40 cursor-not-allowed"
          aria-disabled="true"
        >
          <span className="text-4xl leading-none" aria-hidden="true">✉️</span>
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-h2 text-ink">Sobres</span>
            <span className="text-small text-ink-2">Cartas para cuando…</span>
          </div>
        </div>
      </div>
    </main>
  );
}
