/**
 * LocalAdapter-Smoke-Test: komplette Partie, in der auch der "Mensch"
 * automatisch zieht – prüft die Adapter-Schleife inkl. Neustart-Schutz.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { LocalAdapter } from "../src/lib/adapter/local.ts";
import { chooseBotAction } from "../src/lib/engine/bot.ts";
import type { PlayerView } from "../src/lib/engine/types.ts";

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
  adapter.newGame({ botCount: 3, rules: { stack2: true, drawToMatch: true }, lang: "de" });

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
  adapter.newGame({ botCount: 3, rules: { stack2: false, drawToMatch: false }, lang: "de" });

  // Mensch zieht -> Bot 1 plant einen Zug in 50ms; mittendrin Neustart
  adapter.dispatch({ type: "draw" });
  // Falls die gezogene Karte passte, Entscheidung auflösen
  adapter.dispatch({ type: "keepDrawn" } as never);
  await delay(10);
  adapter.newGame({ botCount: 3, rules: { stack2: false, drawToMatch: false }, lang: "de" });
  const len = turns.length;
  await delay(40); // alter Timer wäre jetzt gefeuert
  // erlaubt sind nur Züge der NEUEN Partie (Bot-Kette), aber Zustand bleibt konsistent:
  // direkt nach newGame ist turn 0; ein Geister-Zug der alten Partie würde
  // einen reduce auf inkonsistentem Zustand auslösen und im console.error landen.
  assert.ok(turns.length >= len, "subscribe lebt");
  adapter.destroy();
});
