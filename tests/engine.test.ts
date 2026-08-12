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
import { EngineError, STACK_MODES } from "../src/lib/engine/types.ts";

const NO_RULES: Rules = {
  stackMode: "off", drawToMatch: false, zeroChain: false,
};

/** NO_RULES mit gezielten Abweichungen – hält die Tests lesbar. */
function rules(over: Partial<Rules> = {}): Rules {
  return { ...NO_RULES, ...over };
}

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
    // Rang und Höhe des Strafstapels müssen immer zusammenpassen
    assert.equal(
      s.pendingDraw === 0,
      s.pendingDrawKind === "none",
      "pendingDrawKind passt nicht zu pendingDraw",
    );
  }
  assert.equal(s.phase, "finished", "Partie endete nicht");
  // Nach Spielende darf keine Forderung offen sein – sie koennte niemand mehr erfuellen
  assert.equal(s.pendingZero, false, "offene Null-Forderung nach Spielende");
  assert.equal(s.pendingDraw, 0, "offener Strafstapel nach Spielende");
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

test("off: +2 lässt das Ziel sofort 2 ziehen und aussetzen", () => {
  let s = game(4);
  const t = topCard(s);
  s.players[0].hand.push({ id: 970, color: t.color, value: "draw2" });
  const before = s.players[1].hand.length;
  s = reduce(s, { type: "play", player: 0, cardId: 970 });
  assert.equal(s.players[1].hand.length, before + 2);
  assert.equal(s.turn, 2);
  assert.equal(s.pendingDraw, 0);
});

test("two: Strafstapel wächst, Konter nur mit +2", () => {
  let s = game(4, rules({ stackMode: "two" }));
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

/* ---------- +4 stapeln ---------- */

test("off: +4 lässt das Ziel sofort 4 ziehen und aussetzen", () => {
  let s = game(4);
  s.players[0].hand.push({ id: 700, color: null, value: "wild4" });
  const before = s.players[1].hand.length;
  s = reduce(s, { type: "play", player: 0, cardId: 700, chosenColor: "gold" });
  assert.equal(s.players[1].hand.length, before + 4);
  assert.equal(s.pendingDraw, 0);
  assert.equal(s.turn, 2);
  assert.equal(s.color, "gold");
});

test("trump: +4 eröffnet den Strafstapel, Konter-Chance bleibt", () => {
  let s = game(4, rules({ stackMode: "trump" }));
  s.players[0].hand.push({ id: 701, color: null, value: "wild4" });
  const before = s.players[1].hand.length;
  s = reduce(s, { type: "play", player: 0, cardId: 701, chosenColor: "lila" });
  assert.equal(s.pendingDraw, 4);
  assert.equal(s.players[1].hand.length, before, "noch wird nicht gezogen");
  assert.equal(s.turn, 1, "Konter-Chance: kein Überspringen");
  assert.equal(s.color, "lila", "Farbwunsch gilt trotz Strafstapel");
});

test("frei mischbar: +2 kontert +4 und umgekehrt, Stapel summiert sich", () => {
  let s = game(4, rules({ stackMode: "free" }));
  const t = topCard(s);

  // Spieler 0 legt +2 → Stapel 2
  s.players[0].hand.push({ id: 710, color: t.color, value: "draw2" });
  s = reduce(s, { type: "play", player: 0, cardId: 710 });
  assert.equal(s.pendingDraw, 2);

  // Spieler 1 kontert mit +4 → Stapel 6
  assert.ok(isPlayable(s, { id: 711, color: null, value: "wild4" }), "+4 kontert +2");
  s.players[1].hand.push({ id: 711, color: null, value: "wild4" });
  s = reduce(s, { type: "play", player: 1, cardId: 711, chosenColor: "gold" });
  assert.equal(s.pendingDraw, 6);

  // Spieler 2 kontert mit +2 → Stapel 8
  assert.ok(isPlayable(s, { id: 712, color: "koralle", value: "draw2" }), "+2 kontert +4");
  s.players[2].hand.push({ id: 712, color: "koralle", value: "draw2" });
  s = reduce(s, { type: "play", player: 2, cardId: 712 });
  assert.equal(s.pendingDraw, 8);

  // Spieler 3 schluckt alles
  const before = s.players[3].hand.length;
  s = reduce(s, { type: "draw", player: 3 });
  assert.equal(s.players[3].hand.length, before + 8);
  assert.equal(s.pendingDraw, 0);
  assert.equal(s.turn, 0);
});

/* ---------- Modus "trump": gleich oder höher ---------- */

test("trump: nach einem +4 ist die +2 raus", () => {
  let s = game(4, rules({ stackMode: "trump" }));
  s.players[0].hand.push({ id: 720, color: null, value: "wild4" });
  s = reduce(s, { type: "play", player: 0, cardId: 720, chosenColor: "gold" });
  assert.equal(s.pendingDrawKind, "wild4");
  assert.ok(isPlayable(s, { id: 721, color: null, value: "wild4" }), "+4 kontert +4");
  assert.ok(!isPlayable(s, { id: 722, color: "gold", value: "draw2" }), "+2 ist hier kein Konter");
});

test("trump: +2 kontert +2, bis ein +4 die Kette sperrt", () => {
  let s = game(4, rules({ stackMode: "trump" }));
  const t = topCard(s);

  // Reine +2-Kette: +2 darf weiterreichen
  s.players[0].hand.push({ id: 730, color: t.color, value: "draw2" });
  s = reduce(s, { type: "play", player: 0, cardId: 730 });
  assert.equal(s.pendingDraw, 2);
  assert.equal(s.pendingDrawKind, "draw2");
  assert.ok(isPlayable(s, { id: 731, color: "gold", value: "draw2" }), "+2 kontert +2");

  s.players[1].hand.push({ id: 732, color: "gold", value: "draw2" });
  s = reduce(s, { type: "play", player: 1, cardId: 732 });
  assert.equal(s.pendingDraw, 4);
  assert.equal(s.pendingDrawKind, "draw2");

  // Spieler 2 hebt mit +4 – ab jetzt ist die +2 gesperrt
  s.players[2].hand.push({ id: 733, color: null, value: "wild4" });
  s = reduce(s, { type: "play", player: 2, cardId: 733, chosenColor: "lila" });
  assert.equal(s.pendingDraw, 8);
  assert.equal(s.pendingDrawKind, "wild4");
  assert.ok(!isPlayable(s, { id: 734, color: "lila", value: "draw2" }), "+2 nach +4 gesperrt");
  assert.ok(isPlayable(s, { id: 735, color: null, value: "wild4" }), "+4 geht weiter");

  // Spieler 3 schluckt: Rang wird zurückgesetzt
  s = reduce(s, { type: "draw", player: 3 });
  assert.equal(s.pendingDraw, 0);
  assert.equal(s.pendingDrawKind, "none");
});

test("trump: eine +2 senkt den Rang eines +4-Stapels nicht", () => {
  // Erreichbar nur über free→trump-Wechsel, aber die Invariante muss halten:
  // pendingDrawKind darf nie von wild4 auf draw2 zurückfallen.
  let s = game(4, rules({ stackMode: "free" }));
  s.players[0].hand.push({ id: 740, color: null, value: "wild4" });
  s = reduce(s, { type: "play", player: 0, cardId: 740, chosenColor: "gold" });
  assert.equal(s.pendingDrawKind, "wild4");
  s.players[1].hand.push({ id: 741, color: "gold", value: "draw2" });
  s = reduce(s, { type: "play", player: 1, cardId: 741 });
  assert.equal(s.pendingDraw, 6);
  assert.equal(s.pendingDrawKind, "wild4", "+4 bleibt maßgeblich");
});

test("two: +4 stapelt nicht, sondern zieht sofort", () => {
  let s = game(4, rules({ stackMode: "two" }));
  s.players[0].hand.push({ id: 750, color: null, value: "wild4" });
  const before = s.players[1].hand.length;
  s = reduce(s, { type: "play", player: 0, cardId: 750, chosenColor: "gold" });
  assert.equal(s.pendingDraw, 0);
  assert.equal(s.players[1].hand.length, before + 4);
  assert.equal(s.turn, 2);
});

/* ---------- Null-Kette ---------- */

test("Null-Kette: nach 0 ist nur eine 0 spielbar", () => {
  let s = game(4, rules({ zeroChain: true }));
  const t = topCard(s);
  s.players[0].hand.push({ id: 730, color: t.color, value: "0" });
  s = reduce(s, { type: "play", player: 0, cardId: 730 });
  assert.equal(s.pendingZero, true);
  assert.equal(s.turn, 1, "kein Überspringen");
  assert.ok(isPlayable(s, { id: 731, color: "gold", value: "0" }), "jede 0 erfüllt die Forderung");
  assert.ok(!isPlayable(s, { id: 732, color: s.color, value: "5" }));
  assert.ok(!isPlayable(s, { id: 733, color: null, value: "wild" }), "Wunschkarte hilft nicht");
  assert.ok(!isPlayable(s, { id: 734, color: null, value: "wild4" }));
});

test("Null-Kette: 0 drauflegen setzt die Forderung neu", () => {
  let s = game(4, rules({ zeroChain: true }));
  const t = topCard(s);
  s.players[0].hand.push({ id: 740, color: t.color, value: "0" });
  s = reduce(s, { type: "play", player: 0, cardId: 740 });
  s.players[1].hand.push({ id: 741, color: "gold", value: "0" });
  s = reduce(s, { type: "play", player: 1, cardId: 741 });
  assert.equal(s.pendingZero, true, "Kette läuft weiter");
  assert.equal(s.turn, 2);
  assert.equal(s.color, "gold");
});

test("Null-Kette: ohne 0 wird genau eine Karte gezogen, Zug endet", () => {
  let s = game(4, rules({ zeroChain: true }));
  const t = topCard(s);
  s.players[0].hand.push({ id: 750, color: t.color, value: "0" });
  s = reduce(s, { type: "play", player: 0, cardId: 750 });
  s.players[1].hand = s.players[1].hand.filter((c) => c.value !== "0"); // garantiert keine 0
  const before = s.players[1].hand.length;
  s = reduce(s, { type: "draw", player: 1 });
  assert.equal(s.players[1].hand.length, before + 1, "genau eine Karte");
  assert.equal(s.pendingZero, false, "Forderung ist erledigt");
  assert.equal(s.phase, "playing", "keine drawnDecision – die Kette bricht");
  assert.equal(s.turn, 2);
  assert.ok(s.events.some((e) => e.kind === "zeroMissed"));
});

test("Null-Kette: drawToMatch zieht trotzdem nur eine Karte", () => {
  let s = game(4, rules({ zeroChain: true, drawToMatch: true }));
  const t = topCard(s);
  s.players[0].hand.push({ id: 760, color: t.color, value: "0" });
  s = reduce(s, { type: "play", player: 0, cardId: 760 });
  s.players[1].hand = s.players[1].hand.filter((c) => c.value !== "0");
  const before = s.players[1].hand.length;
  s = reduce(s, { type: "draw", player: 1 });
  assert.equal(s.players[1].hand.length, before + 1);
});

test("Null-Kette: mit einer 0 auf der Hand ist Ziehen verboten", () => {
  // Sonst liesse sich die Kette durch blosses Verweigern der eigenen 0 abbrechen.
  let s = game(4, rules({ zeroChain: true }));
  const t = topCard(s);
  s.players[0].hand.push({ id: 790, color: t.color, value: "0" });
  s = reduce(s, { type: "play", player: 0, cardId: 790 });
  s.players[1].hand.push({ id: 791, color: "gold", value: "0" });
  assert.throws(() => reduce(s, { type: "draw", player: 1 }), EngineError);

  // Die 0 legen geht weiterhin und setzt die Forderung neu
  const next = reduce(s, { type: "play", player: 1, cardId: 791 });
  assert.equal(next.pendingZero, true);
  assert.equal(next.turn, 2);
});

test("Null-Kette: Sieg mit der letzten 0 fordert von niemandem mehr eine 0", () => {
  let s = game(4, rules({ zeroChain: true }));
  const t = topCard(s);
  s.players[0].hand = [{ id: 792, color: t.color, value: "0" }];
  s = reduce(s, { type: "play", player: 0, cardId: 792 });
  assert.equal(s.phase, "finished");
  assert.equal(s.pendingZero, false, "keine Forderung an einen Spieler, der nie dran kommt");
  assert.ok(!s.events.some((e) => e.kind === "zeroDemanded"), "kein zeroDemanded nach Spielende");
});

test("Null-Kette aus: 0 verhält sich wie eine normale Zahlenkarte", () => {
  let s = game(4);
  const t = topCard(s);
  s.players[0].hand.push({ id: 770, color: t.color, value: "0" });
  s = reduce(s, { type: "play", player: 0, cardId: 770 });
  assert.equal(s.pendingZero, false);
  assert.equal(s.turn, 1);
});

test("Null-Kette: Sieg mit der letzten 0 lässt keine Forderung offen", () => {
  let s = game(4, rules({ zeroChain: true }));
  const t = topCard(s);
  s.players[0].hand = [{ id: 780, color: t.color, value: "0" }];
  s = reduce(s, { type: "play", player: 0, cardId: 780 });
  assert.equal(s.phase, "finished");
  assert.equal(s.winner, 0);
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

test("1000+ Partien, alle 16 Regelkombinationen, 2–4 Spieler: terminieren + Invariante", () => {
  // Vollständiges Kreuzprodukt aller vier Hausregeln – deckt auch die
  // Wechselwirkung zwischen Strafstapel und Null-Kette ab.
  const ruleSets: Rules[] = [];
  for (const stackMode of STACK_MODES) {
    for (const drawToMatch of [false, true]) {
      for (const zeroChain of [false, true]) {
        ruleSets.push({ stackMode, drawToMatch, zeroChain });
      }
    }
  }
  assert.equal(ruleSets.length, 16);

  let n = 0;
  for (const rs of ruleSets) {
    for (const players of [2, 3, 4]) {
      for (let seed = 1; seed <= 25; seed++) {
        const rand = seededRand(seed * 7919 + players);
        const end = simulate(game(players, rs, seed), rand);
        assert.ok(end.winner !== null && end.winner >= 0 && end.winner < players);
        n++;
      }
    }
  }
  assert.ok(n >= 1000, `nur ${n} Partien simuliert`);
});
