import type { Card, PlayerView } from "./engine/types.ts";
import { canPlay } from "./engine/playable.ts";

/** Spiegelt engine.isPlayable auf der zensierten PlayerView – gleiche Quelle, gleiche Regel. */
export function isPlayableInView(view: PlayerView, card: Card): boolean {
  return canPlay(view, card);
}
