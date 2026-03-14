import { create } from "zustand";

export type GamePhase = "idle" | "playing" | "input" | "success" | "fail";

interface GameState {
  phase: GamePhase;
  /** Triggers a play request from layout → game page */
  playRequested: number; // incremented to signal play
  /** Triggers a hint (replay) request */
  hintRequested: number;

  setPhase: (phase: GamePhase) => void;
  requestPlay: () => void;
  requestHint: () => void;
  reset: () => void;
}

export const useGameStore = create<GameState>()((set) => ({
  phase: "idle",
  playRequested: 0,
  hintRequested: 0,

  setPhase: (phase) => set({ phase }),
  requestPlay: () => set((s) => ({ playRequested: s.playRequested + 1 })),
  requestHint: () => set((s) => ({ hintRequested: s.hintRequested + 1 })),
  reset: () => set({ phase: "idle", playRequested: 0, hintRequested: 0 }),
}));
