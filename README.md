# 💎 Gem Reels — SlotArcade

A polished, browser-based **3-reel fantasy slot machine** built with **React + Vite + TypeScript**.
Spin the reels, match three gems along any of three paylines, and chase the Wild Orb jackpot.

> Play money only. This is an entertainment demo with no real-money gambling.

## Features

- **3×3 reels with 3 paylines** — the center row plus both diagonals (which form an X). Multiple
  lines can win on one spin and the payouts add up. Classic staggered reel stop.
- **Fantasy gem theme** — Amethyst, Emerald, Sapphire, Ruby, Crown, and Diamond, each with
  weighted rarity and its own payout.
- **Wild Orb** 🔮 that substitutes for any gem to complete a line; three Wilds award the **jackpot**.
- **Balanced payouts** — the paytable is tuned for ~95% return-to-player across all three lines
  (guarded by a unit test), so wins are frequent but the game stays fair.
- **Betting & credits** — adjustable bet, starting balance of 1,000 credits, deposit buttons to
  top up, persisted to `localStorage` so your balance survives a refresh.
- **Win & jackpot animations** — winning paylines glow, plus a celebratory overlay and a special
  jackpot flourish.
- **Sound effects & background music** synthesized with the Web Audio API (no audio files), with
  a mute toggle.

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

## 📱 Android APK

The game is wrapped as a native Android app with [Capacitor](https://capacitorjs.com/),
so it can be installed as an `.apk`.

### Download the prebuilt APK (easiest)

A GitHub Actions workflow builds the APK on every push and uploads it as a downloadable artifact:

1. Open the repo's **Actions** tab → **Build Android APK** → the latest successful run.
2. Download the **`gem-reels-debug-apk`** artifact and unzip it to get `app-debug.apk`.
3. Copy it to an Android device and install (enable *Install unknown apps* for your file manager).

Pushing a tag like `v1.0.0` also attaches the APK to a **GitHub Release** for a stable download link.

> The APK is a **debug build** signed with Android's debug key — perfect for sideloading and
> testing, but not for Play Store distribution (that needs a release keystore).

### Build the APK yourself

Requires a **JDK (17+)** and the **Android SDK** (e.g. via Android Studio). Then:

```bash
npm install
npm run android:apk     # builds the web app, syncs Capacitor, and runs Gradle
# → android/app/build/outputs/apk/debug/app-debug.apk
```

Or open the native project in Android Studio to run on a device/emulator:

```bash
npm run android:open
```

> Note: this can't be built inside the Claude Code web sandbox because Google's SDK/Maven
> servers are not reachable there — use GitHub Actions or a local machine.

## How it works

The code separates **pure game logic** from the **React UI** so the core is fully testable
without a DOM.

- `src/game/` — symbol definitions, a seedable RNG (mulberry32), weighted reel spinning, and
  payline evaluation. Covered by `src/game/engine.test.ts`.
- `src/state/useGameState.ts` — a React hook holding credits, bet, spin timing, deposits, and
  `localStorage` persistence.
- `src/components/` — the slot machine, reels, controls, paylines overlay, paytable, and win overlay.
- `src/audio/sounds.ts` — Web Audio sound effects and background music.

## Game rules

- There are **3 paylines**: the center row (D-E-F) and both diagonals (A-E-I and C-E-G), which
  together form an X.
- Three matching gems on a line pay `bet × the gem's multiplier` (see the in-game paytable).
  Multiple lines can win on the same spin and their payouts add up.
- A **Wild Orb** substitutes for any gem; **three Wilds** on a line pay the jackpot (`bet × 200`).
- Rarer gems appear less often and pay more. The paytable is tuned for ~95% return-to-player.
