export type PlayerId = string;

export interface GameConfig {
  target?: number;
  [key: string]: unknown;
}

export interface ScorerResult {
  finished: boolean;
  winner: PlayerId | null;
  scores: Record<PlayerId, number>;
  extra?: Record<PlayerId, unknown>;
}

export interface Scorer<S, E> {
  init(config: GameConfig, players: [PlayerId, PlayerId]): S;
  apply(state: S, event: E): S;
  undo(state: S): S;
  result(state: S): ScorerResult;
}
