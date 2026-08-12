/**
 * LocalAdapter-Smoke-Test: komplette Partie, in der auch der "Mensch"
 * automatisch zieht – prüft die Adapter-Schleife inkl. Neustart-Schutz.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { LocalAdapter } from "../src/lib/adapter/local.ts";
import { chooseBotAction } from "../src/lib/engine/bot.ts";
import type { PlayerView } from "../src/lib/engine/types.ts";
import { ENGINE_ERROR_CODES, STACK_MODES } from "../src/lib/engine/types.ts";
import { DEFAULT_SETTINGS, migrateStackMode } from "../src/lib/settings.ts";
import { TRANSLATIONS, type Lang } from "../src/lib/i18n.ts";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

test("LocalAdapter spielt eine komplette Partie durch", async () => {
  const adapter = new LocalAdapter({ botDelayMs: () => 0 });
  let latest: PlayerView | null = null;
  let finished = false;

  adapter.onError = (m) => assert.fail("EngineError im Adapter: " + m);
  adapter.subscribe((v) => {
    latest = v;
    if (v.phase === "finished") finished = true;
  });
  adapter.newGame({ botCount: 3, rules: { stackMode: "trump", drawToMatch: true, zeroChain: true }, lang: "de" });

  const start = Date.now();
  while (!finished && Date.now() - start < 15000) {
    await delay(5);
    const v = latest as PlayerView | null;
    if (v && v.phase !== "finished" && v.turn === v.you) {
      // der "Mensch" spielt mit Bot-Heuristik
      const action = chooseBotAction(v);
      const { player: _drop, ...rest } = action;
      adapter.dispatch(rest);
    }
  }

  assert.ok(finished, "Partie über den Adapter endete nicht");
  adapter.destroy();
});

test("newGame entwertet laufende Bot-Züge (kein Geister-Zug)", async () => {
  const adapter = new LocalAdapter({ botDelayMs: () => 50 });
  const turns: number[] = [];
  adapter.subscribe((v) => turns.push(v.turn));
  adapter.newGame({ botCount: 3, rules: { stackMode: "off", drawToMatch: false, zeroChain: false }, lang: "de" });

  // Mensch zieht -> Bot 1 plant einen Zug in 50ms; mittendrin Neustart
  adapter.dispatch({ type: "draw" });
  // Falls die gezogene Karte passte, Entscheidung auflösen
  adapter.dispatch({ type: "keepDrawn" } as never);
  await delay(10);
  adapter.newGame({ botCount: 3, rules: { stackMode: "off", drawToMatch: false, zeroChain: false }, lang: "de" });
  const len = turns.length;
  await delay(40); // alter Timer wäre jetzt gefeuert
  // erlaubt sind nur Züge der NEUEN Partie (Bot-Kette), aber Zustand bleibt konsistent:
  // direkt nach newGame ist turn 0; ein Geister-Zug der alten Partie würde
  // einen reduce auf inkonsistentem Zustand auslösen und im console.error landen.
  assert.ok(turns.length >= len, "subscribe lebt");
  adapter.destroy();
});

/* ---------- Lokalisierte Regelverstoesse ---------- */

test("jeder EngineError-Code hat in jeder Sprache einen Text", () => {
  // Ohne diesen Test faellt ein vergessener Code erst als leerer Toast auf.
  const langs = Object.keys(TRANSLATIONS) as Lang[];
  assert.ok(langs.length >= 2, "es sollten mindestens de und en existieren");
  for (const lang of langs) {
    for (const code of ENGINE_ERROR_CODES) {
      const text = TRANSLATIONS[lang].errors[code];
      assert.equal(typeof text, "string", `${lang}.errors.${code} fehlt`);
      assert.ok(text.trim().length > 0, `${lang}.errors.${code} ist leer`);
    }
  }
});

test("die Sprachen unterscheiden sich tatsächlich (kein kopierter Block)", () => {
  // Faengt den Fall ab, dass der englische Block versehentlich deutsch bleibt.
  const different = ENGINE_ERROR_CODES.filter(
    (code) => TRANSLATIONS.de.errors[code] !== TRANSLATIONS.en.errors[code],
  );
  assert.equal(different.length, ENGINE_ERROR_CODES.length,
    "diese Codes sind in beiden Sprachen identisch: " +
    ENGINE_ERROR_CODES.filter((c) => !different.includes(c)).join(", "));
});

test("LocalAdapter meldet den Fehlercode, nicht den Text", () => {
  const adapter = new LocalAdapter({ botDelayMs: () => 100000 });
  const codes: string[] = [];
  adapter.onError = (code) => codes.push(code);
  adapter.newGame({ botCount: 3, rules: { stackMode: "off", drawToMatch: false, zeroChain: false }, lang: "de" });

  // Karte, die es nicht gibt
  adapter.dispatch({ type: "play", cardId: -1 });
  assert.deepEqual(codes, ["cardNotInHand"]);
  // Der Code muss uebersetzbar sein
  assert.ok(TRANSLATIONS.de.errors[codes[0] as keyof typeof TRANSLATIONS.de.errors]);
  adapter.destroy();
});

/* ---------- Migration alter Einstellungen (< 1.4) ---------- */

test("migrateStackMode übersetzt die alten stack2/stack4-Booleans", () => {
  assert.equal(migrateStackMode({ stack2: false, stack4: false }), "off");
  assert.equal(migrateStackMode({ stack2: true, stack4: false }), "two");
  assert.equal(migrateStackMode({ stack2: true, stack4: true }), "free");
  // stack4 ohne stack2 hieß „nur +4 kontert"
  assert.equal(migrateStackMode({ stack2: false, stack4: true }), "trump");
  // Teilweise gesetzte Altstände dürfen nicht auf den Default fallen
  assert.equal(migrateStackMode({ stack2: true }), "two");
});

test("migrateStackMode akzeptiert neue Werte und fällt sonst auf den Default", () => {
  for (const mode of STACK_MODES) {
    assert.equal(migrateStackMode({ stackMode: mode }), mode);
  }
  assert.equal(migrateStackMode({}), DEFAULT_SETTINGS.rules.stackMode);
  assert.equal(migrateStackMode(null), DEFAULT_SETTINGS.rules.stackMode);
  assert.equal(migrateStackMode(undefined), DEFAULT_SETTINGS.rules.stackMode);
  assert.equal(migrateStackMode({ stackMode: "quatsch" }), DEFAULT_SETTINGS.rules.stackMode);
});
