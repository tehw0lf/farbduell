/**
 * Farbduell Engine – reiner Reducer.
 *
 * reduce(state, action) -> neuer State. Keine Seiteneffekte, kein DOM,
 * keine Timer, deterministischer RNG im State. Dadurch läuft exakt
 * derselbe Code lokal im Browser (LocalAdapter) und später autoritativ
 * auf einem Multiplayer-Server.
 */

import type {
  Action, Card, Color, GameEvent, GameState, Rules,
} from "./types.ts";
import { EngineError } from "./types.ts";
import { buildDeck, shuffle } from "./deck.ts";

export interface CreateGameOptions {
  /** Spielernamen in Sitzreihenfolge; isBot parallel dazu */
  names: string[];
  bots: boolean[];
  rules: Rules;
  /** ohne Seed wird einer aus Date.now() gebildet */
  seed?: number;
}

const HAND_SIZE = 7;

export function createGame(opts: CreateGameOptions): GameState {
  if (opts.names.length < 2 || opts.names.length > 10) {
    throw new EngineError("2 bis 10 Spieler");
  }
  let rng = (opts.seed ?? (Date.now() ^ (Math.random() * 0xffffffff))) | 0;

  const drawPile = buildDeck();
  rng = shuffle(drawPile, rng);

  const players = opts.names.map((name, i) => ({
    name,
    isBot: opts.bots[i] ?? false,
    hand: [] as Card[],
  }));
  for (let r = 0; r < HAND_SIZE; r++) {
    for (const p of players) p.hand.push(drawPile.pop()!);
  }

  // Erste Ablagekarte: nur Zahlenkarten (vermeidet Start-Sonderfälle)
  let first = drawPile.pop()!;
  while (Number.isNaN(Number(first.value))) {
    drawPile.unshift(first);
    first = drawPile.pop()!;
  }

  return {
    players,
    drawPile,
    discard: [first],
    color: first.color!,
    dir: 1,
    turn: 0,
    pendingDraw: 0,
    phase: "playing",
    drawnCardId: null,
    winner: null,
    rules: { ...opts.rules },
    rng,
    events: [],
  };
}

/* ---------- Abfragen (auch für UI/Bots nützlich) ---------- */

export function topCard(s: GameState): Card {
  return s.discard[s.discard.length - 1];
}

export function isPlayable(s: GameState, card: Card): boolean {
  if (s.pendingDraw > 0) return card.value === "draw2"; // nur Kontern
  if (card.value === "wild" || card.value === "wild4") return true;
  return card.color === s.color || card.value === topCard(s).value;
}

export function nextIdx(s: GameState, from: number, steps: number): number {
  const n = s.players.length;
  return (((from + s.dir * steps) % n) + n) % n;
}

/* ---------- interne Helfer (arbeiten auf dem Klon) ---------- */

function refill(s: GameState) {
  if (s.drawPile.length > 0) return;
  if (s.discard.length <= 1) return; // nichts zum Mischen übrig
  const top = s.discard.pop()!;
  s.drawPile = s.discard;
  s.discard = [top];
  s.rng = shuffle(s.drawPile, s.rng);
  s.events.push({ kind: "reshuffled" });
}

function drawOne(s: GameState, player: number): Card | null {
  refill(s);
  const card = s.drawPile.pop();
  if (!card) return null;
  s.players[player].hand.push(card);
  return card;
}

function drawMany(s: GameState, player: number, n: number): number {
  let drawn = 0;
  for (let i = 0; i < n; i++) {
    if (!drawOne(s, player)) break;
    drawn++;
  }
  return drawn;
}

function applyCard(s: GameState, player: number, card: Card, chosenColor?: Color) {
  const p = s.players[player];
  p.hand = p.hand.filter((c) => c.id !== card.id);
  s.discard.push(card);
  s.color = card.color ?? chosenColor!;
  s.events.push({ kind: "played", player, card });

  let skips = 1; // normal: der Nächste ist dran

  switch (card.value) {
    case "reverse": {
      s.dir = s.dir === 1 ? -1 : 1;
      const playAgain = s.players.length === 2; // 2-Spieler-Regel: wirkt wie Aussetzen
      if (playAgain) skips = 2;
      s.events.push({ kind: "reversed", playAgain });
      break;
    }
    case "skip": {
      s.events.push({ kind: "skipped", player: nextIdx(s, player, 1) });
      skips = 2;
      break;
    }
    case "draw2": {
      if (s.rules.stack2) {
        s.pendingDraw += 2;
        s.events.push({ kind: "penaltyGrew", total: s.pendingDraw });
        skips = 1; // der Nächste darf kontern
      } else {
        const target = nextIdx(s, player, 1);
        const n = drawMany(s, target, 2);
        s.events.push({ kind: "drewPenalty", player: target, count: n });
        skips = 2;
      }
      break;
    }
    case "wild4": {
      const target = nextIdx(s, player, 1);
      const n = drawMany(s, target, 4);
      s.events.push({ kind: "drewPenalty", player: target, count: n });
      s.events.push({ kind: "wishedColor", player, color: s.color });
      skips = 2;
      break;
    }
    case "wild": {
      s.events.push({ kind: "wishedColor", player, color: s.color });
      break;
    }
  }

  if (p.hand.length === 1) s.events.push({ kind: "lastCard", player });
  if (p.hand.length === 0) {
    s.phase = "finished";
    s.winner = player;
    s.events.push({ kind: "won", player });
    return;
  }
  s.turn = nextIdx(s, player, skips);
}

/* ---------- Validierung ---------- */

function assertTurn(s: GameState, action: Action) {
  if (s.phase === "finished") throw new EngineError("Die Runde ist vorbei.");
  if (action.player !== s.turn) throw new EngineError("Nicht dein Zug.");
}

function assertChosenColor(card: Card, chosenColor?: Color) {
  if (card.color === null && !chosenColor) {
    throw new EngineError("Wunschkarte braucht eine Farbwahl.");
  }
}

/* ---------- Reducer ---------- */

export function reduce(state: GameState, action: Action): GameState {
  const s: GameState = structuredClone(state);
  s.events = [];

  switch (action.type) {
    case "play": {
      assertTurn(s, action);
      if (s.phase !== "playing") throw new EngineError("Erst über die gezogene Karte entscheiden.");
      const card = s.players[action.player].hand.find((c) => c.id === action.cardId);
      if (!card) throw new EngineError("Karte nicht auf der Hand.");
      if (!isPlayable(s, card)) throw new EngineError("Karte passt nicht.");
      assertChosenColor(card, action.chosenColor);
      applyCard(s, action.player, card, action.chosenColor);
      return s;
    }

    case "draw": {
      assertTurn(s, action);
      if (s.phase !== "playing") throw new EngineError("Erst über die gezogene Karte entscheiden.");

      // Strafstapel schlucken
      if (s.pendingDraw > 0) {
        const n = drawMany(s, action.player, s.pendingDraw);
        s.pendingDraw = 0;
        s.events.push({ kind: "drewPenalty", player: action.player, count: n });
        s.turn = nextIdx(s, action.player, 1);
        return s;
      }

      let drawn: Card | null = null;
      let count = 0;
      if (s.rules.drawToMatch) {
        // ziehen, bis es passt (Kappe schützt vor leeren Stapeln)
        while (count < 60) {
          drawn = drawOne(s, action.player);
          if (!drawn) break;
          count++;
          if (isPlayable(s, drawn)) break;
        }
      } else {
        drawn = drawOne(s, action.player);
        count = drawn ? 1 : 0;
      }
      s.events.push({ kind: "drew", player: action.player, count });

      if (drawn && isPlayable(s, drawn)) {
        s.phase = "drawnDecision";
        s.drawnCardId = drawn.id;
      } else {
        s.turn = nextIdx(s, action.player, 1);
      }
      return s;
    }

    case "playDrawn": {
      assertTurn(s, action);
      if (s.phase !== "drawnDecision") throw new EngineError("Keine gezogene Karte offen.");
      const card = s.players[action.player].hand.find((c) => c.id === s.drawnCardId);
      if (!card) throw new EngineError("Gezogene Karte nicht gefunden.");
      assertChosenColor(card, action.chosenColor);
      s.phase = "playing";
      s.drawnCardId = null;
      applyCard(s, action.player, card, action.chosenColor);
      return s;
    }

    case "keepDrawn": {
      assertTurn(s, action);
      if (s.phase !== "drawnDecision") throw new EngineError("Keine gezogene Karte offen.");
      s.phase = "playing";
      s.drawnCardId = null;
      s.turn = nextIdx(s, action.player, 1);
      return s;
    }
  }
}
