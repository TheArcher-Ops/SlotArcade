import type { Symbol } from './types';

/**
 * The gem symbols, ordered from most common (low payout) to rarest (high
 * payout), plus the Wild. Weights are relative (they sum to 100, so each is a
 * direct per-cell probability percentage); rarer gems appear less often and
 * pay more. The Wild substitutes for any gem and, as a full line, awards the
 * jackpot.
 *
 * Payouts are tuned for ~95% return-to-player across all three paylines (the
 * center row and both diagonals), accounting for the fact that one bet covers
 * all three lines and that multiple lines can win on a single spin. See
 * engine.test.ts for the RTP assertion that guards this tuning.
 */
export const SYMBOLS: Symbol[] = [
  { id: 'amethyst', name: 'Amethyst', glyph: '🟣', weight: 30, payout: 2 },
  { id: 'emerald', name: 'Emerald', glyph: '🟢', weight: 24, payout: 3 },
  { id: 'sapphire', name: 'Sapphire', glyph: '🔵', weight: 18, payout: 4 },
  { id: 'ruby', name: 'Ruby', glyph: '🔴', weight: 12, payout: 8 },
  { id: 'crown', name: 'Crown', glyph: '👑', weight: 7, payout: 15 },
  { id: 'diamond', name: 'Diamond', glyph: '💎', weight: 4, payout: 40 },
  { id: 'wild', name: 'Wild Orb', glyph: '🔮', weight: 5, payout: 0, isWild: true },
];

/**
 * Multiplier applied to the bet when all three cells on a payline land on the
 * Wild Orb. This is the top prize.
 */
export const JACKPOT_MULTIPLIER = 200;

/** Total of all symbol weights, used for weighted random selection. */
export const TOTAL_WEIGHT = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
