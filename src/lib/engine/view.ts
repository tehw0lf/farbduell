import type { GameState, PlayerView } from "./types.ts";
import { topCard } from "./engine.ts";

/**
 * Erzeugt die Sicht EINES Spielers auf das Spiel. Fremde Hände sind nur
 * Kartenzahlen – das ist zugleich der Anti-Cheat-Mechanismus für später:
 * Ein Multiplayer-Server schickt jedem Client ausschließlich playerView(s, i).
 */
export function playerView(s: GameState, you: number): PlayerView {
  const me = s.players[you];
  return {
    you,
    yourHand: structuredClone(me.hand),
    players: s.players.map((p) => ({
      name: p.name,
      isBot: p.isBot,
      cardCount: p.hand.length,
    })),
    topCard: structuredClone(topCard(s)),
    color: s.color,
    dir: s.dir,
    turn: s.turn,
    phase: s.phase,
    pendingDraw: s.pendingDraw,
    drawnCard:
      s.phase === "drawnDecision" && s.turn === you
        ? structuredClone(me.hand.find((c) => c.id === s.drawnCardId) ?? null)
        : null,
    drawPileCount: s.drawPile.length,
    winner: s.winner,
    rules: { ...s.rules },
    events: structuredClone(s.events),
  };
}
