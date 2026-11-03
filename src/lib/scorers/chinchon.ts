import type { Scorer, PlayerId, GameConfig, ScorerResult } from "./types";

export type ChinchonHandEvent = {
  t: "hand";
  scores: Record<PlayerId, number>;
};

export type ChinchonChinchonEvent = {
  t: "chinchon";
  player: PlayerId;
};

export type ChinchonEvent = ChinchonHandEvent | ChinchonChinchonEvent;

export interface ChinchonState {
  players: [PlayerId, PlayerId];
  limit: number;
  events: ChinchonEvent[];
}

export interface ChinchonRow {
  made: Record<PlayerId, number>;
  total: Record<PlayerId, number>;
}

/** Returns one row per 'hand' event (chinchon events are excluded). */
export function chinchonRows(state: ChinchonState): ChinchonRow[] {
  const rows: ChinchonRow[] = [];
  const running: Record<string, number> = {
    [state.players[0]]: 0,
    [state.players[1]]: 0,
  };
  for (const e of state.events) {
    if (e.t !== "hand") continue;
    for (const pid of state.players) {
      running[pid] = (running[pid] ?? 0) + (e.scores[pid] ?? 0);
    }
    rows.push({
      made: { ...e.scores },
      total: { ...running },
    });
  }
  return rows;
}

function calcResult(state: ChinchonState): ScorerResult {
  const [pA, pB] = state.players;
  const totals: Record<string, number> = { [pA]: 0, [pB]: 0 };

  for (const e of state.events) {
    if (e.t === "chinchon") {
      return {
        finished: true,
        winner: e.player,
        scores: { ...totals },
      };
    }
    // t === "hand"
    totals[pA] = (totals[pA] ?? 0) + (e.scores[pA] ?? 0);
    totals[pB] = (totals[pB] ?? 0) + (e.scores[pB] ?? 0);

    const aOver = totals[pA]! > state.limit;
    const bOver = totals[pB]! > state.limit;

    if (aOver || bOver) {
      let winner: PlayerId | null;
      if (aOver && bOver) {
        if (totals[pA]! > totals[pB]!) winner = pB;
        else if (totals[pB]! > totals[pA]!) winner = pA;
        else winner = null; // tie
      } else {
        winner = aOver ? pB : pA;
      }
      return {
        finished: true,
        winner,
        scores: { ...totals },
      };
    }
  }

  return {
    finished: false,
    winner: null,
    scores: { ...totals },
  };
}

export const chinchonScorer: Scorer<ChinchonState, ChinchonEvent> = {
  init(_config: GameConfig, players: [PlayerId, PlayerId]): ChinchonState {
    return { players, limit: 101, events: [] };
  },

  apply(state: ChinchonState, event: ChinchonEvent): ChinchonState {
    if (calcResult(state).finished) return state;
    return { ...state, events: [...state.events, event] };
  },

  undo(state: ChinchonState): ChinchonState {
    if (state.events.length === 0) return state;
    return { ...state, events: state.events.slice(0, -1) };
  },

  result: calcResult,
};
