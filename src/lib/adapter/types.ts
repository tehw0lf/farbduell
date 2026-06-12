import type { Action, PlayerView, Rules } from "../engine/types.ts";

/** Each Action variant with the "player" field removed. */
export type DispatchAction =
  | { type: "play"; cardId: number; chosenColor?: import("../engine/types.ts").Color }
  | { type: "draw" }
  | { type: "playDrawn"; chosenColor?: import("../engine/types.ts").Color }
  | { type: "keepDrawn" };

/**
 * Die UI spricht ausschließlich mit diesem Interface. Heute steckt dahinter
 * der LocalAdapter (Engine + Bots im Browser); ein späterer RemoteAdapter
 * implementiert dasselbe Interface über WebSocket gegen einen Server, der
 * dieselbe Engine autoritativ ausführt. Die UI bleibt dabei unverändert.
 */
export interface GameAdapter {
  /** liefert bei jedem Zustandswechsel die Sicht des lokalen Spielers */
  subscribe(cb: (view: PlayerView) => void): () => void;
  /** schickt eine Aktion des lokalen Spielers; Fehler landen in onError */
  dispatch(action: DispatchAction): void;
  /** startet eine neue Runde */
  newGame(opts: NewGameOptions): void;
  /** Regeln zur Laufzeit ändern (gelten ab sofort) */
  setRules(rules: Rules): void;
  /** Aufräumen (Timer, Sockets) */
  destroy(): void;
  onError?: (message: string) => void;
}

export interface NewGameOptions {
  botCount: number;
  rules: Rules;
  lang: import("../i18n.ts").Lang;
}
