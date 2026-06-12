<script lang="ts">
  import type { PlayerView } from "../engine/types.ts";
  import type { Lang } from "../i18n.ts";
  import { TRANSLATIONS } from "../i18n.ts";

  interface Props {
    view: PlayerView;
    lang: Lang;
  }
  let { view, lang }: Props = $props();

  const t = $derived(TRANSLATIONS[lang]);

  const HUES = ["var(--koralle)", "var(--tuerkis)", "var(--lila)"];
  const opponents = $derived(
    view.players
      .map((p, i) => ({ ...p, idx: i }))
      .filter((p) => p.idx !== view.you)
  );
</script>

<div class="opponents" role="list" aria-label={t.opponents}>
  {#each opponents as opp, i (opp.idx)}
    <div
      class="opp"
      class:active={view.turn === opp.idx && view.phase !== "finished"}
      role="listitem"
      aria-label={`${opp.name}: ${opp.cardCount}`}
      aria-current={view.turn === opp.idx && view.phase !== "finished" ? "true" : undefined}
    >
      <div class="avatar" style="background:{HUES[i % HUES.length]}" aria-hidden="true">
        {opp.name[0]}
      </div>
      <div class="name">{opp.name}</div>
      <div class="count" aria-hidden="true">
        <span class="mini-back"></span>
        <span>{opp.cardCount}</span>
      </div>
      <div class="thinking" aria-hidden="true"><i></i><i></i><i></i></div>
    </div>
  {/each}
</div>

<style>
  .opponents {
    display: flex;
    justify-content: center;
    gap: 14px;
    padding: 4px 12px 10px;
    flex: 0 0 auto;
  }
  .opp {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: var(--radius);
    background: var(--surface);
    border: 1px solid var(--line);
    min-width: 86px;
    position: relative;
    transition: box-shadow 0.3s, transform 0.3s;
  }
  .opp.active {
    box-shadow: 0 0 0 2px var(--gold), 0 6px 18px rgba(0, 0, 0, 0.35);
    transform: translateY(2px);
  }
  .avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-weight: 800;
    font-size: 0.9rem;
    color: var(--ink);
  }
  .name {
    font-size: 0.75rem;
    color: var(--muted);
    font-weight: 600;
  }
  .count {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.8rem;
    font-weight: 700;
  }
  .mini-back {
    width: 14px;
    height: 21px;
    border-radius: 3px;
    background: repeating-linear-gradient(135deg, #3b2f63 0 4px, #2a2148 4px 8px);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }
  .thinking {
    position: absolute;
    top: -8px;
    right: -4px;
    background: var(--surface-2);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 2px 8px;
    opacity: 0;
    transition: opacity 0.25s;
  }
  .opp.active .thinking { opacity: 1; }
  .thinking i {
    display: inline-block;
    width: 4px;
    height: 4px;
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
</style>
