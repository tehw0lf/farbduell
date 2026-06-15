import type { Rules } from "./engine/types.ts";
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
  rules: { stack2: true, drawToMatch: false },
  timeLimit: 0,
  theme: "light",
  lang: "de",
  sound: true,
  showPlayable: false,
};

const KEY = "farbduell-settings";

export function loadSettings(): Settings {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return {
      botCount: [1, 2, 3].includes(raw.botCount) ? raw.botCount : 3,
      rules: {
        stack2: raw.rules?.stack2 === undefined ? DEFAULT_SETTINGS.rules.stack2 : !!raw.rules.stack2,
        drawToMatch: raw.rules?.drawToMatch === undefined ? DEFAULT_SETTINGS.rules.drawToMatch : !!raw.rules.drawToMatch,
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
