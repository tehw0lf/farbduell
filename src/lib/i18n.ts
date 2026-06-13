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
    penaltyStackPlayable: (n: number) => `Strafstapel: ${n} Karten – leg eine +2 drauf oder zieh sie.`,
    penaltyStackDraw: (n: number) => `Keine +2 auf der Hand – zieh die ${n} Strafkarten.`,
    yourTurn: "Du bist dran.",
    drawCard: "Nichts passt – zieh.",

    // Toast messages
    drew: (name: string, you: boolean, n: number) =>
      `${name} ${you ? "ziehst" : "zieht"} ${n} Karte${n === 1 ? "" : "n"}`,
    drewPenalty: (name: string, you: boolean, n: number) =>
      `${name} ${you ? "ziehst" : "zieht"} ${n} Strafkarten`,
    penaltyGrew: (n: number) => `Strafstapel: ${n} Karten`,
    skipped: (name: string, you: boolean) =>
      `${name} ${you ? "setzt du aus" : "setzt aus"}`,
    reversed: "Richtungswechsel!",
    wishedColor: (name: string, color: string) => `${name} wünscht sich ${color}`,
    lastCard: (name: string, you: boolean) =>
      `${name} ${you ? "rufst" : "ruft"}: „Letzte Karte!"`,
    reshuffled: "Ablagestapel neu gemischt",
    timeout: "Zeit um – du ziehst automatisch",

    // Player names
    you: "Du",
    botNames: ["Mira", "Jonas", "Pia", "Lena", "Kai", "Sara", "Tom", "Nina", "Max", "Eva"] as string[],

    // Colors
    colors: { koralle: "Koralle", gold: "Gold", tuerkis: "Türkis", lila: "Lila" } as Record<Color, string>,

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
    drawnFitsHint: "Deine gezogene Karte kannst du direkt legen – musst du aber nicht.",
    keep: "Behalten",
    play: "Legen",

    // Modals – end
    youWon: "Gewonnen! 🎉",
    youWonHint: "Alle Karten abgelegt – ganz ohne Hektik.",
    opponentWon: (name: string) => `${name} gewinnt`,
    opponentWonHint: "Nächste Runde läuft's. Zeit hast du ja genug.",
    newRound: "Neue Runde",

    // Modals – settings
    settingsTitle: "Einstellungen",
    settingsHint: "Mitspieler ändern startet eine neue Runde. Hausregeln gelten sofort.",
    opponents: "Mitspieler",
    bot: (n: number) => n === 1 ? "1 Bot" : `${n} Bots`,
    houseRules: "Hausregeln",
    stack2Label: "+2 stapeln",
    stack2Desc: "Wer eine +2 bekommt, darf eine eigene +2 drauflegen – der Strafstapel wandert weiter.",
    drawToMatchLabel: "Ziehen, bis es passt",
    drawToMatchDesc: "Statt einer Karte ziehst du so lange, bis eine passende kommt.",
    timeLimitLabel: "Zeitlimit pro Zug",
    timeLimitOff: "Aus",
    timeLimitHint: "Läuft die Zeit ab, ziehst du automatisch eine Karte. Standard: kein Limit.",
    language: "Sprache",
    sound: "Sound",
    soundOn: "An",
    soundOff: "Aus",
    showPlayableLabel: "Spielbare Karten",
    showPlayableDesc: "Nicht spielbare Karten werden abgedunkelt und spielbare hervorgehoben.",
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
    penaltyStackPlayable: (n: number) => `Penalty stack: ${n} cards – play a +2 or draw them.`,
    penaltyStackDraw: (n: number) => `No +2 in hand – draw the ${n} penalty cards.`,
    yourTurn: "Your turn.",
    drawCard: "Nothing fits – draw.",

    // Toast messages
    drew: (name: string, you: boolean, n: number) =>
      `${name} ${you ? "draw" : "draws"} ${n} card${n === 1 ? "" : "s"}`,
    drewPenalty: (name: string, you: boolean, n: number) =>
      `${name} ${you ? "draw" : "draws"} ${n} penalty card${n === 1 ? "" : "s"}`,
    penaltyGrew: (n: number) => `Penalty stack: ${n} cards`,
    skipped: (name: string, you: boolean) =>
      `${name} ${you ? "are" : "is"} skipped`,
    reversed: "Direction reversed!",
    wishedColor: (name: string, color: string) => `${name} wishes for ${color}`,
    lastCard: (name: string, you: boolean) =>
      `${name} ${you ? "call" : "calls"}: "Last card!"`,
    reshuffled: "Discard pile reshuffled",
    timeout: "Time's up – drawing automatically",

    // Player names
    you: "You",
    botNames: ["Mira", "Jonas", "Pia", "Lena", "Kai", "Sara", "Tom", "Nina", "Max", "Eva"] as string[],

    // Colors
    colors: { koralle: "Coral", gold: "Gold", tuerkis: "Teal", lila: "Purple" } as Record<Color, string>,

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
    drawnFitsHint: "You can play the card you just drew – but you don't have to.",
    keep: "Keep",
    play: "Play",

    // Modals – end
    youWon: "You won! 🎉",
    youWonHint: "All cards played – no rush needed.",
    opponentWon: (name: string) => `${name} wins`,
    opponentWonHint: "Better luck next round. You've got time.",
    newRound: "New round",

    // Modals – settings
    settingsTitle: "Settings",
    settingsHint: "Changing opponents starts a new round. House rules apply immediately.",
    opponents: "Opponents",
    bot: (n: number) => n === 1 ? "1 Bot" : `${n} Bots`,
    houseRules: "House rules",
    stack2Label: "Stack +2",
    stack2Desc: "When hit by a +2, you may play your own +2 – the penalty pile keeps growing.",
    drawToMatchLabel: "Draw until you match",
    drawToMatchDesc: "Instead of one card, you keep drawing until a playable card comes up.",
    timeLimitLabel: "Turn time limit",
    timeLimitOff: "Off",
    timeLimitHint: "When time runs out, a card is drawn automatically. Default: no limit.",
    language: "Language",
    sound: "Sound",
    soundOn: "On",
    soundOff: "Off",
    showPlayableLabel: "Highlight playable",
    showPlayableDesc: "Dims cards that can't be played and highlights those that can.",
    close: "Close",
  },
} as const;

export type T = typeof TRANSLATIONS.de;
