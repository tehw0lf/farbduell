import type { Color } from "./engine/types.ts";

export type Lang = "de" | "en";

export const TRANSLATIONS = {
  de: {
    // Header
    lightTheme: "Helles Design",
    darkTheme: "Dunkles Design",
    settings: "Einstellungen",
    noTimeLimit: "ohne Zeitlimit",

    // Status messages
    thinking: (name: string) => `${name} überlegt …`,
    yourDecision: "Deine Entscheidung.",
    penaltyStackPlayable: (n: number) =>
      `Strafstapel: ${n} Karten – kontere oder zieh sie.`,
    penaltyStackDraw: (n: number) =>
      `Nichts zum Kontern – zieh die ${n} Strafkarten.`,
    zeroDemandPlayable: "Null gelegt – leg eine 0 drauf.",
    zeroDemandDraw: "Keine 0 auf der Hand – zieh eine Karte.",
    yourTurn: "Du bist dran.",
    drawCard: "Nichts passt – zieh.",

    // Toast messages
    drew: (name: string, you: boolean, n: number) =>
      `${name} ${you ? "ziehst" : "zieht"} ${n} Karte${n === 1 ? "" : "n"}`,
    drewPenalty: (name: string, you: boolean, n: number) =>
      `${name} ${you ? "ziehst" : "zieht"} ${n} Strafkarten`,
    penaltyGrew: (n: number) => `Strafstapel: ${n} Karten`,
    zeroDemanded: (name: string, you: boolean) =>
      `${name} ${you ? "musst" : "muss"} eine 0 legen`,
    zeroMissed: (name: string, you: boolean) =>
      `${name} ${you ? "hast" : "hat"} keine 0 – eine Karte gezogen`,
    skipped: (name: string, you: boolean) =>
      `${name} ${you ? "setzt aus" : "setzt aus"}`,
    reversed: "Richtungswechsel!",
    wishedColor: (name: string, you: boolean, color: string) =>
      `${name} ${you ? "wünschst dir" : "wünscht sich"} ${color}`,
    lastCard: (name: string, you: boolean) =>
      `${name} ${you ? "rufst" : "ruft"}: „Letzte Karte!"`,
    reshuffled: "Ablagestapel neu gemischt",
    timeout: "Zeit um – du ziehst automatisch",

    // Player names
    you: "Du",
    botNames: [
      "Mira",
      "Jonas",
      "Pia",
      "Lena",
      "Kai",
      "Sara",
      "Tom",
      "Nina",
      "Max",
      "Eva",
    ] as string[],

    // Colors
    colors: {
      koralle: "Koralle",
      gold: "Gold",
      tuerkis: "Türkis",
      lila: "Lila",
    } as Record<Color, string>,

    // Table
    direction: "Richtung",
    drawPile: (n: number) => `Ziehen (${n})`,
    discardPile: "Ablage",
    currentColor: "Aktuelle Farbe",

    // Card labels
    cardBack: "Kartenrücken",
    wildPlusFour: "Wunschkarte plus vier",
    wild: "Wunschkarte",

    // Modals – color pick
    chooseColor: "Farbe wünschen",
    chooseColorHint: "Welche Farbe soll als Nächstes gelten?",
    cancel: "Doch nicht",

    // Modals – drawn decision
    drawnFits: "Passt sogar!",
    drawnFitsHint:
      "Deine gezogene Karte kannst du direkt legen – musst du aber nicht.",
    keep: "Behalten",
    play: "Legen",

    // Modals – end
    youWon: "Gewonnen! 🎉",
    youWonHint: "Alle Karten abgelegt.",
    opponentWon: (name: string) => `${name} gewinnt`,
    opponentWonHint: "Nächste Runde läuft's.",
    newRound: "Neue Runde",

    // Modals – settings
    settingsTitle: "Einstellungen",
    settingsHint:
      "Mitspieler ändern startet eine neue Runde. Hausregeln gelten sofort.",
    opponents: "Mitspieler",
    bot: (n: number) => (n === 1 ? "1 Bot" : `${n} Bots`),
    houseRules: "Hausregeln",
    stackLabel: "Strafstapel",
    stackModeNames: {
      off: "Aus",
      two: "Nur +2",
      free: "Frei",
      trump: "+4 Trumpf",
    } as Record<string, string>,
    stackModeDescs: {
      off: "Kein Stapeln – wer eine +2 oder +4 bekommt, zieht sofort und setzt aus.",
      two: "+2 kontert +2, der Strafstapel wandert weiter. Eine +4 zieht sofort.",
      free: "+2 und +4 sind frei mischbar, jede kontert jede – der Stapel kann kräftig wachsen.",
      trump:
        "Gleich oder höher: +2 kontert nur reine +2-Stapel, +4 kontert alles. Nach einer +4 ist die +2 raus.",
    } as Record<string, string>,
    zeroChainLabel: "Null-Kette",
    zeroChainDesc:
      "Nach einer 0 muss der Nächste ebenfalls eine 0 legen – sonst zieht er eine Karte.",
    drawToMatchLabel: "Ziehen, bis es passt",
    drawToMatchDesc:
      "Statt einer Karte ziehst du so lange, bis eine passende kommt.",
    timeLimitLabel: "Zeitlimit pro Zug",
    timeLimitOff: "Aus",
    timeLimitHint:
      "Läuft die Zeit ab, ziehst du automatisch eine Karte. Standard: kein Limit.",
    language: "Sprache",
    sound: "Sound",
    soundOn: "An",
    soundOff: "Aus",
    showPlayableLabel: "Spielbare Karten",
    showPlayableDesc:
      "Nicht spielbare Karten werden abgedunkelt und spielbare hervorgehoben.",
    close: "Schließen",
  },
  en: {
    // Header
    lightTheme: "Light theme",
    darkTheme: "Dark theme",
    settings: "Settings",
    noTimeLimit: "no time limit",

    // Status messages
    thinking: (name: string) => `${name} is thinking …`,
    yourDecision: "Your decision.",
    penaltyStackPlayable: (n: number) =>
      `Penalty stack: ${n} cards – counter it or draw them.`,
    penaltyStackDraw: (n: number) =>
      `Nothing to counter with – draw the ${n} penalty cards.`,
    zeroDemandPlayable: "Zero played – put a 0 on top.",
    zeroDemandDraw: "No 0 in hand – draw a card.",
    yourTurn: "Your turn.",
    drawCard: "Nothing fits – draw.",

    // Toast messages
    drew: (name: string, you: boolean, n: number) =>
      `${name} ${you ? "draw" : "draws"} ${n} card${n === 1 ? "" : "s"}`,
    drewPenalty: (name: string, you: boolean, n: number) =>
      `${name} ${you ? "draw" : "draws"} ${n} penalty card${n === 1 ? "" : "s"}`,
    penaltyGrew: (n: number) => `Penalty stack: ${n} cards`,
    zeroDemanded: (name: string, you: boolean) =>
      `${name} ${you ? "must" : "has to"} play a 0`,
    zeroMissed: (name: string, you: boolean) =>
      `${name} ${you ? "have" : "has"} no 0 – drew a card`,
    skipped: (name: string, you: boolean) =>
      `${name} ${you ? "are" : "is"} skipped`,
    reversed: "Direction reversed!",
    wishedColor: (name: string, you: boolean, color: string) =>
      `${name} ${you ? "wish for" : "wishes for"} ${color}`,
    lastCard: (name: string, you: boolean) =>
      `${name} ${you ? "call" : "calls"}: "Last card!"`,
    reshuffled: "Discard pile reshuffled",
    timeout: "Time's up – drawing automatically",

    // Player names
    you: "You",
    botNames: [
      "Mira",
      "Jonas",
      "Pia",
      "Lena",
      "Kai",
      "Sara",
      "Tom",
      "Nina",
      "Max",
      "Eva",
    ] as string[],

    // Colors
    colors: {
      koralle: "Coral",
      gold: "Gold",
      tuerkis: "Teal",
      lila: "Purple",
    } as Record<Color, string>,

    // Table
    direction: "Direction",
    drawPile: (n: number) => `Draw (${n})`,
    discardPile: "Discard",
    currentColor: "Current color",

    // Card labels
    cardBack: "Card back",
    wildPlusFour: "Wild plus four",
    wild: "Wild card",

    // Modals – color pick
    chooseColor: "Choose a color",
    chooseColorHint: "Which color should be next?",
    cancel: "Never mind",

    // Modals – drawn decision
    drawnFits: "It fits!",
    drawnFitsHint:
      "You can play the card you just drew – but you don't have to.",
    keep: "Keep",
    play: "Play",

    // Modals – end
    youWon: "You won! 🎉",
    youWonHint: "All cards played.",
    opponentWon: (name: string) => `${name} wins`,
    opponentWonHint: "Better luck next round.",
    newRound: "New round",

    // Modals – settings
    settingsTitle: "Settings",
    settingsHint:
      "Changing opponents starts a new round. House rules apply immediately.",
    opponents: "Opponents",
    bot: (n: number) => (n === 1 ? "1 Bot" : `${n} Bots`),
    houseRules: "House rules",
    stackLabel: "Penalty stack",
    stackModeNames: {
      off: "Off",
      two: "+2 only",
      free: "Free",
      trump: "+4 trumps",
    } as Record<string, string>,
    stackModeDescs: {
      off: "No stacking – whoever is hit by a +2 or +4 draws immediately and is skipped.",
      two: "+2 counters +2 and the penalty pile keeps moving. A +4 draws immediately.",
      free: "+2 and +4 mix freely, each counters the other – the pile can grow fast.",
      trump:
        "Equal or higher: +2 only counters pure +2 piles, +4 counters everything. After a +4 the +2 is out.",
    } as Record<string, string>,
    zeroChainLabel: "Zero chain",
    zeroChainDesc:
      "After a 0, the next player must play a 0 as well – otherwise they draw a card.",
    drawToMatchLabel: "Draw until you match",
    drawToMatchDesc:
      "Instead of one card, you keep drawing until a playable card comes up.",
    timeLimitLabel: "Turn time limit",
    timeLimitOff: "Off",
    timeLimitHint:
      "When time runs out, a card is drawn automatically. Default: no limit.",
    language: "Language",
    sound: "Sound",
    soundOn: "On",
    soundOff: "Off",
    showPlayableLabel: "Highlight playable",
    showPlayableDesc:
      "Dims cards that can't be played and highlights those that can.",
    close: "Close",
  },
} as const;

export type T = typeof TRANSLATIONS.de;
