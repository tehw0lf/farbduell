import type { Rules, StackMode } from "./engine/types.ts";
import { STACK_MODES } from "./engine/types.ts";
import type { Lang } from "./i18n.ts";

export interface Settings {
  botCount: number;
  rules: Rules;
  /** Sekunden pro Zug; 0 = kein Limit (Standard) */
  timeLimit: 0 | 30 | 60 | 90;
  theme: "light" | "dark";
  lang: Lang;
  sound: boolean;
  /** Spielbare Karten hervorheben (dimmt nicht-spielbare) */
  showPlayable: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  botCount: 3,
  rules: { stackMode: "two", drawToMatch: false, zeroChain: false },
  timeLimit: 0,
  theme: "light",
  lang: "de",
  sound: true,
  showPlayable: false,
};

/**
 * Liest den Stapel-Modus aus unbekanntem Input. Versteht auch die alten
 * Booleans stack2/stack4 aus Versionen vor 1.4, damit gespeicherte
 * Einstellungen und laufende Partien nicht auf den Default zurückfallen.
 */
export function migrateStackMode(raw: unknown): StackMode {
  const r = raw as { stackMode?: unknown; stack2?: unknown; stack4?: unknown } | null | undefined;
  if (r && STACK_MODES.includes(r.stackMode as StackMode)) return r.stackMode as StackMode;
  if (r && (r.stack2 !== undefined || r.stack4 !== undefined)) {
    // Altes stack4 ohne stack2 hieß „nur +4 kontert" – das ist heute `trump`.
    if (r.stack4) return r.stack2 ? "free" : "trump";
    return r.stack2 ? "two" : "off";
  }
  return DEFAULT_SETTINGS.rules.stackMode;
}

const KEY = "farbduell-settings";

export function loadSettings(): Settings {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return {
      botCount: [1, 2, 3].includes(raw.botCount) ? raw.botCount : 3,
      rules: {
        stackMode: migrateStackMode(raw.rules),
        drawToMatch: raw.rules?.drawToMatch === undefined ? DEFAULT_SETTINGS.rules.drawToMatch : !!raw.rules.drawToMatch,
        zeroChain: raw.rules?.zeroChain === undefined ? DEFAULT_SETTINGS.rules.zeroChain : !!raw.rules.zeroChain,
      },
      timeLimit: [0, 30, 60, 90].includes(raw.timeLimit) ? raw.timeLimit : 0,
      theme: raw.theme === "dark" ? "dark" : "light",
      lang: raw.lang === "en" ? "en" : "de",
      sound: raw.sound === false ? false : true,
      showPlayable: raw.showPlayable === true ? true : false,
    };
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode etc. – Einstellungen gelten dann nur für die Sitzung */
  }
}
