<script lang="ts">
  import type { PlayerView } from "../engine/types.ts";
  import type { Lang } from "../i18n.ts";
  import { TRANSLATIONS } from "../i18n.ts";
  import Card from "./Card.svelte";

  interface Props {
    view: PlayerView;
    nudgeDraw: boolean;
    ondraw: () => void;
    lang: Lang;
  }
  let { view, nudgeDraw, ondraw, lang }: Props = $props();

  const t = $derived(TRANSLATIONS[lang]);
</script>

<div class="table" role="region" aria-label={t.currentColor}>
  <div class="meta-row" aria-live="polite" aria-atomic="true">
    <span>{t.direction}</span>
    <span class="arrow" style="transform:scaleX({view.dir})" aria-hidden="true">⟳</span>
  </div>

  <div class="piles">
    <div class="pile">
      <div class="draw-wrap" class:nudge={nudgeDraw}>
        <Card faceUp={false} playable onclick={ondraw} {lang} aria-label={t.drawPile(view.drawPileCount)} />
      </div>
      <div class="pile-label" aria-hidden="true">{t.drawPile(view.drawPileCount)}</div>
    </div>

    <div class="pile">
      <Card card={view.topCard} {lang} />
      <div class="pile-label" aria-hidden="true">{t.discardPile}</div>
    </div>
  </div>

  <div class="meta-row" aria-live="polite" aria-atomic="true">
    <span>{t.currentColor}</span>
    <span
      class="color-dot"
      role="img"
      style="background:var(--{view.color})"
      aria-label={t.colors[view.color]}
    ></span>
  </div>
</div>

<style>
  .table {
    flex: 1 1 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 6px 0;
  }
  .piles {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 26px;
  }
  .pile {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .pile-label {
    font-size: 0.68rem;
    color: var(--muted);
    text-align: center;
    margin-top: 6px;
    font-weight: 600;
  }
  .meta-row {
    font-size: 0.75rem;
    color: var(--muted);
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }
  .arrow {
    font-size: 1rem;
    transition: transform 0.4s;
    display: inline-block;
  }
  .color-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid var(--dot-border);
    flex-shrink: 0;
  }
  .draw-wrap { transition: transform 0.2s; }
  .draw-wrap:hover { transform: translateY(-4px); }
  .draw-wrap.nudge { animation: nudge 2.4s ease-in-out infinite; }
  @keyframes nudge {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
</style>
