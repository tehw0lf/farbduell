<script lang="ts">
  import type { Card as CardT, PlayerView } from "../engine/types.ts";
  import type { Lang } from "../i18n.ts";
  import { isPlayableInView } from "../viewHelpers.ts";
  import Card from "./Card.svelte";

  interface Props {
    view: PlayerView;
    onplay: (card: CardT) => void;
    lang: Lang;
  }
  let { view, onplay, lang }: Props = $props();

  const myTurn = $derived(view.turn === view.you && view.phase === "playing");
</script>

<div class="hand" class:my-turn={myTurn} role="list">
  {#each view.yourHand as card (card.id)}
    {@const playable = myTurn && isPlayableInView(view, card)}
    <div class="slot" class:playable class:dim={!playable} role="listitem">
      <Card {card} {playable} {lang} onclick={() => playable && onplay(card)} />
    </div>
  {/each}
</div>

<style>
  .hand {
    display: flex;
    gap: 0;
    overflow-x: auto;
    padding: 14px 18px 6px;
    scrollbar-width: thin;
    justify-content: safe center;
  }
  .slot { margin-left: -18px; transition: transform 0.18s, opacity 0.2s; }
  .slot:first-child { margin-left: 0; }
  .slot.dim { opacity: 0.55; }
  .slot.playable:hover,
  .slot.playable:focus-within {
    transform: translateY(-10px);
    z-index: 2;
    position: relative;
  }
  .my-turn .slot.playable :global(.card) {
    box-shadow: var(--shadow), 0 0 0 2px var(--ring);
  }
  @media (min-width: 600px) {
    .slot { margin-left: -12px; }
  }
</style>
