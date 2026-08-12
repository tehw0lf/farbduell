# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # dev server at http://localhost:5173
npm test           # engine + adapter tests (Node ≥ 22.6, no extra deps)
npm run build      # production build with PWA (output: dist/)
npm run preview    # serve dist/ locally – use this to test PWA installability
npm run check      # svelte-check + TypeScript type checking
```

**Pre-commit validation:**
```bash
npm run check && npm test && npm run build
```

No lint script exists; `npm run check` covers type errors.

**Before every push:** bump the version in `package.json` (patch for fixes/polish, minor for new features), then run `npm install` to update `package-lock.json`.

## Architecture

The core design principle: **the UI only knows the `GameAdapter` interface and the censored `PlayerView`**. It is unaware of whether a local engine or a remote server is behind the adapter.

### Engine (`src/lib/engine/`)

Pure reducer with no DOM, no timers, no side effects. The RNG state (`mulberry32`) lives inside `GameState` making everything deterministic and reproducible.

- **`types.ts`** – all shared types: `Card`, `GameState`, `Action`, `GameEvent`, `PlayerView`, `Rules`, `EngineError`
- **`deck.ts`** – builds the 108-card deck; `shuffle()` takes and returns the RNG seed
- **`engine.ts`** – `createGame()` and `reduce(state, action) → state`; throws `EngineError` on illegal moves

**The engine is language-free.** `EngineError` carries a stable `code` (`EngineErrorCode`) plus an English developer message for logs. The UI maps the code to a translated string via `t.errors[code]`; a future server can send the same code over the wire without knowing the client's language. When adding a rule violation: add the code to `ENGINE_ERROR_CODES`, throw it with an English message, and add texts to **both** language blocks in `i18n.ts` — a test asserts every code is translated everywhere.

- **`playable.ts`** – `canPlay(ctx, card)`: the single source of truth for legality. Engine, bot and UI all derive from it, so the rule cannot drift between them. `stacks(rules, value)` answers whether a card feeds the penalty pile in the current `stackMode`
- **`view.ts`** – `playerView(state, i)`: produces a `PlayerView` for player `i` with all opponents' hands hidden (only `cardCount` exposed)
- **`bot.ts`** – bot heuristic operating purely on `PlayerView`

### Adapter layer (`src/lib/adapter/`)

- **`types.ts`** – `GameAdapter` interface: `subscribe / dispatch / newGame / setRules / destroy`
- **`local.ts`** – `LocalAdapter`: runs engine + bots in the browser with `setTimeout`-based bot turns. The `generation` counter invalidates stale bot timers after `newGame()`.

### UI (`src/lib/components/`, `src/App.svelte`)

Svelte 5 components. `App.svelte` wires the adapter to the UI and manages toasts and the optional turn timer. Settings (bot count, rules, theme, time limit) are persisted to `localStorage` via `src/lib/settings.ts`.

## Multiplayer roadmap

The engine is designed for a future `RemoteAdapter` (WebSocket). The server would import the same `src/lib/engine/` files, hold `GameState` per room, apply `reduce()` authoritatively, and broadcast `playerView(state, i)` to each client. See the README for the full roadmap.

## Adding house rules

1. Add a field to `Rules` in [src/lib/engine/types.ts](src/lib/engine/types.ts). If the variants are mutually exclusive, model them as a union type (like `StackMode`) rather than several booleans — invalid combinations then cannot be represented at all
2. If the rule changes which cards are legal, put that in `canPlay()` in [src/lib/engine/playable.ts](src/lib/engine/playable.ts) — never inline it in the engine, bot or UI
3. Implement the turn effects in [src/lib/engine/engine.ts](src/lib/engine/engine.ts)
4. Write tests in [tests/engine.test.ts](tests/engine.test.ts) and add the rule to the mass-simulation cross product
5. Add a toggle in [src/lib/components/Modals.svelte](src/lib/components/Modals.svelte) and [src/lib/settings.ts](src/lib/settings.ts), plus strings in [src/lib/i18n.ts](src/lib/i18n.ts)
6. If the rule adds state to `GameState`, migrate persisted saves in [src/lib/adapter/local.ts](src/lib/adapter/local.ts)
