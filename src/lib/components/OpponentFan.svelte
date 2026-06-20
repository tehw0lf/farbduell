<script lang="ts">
  import { onMount } from "svelte";
  import type { PlayerView } from "../engine/types.ts";
  import type { Lang } from "../i18n.ts";

  interface Props {
    view: PlayerView;
    lang: Lang;
    position: "top" | "left" | "right";
    playerIdx: number;
  }
  let { view, lang, position, playerIdx }: Props = $props();

  const player = $derived(view.players[playerIdx]);
  const isActive = $derived(view.turn === playerIdx && view.phase !== "finished");

  const MAX_VISIBLE = 8;
  const displayCount = $derived(Math.min(player.cardCount, MAX_VISIBLE));

  // Mirrors the --card-w/--card-h breakpoint in app.css
  let isWide = $state(false);
  onMount(() => {
    const mq = matchMedia("(min-width: 600px)");
    isWide = mq.matches;
    const onChange = (e: MediaQueryListEvent) => (isWide = e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  });

  const CW = $derived(isWide ? 64 : 52);
  const CH = $derived(isWide ? 96 : 78);
  const PIVOT = $derived(isWide ? 120 : 100);

  // Spread scales with card count so 1-2 cards look natural, 8 stays wide
  const spread = $derived(Math.min(8, displayCount - 1) * 6);

  const cardTransforms = $derived(
    Array.from({ length: displayCount }, (_, i) => {
      const norm = displayCount === 1 ? 0 : (i / (displayCount - 1)) - 0.5;
      return norm * spread;
    })
  );

  // Geometric width: outermost card tip swings (CH+PIVOT)*sin(spread/2) from center
  const halfAngle = $derived((spread / 2) * Math.PI / 180);
  const tipSwing = $derived((CH + PIVOT) * Math.sin(halfAngle));
  const fanW = $derived(Math.ceil(Math.max(CW + 20, tipSwing * 2 + CW)));
  // Height = card + arc rise
  const arcRise = $derived(PIVOT * (1 - Math.cos(halfAngle)));
  const fanH = $derived(Math.ceil(CH + arcRise + 4));
</script>

<div
  class="wrapper"
  class:pos-left={position === "left"}
  class:pos-right={position === "right"}
  class:active={isActive}
  title="{player.name}: {player.cardCount} {player.cardCount === 1 ? 'Karte' : 'Karten'}"
  role="listitem"
  aria-label="{player.name}: {player.cardCount}"
  aria-current={isActive ? "true" : undefined}
>
  <div
    class="fan"
    aria-hidden="true"
    style="width:{fanW}px; height:{fanH}px"
  >
    {#each cardTransforms as deg, i (i)}
      <div
        class="card-back"
        style="
          width:{CW}px;
          height:{CH}px;
          left:calc(50% - {CW / 2}px);
          bottom:0;
          transform-origin: center {CH + PIVOT}px;
          transform: rotate({deg}deg);
          z-index:{i};
        "
      ></div>
    {/each}
  </div>

  <div class="label">
    <span class="name">{player.name}</span>
    <span class="count">{player.cardCount}</span>
  </div>

  {#if isActive}
    <div class="thinking" aria-hidden="true"><i></i><i></i><i></i></div>
  {/if}
</div>

<style>
  .wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    position: relative;
  }

  /* Side players: rotate the whole thing and reflow label */
  .pos-left {
    flex-direction: row;
    gap: 6px;
    align-items: center;
  }
  .pos-right {
    flex-direction: row-reverse;
    gap: 6px;
    align-items: center;
  }

  .pos-left .fan {
    transform: rotate(90deg);
  }
  .pos-right .fan {
    transform: rotate(-90deg);
  }

  .fan {
    position: relative;
    flex-shrink: 0;
    overflow: visible;
  }

  .card-back {
    position: absolute;
    border-radius: 5px;
    background: repeating-linear-gradient(135deg, #3b2f63 0 5px, #2a2148 5px 10px);
    border: 1.5px solid rgba(255, 255, 255, 0.22);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.32);
  }

  .label {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }

  .wrapper.pos-left .label,
  .wrapper.pos-right .label {
    align-items: flex-start;
  }

  .name {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--muted);
    max-width: 64px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .count {
    font-size: 0.72rem;
    font-weight: 800;
    color: var(--text);
    background: var(--surface-2);
    border-radius: 999px;
    padding: 1px 6px;
    border: 1px solid var(--line);
  }

  .wrapper.active .count {
    background: var(--gold);
    color: var(--ink);
    border-color: transparent;
  }

  .thinking {
    position: absolute;
    top: -4px;
    right: -4px;
    background: var(--surface-2);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 2px 6px;
  }

  .thinking i {
    display: inline-block;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--muted);
    margin: 0 1px;
    animation: blink 1.2s infinite;
  }

  .thinking i:nth-child(2) { animation-delay: 0.2s; }
  .thinking i:nth-child(3) { animation-delay: 0.4s; }

  @keyframes blink {
    0%, 80%, 100% { opacity: 0.25; }
    40% { opacity: 1; }
  }

  @media (min-width: 600px) {
    .name { font-size: 0.8rem; max-width: 90px; }
    .count { font-size: 0.8rem; }
  }
</style>
