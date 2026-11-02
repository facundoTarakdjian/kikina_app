/**
 * MatchstickColumn — columna de fosforitos para Truco.
 * 30 puntos: 2 filas (malas 1-15 / buenas 16-30), 3 grupos de 5 por fila.
 * Cada grupo de 5 = cuadrado con diagonal: top / right / bottom / left / diagonal.
 */

const G = 32; // tamaño de cada cuadrado SVG (px)
const PAD = 5; // padding interior del cuadrado

// Los 5 segmentos de un grupo, en orden de llenado
const STROKES = [
  `M${PAD} ${PAD} L${G - PAD} ${PAD}`,                       // 1 — top
  `M${G - PAD} ${PAD} L${G - PAD} ${G - PAD}`,               // 2 — right
  `M${G - PAD} ${G - PAD} L${PAD} ${G - PAD}`,               // 3 — bottom
  `M${PAD} ${G - PAD} L${PAD} ${PAD}`,                       // 4 — left
  `M${G - PAD} ${PAD} L${PAD} ${G - PAD}`,                   // 5 — diagonal
];

interface TallyGroupProps {
  count: number; // cuántos de los 5 están activos (0-5)
  activeColor: string;
}

function TallyGroup({ count, activeColor }: TallyGroupProps) {
  return (
    <svg
      width={G}
      height={G}
      viewBox={`0 0 ${G} ${G}`}
      aria-hidden="true"
    >
      {STROKES.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke={i < count ? activeColor : "currentColor"}
          strokeWidth={2.5}
          strokeLinecap="round"
          opacity={i < count ? 1 : 0.12}
          fill="none"
        />
      ))}
    </svg>
  );
}

interface MatchstickColumnProps {
  score: number;       // 0-30
  label: string;       // nombre del jugador
  color: string;       // color del jugador (ej: "var(--facu)")
}

export function MatchstickColumn({ score, label, color }: MatchstickColumnProps) {
  // Distribuir el score en los 6 grupos (3 malas + 3 buenas)
  function groupCount(groupIndex: number): number {
    // groupIndex 0-2: malas (puntos 1-15); 3-5: buenas (16-30)
    const base = groupIndex * 5;
    const filled = Math.max(0, Math.min(5, score - base));
    return filled;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-small text-ink-2 font-medium">{label}</span>

      {/* Puntuación numérica */}
      <span
        className="text-score tabular-nums leading-none"
        style={{ color }}
      >
        {score}
      </span>

      {/* Fosforitos */}
      <div className="flex flex-col gap-3">
        {/* Malas: grupos 0-2 → puntos 1-15 */}
        <div>
          <p className="text-caption text-ink-2 text-center mb-1.5">MALAS</p>
          <div className="flex gap-2">
            {[0, 1, 2].map((gi) => (
              <TallyGroup key={gi} count={groupCount(gi)} activeColor={color} />
            ))}
          </div>
        </div>

        {/* Separador */}
        <div className="h-px bg-line" aria-hidden="true" />

        {/* Buenas: grupos 3-5 → puntos 16-30 */}
        <div>
          <p className="text-caption text-ink-2 text-center mb-1.5">BUENAS</p>
          <div className="flex gap-2">
            {[3, 4, 5].map((gi) => (
              <TallyGroup key={gi} count={groupCount(gi)} activeColor={color} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
