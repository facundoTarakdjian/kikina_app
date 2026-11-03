export type CardKind = "verdad" | "reto";

export interface DiscretionCard {
  id: string;
  level: number;
  kind: CardKind;
  text: string;
}

export interface PlayerProfile {
  id: string;
  display_name: string;
  color: string | null;
}

export interface CardSession {
  level: number;
  seenIds: string[];
  excludedIds: string[]; // "nunca" de cualquiera (M-16); hoy llega vacío
  currentCard: DiscretionCard | null;
  nextKind: CardKind;
  turnIndex: number; // 0 o 1 (índice en players)
  players: [PlayerProfile, PlayerProfile];
  listoCount: number; // cartas completadas (para prompt de subir de nivel)
  exhausted: boolean;
}

/**
 * Elige una carta del nivel dado, evitando vistas y excluidas.
 * Prefiere el tipo `preferKind`; si no quedan de ese tipo, usa el otro.
 * Devuelve null si no hay cartas disponibles.
 */
export function pickCard(
  cards: DiscretionCard[],
  level: number,
  seenIds: string[],
  excludedIds: string[],
  preferKind: CardKind,
  random: () => number = Math.random,
): DiscretionCard | null {
  const seenSet = new Set(seenIds);
  const excludedSet = new Set(excludedIds);

  const available = cards.filter(
    (c) => c.level === level && !seenSet.has(c.id) && !excludedSet.has(c.id),
  );
  if (available.length === 0) return null;

  const preferred = available.filter((c) => c.kind === preferKind);
  const pool = preferred.length > 0 ? preferred : available;
  return pool[Math.floor(random() * pool.length)]!;
}

export function initSession(
  players: [PlayerProfile, PlayerProfile],
  level: number,
  excludedIds: string[],
  cards: DiscretionCard[],
  random: () => number = Math.random,
): CardSession {
  const turnIndex = random() < 0.5 ? 0 : 1;
  const firstCard = pickCard(cards, level, [], excludedIds, "verdad", random);
  // nextKind alterna respecto al tipo que se mostró realmente
  const nextKind: CardKind = firstCard?.kind === "verdad" ? "reto" : "verdad";

  return {
    level,
    seenIds: [],
    excludedIds,
    currentCard: firstCard,
    nextKind,
    turnIndex,
    players,
    listoCount: 0,
    exhausted: firstCard === null,
  };
}

export type CardAction =
  | { type: "LISTO" }
  | { type: "PASAR" }
  | { type: "ACCEPT_LEVEL_UP" }
  | { type: "CHANGE_LEVEL"; level: number }
  | { type: "RESET" };

export function cardSessionReducer(
  state: CardSession,
  action: CardAction,
  cards: DiscretionCard[],
  random: () => number = Math.random,
): CardSession {
  switch (action.type) {
    case "LISTO": {
      if (!state.currentCard) return state;
      const newSeenIds = [...state.seenIds, state.currentCard.id];
      const newTurnIndex = 1 - state.turnIndex;
      const newListoCount = state.listoCount + 1;
      // Primero elegimos usando el nextKind actual; luego lo alternamos para la siguiente vez
      const nextCard = pickCard(
        cards,
        state.level,
        newSeenIds,
        state.excludedIds,
        state.nextKind,
        random,
      );
      const newNextKind: CardKind = state.nextKind === "verdad" ? "reto" : "verdad";
      return {
        ...state,
        seenIds: newSeenIds,
        currentCard: nextCard,
        nextKind: newNextKind,
        turnIndex: newTurnIndex,
        listoCount: newListoCount,
        exhausted: nextCard === null,
      };
    }

    case "PASAR": {
      if (!state.currentCard) return state;
      const newSeenIds = [...state.seenIds, state.currentCard.id];
      const newTurnIndex = 1 - state.turnIndex;
      const nextCard = pickCard(
        cards,
        state.level,
        newSeenIds,
        state.excludedIds,
        state.nextKind,
        random,
      );
      const newNextKind: CardKind = state.nextKind === "verdad" ? "reto" : "verdad";
      return {
        ...state,
        seenIds: newSeenIds,
        currentCard: nextCard,
        nextKind: newNextKind,
        turnIndex: newTurnIndex,
        exhausted: nextCard === null,
        // listoCount NO se incrementa
      };
    }

    case "ACCEPT_LEVEL_UP": {
      if (state.level >= 4) return state;
      const newLevel = state.level + 1;
      const newTurnIndex = 1 - state.turnIndex;
      const nextCard = pickCard(
        cards,
        newLevel,
        state.seenIds,
        state.excludedIds,
        state.nextKind,
        random,
      );
      const newNextKind: CardKind = state.nextKind === "verdad" ? "reto" : "verdad";
      return {
        ...state,
        level: newLevel,
        currentCard: nextCard,
        nextKind: newNextKind,
        turnIndex: newTurnIndex,
        exhausted: nextCard === null,
      };
    }

    case "CHANGE_LEVEL": {
      const nextCard = pickCard(
        cards,
        action.level,
        state.seenIds,
        state.excludedIds,
        state.nextKind,
        random,
      );
      return {
        ...state,
        level: action.level,
        currentCard: nextCard,
        exhausted: nextCard === null,
      };
    }

    case "RESET": {
      const firstCard = pickCard(cards, state.level, [], state.excludedIds, "verdad", random);
      const nextKind: CardKind = firstCard?.kind === "verdad" ? "reto" : "verdad";
      return {
        ...state,
        seenIds: [],
        currentCard: firstCard,
        nextKind,
        listoCount: 0,
        exhausted: firstCard === null,
        turnIndex: 1 - state.turnIndex,
      };
    }

    default:
      return state;
  }
}
