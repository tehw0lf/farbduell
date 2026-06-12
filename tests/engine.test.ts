/**
 * Engine-Tests – laufen ohne Abhängigkeiten direkt mit Node:
 *   npm test   (node --experimental-strip-types --test)
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { buildDeck } from "../src/lib/engine/deck.ts";
import {
  createGame, reduce, isPlayable, topCard,
} from "../src/lib/engine/engine.ts";
import { playerView } from "../src/lib/engine/view.ts";
import { chooseBotAction } from "../src/lib/engine/bot.ts";
import type { GameState, Rules } from "../src/lib/engine/types.ts";
import { EngineError } from "../src/lib/engine/types.ts";

const NO_RULES: Rules = { stack2: false, drawToMatch: false };

function game(n: number, rules: Rules = NO_RULES, seed = 42): GameState {
  return createGame({
    names: ["Du", "Mira", "Jonas", "Pia"].slice(0, n),
    bots: [false, true, true, true].slice(0, n),
    rules,
    seed,
  });
}

/** mulberry32 als Funktion für deterministische Bot-Entscheidungen */
function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let x = s;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function totalCards(s: GameState): number {
  return s.drawPile.length + s.discard.length +
    s.players.reduce((a, p) => a + p.hand.length, 0);
}

/** Spielt eine Partie komplett mit Bots durch (alle Spieler werden vom Bot gesteuert). */
function simulate(s: GameState, rand: () => number): GameState {
  let guard = 0;
  while (s.phase !== "finished" && guard++ < 10000) {
    const view = playerView(s, s.turn);
    const action = chooseBotAction(view, rand);
    s = reduce(s, action);
    assert.equal(totalCards(s), 108, "Kartenzahl-Invariante verletzt");
  }
  assert.equal(s.phase, "finished", "Partie endete nicht");
  return s;
}

/* ---------- Grundlagen ---------- */

test("Deck hat 108 Karten mit korrekter Verteilung", () => {
  const deck = buildDeck();
  assert.equal(deck.length, 108);
  assert.equal(deck.filter((c) => c.value === "wild").length, 4);
  assert.equal(deck.filter((c) => c.value === "wild4").length, 4);
  assert.equal(deck.filter((c) => c.value === "0").length, 4);
  assert.equal(deck.filter((c) => c.value === "draw2").length, 8);
  // ids eindeutig
  assert.equal(new Set(deck.map((c) => c.id)).size, 108);
});

test("createGame: 7 Karten pro Hand, Zahlenkarte als Start, Farbe gesetzt", () => {
  const s = game(4);
  for (const p of s.players) assert.equal(p.hand.length, 7);
  assert.ok(!Number.isNaN(Number(topCard(s).value)));
  assert.equal(s.color, topCard(s).color);
  assert.equal(totalCards(s), 108);
});

test("gleicher Seed ⇒ identisches Spiel (Determinismus)", () => {
  const a = game(4, NO_RULES, 1234);
  const b = game(4, NO_RULES, 1234);
  assert.deepEqual(a.players, b.players);
  assert.deepEqual(a.drawPile, b.drawPile);
});

/* ---------- Regeln ---------- */

test("isPlayable: Farbe, Wert, Wunschkarten", () => {
  const s = game(4);
  const t = topCard(s);
  const other = (["koralle", "gold", "tuerkis", "lila"] as const).find((c) => c !== t.color)!;
  assert.ok(isPlayable(s, { id: 900, color: t.color, value: "5" }));
  assert.ok(isPlayable(s, { id: 901, color: other, value: t.value }));
  assert.ok(isPlayable(s, { id: 902, color: null, value: "wild" }));
  assert.ok(!isPlayable(s, { id: 903, color: other, value: t.value === "9" ? "8" : "9" }));
});

test("ungültige Aktionen werfen EngineError", () => {
  const s = game(4);
  assert.throws(() => reduce(s, { type: "play", player: 1, cardId: 1 }), EngineError);
  assert.throws(() => reduce(s, { type: "keepDrawn", player: 0 }), EngineError);
  assert.throws(() => reduce(s, { type: "play", player: 0, cardId: -1 }), EngineError);
});

test("Wunschkarte ohne Farbwahl wird abgelehnt", () => {
  let s = game(4);
  s.players[0].hand.push({ id: 950, color: null, value: "wild" });
  assert.throws(() => reduce(s, { type: "play", player: 0, cardId: 950 }), EngineError);
  s = reduce(s, { type: "play", player: 0, cardId: 950, chosenColor: "gold" });
  assert.equal(s.color, "gold");
});

test("Reverse: bei 2 Spielern wie Aussetzen, bei 4 normal", () => {
  // 4 Spieler
  let s = game(4);
  const t = topCard(s);
  s.players[0].hand.push({ id: 960, color: t.color, value: "reverse" });
  s = reduce(s, { type: "play", player: 0, cardId: 960 });
  assert.equal(s.turn, 3, "bei 4 Spielern muss der Vorgänger dran sein");

  // 2 Spieler
  let s2 = game(2);
  const t2 = topCard(s2);
  s2.players[0].hand.push({ id: 961, color: t2.color, value: "reverse" });
  s2.players[0].hand.push({ id: 962, color: t2.color, value: "1" }); // kein Sieg
  s2 = reduce(s2, { type: "play", player: 0, cardId: 961 });
  assert.equal(s2.turn, 0, "bei 2 Spielern muss derselbe Spieler nochmal dran sein");
});

test("+2 ohne Stapel-Regel: Ziel zieht 2 und wird übersprungen", () => {
  let s = game(4);
  const t = topCard(s);
  s.players[0].hand.push({ id: 970, color: t.color, value: "draw2" });
  const before = s.players[1].hand.length;
  s = reduce(s, { type: "play", player: 0, cardId: 970 });
  assert.equal(s.players[1].hand.length, before + 2);
  assert.equal(s.turn, 2);
  assert.equal(s.pendingDraw, 0);
});

test("+2 mit Stapel-Regel: Strafstapel wächst, Konter nur mit +2", () => {
  let s = game(4, { stack2: true, drawToMatch: false });
  const t = topCard(s);
  s.players[0].hand.push({ id: 980, color: t.color, value: "draw2" });
  s = reduce(s, { type: "play", player: 0, cardId: 980 });
  assert.equal(s.pendingDraw, 2);
  assert.equal(s.turn, 1, "Konter-Chance: kein Überspringen");
  assert.ok(isPlayable(s, { id: 981, color: "gold", value: "draw2" }), "beliebige +2 kontert");
  assert.ok(!isPlayable(s, { id: 982, color: s.color, value: "5" }));
  assert.ok(!isPlayable(s, { id: 983, color: null, value: "wild4" }));

  // Spieler 1 kontert → 4; Spieler 2 schluckt
  s.players[1].hand.push({ id: 984, color: "gold", value: "draw2" });
  s = reduce(s, { type: "play", player: 1, cardId: 984 });
  assert.equal(s.pendingDraw, 4);
  const before = s.players[2].hand.length;
  s = reduce(s, { type: "draw", player: 2 });
  assert.equal(s.players[2].hand.length, before + 4);
  assert.equal(s.pendingDraw, 0);
  assert.equal(s.turn, 3);
});

test("Ziehen: passende Karte eröffnet drawnDecision, behalten gibt Zug ab", () => {
  let s = game(4, NO_RULES, 7);
  // Hand leeren bis nichts passt, dann passende Karte oben auf den Stapel legen
  s.players[0].hand = [];
  const t = topCard(s);
  const fitting = { id: 990, color: t.color, value: "7" as const };
  s.drawPile.push(fitting);
  s = reduce(s, { type: "draw", player: 0 });
  assert.equal(s.phase, "drawnDecision");
  assert.equal(s.drawnCardId, 990);
  // behalten
  s = reduce(s, { type: "keepDrawn", player: 0 });
  assert.equal(s.phase, "playing");
  assert.equal(s.turn, 1);
  assert.ok(s.players[0].hand.some((c) => c.id === 990));
});

test("Sieg: letzte Karte beendet die Runde", () => {
  let s = game(4);
  const t = topCard(s);
  s.players[0].hand = [{ id: 995, color: t.color, value: "3" }];
  s = reduce(s, { type: "play", player: 0, cardId: 995 });
  assert.equal(s.phase, "finished");
  assert.equal(s.winner, 0);
});

/* ---------- Sichtbarkeit / Anti-Cheat ---------- */

test("playerView verbirgt fremde Hände vollständig", () => {
  const s = game(4);
  const v = playerView(s, 0);
  assert.equal(v.yourHand.length, 7);
  assert.ok(!("hand" in v.players[1]));
  assert.equal(v.players[2].cardCount, 7);
  const json = JSON.stringify(v);
  // keine fremde Karten-id darf in der View auftauchen
  for (const c of s.players[1].hand) {
    assert.ok(!json.includes(`"id":${c.id},`) || s.players[0].hand.some(m => m.id === c.id) || topCard(s).id === c.id,
      "fremde Karte sichtbar: " + c.id);
  }
});

/* ---------- Massensimulation ---------- */

test("1000 Partien, alle Regelkombinationen, 2–4 Spieler: terminieren + Invariante", () => {
  const ruleSets: Rules[] = [
    { stack2: false, drawToMatch: false },
    { stack2: true,  drawToMatch: false },
    { stack2: false, drawToMatch: true },
    { stack2: true,  drawToMatch: true },
  ];
  let n = 0;
  for (const rules of ruleSets) {
    for (const players of [2, 3, 4]) {
      for (let seed = 1; seed <= 84; seed++) {
        const rand = seededRand(seed * 7919 + players);
        const end = simulate(game(players, rules, seed), rand);
        assert.ok(end.winner !== null && end.winner >= 0 && end.winner < players);
        n++;
      }
    }
  }
  assert.ok(n >= 1000, `nur ${n} Partien simuliert`);
});
