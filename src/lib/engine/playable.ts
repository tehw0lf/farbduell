import type { Card, Color, DrawKind, Rules } from "./types.ts";

/**
 * Die kleinste gemeinsame Teilmenge von GameState und PlayerView, die für die
 * Frage „darf diese Karte gelegt werden?" nötig ist. Dadurch existiert die
 * Regel genau einmal – Engine, Bot und UI leiten sie aus derselben Funktion ab
 * und können nicht auseinanderdriften.
 */
export interface PlayContext {
  topCard: Card;
  color: Color;
  pendingDraw: number;
  pendingDrawKind: DrawKind;
  pendingZero: boolean;
  rules: Rules;
}

/** Darf `card` einen laufenden Strafstapel weiterreichen? */
function counters(rules: Rules, kind: DrawKind, card: Card): boolean {
  const isDraw2 = card.value === "draw2";
  const isWild4 = card.value === "wild4";
  if (!isDraw2 && !isWild4) return false;

  switch (rules.stackMode) {
    case "off":
      return false;
    case "two":
      // Nur die +2-Kette existiert; +4 landet nie auf dem Stapel.
      return isDraw2;
    case "free":
      return true;
    case "trump":
      // Gleich oder höher: +4 kontert immer, +2 nur solange kein +4 liegt.
      return isWild4 || kind !== "wild4";
  }
}

/** Kann diese Kartenart im aktuellen Modus überhaupt einen Stapel eröffnen? */
export function stacks(rules: Rules, value: Card["value"]): boolean {
  if (value === "draw2") return rules.stackMode !== "off";
  if (value === "wild4") return rules.stackMode === "free" || rules.stackMode === "trump";
  return false;
}

export function canPlay(ctx: PlayContext, card: Card): boolean {
  // Offener Strafstapel: nur kontern oder schlucken.
  if (ctx.pendingDraw > 0) return counters(ctx.rules, ctx.pendingDrawKind, card);

  // Offene Null-Forderung: nur eine 0 erfüllt sie.
  if (ctx.pendingZero) return card.value === "0";

  if (card.value === "wild" || card.value === "wild4") return true;
  return card.color === ctx.color || card.value === ctx.topCard.value;
}
