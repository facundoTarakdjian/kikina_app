import { describe, it, expect } from "vitest";
import { chinchonScorer, chinchonRows } from "../src/lib/scorers/chinchon";

const P1 = "facu";
const P2 = "kiki";

function init() {
  return chinchonScorer.init({}, [P1, P2]);
}

function hand(state: ReturnType<typeof init>, p1Score: number, p2Score: number) {
  return chinchonScorer.apply(state, {
    t: "hand",
    scores: { [P1]: p1Score, [P2]: p2Score },
  });
}

describe("chinchonScorer", () => {
  it("el ejemplo del enunciado: mano 1 → Facu 3, Kiki 17 | mano 2 → Facu 5, Kiki −10", () => {
    let state = init();
    state = hand(state, 3, 17);
    state = hand(state, 5, -10);

    const rows = chinchonRows(state);
    expect(rows).toHaveLength(2);

    // Mano 1: made 3|17, total 3|17
    expect(rows[0]!.made[P1]).toBe(3);
    expect(rows[0]!.made[P2]).toBe(17);
    expect(rows[0]!.total[P1]).toBe(3);
    expect(rows[0]!.total[P2]).toBe(17);

    // Mano 2: made 5|−10, total 8|7
    expect(rows[1]!.made[P1]).toBe(5);
    expect(rows[1]!.made[P2]).toBe(-10);
    expect(rows[1]!.total[P1]).toBe(8);
    expect(rows[1]!.total[P2]).toBe(7);
  });

  it("101 exacto: la partida NO termina", () => {
    let state = init();
    state = hand(state, 101, 10);
    const result = chinchonScorer.result(state);
    expect(result.finished).toBe(false);
    expect(result.scores[P1]).toBe(101);
  });

  it("102 pierde", () => {
    let state = init();
    state = hand(state, 102, 10);
    const result = chinchonScorer.result(state);
    expect(result.finished).toBe(true);
    expect(result.winner).toBe(P2);
  });

  it("ambos se pasan: pierde el que quedó más arriba", () => {
    let state = init();
    state = hand(state, 110, 105);
    const result = chinchonScorer.result(state);
    expect(result.finished).toBe(true);
    expect(result.winner).toBe(P2); // P2 tiene 105, P1 tiene 110 → P1 pierde
  });

  it("ambos se pasan con el mismo total: empate (winner null)", () => {
    let state = init();
    state = hand(state, 110, 110);
    const result = chinchonScorer.result(state);
    expect(result.finished).toBe(true);
    expect(result.winner).toBeNull();
  });

  it("¡Chinchón! gana directo sin importar los totales", () => {
    let state = init();
    state = hand(state, 50, 50);
    state = chinchonScorer.apply(state, { t: "chinchon", player: P2 });
    const result = chinchonScorer.result(state);
    expect(result.finished).toBe(true);
    expect(result.winner).toBe(P2);
  });

  it("se puede cargar −10 en un jugador y 3 en el otro (ambos se guardan tal cual)", () => {
    let state = init();
    state = hand(state, 3, -10);
    const rows = chinchonRows(state);
    expect(rows[0]!.made[P1]).toBe(3);
    expect(rows[0]!.made[P2]).toBe(-10);
    expect(rows[0]!.total[P1]).toBe(3);
    expect(rows[0]!.total[P2]).toBe(-10);
    expect(chinchonScorer.result(state).finished).toBe(false);
  });

  it("no acepta eventos con la partida terminada", () => {
    let state = init();
    state = hand(state, 110, 50);
    expect(chinchonScorer.result(state).finished).toBe(true);
    const before = state.events.length;
    state = hand(state, 5, 5);
    expect(state.events.length).toBe(before);
  });

  it("deshacer quita el último evento", () => {
    let state = init();
    state = hand(state, 20, 15);
    state = hand(state, 30, 10);
    state = chinchonScorer.undo(state);
    const result = chinchonScorer.result(state);
    expect(result.scores[P1]).toBe(20);
    expect(result.scores[P2]).toBe(15);
    expect(result.finished).toBe(false);
  });

  it("deshacer el evento que terminó la partida la revive", () => {
    let state = init();
    state = hand(state, 110, 50);
    expect(chinchonScorer.result(state).finished).toBe(true);
    state = chinchonScorer.undo(state);
    expect(chinchonScorer.result(state).finished).toBe(false);
  });

  it("deshacer en estado vacío no rompe", () => {
    const state = chinchonScorer.undo(init());
    expect(state.events.length).toBe(0);
  });
});
