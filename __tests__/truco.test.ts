import { describe, it, expect } from "vitest";
import { trucoScorer } from "../src/lib/scorers/truco";

const P1 = "player-1";
const P2 = "player-2";

function init() {
  return trucoScorer.init({}, [P1, P2]);
}

function addPoints(state: ReturnType<typeof init>, player: string, n: number) {
  let s = state;
  for (let i = 0; i < n; i++) {
    s = trucoScorer.apply(s, { t: "point", player });
  }
  return s;
}

describe("trucoScorer", () => {
  it("initializa con puntajes en 0", () => {
    const state = init();
    const result = trucoScorer.result(state);
    expect(result.scores[P1]).toBe(0);
    expect(result.scores[P2]).toBe(0);
    expect(result.finished).toBe(false);
    expect(result.winner).toBeNull();
  });

  it("acumula puntos correctamente", () => {
    let state = init();
    state = addPoints(state, P1, 5);
    state = addPoints(state, P2, 3);
    const result = trucoScorer.result(state);
    expect(result.scores[P1]).toBe(5);
    expect(result.scores[P2]).toBe(3);
    expect(result.finished).toBe(false);
  });

  it("29→30 gana (llegar exactamente al target)", () => {
    let state = init();
    state = addPoints(state, P1, 29);
    expect(trucoScorer.result(state).finished).toBe(false);
    state = trucoScorer.apply(state, { t: "point", player: P1 });
    const result = trucoScorer.result(state);
    expect(result.finished).toBe(true);
    expect(result.winner).toBe(P1);
    expect(result.scores[P1]).toBe(30);
  });

  it("no registra eventos después de que terminó la partida", () => {
    let state = init();
    state = addPoints(state, P2, 30);
    const before = state.events.length;
    state = trucoScorer.apply(state, { t: "point", player: P1 });
    state = trucoScorer.apply(state, { t: "point", player: P2 });
    expect(state.events.length).toBe(before);
    expect(trucoScorer.result(state).scores[P1]).toBe(0);
  });

  it("deshacer quita el último evento", () => {
    let state = init();
    state = addPoints(state, P1, 5);
    state = addPoints(state, P2, 3);
    state = trucoScorer.undo(state);
    const result = trucoScorer.result(state);
    expect(result.scores[P2]).toBe(2);
    expect(result.scores[P1]).toBe(5);
  });

  it("deshacer en estado vacío no rompe", () => {
    const state = init();
    const after = trucoScorer.undo(state);
    expect(after.events.length).toBe(0);
  });

  it("deshacer el punto ganador elimina el estado de victoria", () => {
    let state = init();
    state = addPoints(state, P1, 29);
    state = trucoScorer.apply(state, { t: "point", player: P1 }); // llega a 30, gana
    expect(trucoScorer.result(state).finished).toBe(true);
    state = trucoScorer.undo(state);
    const result = trucoScorer.result(state);
    expect(result.finished).toBe(false);
    expect(result.winner).toBeNull();
    expect(result.scores[P1]).toBe(29);
  });

  it("soporta n > 1 en un evento", () => {
    let state = init();
    state = trucoScorer.apply(state, { t: "point", player: P1, n: 3 });
    expect(trucoScorer.result(state).scores[P1]).toBe(3);
  });

  it("el primero en llegar gana, el otro puede tener puntaje alto", () => {
    let state = init();
    // P2 llega a 30 antes que P1 aunque P1 tenga también puntos
    state = addPoints(state, P1, 15);
    state = addPoints(state, P2, 30);
    const result = trucoScorer.result(state);
    expect(result.winner).toBe(P2);
    expect(result.finished).toBe(true);
  });

  it("separador malas/buenas en 15: score 15 no es victoria", () => {
    let state = init();
    state = addPoints(state, P1, 15);
    const result = trucoScorer.result(state);
    expect(result.finished).toBe(false);
    expect(result.scores[P1]).toBe(15);
  });
});
