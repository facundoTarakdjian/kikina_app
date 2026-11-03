import { describe, expect, it } from "vitest";
import { rollDie } from "../src/lib/discretion/dice";
import type { DiceFace } from "../src/lib/discretion/dice";

// --- helpers ---

function face(id: string, min_level: number): DiceFace {
  return { id, die: "accion", min_level, text: `texto_${id}` };
}

/** Genera una función random que devuelve valores de la secuencia en orden. */
function seq(...values: number[]) {
  let i = 0;
  return () => values[i++ % values.length]!;
}

// --- tests ---

describe("rollDie", () => {
  it("en Chispa (nivel 1) nunca devuelve una cara de nivel 2–4", () => {
    const faces: DiceFace[] = [
      face("a", 1),
      face("b", 1),
      face("c", 2),
      face("d", 3),
      face("e", 4),
    ];
    for (let i = 0; i < 50; i++) {
      const result = rollDie(faces, 1);
      expect(result.min_level).toBe(1);
    }
  });

  it("nunca devuelve una cara con min_level mayor al nivel elegido", () => {
    const faces: DiceFace[] = [
      face("a", 1),
      face("b", 2),
      face("c", 3),
      face("d", 4),
    ];
    for (let level = 1; level <= 4; level++) {
      for (let i = 0; i < 20; i++) {
        const result = rollDie(faces, level);
        expect(result.min_level).toBeLessThanOrEqual(level);
      }
    }
  });

  it("con random < 0.6 elige del grupo atLevel (60 %)", () => {
    // atLevel = [b (min_level=2)], below = [a (min_level=1)]
    const faces: DiceFace[] = [face("a", 1), face("b", 2)];
    // Primer random() = 0.5 → elige atLevel; segundo random() = 0 → primer ítem del pool
    const result = rollDie(faces, 2, undefined, seq(0.5, 0));
    expect(result.id).toBe("b");
  });

  it("con random >= 0.6 elige del grupo below (40 %)", () => {
    const faces: DiceFace[] = [face("a", 1), face("b", 2)];
    // Primer random() = 0.7 → elige below; segundo random() = 0 → primer ítem del pool
    const result = rollDie(faces, 2, undefined, seq(0.7, 0));
    expect(result.id).toBe("a");
  });

  it("si atLevel está vacío usa below como fallback", () => {
    // nivel 3 pero no hay caras con min_level=3
    const faces: DiceFace[] = [face("a", 1), face("b", 2)];
    // Con random que devolvería atLevel (< 0.6), igual cae en below por fallback
    const result = rollDie(faces, 3, undefined, seq(0.3, 0));
    expect(result.min_level).toBeLessThanOrEqual(2);
  });

  it("si below está vacío usa atLevel como fallback (nivel 1)", () => {
    const faces: DiceFace[] = [face("a", 1), face("b", 1)];
    // Con random que devolvería below (>= 0.6), igual cae en atLevel
    const result = rollDie(faces, 1, undefined, seq(0.9, 0));
    expect(result.min_level).toBe(1);
  });

  it("no repite la misma cara si hay más de una opción en el grupo", () => {
    const faces: DiceFace[] = [face("x", 1), face("y", 1)];
    // Primer random() = 0.3 → atLevel (ambas son nivel 1); segundo = 0 → primer ítem
    // Sin lastFaceId → puede devolver cualquiera
    const first = rollDie(faces, 1, undefined, seq(0.3, 0));
    // Ahora evitamos esa cara; con seq(0.3, 0) tomaría el primer ítem del pool filtrado
    const second = rollDie(faces, 1, first.id, seq(0.3, 0));
    expect(second.id).not.toBe(first.id);
  });

  it("si solo hay una cara en el grupo, la repite (no hay otra opción)", () => {
    const faces: DiceFace[] = [face("solo", 1)];
    const first = rollDie(faces, 1);
    const second = rollDie(faces, 1, first.id);
    expect(second.id).toBe("solo");
  });

  it("lanza si no hay caras válidas para el nivel", () => {
    const faces: DiceFace[] = [face("a", 2), face("b", 3)];
    expect(() => rollDie(faces, 1)).toThrow();
  });
});
