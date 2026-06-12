/**
 * Farbduell Engine – Typen
 *
 * Diese Typen sind die gemeinsame Sprache zwischen UI, Bots und einem
 * späteren Multiplayer-Server. Die Engine kennt kein DOM und keine Timer.
 */

export const COLORS = ["koralle", "gold", "tuerkis", "lila"] as const;
export type Color = (typeof COLORS)[number];

export type Value =
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  | "skip" | "reverse" | "draw2"
  | "wild" | "wild4";

export interface Card {
  id: number;
  /** null bei Wunschkarten */
  color: Color | null;
  value: Value;
}

export interface Rules {
  /** +2 darf mit eigener +2 gekontert werden; Strafstapel wächst */
  stack2: boolean;
  /** statt 1 Karte wird gezogen, bis eine passt */
  drawToMatch: boolean;
}

export interface Player {
  name: string;
  isBot: boolean;
  hand: Card[];
}

export type Phase = "playing" | "drawnDecision" | "finished";

export interface GameState {
  players: Player[];
  drawPile: Card[];
  discard: Card[];
  /** aktuell geforderte Farbe (bei Wunschkarten ≠ Farbe der obersten Karte) */
  color: Color;
  /** 1 = im Uhrzeigersinn, -1 = dagegen */
  dir: 1 | -1;
  /** Index des Spielers am Zug */
  turn: number;
  /** angesammelte Strafkarten (Hausregel stack2) */
  pendingDraw: number;
  phase: Phase;
  /** nur in Phase drawnDecision: id der frisch gezogenen, spielbaren Karte */
  drawnCardId: number | null;
  /** Index des Siegers, sobald phase === finished */
  winner: number | null;
  rules: Rules;
  /** Zustand des deterministischen RNG (mulberry32) */
  rng: number;
  /** Events des letzten reduce()-Aufrufs, für Toasts/Broadcasts */
  events: GameEvent[];
}

/** Aktionen tragen immer den ausführenden Spieler – der Server prüft Identität, die Engine prüft, ob er dran ist. */
export type Action =
  | { type: "play"; player: number; cardId: number; chosenColor?: Color }
  | { type: "draw"; player: number }
  | { type: "playDrawn"; player: number; chosenColor?: Color }
  | { type: "keepDrawn"; player: number };

export type GameEvent =
  | { kind: "played"; player: number; card: Card }
  | { kind: "drew"; player: number; count: number }
  | { kind: "drewPenalty"; player: number; count: number }
  | { kind: "penaltyGrew"; total: number }
  | { kind: "skipped"; player: number }
  | { kind: "reversed"; playAgain: boolean }
  | { kind: "wishedColor"; player: number; color: Color }
  | { kind: "lastCard"; player: number }
  | { kind: "reshuffled" }
  | { kind: "won"; player: number };

/** Sicht eines einzelnen Spielers – fremde Hände sind nur Kartenzahlen. */
export interface PlayerView {
  you: number;
  yourHand: Card[];
  /** in Sitzreihenfolge, inklusive dir selbst (hand = null bei anderen) */
  players: { name: string; isBot: boolean; cardCount: number }[];
  topCard: Card;
  color: Color;
  dir: 1 | -1;
  turn: number;
  phase: Phase;
  pendingDraw: number;
  /** nur gesetzt, wenn DU in drawnDecision steckst */
  drawnCard: Card | null;
  drawPileCount: number;
  winner: number | null;
  rules: Rules;
  events: GameEvent[];
}

export class EngineError extends Error {}
