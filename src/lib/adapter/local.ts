import type { Action, GameState, PlayerView, Rules } from "../engine/types.ts";
import { EngineError } from "../engine/types.ts";
import { createGame, reduce } from "../engine/engine.ts";
import { playerView } from "../engine/view.ts";
import { chooseBotAction } from "../engine/bot.ts";
import type { DispatchAction, GameAdapter, NewGameOptions } from "./types.ts";
import { TRANSLATIONS } from "../i18n.ts";

const HUMAN = 0;

/** Bots im Browser: gleiche Engine, gleiche Bot-Logik wie ein späterer Server. */
export class LocalAdapter implements GameAdapter {
  onError?: (message: string) => void;

  private state: GameState | null = null;
  private listeners = new Set<(view: PlayerView) => void>();
  private botTimer: ReturnType<typeof setTimeout> | null = null;
  /** entwertet ausstehende Bot-Timer nach einem Neustart */
  private generation = 0;
  private botDelay: () => number;

  constructor(opts: { botDelayMs?: () => number } = {}) {
    this.botDelay = opts.botDelayMs ?? (() => 900 + Math.random() * 900);
  }

  subscribe(cb: (view: PlayerView) => void): () => void {
    this.listeners.add(cb);
    if (this.state) cb(playerView(this.state, HUMAN));
    return () => this.listeners.delete(cb);
  }

  newGame(opts: NewGameOptions): void {
    this.generation++;
    this.clearTimer();
    const t = TRANSLATIONS[opts.lang];
    this.state = createGame({
      names: [t.you, ...t.botNames.slice(0, opts.botCount)],
      bots: [false, ...Array(opts.botCount).fill(true)],
      rules: opts.rules,
    });
    this.emit();
    this.scheduleBots();
  }

  dispatch(action: DispatchAction): void {
    if (!this.state) return;
    try {
      this.state = reduce(this.state, { ...action, player: HUMAN } as Action);
      this.emit();
      this.scheduleBots();
    } catch (err) {
      if (err instanceof EngineError) this.onError?.(err.message);
      else throw err;
    }
  }

  setRules(rules: Rules): void {
    if (!this.state) return;
    this.state = structuredClone(this.state);
    this.state.rules = { ...rules };
    // Abschalten der Stapel-Regel lässt einen offenen Strafstapel verfallen
    if (!rules.stack2) this.state.pendingDraw = 0;
    this.state.events = [];
    this.emit();
  }

  destroy(): void {
    this.generation++;
    this.clearTimer();
    this.listeners.clear();
  }

  /* ---------- intern ---------- */

  private emit(): void {
    if (!this.state) return;
    const view = playerView(this.state, HUMAN);
    for (const cb of this.listeners) cb(view);
  }

  private scheduleBots(): void {
    this.clearTimer();
    const s = this.state;
    if (!s || s.phase === "finished") return;
    if (!s.players[s.turn].isBot) return;

    const gen = this.generation;
    this.botTimer = setTimeout(() => {
      if (gen !== this.generation || !this.state) return;
      const st = this.state;
      if (st.phase === "finished" || !st.players[st.turn].isBot) return;
      try {
        const action = chooseBotAction(playerView(st, st.turn));
        this.state = reduce(st, action);
        this.emit();
        this.scheduleBots();
      } catch (err) {
        // Ein Bot-Fehler wäre ein Engine-Bug – sichtbar machen statt verschlucken
        console.error("Bot-Zug fehlgeschlagen:", err);
      }
    }, this.botDelay());
  }

  private clearTimer(): void {
    if (this.botTimer) {
      clearTimeout(this.botTimer);
      this.botTimer = null;
    }
  }
}
