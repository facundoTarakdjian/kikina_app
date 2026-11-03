import { describe, it, expect } from "vitest";
import {
  scrabbleScorer,
  scrabbleTurns,
  scrabbleNextPlayer,
} from "../src/lib/scorers/scrabble";

const P1 = "facu";
const P2 = "kiki";

function init() {
  return scrabbleScorer.init({}, [P1, P2]);
}

function turn(
  state: ReturnType<typeof init>,
  player: string,
  points: number,
  word?: string,
) {
  return scrabbleScorer.apply(state, { t: "turn", player, points, word });
}

function end(state: ReturnType<typeof init>) {
  return scrabbleScorer.apply(state, { t: "end" });
}

describe("scrabbleScorer", () => {
  it("hice/va acumulan correctamente", () => {
    let state = init();
    state = turn(state, P1, 12, "CASA");
    state = turn(state, P2, 8, "TREN");
    state = turn(state, P1, 20, "QUIERO");

    const rows = scrabbleTurns(state);
    expect(rows).toHaveLength(3);
    expect(rows[0]!.total).toBe(12);
    expect(rows[1]!.total).toBe(8);
    expect(rows[2]!.total).toBe(32);

    const result = scrabbleScorer.result(state);
    expect(result.scores[P1]).toBe(32);
    expect(result.scores[P2]).toBe(8);
    expect(result.finished).toBe(false);
  });

  it("alternancia: rechaza turno del mismo jugador dos veces seguidas", () => {
    let state = init();
    state = turn(state, P1, 10, "VINO");
    // P1 intenta jugar de nuevo → se ignora
    const before = state.events.length;
    state = turn(state, P1, 5, "SOL");
    expect(state.events.length).toBe(before);
    // P2 sí puede jugar
    state = turn(state, P2, 7, "MAR");
    expect(state.events.length).toBe(before + 1);
  });

  it("scrabbleNextPlayer alterna correctamente", () => {
    let state = init();
    expect(scrabbleNextPlayer(state)).toBeNull();
    state = turn(state, P1, 10);
    expect(scrabbleNextPlayer(state)).toBe(P2);
    state = turn(state, P2, 5);
    expect(scrabbleNextPlayer(state)).toBe(P1);
  });

  it("terminar y ganador: el de mayor total gana", () => {
    let state = init();
    state = turn(state, P1, 50, "QUESO");
    state = turn(state, P2, 30, "RUTA");
    state = end(state);

    const result = scrabbleScorer.result(state);
    expect(result.finished).toBe(true);
    expect(result.winner).toBe(P1);
    expect(result.scores[P1]).toBe(50);
    expect(result.scores[P2]).toBe(30);
  });

  it("empate: winner null", () => {
    let state = init();
    state = turn(state, P1, 40);
    state = turn(state, P2, 40);
    state = end(state);

    const result = scrabbleScorer.result(state);
    expect(result.finished).toBe(true);
    expect(result.winner).toBeNull();
  });

  it("no se puede terminar sin jugadas", () => {
    const state = end(init());
    expect(scrabbleScorer.result(state).finished).toBe(false);
    expect(state.events.length).toBe(0);
  });

  it("no acepta turnos después de terminar", () => {
    let state = init();
    state = turn(state, P1, 10);
    state = end(state);
    const before = state.events.length;
    state = turn(state, P2, 5);
    expect(state.events.length).toBe(before);
  });

  it("puntos negativos se acumulan", () => {
    let state = init();
    state = turn(state, P1, 50);
    state = turn(state, P2, 30);
    state = turn(state, P1, -10); // descuento de fichas

    const result = scrabbleScorer.result(state);
    expect(result.scores[P1]).toBe(40);
    expect(result.scores[P2]).toBe(30);
  });

  it("mejor palabra y mejor turno en extra", () => {
    let state = init();
    state = turn(state, P1, 12, "CASA");
    state = turn(state, P2, 8, "TREN");
    state = turn(state, P1, 22, "QUIERO");
    state = turn(state, P2, 15, "PLAYA");
    state = end(state);

    const result = scrabbleScorer.result(state);
    const extraP1 = result.extra?.[P1] as Record<string, unknown>;
    const extraP2 = result.extra?.[P2] as Record<string, unknown>;

    expect(extraP1?.best_word).toBe("QUIERO");
    expect(extraP1?.best_word_points).toBe(22);
    expect(extraP1?.best_turn).toBe(22);

    expect(extraP2?.best_word).toBe("PLAYA");
    expect(extraP2?.best_word_points).toBe(15);
    expect(extraP2?.best_turn).toBe(15);
  });

  it("palabra se normaliza: trim + toUpperCase", () => {
    let state = init();
    state = turn(state, P1, 10, "  casa  ");
    const rows = scrabbleTurns(state);
    expect(rows[0]!.word).toBe("CASA");
  });

  it("pasó = turno de 0 puntos sin palabra", () => {
    let state = init();
    state = turn(state, P1, 0); // pasó
    state = turn(state, P2, 5, "SOL");
    const rows = scrabbleTurns(state);
    expect(rows[0]!.points).toBe(0);
    expect(rows[0]!.word).toBeUndefined();
  });

  it("deshacer quita el último evento", () => {
    let state = init();
    state = turn(state, P1, 15, "VINO");
    state = turn(state, P2, 10, "SOL");
    state = scrabbleScorer.undo(state);

    const result = scrabbleScorer.result(state);
    expect(result.scores[P1]).toBe(15);
    expect(result.scores[P2]).toBe(0);
    expect(scrabbleNextPlayer(state)).toBe(P2);
  });

  it("deshacer el 'end' permite seguir jugando", () => {
    let state = init();
    state = turn(state, P1, 10);
    state = end(state);
    expect(scrabbleScorer.result(state).finished).toBe(true);
    state = scrabbleScorer.undo(state);
    expect(scrabbleScorer.result(state).finished).toBe(false);
    // ahora P2 puede jugar
    state = turn(state, P2, 5);
    expect(scrabbleScorer.result(state).scores[P2]).toBe(5);
  });

  it("deshacer en estado vacío no rompe", () => {
    const state = scrabbleScorer.undo(init());
    expect(state.events.length).toBe(0);
  });
});
