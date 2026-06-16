<script lang="ts">
  import { onMount } from "svelte";
  import type { Card as CardT, Color, GameEvent, PlayerView } from "./lib/engine/types.ts";
  import { LocalAdapter } from "./lib/adapter/local.ts";
  import type { GameAdapter } from "./lib/adapter/types.ts";
  import { loadSettings, saveSettings, type Settings } from "./lib/settings.ts";
  import { TRANSLATIONS } from "./lib/i18n.ts";
  import { isPlayableInView } from "./lib/viewHelpers.ts";
  import { soundPlay, soundDraw, soundLastCard, soundWin, soundLose, soundPenalty } from "./lib/sounds.ts";
  import OpponentFan from "./lib/components/OpponentFan.svelte";
  import Table from "./lib/components/Table.svelte";
  import Hand from "./lib/components/Hand.svelte";
  import Modals from "./lib/components/Modals.svelte";

  /* Heute lokal – für Multiplayer wird hier ein RemoteAdapter eingesetzt. */
  const adapter = new LocalAdapter();

  let settings = $state<Settings>(loadSettings());
  let view = $state<PlayerView | null>(null);
  let colorPickCard = $state<CardT | null>(null);
  let colorPickFromDrawn = $state(false);
  let settingsOpen = $state(false);
  let toastText = $state("");
  let toastShout = $state(false);
  let toastVisible = $state(false);
  let timeLeft = $state(0);

  let toastTimer: ReturnType<typeof setTimeout> | null = null;
  let ticker: ReturnType<typeof setInterval> | null = null;

  const t = $derived(TRANSLATIONS[settings.lang]);

  /* ---------- Lifecycle ---------- */

  onMount(() => {
    applyTheme(settings.theme);
    adapter.onError = (msg) => toast(msg);
    const unsub = adapter.subscribe((v) => {
      view = v;
      for (const ev of v.events) handleEvent(v, ev);
      manageTimer(v);
    });
    if (adapter.hasRestoredGame) {
      adapter.resumeBots();
    } else {
      adapter.newGame({ botCount: settings.botCount, rules: settings.rules, lang: settings.lang });
    }
    return () => {
      unsub();
      adapter.destroy();
      stopTicker();
    };
  });

  /* ---------- Status & Events ---------- */

  const myTurn = $derived(view !== null && view.turn === view.you);
  const anyPlayable = $derived(
    view !== null && view.yourHand.some((c) => isPlayableInView(view!, c))
  );
  const status = $derived.by(() => {
    if (!view) return "";
    if (view.phase === "finished") return "";
    if (!myTurn) return t.thinking(view.players[view.turn].name);
    if (view.phase === "drawnDecision") return t.yourDecision;
    if (view.pendingDraw > 0) {
      return anyPlayable
        ? t.penaltyStackPlayable(view.pendingDraw)
        : t.penaltyStackDraw(view.pendingDraw);
    }
    return anyPlayable ? t.yourTurn : t.drawCard;
  });

  function name(v: PlayerView, idx: number): string {
    return idx === v.you ? t.you : v.players[idx].name;
  }

  function handleEvent(v: PlayerView, ev: GameEvent) {
    const isYou = (idx: number) => idx === v.you;
    switch (ev.kind) {
      case "played":
        if (isYou(ev.player)) sound(soundPlay);
        break;
      case "drew":
        if (ev.count > 1 || !isYou(ev.player)) {
          toast(t.drew(name(v, ev.player), isYou(ev.player), ev.count));
        }
        if (isYou(ev.player)) sound(soundDraw);
        break;
      case "drewPenalty":
        toast(t.drewPenalty(name(v, ev.player), isYou(ev.player), ev.count));
        sound(soundPenalty);
        break;
      case "penaltyGrew":
        toast(t.penaltyGrew(ev.total));
        break;
      case "skipped":
        toast(t.skipped(name(v, ev.player), isYou(ev.player)));
        break;
      case "reversed":
        toast(t.reversed);
        break;
      case "wishedColor": {
        toast(t.wishedColor(name(v, ev.player), isYou(ev.player), t.colors[ev.color]));
        break;
      }
      case "lastCard":
        toast(t.lastCard(name(v, ev.player), isYou(ev.player)), true);
        sound(soundLastCard);
        break;
      case "reshuffled":
        toast(t.reshuffled);
        break;
      case "won":
        sound(isYou(ev.player) ? soundWin : soundLose);
        break;
    }
  }

  function sound(fn: () => void) {
    if (settings.sound) fn();
  }

  function toast(text: string, shout = false) {
    toastText = text;
    toastShout = shout;
    toastVisible = true;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastVisible = false), 2200);
  }

  /* ---------- Aktionen ---------- */

  function onPlay(card: CardT) {
    if (card.color === null) {
      colorPickCard = card;
      colorPickFromDrawn = false;
    } else {
      adapter.dispatch({ type: "play", cardId: card.id });
    }
  }

  function onDraw() {
    if (!view || !myTurn || view.phase !== "playing") return;
    adapter.dispatch({ type: "draw" });
  }

  function onPlayDrawn() {
    const card = view?.drawnCard;
    if (!card) return;
    if (card.color === null) {
      colorPickCard = card;
      colorPickFromDrawn = true;
    } else {
      adapter.dispatch({ type: "playDrawn" });
    }
  }

  function onKeepDrawn() {
    adapter.dispatch({ type: "keepDrawn" });
  }

  function onColor(color: Color) {
    const fromDrawn = colorPickFromDrawn;
    const card = colorPickCard;
    colorPickCard = null;
    colorPickFromDrawn = false;
    if (!card) return;
    if (fromDrawn) adapter.dispatch({ type: "playDrawn", chosenColor: color });
    else adapter.dispatch({ type: "play", cardId: card.id, chosenColor: color });
  }

  function onColorCancel() {
    colorPickCard = null;
    colorPickFromDrawn = false;
  }

  function onNewRound() {
    adapter.newGame({ botCount: settings.botCount, rules: settings.rules, lang: settings.lang });
  }

  /* ---------- Einstellungen & Theme ---------- */

  function onSettings(patch: Partial<Settings>) {
    const botsChanged = patch.botCount !== undefined && patch.botCount !== settings.botCount;
    settings = { ...settings, ...patch };
    saveSettings(settings);
    if (patch.rules) adapter.setRules(settings.rules);
    if (botsChanged || patch.lang !== undefined) {
      settingsOpen = false;
      onNewRound();
    }
    if (patch.timeLimit !== undefined && view) manageTimer(view);
  }

  function applyTheme(theme: Settings["theme"]) {
    document.documentElement.dataset.theme = theme;
  }

  function toggleTheme() {
    settings = { ...settings, theme: settings.theme === "dark" ? "light" : "dark" };
    saveSettings(settings);
    applyTheme(settings.theme);
  }

  /* ---------- Zugtimer (optional, Standard aus) ---------- */

  function manageTimer(v: PlayerView) {
    stopTicker();
    const active =
      settings.timeLimit > 0 &&
      v.phase === "playing" &&
      v.turn === v.you &&
      colorPickCard === null;
    if (!active) return;
    timeLeft = settings.timeLimit;
    ticker = setInterval(() => {
      const cur = view;
      if (!cur || cur.phase !== "playing" || cur.turn !== cur.you || colorPickCard !== null) {
        stopTicker();
        return;
      }
      timeLeft--;
      if (timeLeft <= 0) {
        stopTicker();
        onTimeout();
      }
    }, 1000);
  }

  function onTimeout() {
    if (!view || view.turn !== view.you || view.phase !== "playing") return;
    toast(t.timeout);
    adapter.dispatch({ type: "draw" });
    // view is reactive – re-read after dispatch to check updated phase
    const after = view;
    if (after?.phase === "drawnDecision") adapter.dispatch({ type: "keepDrawn" });
  }

  function stopTicker() {
    if (ticker) clearInterval(ticker);
    ticker = null;
    timeLeft = 0;
  }
</script>

<header>
  <div class="logo" aria-label="Farbduell">Farb<span>duell</span></div>
  <div class="header-actions">
    <button
      class="badge badge-btn"
      onclick={toggleTheme}
      aria-label={settings.theme === "dark" ? t.lightTheme : t.darkTheme}
    >
      {settings.theme === "dark" ? "☀️" : "🌙"}
    </button>
    <button
      class="badge badge-btn"
      onclick={() => (settingsOpen = true)}
      aria-label={t.settings}
      aria-haspopup="dialog"
    >
      ⚙️
    </button>
    <div class="badge" aria-live="off">{t.noTimeLimit}</div>
  </div>
</header>

<main>
  {#if view}
    {@const v = view}
    {@const seatOrder = v.players
      .map((p, i) => ({ ...p, idx: i }))
      .filter((p) => p.idx !== v.you)}
    <!--
      Seating runs clockwise around the table: left -> top -> right (the
      same order turns pass in when dir === 1). Turn order follows
      view.dir, so when dir is -1 the same seats are walked in reverse.
    -->
    {@const seated = v.dir === 1 ? seatOrder : seatOrder.slice().reverse()}
    {@const seatPositions = (
      seated.length === 1 ? ["top"]
      : seated.length === 2 ? ["left", "top"]
      : ["left", "top", "right"]
    ) as ("top" | "left" | "right")[]}
    <div class="game-layout">
      <!-- top opponent -->
      <div class="area-top">
        {#each seated as opp, i (opp.idx)}
          {#if seatPositions[i] === "top"}
            <OpponentFan view={view} lang={settings.lang} position="top" playerIdx={opp.idx} />
          {/if}
        {/each}
      </div>

      <!-- middle row: left / table / right -->
      <div class="area-middle">
        <div class="area-left">
          {#each seated as opp, i (opp.idx)}
            {#if seatPositions[i] === "left"}
              <OpponentFan view={view} lang={settings.lang} position="left" playerIdx={opp.idx} />
            {/if}
          {/each}
        </div>

        <div class="area-center">
          <Table {view} nudgeDraw={myTurn && view.phase === "playing" && !anyPlayable} ondraw={onDraw} lang={settings.lang} />
        </div>

        <div class="area-right">
          {#each seated as opp, i (opp.idx)}
            {#if seatPositions[i] === "right"}
              <OpponentFan view={view} lang={settings.lang} position="right" playerIdx={opp.idx} />
            {/if}
          {/each}
        </div>
      </div>

      <!-- bottom: player hand -->
      <div class="me">
        <div class="status" role="status" aria-live="polite" aria-atomic="true">{status}</div>
        {#if timeLeft > 0}
          <div class="timer" class:urgent={timeLeft <= 5} aria-live="polite" aria-atomic="true">⏱ {timeLeft} s</div>
        {/if}
        <Hand {view} onplay={onPlay} lang={settings.lang} showPlayable={settings.showPlayable} />
      </div>
    </div>
  {/if}
</main>

<div class="version">v{__APP_VERSION__}</div>

<div
  class="toast"
  class:show={toastVisible}
  class:shout={toastShout}
  role="status"
  aria-live="polite"
  aria-atomic="true"
>{toastText}</div>

<Modals
  {view}
  {settings}
  {colorPickCard}
  {settingsOpen}
  oncolor={onColor}
  oncolorcancel={onColorCancel}
  onplaydrawn={onPlayDrawn}
  onkeepdrawn={onKeepDrawn}
  onnewround={onNewRound}
  onsettings={onSettings}
  onclosesettings={() => (settingsOpen = false)}
/>

<style>
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    flex: 0 0 auto;
  }
  .logo {
    font-size: 1.15rem;
    font-weight: 800;
    letter-spacing: 0.02em;
  }
  .logo span { color: var(--logo-accent); }
  .header-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .badge {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--ink);
    background: var(--tuerkis);
    border-radius: 999px;
    padding: 4px 10px;
  }
  .badge-btn {
    background: var(--surface-2);
    color: var(--text);
    border: 1px solid var(--line);
    transition: background 0.15s;
  }
  .badge-btn:hover { background: var(--surface-2-h); }
  main {
    flex: 1 1 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .game-layout {
    flex: 1 1 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 4px 4px 0;
  }
  .area-top {
    flex: 0 0 auto;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    padding-bottom: 4px;
  }
  .area-middle {
    flex: 1 1 0;
    min-height: 0;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .area-left {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
  .area-center {
    flex: 1 1 0;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .area-right {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }
  .me {
    flex: 0 0 auto;
    padding: 8px 0 14px;
  }
  .status {
    text-align: center;
    font-size: 0.85rem;
    color: var(--muted);
    min-height: 1.4em;
    padding: 0 16px 8px;
    font-weight: 600;
  }
  .timer {
    text-align: center;
    font-size: 0.78rem;
    font-weight: 800;
    color: var(--muted);
    padding-bottom: 4px;
    font-variant-numeric: tabular-nums;
  }
  .timer.urgent { color: var(--koralle); }
  .toast {
    position: fixed;
    left: 50%;
    bottom: calc(var(--card-h) + 70px);
    transform: translateX(-50%) translateY(8px);
    background: var(--surface-2);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 8px 16px;
    font-size: 0.8rem;
    font-weight: 600;
    opacity: 0;
    transition: opacity 0.25s, transform 0.25s;
    z-index: 15;
    max-width: 86%;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
  }
  .toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  .toast.shout {
    background: var(--koralle);
    color: #fff;
    font-weight: 800;
  }
  .version {
    position: fixed;
    bottom: 6px;
    left: 10px;
    font-size: 0.6rem;
    color: var(--muted);
    opacity: 0.4;
    pointer-events: none;
    font-variant-numeric: tabular-nums;
  }
</style>
