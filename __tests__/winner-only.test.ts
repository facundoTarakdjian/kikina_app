import { describe, it, expect } from "vitest";
import { winnerOnlyScorer } from "../src/lib/scorers/winner-only";

const pA = "player-a";
const pB = "player-b";
const players: [string, string] = [pA, pB];

function init() {
  return winnerOnlyScorer.init({}, players);
}

describe("winnerOnlyScorer", () => {
  it("estado inicial: no terminado, sin ganador", () => {
    const s = init();
    const r = winnerOnlyScorer.result(s);
    expect(r.finished).toBe(false);
    expect(r.winner).toBeNull();
    expect(r.scores[pA]).toBe(0);
    expect(r.scores[pB]).toBe(0);
  });

  it("pA gana", () => {
    const s = winnerOnlyScorer.apply(init(), { t: "win", player: pA });
    const r = winnerOnlyScorer.result(s);
    expect(r.finished).toBe(true);
    expect(r.winner).toBe(pA);
  });

  it("pB gana", () => {
    const s = winnerOnlyScorer.apply(init(), { t: "win", player: pB });
    const r = winnerOnlyScorer.result(s);
    expect(r.finished).toBe(true);
    expect(r.winner).toBe(pB);
  });

  it("no acepta evento adicional después de terminar", () => {
    const s1 = winnerOnlyScorer.apply(init(), { t: "win", player: pA });
    const s2 = winnerOnlyScorer.apply(s1, { t: "win", player: pB });
    expect(s2).toBe(s1); // misma referencia, estado sin cambios
    expect(winnerOnlyScorer.result(s2).winner).toBe(pA);
  });

  it("deshacer restaura a estado sin ganador", () => {
    const s1 = winnerOnlyScorer.apply(init(), { t: "win", player: pA });
    const s2 = winnerOnlyScorer.undo(s1);
    const r = winnerOnlyScorer.result(s2);
    expect(r.finished).toBe(false);
    expect(r.winner).toBeNull();
  });

  it("deshacer en estado vacío no falla", () => {
    const s = winnerOnlyScorer.undo(init());
    expect(winnerOnlyScorer.result(s).finished).toBe(false);
  });
});
