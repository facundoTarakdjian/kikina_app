"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { createClient } from "@/src/lib/supabase/client";
import type { Scorer, PlayerId, GameConfig, ScorerResult } from "./scorers/types";

// Fase del ciclo de vida de la partida
export type MatchPhase =
  | "loading"       // verificando localStorage + DB
  | "offer_resume"  // hay una partida in_progress — preguntar si retomar
  | "idle"          // sin partida, esperando acción del usuario
  | "playing"       // partida en curso
  | "finished";     // partida terminada

interface LocalMatchData<S> {
  matchId: string;
  state: S;
  savedAt: string; // ISO — para comparar con DB updated_at
}

interface MatchInternalState<S> {
  phase: MatchPhase;
  matchId: string | null;
  gameState: S | null;
}

// _E no se usa directamente en acciones pero mantiene la firma genérica
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type MatchAction<S, _E> =
  | { type: "LOADED_PENDING"; matchId: string; gameState: S }
  | { type: "LOADED_NONE" }
  | { type: "STARTED"; matchId: string; gameState: S }
  | { type: "DISPATCHED"; gameState: S }
  | { type: "FINISHED"; gameState: S }
  | { type: "ABANDONED" };

function matchReducer<S, E>(
  state: MatchInternalState<S>,
  action: MatchAction<S, E>,
): MatchInternalState<S> {
  switch (action.type) {
    case "LOADED_PENDING":
      return { phase: "offer_resume", matchId: action.matchId, gameState: action.gameState };
    case "LOADED_NONE":
      return { phase: "idle", matchId: null, gameState: null };
    case "STARTED":
      return { phase: "playing", matchId: action.matchId, gameState: action.gameState };
    case "DISPATCHED":
      return { ...state, gameState: action.gameState };
    case "FINISHED":
      return { phase: "finished", matchId: state.matchId, gameState: action.gameState };
    case "ABANDONED":
      return { phase: "idle", matchId: null, gameState: null };
    default:
      return state;
  }
}

export interface UseMatchStateReturn<S, E> {
  phase: MatchPhase;
  gameState: S | null;
  result: ScorerResult | null;
  matchId: string | null;
  dispatch: (event: E) => void;
  undo: () => void;
  startNew: () => Promise<void>;
  resume: () => void;
  abandon: () => Promise<void>;
}

export function useMatchState<S, E>(opts: {
  scorer: Scorer<S, E>;
  config: GameConfig;
  players: [PlayerId, PlayerId];
  gameId: string;
  coupleId: string;
  userId: string;
  storageKey: string; // e.g. "truco"
}): UseMatchStateReturn<S, E> {
  const { scorer, config, players, gameId, coupleId, userId, storageKey } = opts;

  const lsKey = `kk:match:${storageKey}`;

  const [internalState, dispatch] = useReducer(
    matchReducer<S, E>,
    { phase: "loading", matchId: null, gameState: null },
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Persistencia ---

  function saveToLocalStorage(matchId: string, gameState: S) {
    const data: LocalMatchData<S> = {
      matchId,
      state: gameState,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(lsKey, JSON.stringify(data));
  }

  function clearLocalStorage() {
    localStorage.removeItem(lsKey);
  }

  async function upsertStateToDB(matchId: string, gameState: S) {
    const supabase = createClient();
    await supabase
      .from("matches")
      .update({ state: gameState as never })
      .eq("id", matchId);
  }

  function scheduleSave(matchId: string, gameState: S) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void upsertStateToDB(matchId, gameState);
    }, 800);
  }

  // --- Efectos ---

  useEffect(() => {
    async function resolveInitialState() {
      // 1. Leer localStorage (sincrónico)
      let localData: LocalMatchData<S> | null = null;
      const raw = localStorage.getItem(lsKey);
      if (raw) {
        try {
          localData = JSON.parse(raw) as LocalMatchData<S>;
        } catch {
          localStorage.removeItem(lsKey);
        }
      }

      // 2. Consultar DB para partida in_progress de esta pareja + juego
      const supabase = createClient();
      const { data: dbMatch } = await supabase
        .from("matches")
        .select("id, state, updated_at")
        .eq("game_id", gameId)
        .eq("couple_id", coupleId)
        .eq("status", "in_progress")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // 3. Decidir qué ofrecer
      if (!localData && !dbMatch) {
        dispatch({ type: "LOADED_NONE" });
        return;
      }

      if (localData && !dbMatch) {
        // Solo en local (la DB todavía no tiene la partida o fue creada en este celu)
        dispatch({ type: "LOADED_PENDING", matchId: localData.matchId, gameState: localData.state });
        return;
      }

      if (!localData && dbMatch) {
        // Solo en DB: otro dispositivo inició la partida
        dispatch({
          type: "LOADED_PENDING",
          matchId: dbMatch.id,
          gameState: dbMatch.state as S,
        });
        return;
      }

      // Ambos existen: comparar timestamps
      if (localData && dbMatch) {
        if (localData.matchId === dbMatch.id) {
          // Misma partida: el local es más nuevo (se guardó antes del debounce)
          dispatch({ type: "LOADED_PENDING", matchId: localData.matchId, gameState: localData.state });
        } else {
          // Partidas distintas: elegir la más nueva por timestamp
          const localTime = new Date(localData.savedAt).getTime();
          const dbTime = new Date(dbMatch.updated_at).getTime();
          if (localTime >= dbTime) {
            // La local es más nueva; la del DB quedó obsoleta → abandonarla silenciosamente
            await supabase
              .from("matches")
              .update({ status: "abandoned" })
              .eq("id", dbMatch.id);
            dispatch({ type: "LOADED_PENDING", matchId: localData.matchId, gameState: localData.state });
          } else {
            // La del DB es más nueva; descartar local
            localStorage.removeItem(lsKey);
            dispatch({
              type: "LOADED_PENDING",
              matchId: dbMatch.id,
              gameState: dbMatch.state as S,
            });
          }
        }
      }
    }

    void resolveInitialState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Limpieza del debounce al desmontar
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // --- Acciones ---

  const startNew = useCallback(async () => {
    clearLocalStorage();
    const supabase = createClient();
    const initialGameState = scorer.init(config, players);

    const { data, error } = await supabase
      .from("matches")
      .insert({
        couple_id: coupleId,
        game_id: gameId,
        created_by: userId,
        state: initialGameState as never,
        status: "in_progress",
      })
      .select("id")
      .single();

    if (error || !data) {
      // Fallback: ID local para no bloquear la experiencia
      const localId = crypto.randomUUID();
      saveToLocalStorage(localId, initialGameState);
      dispatch({ type: "STARTED", matchId: localId, gameState: initialGameState });
      return;
    }

    saveToLocalStorage(data.id, initialGameState);
    dispatch({ type: "STARTED", matchId: data.id, gameState: initialGameState });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scorer, config, players, gameId, coupleId, userId]);

  const resume = useCallback(() => {
    if (
      internalState.phase !== "offer_resume" ||
      !internalState.matchId ||
      !internalState.gameState
    ) return;
    // Si viene de DB (no estaba en localStorage), sincronizar
    const raw = localStorage.getItem(lsKey);
    if (!raw) {
      saveToLocalStorage(internalState.matchId, internalState.gameState);
    }
    dispatch({
      type: "STARTED",
      matchId: internalState.matchId,
      gameState: internalState.gameState,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internalState]);

  const abandon = useCallback(async () => {
    if (internalState.matchId) {
      const supabase = createClient();
      await supabase
        .from("matches")
        .update({ status: "abandoned" })
        .eq("id", internalState.matchId);
    }
    clearLocalStorage();
    dispatch({ type: "ABANDONED" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internalState.matchId]);

  const dispatchEvent = useCallback((event: E) => {
    if (!internalState.gameState || !internalState.matchId) return;

    const newGameState = scorer.apply(internalState.gameState, event);
    const result = scorer.result(newGameState);

    saveToLocalStorage(internalState.matchId, newGameState);
    scheduleSave(internalState.matchId, newGameState);

    if (result.finished) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const matchId = internalState.matchId;
      void (async () => {
        const supabase = createClient();
        await supabase
          .from("matches")
          .update({
            status: "finished",
            winner_id: result.winner,
            finished_at: new Date().toISOString(),
            state: newGameState as never,
          })
          .eq("id", matchId);

        const scoreRows = players.map((p) => ({
          match_id: matchId,
          couple_id: coupleId,
          user_id: p,
          score: result.scores[p] ?? 0,
          extra: {},
        }));
        await supabase.from("match_scores").insert(scoreRows);
        clearLocalStorage();
      })();
      dispatch({ type: "FINISHED", gameState: newGameState });
    } else {
      dispatch({ type: "DISPATCHED", gameState: newGameState });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internalState, scorer, players, coupleId]);

  const undo = useCallback(() => {
    if (!internalState.gameState || !internalState.matchId) return;
    if (internalState.phase === "finished") return;

    const newGameState = scorer.undo(internalState.gameState);
    saveToLocalStorage(internalState.matchId, newGameState);
    scheduleSave(internalState.matchId, newGameState);
    dispatch({ type: "DISPATCHED", gameState: newGameState });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internalState, scorer]);

  const result = internalState.gameState ? scorer.result(internalState.gameState) : null;

  return {
    phase: internalState.phase,
    gameState: internalState.gameState,
    result,
    matchId: internalState.matchId,
    dispatch: dispatchEvent,
    undo,
    startNew,
    resume,
    abandon,
  };
}
