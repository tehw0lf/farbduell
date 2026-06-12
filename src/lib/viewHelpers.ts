import type { Card, PlayerView } from "./engine/types.ts";

/** Spiegelt engine.isPlayable auf der zensierten PlayerView. */
export function isPlayableInView(view: PlayerView, card: Card): boolean {
  if (view.pendingDraw > 0) return card.value === "draw2";
  if (card.value === "wild" || card.value === "wild4") return true;
  return card.color === view.color || card.value === view.topCard.value;
}
