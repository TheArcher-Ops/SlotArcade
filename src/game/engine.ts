import type { LineWin, Payline, Reel, Rng, Symbol, SpinEvaluation, SpinResult } from './types';
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

/**
 * The three active paylines, each passing through the center cell:
 *  - center: D-E-F (center row)
 *  - diagDown: A-E-I (top-left → bottom-right)
 *  - diagUp: C-E-G (top-right → bottom-left)
 * Together the two diagonals form an "X".
 */
export const PAYLINES: Payline[] = [
  { id: 'center', name: 'Center Row', cells: [[0, 1], [1, 1], [2, 1]] },
  { id: 'diagDown', name: 'Diagonal ↘', cells: [[0, 0], [1, 1], [2, 2]] },
  { id: 'diagUp', name: 'Diagonal ↗', cells: [[0, 2], [1, 1], [2, 0]] },
];

/** The three symbols sitting on a payline, ordered left-to-right by reel. */
function symbolsOnLine(result: SpinResult, line: Payline): [Symbol, Symbol, Symbol] {
  const [a, b, c] = line.cells;
  return [
    result.reels[a[0]][a[1]],
    result.reels[b[0]][b[1]],
    result.reels[c[0]][c[1]],
  ];
}

/**
 * Evaluate a single payline.
 *
 * Rules:
 *  - Three Wilds → jackpot (bet × JACKPOT_MULTIPLIER).
 *  - Otherwise, all three positions must share a single non-wild gem, where a
 *    Wild substitutes for that gem. The payout is bet × that gem's multiplier.
 *  - Anything else pays nothing (returns null).
 */
function evaluateLine(line: Payline, symbols: [Symbol, Symbol, Symbol], bet: number): LineWin | null {
  // All wilds → jackpot.
  if (symbols.every((s) => s.isWild)) {
    return { lineId: line.id, symbol: symbols[0], isJackpot: true, win: bet * JACKPOT_MULTIPLIER };
  }

  // All non-wild gems must be the same (wilds substitute).
  const nonWilds = symbols.filter((s) => !s.isWild);
  const firstId = nonWilds[0].id;
  if (nonWilds.every((s) => s.id === firstId)) {
    const matched = nonWilds[0];
    return { lineId: line.id, symbol: matched, isJackpot: false, win: bet * matched.payout };
  }

  return null;
}

/**
 * Evaluate a spin across all paylines. Every winning line pays independently
 * and the payouts are summed.
 */
export function evaluateSpin(result: SpinResult, bet: number): SpinEvaluation {
  const lineWins: LineWin[] = [];
  for (const line of PAYLINES) {
    const win = evaluateLine(line, symbolsOnLine(result, line), bet);
    if (win) lineWins.push(win);
  }

  const total = lineWins.reduce((sum, w) => sum + w.win, 0);
  const isJackpot = lineWins.some((w) => w.isJackpot);
  // The highest-paying line's symbol drives the win overlay's display.
  const best = lineWins.reduce<LineWin | null>(
    (b, w) => (b === null || w.win > b.win ? w : b),
    null,
  );

  return {
    win: total,
    isJackpot,
    matchedSymbol: best?.symbol ?? null,
    lineWins,
  };
}
