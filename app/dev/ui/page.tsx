// Página de diseño — solo disponible en desarrollo
// En producción devuelve 404 gracias al middleware / condición de entorno
import { notFound } from "next/navigation";
import { Wordmark } from "@/src/components/ui/Wordmark";
import { Button } from "@/src/components/ui/Button";

export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="min-h-screen bg-paper font-sans p-8 space-y-16">
      <header>
        <h1 className="text-h1 text-ink">Sistema de diseño Ki&lt;i</h1>
        <p className="text-small text-ink-2 mt-1">
          Solo visible en desarrollo.
        </p>
      </header>

      {/* ── Climas ── */}
      <section className="space-y-4">
        <h2 className="text-h2 text-ink">Climas</h2>
        <div className="flex flex-wrap gap-4">
          <ClimateCard theme="light" label="Claro" />
          <ClimateCard theme="dark" label="Oscuro" />
          <ClimateCard theme="discrecion" label="Discreción" />
        </div>
      </section>

      {/* ── Tipografía ── */}
      <section className="space-y-3">
        <h2 className="text-h2 text-ink">Tipografía</h2>
        <div className="space-y-2">
          <p className="text-display text-ink">text-display — Fraunces 40px</p>
          <p className="text-h1 text-ink">text-h1 — Fraunces 30px</p>
          <p className="text-h2 text-ink">text-h2 — Fraunces 22px</p>
          <p className="text-h3 text-ink">text-h3 — Instrument Sans 17px 600</p>
          <p className="text-small text-ink">text-small — Instrument Sans 14px</p>
          <p className="text-caption text-ink-2">TEXT-CAPTION — 12px uppercase</p>
          <p className="text-score text-accent">42 — text-score Fraunces 56px</p>
        </div>
        <div className="mt-4">
          <Wordmark />
          <p className="text-caption text-ink-2 mt-1">Wordmark (Young Serif)</p>
        </div>
      </section>

      {/* ── Botones ── */}
      <section className="space-y-4">
        <h2 className="text-h2 text-ink">Botones</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primario</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="ghost">Fantasma</Button>
          <Button variant="primary" disabled>Deshabilitado</Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" size="sm">Primario sm</Button>
          <Button variant="secondary" size="sm">Secundario sm</Button>
          <Button variant="ghost" size="sm">Fantasma sm</Button>
        </div>
      </section>

      {/* ── Colores ── */}
      <section className="space-y-4">
        <h2 className="text-h2 text-ink">Paleta (clima actual)</h2>
        <div className="flex flex-wrap gap-3">
          {(
            [
              ["bg-paper", "paper"],
              ["bg-paper-2", "paper-2"],
              ["bg-card", "card"],
              ["bg-line", "line"],
              ["bg-accent", "accent"],
              ["bg-accent-deco", "accent-deco"],
              ["bg-accent-soft", "accent-soft"],
              ["bg-facu", "facu"],
              ["bg-kiki", "kiki"],
              ["bg-ok", "ok"],
              ["bg-danger", "danger"],
            ] as const
          ).map(([cls, name]) => (
            <div key={name} className="flex flex-col items-center gap-1">
              <div
                className={`${cls} w-12 h-12 rounded-card border border-line`}
              />
              <span className="text-caption text-ink-2">{name}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ClimateCard({
  theme,
  label,
}: {
  theme: "light" | "dark" | "discrecion";
  label: string;
}) {
  return (
    <div
      data-theme={theme}
      className="rounded-card p-6 w-64 space-y-3 border border-line"
      style={{ background: "var(--paper)" }}
    >
      <p className="text-caption" style={{ color: "var(--ink-2)" }}>
        {label}
      </p>
      <p className="text-h2" style={{ color: "var(--ink)" }}>
        Ki<span style={{ color: "var(--accent-deco)" }}>{"<"}</span>i
      </p>
      <div className="flex gap-2">
        <span
          className="inline-block w-8 h-8 rounded-full"
          style={{ background: "var(--accent)" }}
        />
        <span
          className="inline-block w-8 h-8 rounded-full"
          style={{ background: "var(--paper-2)" }}
        />
        <span
          className="inline-block w-8 h-8 rounded-full border"
          style={{
            background: "var(--card)",
            borderColor: "var(--line)",
          }}
        />
      </div>
    </div>
  );
}
