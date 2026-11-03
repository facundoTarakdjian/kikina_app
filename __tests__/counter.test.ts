import { describe, it, expect } from "vitest";
import { deriveTotal, canUndo } from "../src/lib/counter";
import type { CounterEvent } from "../src/lib/counter";

const pA = "player-a";
const pB = "player-b";

function ev(user_id: string, delta: 1 | -1): CounterEvent {
  return { user_id, delta };
}

describe("deriveTotal", () => {
  it("estado vacío = 0", () => {
    expect(deriveTotal([], pA)).toBe(0);
  });

  it("suma puntos de un jugador", () => {
    const events = [ev(pA, 1), ev(pA, 1), ev(pA, 1)];
    expect(deriveTotal(events, pA)).toBe(3);
  });

  it("ignora eventos de otro jugador", () => {
    const events = [ev(pA, 1), ev(pB, 1), ev(pB, 1)];
    expect(deriveTotal(events, pA)).toBe(1);
    expect(deriveTotal(events, pB)).toBe(2);
  });

  it("anular resta correctamente", () => {
    const events = [ev(pA, 1), ev(pA, 1), ev(pA, -1)];
    expect(deriveTotal(events, pA)).toBe(1);
  });

  it("no baja de 0 si hay más -1 que +1", () => {
    const events = [ev(pA, 1), ev(pA, -1), ev(pA, -1)];
    expect(deriveTotal(events, pA)).toBe(0);
  });

  it("total en 0 con delta -1 queda en 0", () => {
    const events = [ev(pA, -1)];
    expect(deriveTotal(events, pA)).toBe(0);
  });

  it("secuencia larga con anulaciones mixtas", () => {
    // +1 +1 +1 -1 +1 = 3
    const events = [ev(pA, 1), ev(pA, 1), ev(pA, 1), ev(pA, -1), ev(pA, 1)];
    expect(deriveTotal(events, pA)).toBe(3);
  });
});

describe("canUndo", () => {
  it("false cuando total = 0", () => {
    expect(canUndo(0)).toBe(false);
  });

  it("true cuando total > 0", () => {
    expect(canUndo(1)).toBe(true);
    expect(canUndo(5)).toBe(true);
  });
});
