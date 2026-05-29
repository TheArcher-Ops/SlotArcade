# 💎 Gem Reels — SlotArcade

A polished, browser-based **3-reel fantasy slot machine** built with **React + Vite + TypeScript**.
Spin the reels, match three gems across the center payline, and chase the Wild Orb jackpot.

> Play money only. This is an entertainment demo with no real-money gambling.

## Features

- **3-reel slot** with a single center payline and a classic staggered reel stop.
- **Fantasy gem theme** — Amethyst, Emerald, Sapphire, Ruby, Crown, and Diamond, each with
  weighted rarity and its own payout.
- **Wild Orb** 🔮 that substitutes for any gem to complete a line; three Wilds award the **jackpot**.
- **Betting & credits** — adjustable bet, starting balance of 1,000 credits, persisted to
  `localStorage` so your balance survives a refresh.
- **Win & jackpot animations** — reel highlight, celebratory overlay, and a special jackpot flourish.
- **Sound effects** synthesized with the Web Audio API (no audio files), with a mute toggle.
- **Autoplay** that keeps spinning until you stop it or run out of credits.

## Getting started

```bash
npm install
npm run dev      # start the dev server, then open the printed URL
```

Other scripts:

```bash
npm run build    # type-check and produce a production build in dist/
npm run preview  # serve the production build locally
npm test         # run the engine unit tests (Vitest)
```

## How it works

The code separates **pure game logic** from the **React UI** so the core is fully testable
without a DOM.

- `src/game/` — symbol definitions, a seedable RNG (mulberry32), weighted reel spinning, and
  payline evaluation. Covered by `src/game/engine.test.ts`.
- `src/state/useGameState.ts` — a React hook holding credits, bet, spin timing, autoplay, and
  `localStorage` persistence.
- `src/components/` — the slot machine, reels, controls, paytable, and win overlay.
- `src/audio/sounds.ts` — Web Audio sound effects.

## Game rules

- Only the **center row** pays.
- Three matching gems pay `bet × the gem's multiplier` (see the in-game paytable).
- A **Wild Orb** substitutes for any gem; **three Wilds** pay the jackpot (`bet × 250`).
- Rarer gems appear less often and pay more.
