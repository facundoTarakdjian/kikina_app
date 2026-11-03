import type { Scorer, PlayerId, GameConfig, ScorerResult } from "./types";

export interface WinEvent {
  t: "win";
  player: PlayerId;
}

export interface WinnerOnlyState {
  players: [PlayerId, PlayerId];
  events: WinEvent[]; // 0 or 1 element
}

export const winnerOnlyScorer: Scorer<WinnerOnlyState, WinEvent> = {
  init(_config: GameConfig, players: [PlayerId, PlayerId]): WinnerOnlyState {
    return { players, events: [] };
  },

  apply(state: WinnerOnlyState, event: WinEvent): WinnerOnlyState {
    // Reject if already finished
    if (state.events.length > 0) return state;
    return { ...state, events: [event] };
  },

  undo(state: WinnerOnlyState): WinnerOnlyState {
    if (state.events.length === 0) return state;
    return { ...state, events: [] };
  },

  result(state: WinnerOnlyState): ScorerResult {
    const finished = state.events.length > 0;
    const winner = finished ? state.events[0]!.player : null;
    const scores: Record<PlayerId, number> = {
      [state.players[0]]: 0,
      [state.players[1]]: 0,
    };
    return { finished, winner, scores };
  },
};
