import type { Reel, Rng, Symbol, SpinEvaluation, SpinResult } from './types';
import { JACKPOT_MULTIPLIER, SYMBOLS, TOTAL_WEIGHT } from './symbols';

/**
 * mulberry32 — a tiny, fast, seedable PRNG. Seeding makes spins reproducible,
 * which keeps the unit tests deterministic.
 */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick a single symbol using weighted random selection. */
export function pickSymbol(rng: Rng): Symbol {
  let roll = rng() * TOTAL_WEIGHT;
  for (const symbol of SYMBOLS) {
    roll -= symbol.weight;
    if (roll < 0) return symbol;
  }
  // Floating-point guard: return the last symbol if the loop didn't.
  return SYMBOLS[SYMBOLS.length - 1];
}

/** Build one reel (3 vertically stacked symbols) from the RNG. */
function spinReel(rng: Rng): Reel {
  return [pickSymbol(rng), pickSymbol(rng), pickSymbol(rng)];
}

/** Spin all three reels, producing the visible 3x3 grid. */
export function spinReels(rng: Rng): SpinResult {
  return {
    reels: [spinReel(rng), spinReel(rng), spinReel(rng)],
  };
}

/** The center row (index 1) is the active payline. */
function paylineSymbols(result: SpinResult): [Symbol, Symbol, Symbol] {
  return [result.reels[0][1], result.reels[1][1], result.reels[2][1]];
}

/**
 * Evaluate the center payline.
 *
 * Rules:
 *  - Three Wilds → jackpot (bet × JACKPOT_MULTIPLIER).
 *  - Otherwise, all three positions must share a single non-wild gem, where a
 *    Wild substitutes for that gem. The payout is bet × that gem's multiplier.
 *  - Anything else pays nothing.
 */
export function evaluateSpin(result: SpinResult, bet: number): SpinEvaluation {
  const line = paylineSymbols(result);

  // All wilds → jackpot.
  if (line.every((s) => s.isWild)) {
    const wild = line[0];
    return {
      win: bet * JACKPOT_MULTIPLIER,
      isJackpot: true,
      matchedSymbol: wild,
    };
  }

  // Find the single non-wild gem on the line. If there is more than one
  // distinct gem, there is no win.
  const nonWilds = line.filter((s) => !s.isWild);
  const firstId = nonWilds[0].id;
  const allMatch = nonWilds.every((s) => s.id === firstId);

  if (allMatch) {
    const matched = nonWilds[0];
    return {
      win: bet * matched.payout,
      isJackpot: false,
      matchedSymbol: matched,
    };
  }

  return { win: 0, isJackpot: false, matchedSymbol: null };
}
