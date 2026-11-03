"use client";

interface LevelPickerProps {
  value: number; // 1–4
  onChange: (level: number) => void;
}

const LEVELS = [
  {
    n: 1,
    name: "Chispa",
    ajies: "🌶️",
    color: "var(--d-level-1)",
    border: "var(--d-level-1)",
  },
  {
    n: 2,
    name: "Calentito",
    ajies: "🌶️🌶️",
    color: "var(--d-level-2)",
    border: "var(--d-level-2)",
  },
  {
    n: 3,
    name: "Fuego",
    ajies: "🌶️🌶️🌶️",
    color: "var(--d-level-3)",
    border: "var(--d-level-3)",
  },
  {
    n: 4,
    name: "Sin discreción",
    ajies: "🌶️🌶️🌶️🌶️",
    color: "var(--d-level-4)",
    border: "var(--d-level-4-border, var(--d-glow))",
  },
] as const;

export function LevelPicker({ value, onChange }: LevelPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      {LEVELS.map((lvl) => {
        const active = value === lvl.n;
        return (
          <button
            key={lvl.n}
            onClick={() => onChange(lvl.n)}
            className="flex items-center gap-4 px-4 min-h-[64px] rounded-xl transition-colors active:opacity-80"
            style={{
              backgroundColor: active
                ? `color-mix(in srgb, ${lvl.color} 12%, var(--d-surface))`
                : "var(--d-surface)",
              border: `2px solid ${active ? lvl.border : "var(--d-line)"}`,
              boxShadow: active
                ? `0 0 12px color-mix(in srgb, ${lvl.border} 30%, transparent)`
                : "none",
            }}
            aria-pressed={active}
          >
            <span className="text-xl leading-none" aria-hidden="true">
              {lvl.ajies}
            </span>
            <span
              className="text-h3 flex-1 text-left"
              style={{ color: active ? lvl.color : "var(--d-ink)" }}
            >
              {lvl.name}
            </span>
            {active && (
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: lvl.border }}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
