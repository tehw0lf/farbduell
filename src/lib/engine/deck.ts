import type { Card, Color } from "./types.ts";
import { COLORS } from "./types.ts";

/** mulberry32 – kleiner, schneller, deterministischer PRNG.
 *  Gibt [Zufallszahl 0..1, nächster Seed] zurück, damit die Engine pur bleibt. */
export function nextRand(seed: number): [number, number] {
  let t = (seed + 0x6d2b79f5) | 0;
  let x = t;
  x = Math.imul(x ^ (x >>> 15), x | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  return [((x ^ (x >>> 14)) >>> 0) / 4294967296, t];
}

/** Fisher-Yates mit deterministischem Seed; gibt neuen Seed zurück. */
export function shuffle<T>(arr: T[], seed: number): number {
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    let r: number;
    [r, s] = nextRand(s);
    const j = Math.floor(r * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return s;
}

/** 108 Karten: je Farbe 1×0, 2×1–9, 2× Aussetzen/Richtungswechsel/+2, dazu 4 Wunsch und 4 Wunsch+4. */
export function buildDeck(): Card[] {
  const deck: Card[] = [];
  let id = 0;
  const push = (color: Color | null, value: Card["value"]) =>
    deck.push({ id: ++id, color, value });

  for (const color of COLORS) {
    push(color, "0");
    for (let n = 1; n <= 9; n++) {
      push(color, String(n) as Card["value"]);
      push(color, String(n) as Card["value"]);
    }
    for (const v of ["skip", "reverse", "draw2"] as const) {
      push(color, v);
      push(color, v);
    }
  }
  for (let i = 0; i < 4; i++) {
    push(null, "wild");
    push(null, "wild4");
  }
  return deck;
}
