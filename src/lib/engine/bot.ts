import type { Action, Card, Color, PlayerView } from "./types.ts";
import { COLORS } from "./types.ts";

/**
 * Wählt den nächsten Zug eines Bots – ausschließlich auf Basis seiner
 * PlayerView. Der Bot sieht also exakt das, was ein menschlicher Spieler
 * sähe, und kann damit lokal wie auf einem Server laufen.
 */
export function chooseBotAction(view: PlayerView, rand: () => number = Math.random): Action {
  const me = view.you;

  // Offene Entscheidung über frisch gezogene Karte: passende Karte legen wir
  if (view.phase === "drawnDecision") {
    const card = view.drawnCard!;
    return {
      type: "playDrawn",
      player: me,
      chosenColor: card.color === null ? pickColor(view.yourHand, rand) : undefined,
    };
  }

  const playable = view.yourHand.filter((c) => isPlayableInView(view, c));

  // Strafstapel: kontern, wenn möglich – sonst ziehen
  if (view.pendingDraw > 0) {
    const counter = playable[0];
    return counter
      ? { type: "play", player: me, cardId: counter.id }
      : { type: "draw", player: me };
  }

  if (playable.length === 0) return { type: "draw", player: me };

  const nonWild = playable.filter((c) => c.value !== "wild" && c.value !== "wild4");
  const nextPlayer = view.players[mod(me + view.dir, view.players.length)];
  const actions = nonWild.filter((c) => ["skip", "reverse", "draw2"].includes(c.value));

  let card: Card;
  if (nonWild.length === 0) {
    card = pick(playable, rand);
  } else if (nextPlayer.cardCount <= 2 && actions.length > 0) {
    // dem fast fertigen Nachbarn in die Suppe spucken
    card = pick(actions, rand);
  } else {
    card = pick(nonWild, rand);
  }

  return {
    type: "play",
    player: me,
    cardId: card.id,
    chosenColor: card.color === null ? pickColor(view.yourHand, rand) : undefined,
  };
}

/* ---------- Helfer ---------- */

function isPlayableInView(view: PlayerView, card: Card): boolean {
  if (view.pendingDraw > 0) return card.value === "draw2";
  if (card.value === "wild" || card.value === "wild4") return true;
  return card.color === view.color || card.value === view.topCard.value;
}

function pickColor(hand: Card[], rand: () => number): Color {
  const count: Record<Color, number> = { koralle: 0, gold: 0, tuerkis: 0, lila: 0 };
  for (const c of hand) if (c.color) count[c.color]++;
  let best: Color = COLORS[Math.floor(rand() * COLORS.length)];
  let max = -1;
  for (const c of COLORS) {
    if (count[c] > max) { max = count[c]; best = c; }
  }
  return best;
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}
