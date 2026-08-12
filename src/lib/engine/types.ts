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

/**
 * Wie Strafkarten weitergereicht werden dürfen. Ein Modus statt mehrerer
 * Booleans, weil sich die Varianten gegenseitig ausschließen – ungültige
 * Kombinationen sind so gar nicht erst darstellbar.
 *
 * - `off`   – kein Stapeln: das Ziel zieht sofort und setzt aus
 * - `two`   – nur +2 kontert +2; +4 zieht immer sofort
 * - `free`  – +2 und +4 sind frei mischbar, jede kontert jede
 * - `trump` – gleich oder höher: +2 kontert nur reine +2-Stapel,
 *             +4 kontert alles. Nach einem +4 ist die +2 raus.
 */
export type StackMode = "off" | "two" | "free" | "trump";

export const STACK_MODES = ["off", "two", "free", "trump"] as const;

/** Welche Kartenart den Strafstapel zuletzt bedient hat (für `trump`). */
export type DrawKind = "none" | "draw2" | "wild4";

export interface Rules {
  /** Umgang mit +2/+4-Strafstapeln */
  stackMode: StackMode;
  /** statt 1 Karte wird gezogen, bis eine passt */
  drawToMatch: boolean;
  /** nach einer 0 muss der Nächste eine 0 legen – sonst zieht er eine Karte */
  zeroChain: boolean;
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
  /** angesammelte Strafkarten (abhängig von rules.stackMode) */
  pendingDraw: number;
  /**
   * Höchste Kartenart im offenen Strafstapel. Nur `pendingDraw` würde nicht
   * reichen: 6 kann +2→+4 oder +4→+2 sein, und im Modus `trump` darf nur im
   * zweiten Fall noch eine +2 folgen.
   */
  pendingDrawKind: DrawKind;
  /** offene Null-Forderung (Hausregel zeroChain): der Zugspieler muss eine 0 legen */
  pendingZero: boolean;
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
  | { kind: "zeroDemanded"; player: number }
  | { kind: "zeroMissed"; player: number }
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
  /** höchste Kartenart im offenen Strafstapel (relevant im Modus `trump`) */
  pendingDrawKind: DrawKind;
  /** offene Null-Forderung an den Spieler am Zug */
  pendingZero: boolean;
  /** nur gesetzt, wenn DU in drawnDecision steckst */
  drawnCard: Card | null;
  drawPileCount: number;
  winner: number | null;
  rules: Rules;
  events: GameEvent[];
}

/**
 * Stabile Kennungen für Regelverstöße. Die Engine bleibt sprachfrei – sie
 * kennt keine Übersetzungen, weil sie später auch auf einem Server läuft,
 * der nicht weiß, welche Sprache ein Client eingestellt hat. Die UI bildet
 * den Code auf einen übersetzten Text ab; die Message der Exception bleibt
 * ein englischer Entwicklertext für Logs und Stacktraces.
 */
export const ENGINE_ERROR_CODES = [
  "playerCount",
  "roundOver",
  "notYourTurn",
  "wildNeedsColor",
  "decideDrawnFirst",
  "cardNotInHand",
  "cardDoesNotFit",
  "mustPlayZero",
  "noDrawnCard",
  "drawnCardMissing",
] as const;

export type EngineErrorCode = (typeof ENGINE_ERROR_CODES)[number];

export class EngineError extends Error {
  // Als normales Feld statt Parameter-Property: Node fuehrt die Tests im
  // strip-only-Modus aus, der keinen Code erzeugen darf.
  readonly code: EngineErrorCode;

  constructor(code: EngineErrorCode, message: string) {
    super(message);
    this.name = "EngineError";
    this.code = code;
  }
}
