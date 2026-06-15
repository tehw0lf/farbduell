<script lang="ts">
  import { tick } from "svelte";
  import type { Card as CardT, Color, PlayerView } from "../engine/types.ts";
  import { COLORS } from "../engine/types.ts";
  import type { Settings } from "../settings.ts";
  import type { Lang } from "../i18n.ts";
  import { TRANSLATIONS } from "../i18n.ts";
  import Card from "./Card.svelte";

  interface Props {
    view: PlayerView | null;
    settings: Settings;
    colorPickCard: CardT | null;
    settingsOpen: boolean;
    oncolor: (color: Color) => void;
    oncolorcancel: () => void;
    onplaydrawn: () => void;
    onkeepdrawn: () => void;
    onnewround: () => void;
    onsettings: (patch: Partial<Settings>) => void;
    onclosesettings: () => void;
  }
  let {
    view, settings, colorPickCard, settingsOpen,
    oncolor, oncolorcancel, onplaydrawn, onkeepdrawn,
    onnewround, onsettings, onclosesettings,
  }: Props = $props();

  const t = $derived(TRANSLATIONS[settings.lang]);

  const TIMES = [0, 30, 60, 90] as const;
  const LANGS: { value: Lang; label: string }[] = [
    { value: "de", label: "Deutsch" },
    { value: "en", label: "English" },
  ];

  const drawnOpen = $derived(
    view?.phase === "drawnDecision" && view.drawnCard !== null && colorPickCard === null
  );
  const endOpen = $derived(view?.phase === "finished");
  const youWon = $derived(view?.winner === view?.you);

  // Focus the first focusable element when a modal opens
  let colorPanel = $state<HTMLElement | null>(null);
  let drawnPanel = $state<HTMLElement | null>(null);
  let endPanel = $state<HTMLElement | null>(null);
  let settingsPanel = $state<HTMLElement | null>(null);

  let shaking = $state<"color" | "drawn" | "end" | "settings" | null>(null);

  function shake(which: "color" | "drawn" | "end" | "settings") {
    shaking = which;
    setTimeout(() => (shaking = null), 400);
  }

  $effect(() => {
    if (colorPickCard !== null) focusPanel(colorPanel);
  });
  $effect(() => {
    if (drawnOpen) focusPanel(drawnPanel);
  });
  $effect(() => {
    if (endOpen) focusPanel(endPanel);
  });
  $effect(() => {
    if (settingsOpen) focusPanel(settingsPanel);
  });

  async function focusPanel(panel: HTMLElement | null) {
    if (!panel) return;
    await tick();
    const el = panel.querySelector<HTMLElement>("button, [href], input, [tabindex]");
    el?.focus();
  }

  function trapFocus(e: KeyboardEvent, panel: HTMLElement | null) {
    if (e.key !== "Tab" || !panel) return;
    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>("button, [href], input, [tabindex]")
    ).filter((el) => !el.hasAttribute("disabled"));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
</script>

<!-- Farbwahl -->
<div
  class="overlay"
  class:show={colorPickCard !== null}
  role="dialog"
  aria-modal="true"
  aria-labelledby="color-title"
  aria-hidden={colorPickCard === null}
  onkeydown={(e) => { if (e.key === "Escape") oncolorcancel(); trapFocus(e, colorPanel); }}
  onclick={(e) => { if (e.target === e.currentTarget) shake("color"); }}
>
  <div class="panel" class:shake={shaking === "color"} bind:this={colorPanel}>
    <h2 id="color-title">{t.chooseColor}</h2>
    <p>{t.chooseColorHint}</p>
    <div class="color-grid" role="group" aria-label={t.chooseColor}>
      {#each COLORS as c (c)}
        <button style="background:var(--{c})" onclick={() => oncolor(c)}>
          {t.colors[c]}
        </button>
      {/each}
    </div>
    <button class="btn spaced" onclick={oncolorcancel}>{t.cancel}</button>
  </div>
</div>

<!-- Gezogene Karte -->
<div
  class="overlay"
  class:show={drawnOpen}
  role="dialog"
  aria-modal="true"
  aria-labelledby="drawn-title"
  aria-hidden={!drawnOpen}
  onkeydown={(e) => trapFocus(e, drawnPanel)}
  onclick={(e) => { if (e.target === e.currentTarget) shake("drawn"); }}
>
  <div class="panel" class:shake={shaking === "drawn"} bind:this={drawnPanel}>
    <h2 id="drawn-title">{t.drawnFits}</h2>
    <p>{t.drawnFitsHint}</p>
    {#if view?.drawnCard}
      <div class="drawn-slot"><Card card={view.drawnCard} lang={settings.lang} /></div>
    {/if}
    <div class="btn-row">
      <button class="btn" onclick={onkeepdrawn}>{t.keep}</button>
      <button class="btn primary" onclick={onplaydrawn}>{t.play}</button>
    </div>
  </div>
</div>

<!-- Rundenende -->
<div
  class="overlay"
  class:show={endOpen}
  role="dialog"
  aria-modal="true"
  aria-labelledby="end-title"
  aria-hidden={!endOpen}
  onkeydown={(e) => trapFocus(e, endPanel)}
  onclick={(e) => { if (e.target === e.currentTarget) shake("end"); }}
>
  <div class="panel" class:shake={shaking === "end"} bind:this={endPanel}>
    <h2 id="end-title">
      {youWon ? t.youWon : t.opponentWon(view?.players[view.winner ?? 0].name ?? "")}
    </h2>
    <p>{youWon ? t.youWonHint : t.opponentWonHint}</p>
    <div class="btn-row">
      <button class="btn primary" onclick={onnewround}>{t.newRound}</button>
    </div>
  </div>
</div>

<!-- Einstellungen -->
<div
  class="overlay"
  class:show={settingsOpen}
  role="dialog"
  aria-modal="true"
  aria-labelledby="settings-title"
  aria-hidden={!settingsOpen}
  onkeydown={(e) => { if (e.key === "Escape") onclosesettings(); trapFocus(e, settingsPanel); }}
  onclick={(e) => { if (e.target === e.currentTarget) shake("settings"); }}
>
  <div class="panel settings-panel" class:shake={shaking === "settings"} bind:this={settingsPanel}>
    <div class="panel-scroll">
    <h2 id="settings-title">{t.settingsTitle}</h2>
    <p>{t.settingsHint}</p>

    <div class="set-label" id="opponents-label">{t.opponents}</div>
    <div class="btn-row" role="group" aria-labelledby="opponents-label">
      {#each [1, 2, 3] as n (n)}
        <button
          class="btn"
          class:active={settings.botCount === n}
          aria-pressed={settings.botCount === n}
          onclick={() => onsettings({ botCount: n })}
        >
          {t.bot(n)}
        </button>
      {/each}
    </div>

    <div class="set-label">{t.houseRules}</div>
    <button
      class="rule"
      class:on={settings.rules.stack2}
      aria-pressed={settings.rules.stack2}
      onclick={() => onsettings({ rules: { ...settings.rules, stack2: !settings.rules.stack2 } })}
    >
      <span class="rule-check" aria-hidden="true"></span>
      <span class="rule-text">
        <strong>{t.stack2Label}</strong>
        {t.stack2Desc}
      </span>
    </button>
    <button
      class="rule"
      class:on={settings.rules.drawToMatch}
      aria-pressed={settings.rules.drawToMatch}
      onclick={() => onsettings({ rules: { ...settings.rules, drawToMatch: !settings.rules.drawToMatch } })}
    >
      <span class="rule-check" aria-hidden="true"></span>
      <span class="rule-text">
        <strong>{t.drawToMatchLabel}</strong>
        {t.drawToMatchDesc}
      </span>
    </button>

    <div class="set-label" id="timelimit-label">{t.timeLimitLabel}</div>
    <div class="btn-row" role="group" aria-labelledby="timelimit-label">
      {#each TIMES as time (time)}
        <button
          class="btn"
          class:active={settings.timeLimit === time}
          aria-pressed={settings.timeLimit === time}
          onclick={() => onsettings({ timeLimit: time })}
        >
          {time === 0 ? t.timeLimitOff : `${time} s`}
        </button>
      {/each}
    </div>
    <p class="hint">{t.timeLimitHint}</p>

    <div class="set-label" id="lang-label">{t.language}</div>
    <div class="btn-row" role="group" aria-labelledby="lang-label">
      {#each LANGS as l (l.value)}
        <button
          class="btn"
          class:active={settings.lang === l.value}
          aria-pressed={settings.lang === l.value}
          onclick={() => onsettings({ lang: l.value })}
        >
          {l.label}
        </button>
      {/each}
    </div>

    <div class="set-label" id="sound-label">{t.sound}</div>
    <div class="btn-row" role="group" aria-labelledby="sound-label">
      <button
        class="btn"
        class:active={settings.sound}
        aria-pressed={settings.sound}
        onclick={() => onsettings({ sound: true })}
      >{t.soundOn}</button>
      <button
        class="btn"
        class:active={!settings.sound}
        aria-pressed={!settings.sound}
        onclick={() => onsettings({ sound: false })}
      >{t.soundOff}</button>
    </div>

    <div class="set-label">{t.showPlayableLabel}</div>
    <button
      class="rule"
      class:on={settings.showPlayable}
      aria-pressed={settings.showPlayable}
      onclick={() => onsettings({ showPlayable: !settings.showPlayable })}
    >
      <span class="rule-check" aria-hidden="true"></span>
      <span class="rule-text">
        <strong>{t.showPlayableLabel}</strong>
        {t.showPlayableDesc}
      </span>
    </button>

    </div>
    <div class="panel-footer">
      <button class="btn" onclick={onclosesettings}>{t.close}</button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: var(--backdrop);
    display: grid;
    place-items: center;
    z-index: 20;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s;
  }
  .overlay.show {
    opacity: 1;
    pointer-events: auto;
  }
  .panel {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: 24px 22px;
    max-width: 340px;
    width: 88%;
    max-height: 86dvh;
    overflow-y: auto;
    text-align: center;
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.5);
  }
  .settings-panel {
    display: flex;
    flex-direction: column;
    overflow-y: hidden;
    padding: 0;
  }
  .panel-scroll {
    overflow-y: auto;
    padding: 24px 22px 8px;
    flex: 1 1 auto;
  }
  .panel-footer {
    flex: 0 0 auto;
    padding: 12px 22px 18px;
    border-top: 1px solid var(--line);
  }
  .panel-footer .btn { width: 100%; }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-8px); }
    40%       { transform: translateX(8px); }
    60%       { transform: translateX(-5px); }
    80%       { transform: translateX(5px); }
  }
  .shake { animation: shake 0.4s ease; }
  .panel h2 { font-size: 1.2rem; margin-bottom: 6px; }
  .panel p { font-size: 0.85rem; color: var(--muted); margin-bottom: 16px; }
  .panel p.hint { font-size: 0.72rem; margin: 8px 0 0; }
  .color-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .color-grid button {
    border-radius: 12px;
    padding: 16px 8px;
    font-weight: 800;
    color: #fff;
    font-size: 0.9rem;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.3);
    transition: transform 0.15s;
  }
  .color-grid button:hover { transform: scale(1.04); }
  .btn-row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
  .spaced { margin-top: 14px; }
  .drawn-slot { display: grid; place-items: center; margin-bottom: 16px; }
  .set-label {
    text-align: left;
    font-size: 0.7rem;
    font-weight: 800;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 16px 0 8px;
  }
  .rule {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    width: 100%;
    background: var(--surface-2);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 10px 12px;
    margin-bottom: 8px;
    text-align: left;
    transition: background 0.15s;
  }
  .rule:hover { background: var(--surface-2-h); }
  .rule-check {
    flex: 0 0 auto;
    width: 20px;
    height: 20px;
    border-radius: 6px;
    margin-top: 1px;
    border: 2px solid var(--muted);
    display: grid;
    place-items: center;
    font-size: 0.75rem;
    font-weight: 900;
    color: var(--ink);
  }
  .rule.on .rule-check {
    background: var(--gold);
    border-color: var(--gold);
  }
  .rule.on .rule-check::after { content: "✓"; }
  .rule-text {
    font-size: 0.78rem;
    color: var(--muted);
    line-height: 1.35;
  }
  .rule-text strong {
    display: block;
    color: var(--text);
    font-size: 0.85rem;
    margin-bottom: 2px;
  }
</style>
