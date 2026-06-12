<script lang="ts">
  import type { Card } from "../engine/types.ts";
  import type { Lang } from "../i18n.ts";
  import { TRANSLATIONS } from "../i18n.ts";

  interface Props {
    card?: Card | null;
    faceUp?: boolean;
    playable?: boolean;
    lang?: Lang;
    onclick?: () => void;
    "aria-label"?: string;
  }
  let { card = null, faceUp = true, playable = false, lang = "de", onclick, "aria-label": ariaLabelOverride }: Props = $props();

  const t = $derived(TRANSLATIONS[lang]);

  function glyph(v: string): string {
    if (v === "skip") return "⊘";
    if (v === "reverse") return "⇄";
    if (v === "draw2") return "+2";
    return v;
  }

  const isWild = $derived(card !== null && card.color === null);
  const label = $derived(
    ariaLabelOverride
      ? ariaLabelOverride
      : !card ? t.cardBack
      : isWild ? (card.value === "wild4" ? t.wildPlusFour : t.wild)
      : `${t.colors[card.color!]} ${glyph(card.value)}`
  );
</script>

{#if onclick}
  <button
    class="card"
    class:back={!faceUp || !card}
    class:wild={faceUp && isWild}
    class:playable
    style={faceUp && card && !isWild ? `--card-color: var(--${card.color})` : ""}
    aria-label={label}
    {onclick}
  >
    {#if faceUp && card}
      {#if isWild}
        <span class="wheel" aria-hidden="true"></span>
        {#if card.value === "wild4"}<span class="plus" aria-hidden="true">+4</span>{/if}
      {:else}
        <span class="glyph" aria-hidden="true">{glyph(card.value)}</span>
        <span class="idx tl" aria-hidden="true">{glyph(card.value)}</span>
        <span class="idx br" aria-hidden="true">{glyph(card.value)}</span>
      {/if}
    {/if}
  </button>
{:else}
  <div
    class="card"
    class:back={!faceUp || !card}
    class:wild={faceUp && isWild}
    style={faceUp && card && !isWild ? `--card-color: var(--${card.color})` : ""}
    role="img"
    aria-label={label}
  >
    {#if faceUp && card}
      {#if isWild}
        <span class="wheel" aria-hidden="true"></span>
        {#if card.value === "wild4"}<span class="plus" aria-hidden="true">+4</span>{/if}
      {:else}
        <span class="glyph" aria-hidden="true">{glyph(card.value)}</span>
        <span class="idx tl" aria-hidden="true">{glyph(card.value)}</span>
        <span class="idx br" aria-hidden="true">{glyph(card.value)}</span>
      {/if}
    {/if}
  </div>
{/if}

<style>
  .card {
    width: var(--card-w);
    height: var(--card-h);
    border-radius: 10px;
    position: relative;
    flex: 0 0 auto;
    box-shadow: var(--shadow);
    display: grid;
    place-items: center;
    border: 2px solid rgba(255, 255, 255, 0.85);
    background: linear-gradient(
      160deg,
      color-mix(in srgb, var(--card-color) 80%, white),
      var(--card-color)
    );
    transition: transform 0.18s, box-shadow 0.18s, opacity 0.2s;
  }
  .card.wild {
    background: linear-gradient(160deg, #2b2440, #181426);
  }
  .card.back {
    background: repeating-linear-gradient(135deg, #3b2f63 0 9px, #2a2148 9px 18px);
    border-color: rgba(255, 255, 255, 0.25);
  }
  .card.back::after {
    content: "FD";
    font-weight: 800;
    color: rgba(255, 255, 255, 0.55);
    font-size: 1rem;
    letter-spacing: 0.05em;
  }
  .glyph {
    font-size: 1.9rem;
    font-weight: 800;
    color: #fff;
    text-shadow: 0 2px 0 rgba(0, 0, 0, 0.22);
    line-height: 1;
  }
  .idx {
    position: absolute;
    font-size: 0.7rem;
    font-weight: 800;
    color: #fff;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.25);
  }
  .idx.tl { top: 5px; left: 7px; }
  .idx.br { bottom: 5px; right: 7px; transform: rotate(180deg); }
  .wheel {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: conic-gradient(
      var(--koralle) 0 25%, var(--gold) 25% 50%,
      var(--tuerkis) 50% 75%, var(--lila) 75% 100%
    );
    border: 2px solid rgba(255, 255, 255, 0.9);
  }
  .plus {
    position: absolute;
    bottom: 14px;
    font-size: 0.95rem;
    font-weight: 800;
    color: #fff;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
  }
  button.card:not(.playable) { cursor: default; }
  .playable { cursor: pointer; }
  @media (min-width: 600px) {
    .glyph { font-size: 2.3rem; }
  }
</style>
