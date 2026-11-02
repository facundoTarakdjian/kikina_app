// Wordmark "Ki<i" — Young Serif, con el < en accent-deco
// Solo para uso en la app (logo principal). No usar para h1/h2 de contenido.
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-wordmark text-ink ${className}`}
      style={{ fontSize: "2.5rem", lineHeight: 1 }}
      aria-label="Kikiña"
    >
      Ki
      <span className="text-accent-deco" aria-hidden="true">
        {"<"}
      </span>
      i
    </span>
  );
}
