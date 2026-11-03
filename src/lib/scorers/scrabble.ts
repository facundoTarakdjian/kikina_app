import type { Scorer, PlayerId, GameConfig, ScorerResult } from "./types";

export type ScrabbleTurnEvent = {
  t: "turn";
  player: PlayerId;
  points: number;
  word?: string; // ya normalizada: trim + toUpperCase
};

export type ScrabbleEndEvent = {
  t: "end";
};

export type ScrabbleEvent = ScrabbleTurnEvent | ScrabbleEndEvent;

export interface ScrabbleState {
  players: [PlayerId, PlayerId];
  events: ScrabbleEvent[];
}

export interface ScrabbleTurn {
  n: number;
  player: PlayerId;
  points: number;
  word?: string;
  total: number; // acumulado del jugador después de este turno
}

/** Devuelve un entry por turno jugado (excluye el evento 'end'). */
export function scrabbleTurns(state: ScrabbleState): ScrabbleTurn[] {
  const rows: ScrabbleTurn[] = [];
  const totals: Record<string, number> = {
    [state.players[0]]: 0,
    [state.players[1]]: 0,
  };
  let n = 0;
  for (const e of state.events) {
    if (e.t !== "turn") continue;
    n++;
    totals[e.player] = (totals[e.player] ?? 0) + e.points;
    rows.push({
      n,
      player: e.player,
      points: e.points,
      word: e.word,
      total: totals[e.player]!,
    });
  }
  return rows;
}

/**
 * Devuelve quién juega a continuación alternando desde el último turno.
 * Devuelve null si todavía no hubo ningún turno (el primer jugador lo elige la UI).
 */
export function scrabbleNextPlayer(state: ScrabbleState): PlayerId | null {
  const turns = state.events.filter(
    (e): e is ScrabbleTurnEvent => e.t === "turn",
  );
  if (turns.length === 0) return null;
  const last = turns[turns.length - 1]!;
  return last.player === state.players[0]
    ? state.players[1]
    : state.players[0];
}

function calcResult(state: ScrabbleState): ScorerResult {
  const [pA, pB] = state.players;
  const totals: Record<string, number> = { [pA]: 0, [pB]: 0 };
  const bestWords: Record<string, { word: string; points: number } | null> = {
    [pA]: null,
    [pB]: null,
  };
  const bestTurns: Record<string, number | null> = { [pA]: null, [pB]: null };

  let finished = false;

  for (const e of state.events) {
    if (e.t === "end") {
      finished = true;
      break;
    }
    totals[e.player] = (totals[e.player] ?? 0) + e.points;

    if (bestTurns[e.player] === null || e.points > bestTurns[e.player]!) {
      bestTurns[e.player] = e.points;
    }
    if (e.word) {
      const cur = bestWords[e.player];
      if (!cur || e.points > cur.points) {
        bestWords[e.player] = { word: e.word, points: e.points };
      }
    }
  }

  let winner: PlayerId | null = null;
  if (finished) {
    if (totals[pA]! > totals[pB]!) winner = pA;
    else if (totals[pB]! > totals[pA]!) winner = pB;
  }

  const extra: Record<string, Record<string, unknown>> = {};
  for (const p of state.players) {
    extra[p] = {
      best_word: bestWords[p]?.word ?? null,
      best_word_points: bestWords[p]?.points ?? null,
      best_turn: bestTurns[p] ?? null,
    };
  }

  return {
    finished,
    winner,
    scores: { ...totals },
    extra,
  };
}

export const scrabbleScorer: Scorer<ScrabbleState, ScrabbleEvent> = {
  init(_config: GameConfig, players: [PlayerId, PlayerId]): ScrabbleState {
    return { players, events: [] };
  },

  apply(state: ScrabbleState, event: ScrabbleEvent): ScrabbleState {
    if (calcResult(state).finished) return state;

    if (event.t === "end") {
      const hasTurns = state.events.some((e) => e.t === "turn");
      if (!hasTurns) return state;
      return { ...state, events: [...state.events, event] };
    }

    // Turno: respetar la alternancia
    const next = scrabbleNextPlayer(state);
    if (next !== null && event.player !== next) return state;

    // Normalizar la palabra
    const word = event.word?.trim().toUpperCase() || undefined;
    return {
      ...state,
      events: [...state.events, { ...event, word }],
    };
  },

  undo(state: ScrabbleState): ScrabbleState {
    if (state.events.length === 0) return state;
    return { ...state, events: state.events.slice(0, -1) };
  },

  result: calcResult,
};
