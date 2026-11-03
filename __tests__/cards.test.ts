import { describe, expect, it } from "vitest";
import {
  cardSessionReducer,
  initSession,
  pickCard,
} from "../src/lib/discretion/cards";
import type { DiscretionCard, PlayerProfile } from "../src/lib/discretion/cards";

// --- helpers ---

function card(id: string, level: number, kind: "verdad" | "reto"): DiscretionCard {
  return { id, level, kind, text: `texto_${id}` };
}

const P1: PlayerProfile = { id: "p1", display_name: "Facu", color: "#3F5A73" };
const P2: PlayerProfile = { id: "p2", display_name: "Kiki", color: "#B3243A" };

/** Genera una función random que devuelve valores de la secuencia en orden circular. */
function seq(...values: number[]) {
  let i = 0;
  return () => values[i++ % values.length]!;
}

// Deck variado para tests de sesión
function makeDeck(count: number): DiscretionCard[] {
  return Array.from({ length: count }, (_, i) =>
    card(`c${i}`, 2, i % 2 === 0 ? "verdad" : "reto"),
  );
}

// --- pickCard ---

describe("pickCard", () => {
  it("respeta el nivel: nunca devuelve carta de otro nivel", () => {
    const cards = [card("a", 1, "verdad"), card("b", 2, "verdad"), card("c", 3, "reto")];
    for (let i = 0; i < 20; i++) {
      const result = pickCard(cards, 2, [], [], "verdad");
      expect(result?.level).toBe(2);
    }
  });

  it("prefiere el tipo solicitado cuando hay disponibles", () => {
    const cards = [card("v1", 1, "verdad"), card("r1", 1, "reto"), card("r2", 1, "reto")];
    // Con random 0, siempre elige el primer ítem del pool
    const result = pickCard(cards, 1, [], [], "verdad", seq(0));
    expect(result?.kind).toBe("verdad");
  });

  it("cae al otro tipo si no quedan del tipo preferido", () => {
    const cards = [card("r1", 1, "reto"), card("r2", 1, "reto")];
    const result = pickCard(cards, 1, [], [], "verdad");
    expect(result?.kind).toBe("reto");
  });

  it("respeta excludedIds", () => {
    const cards = [card("x", 1, "verdad"), card("y", 1, "verdad")];
    const result = pickCard(cards, 1, [], ["x"], "verdad");
    expect(result?.id).toBe("y");
  });

  it("devuelve null si no hay cartas disponibles", () => {
    const cards = [card("a", 1, "verdad")];
    expect(pickCard(cards, 1, ["a"], [], "verdad")).toBeNull();
  });
});

// --- initSession ---

describe("initSession", () => {
  it("arranca con una carta del nivel elegido", () => {
    const cards = [card("v1", 2, "verdad"), card("r1", 2, "reto")];
    const session = initSession([P1, P2], 2, [], cards);
    expect(session.currentCard?.level).toBe(2);
  });

  it("el turnIndex inicial es 0 o 1 (aleatorio)", () => {
    const cards = [card("v1", 1, "verdad")];
    const s0 = initSession([P1, P2], 1, [], cards, seq(0.4, 0));
    const s1 = initSession([P1, P2], 1, [], cards, seq(0.6, 0));
    expect(s0.turnIndex).toBe(0);
    expect(s1.turnIndex).toBe(1);
  });
});

// --- cardSessionReducer ---

describe("cardSessionReducer — no repite cartas", () => {
  it("en 20 cartas no hay ninguna repetida", () => {
    const cards = makeDeck(30);
    let session = initSession([P1, P2], 2, [], cards);
    const seen: string[] = [];

    for (let i = 0; i < 20; i++) {
      expect(session.currentCard).not.toBeNull();
      const id = session.currentCard!.id;
      expect(seen).not.toContain(id);
      seen.push(id);
      session = cardSessionReducer(session, { type: "LISTO" }, cards);
    }
  });
});

describe("cardSessionReducer — alternancia verdad/reto", () => {
  it("alterna el tipo de carta en tiradas consecutivas de LISTO", () => {
    const cards = Array.from({ length: 20 }, (_, i) =>
      card(`c${i}`, 1, i % 2 === 0 ? "verdad" : "reto"),
    );
    let session = initSession([P1, P2], 1, [], cards, seq(0.4, 0));
    const kinds: string[] = [];
    for (let i = 0; i < 6; i++) {
      kinds.push(session.currentCard!.kind);
      session = cardSessionReducer(session, { type: "LISTO" }, cards);
    }
    // Nunca dos seguidos del mismo tipo (cuando hay suficientes de ambos)
    for (let i = 1; i < kinds.length; i++) {
      expect(kinds[i]).not.toBe(kinds[i - 1]);
    }
  });
});

describe("cardSessionReducer — alternancia de turno", () => {
  it("el turnIndex alterna con cada LISTO", () => {
    const cards = makeDeck(20);
    let session = initSession([P1, P2], 2, [], cards, seq(0.4, 0));
    const initial = session.turnIndex;
    session = cardSessionReducer(session, { type: "LISTO" }, cards);
    expect(session.turnIndex).toBe(1 - initial);
    session = cardSessionReducer(session, { type: "LISTO" }, cards);
    expect(session.turnIndex).toBe(initial);
  });

  it("el turnIndex también alterna con PASAR", () => {
    const cards = makeDeck(20);
    let session = initSession([P1, P2], 2, [], cards, seq(0.4, 0));
    const initial = session.turnIndex;
    session = cardSessionReducer(session, { type: "PASAR" }, cards);
    expect(session.turnIndex).toBe(1 - initial);
  });
});

describe("cardSessionReducer — PASAR no incrementa listoCount", () => {
  it("PASAR no suma al contador de completadas", () => {
    const cards = makeDeck(10);
    let session = initSession([P1, P2], 2, [], cards);
    session = cardSessionReducer(session, { type: "PASAR" }, cards);
    expect(session.listoCount).toBe(0);
    session = cardSessionReducer(session, { type: "LISTO" }, cards);
    expect(session.listoCount).toBe(1);
  });
});

describe("cardSessionReducer — excludedIds", () => {
  it("nunca devuelve una carta excluida", () => {
    const cards = Array.from({ length: 10 }, (_, i) => card(`c${i}`, 1, "verdad"));
    const excludedIds = ["c0", "c1", "c2"];
    let session = initSession([P1, P2], 1, excludedIds, cards);
    for (let i = 0; i < 7; i++) {
      expect(excludedIds).not.toContain(session.currentCard?.id);
      session = cardSessionReducer(session, { type: "LISTO" }, cards);
    }
  });
});

describe("cardSessionReducer — estado agotado", () => {
  it("marca exhausted cuando no quedan cartas del nivel", () => {
    const cards = [card("only", 1, "verdad")];
    let session = initSession([P1, P2], 1, [], cards);
    expect(session.exhausted).toBe(false);
    session = cardSessionReducer(session, { type: "LISTO" }, cards);
    expect(session.exhausted).toBe(true);
    expect(session.currentCard).toBeNull();
  });

  it("RESET limpia seenIds y retoma el nivel", () => {
    const cards = [card("only", 1, "verdad")];
    let session = initSession([P1, P2], 1, [], cards);
    session = cardSessionReducer(session, { type: "LISTO" }, cards);
    expect(session.exhausted).toBe(true);
    session = cardSessionReducer(session, { type: "RESET" }, cards);
    expect(session.exhausted).toBe(false);
    expect(session.currentCard?.id).toBe("only");
    expect(session.listoCount).toBe(0);
  });
});

describe("cardSessionReducer — CHANGE_LEVEL", () => {
  it("cambia de nivel y no repite cartas ya vistas en el nuevo nivel", () => {
    const cards = [
      card("l1a", 1, "verdad"),
      card("l2a", 2, "verdad"),
      card("l2b", 2, "reto"),
    ];
    let session = initSession([P1, P2], 1, [], cards);
    // Ver la única carta de nivel 1
    session = cardSessionReducer(session, { type: "LISTO" }, cards);
    // Cambiar a nivel 2
    session = cardSessionReducer(session, { type: "CHANGE_LEVEL", level: 2 }, cards);
    expect(session.level).toBe(2);
    expect(session.currentCard?.level).toBe(2);
  });
});
