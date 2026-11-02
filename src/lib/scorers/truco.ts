import type { Scorer, PlayerId, GameConfig, ScorerResult } from "./types";

export interface TrucoEvent {
  t: "point";
  player: PlayerId;
  n?: number; // defaults to 1
}

export interface TrucoState {
  players: [PlayerId, PlayerId];
  target: number;
  events: TrucoEvent[];
}

const TARGET = 30;

function deriveScores(
  players: [PlayerId, PlayerId],
  events: TrucoEvent[],
): Record<PlayerId, number> {
  const scores: Record<string, number> = {
    [players[0]]: 0,
    [players[1]]: 0,
  };
  for (const e of events) {
    scores[e.player] = (scores[e.player] ?? 0) + (e.n ?? 1);
  }
  return scores;
}

function calcResult(state: TrucoState): ScorerResult {
  const scores = deriveScores(state.players, state.events);
  // primero que llega al target gana; si ambos llegan en el mismo paso (imposible en +1, pero por seguridad), gana el que llegó primero
  let winner: PlayerId | null = null;
  const running: Record<string, number> = { [state.players[0]]: 0, [state.players[1]]: 0 };
  for (const e of state.events) {
    running[e.player] = (running[e.player] ?? 0) + (e.n ?? 1);
    if (running[e.player] >= state.target && winner === null) {
      winner = e.player;
      break;
    }
  }
  return {
    finished: winner !== null,
    winner,
    scores,
  };
}

export const trucoScorer: Scorer<TrucoState, TrucoEvent> = {
  init(_config: GameConfig, players: [PlayerId, PlayerId]): TrucoState {
    return { players, target: TARGET, events: [] };
  },

  apply(state: TrucoState, event: TrucoEvent): TrucoState {
    // no registrar eventos si la partida ya terminó
    const res = calcResult(state);
    if (res.finished) return state;
    return { ...state, events: [...state.events, event] };
  },

  undo(state: TrucoState): TrucoState {
    if (state.events.length === 0) return state;
    return { ...state, events: state.events.slice(0, -1) };
  },

  result: calcResult,
};
