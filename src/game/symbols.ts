import type { Symbol } from './types';

/**
 * The gem symbols, ordered from most common (low payout) to rarest (high
 * payout), plus the Wild. Weights are relative; rarer gems appear less often
 * and pay more. The Wild substitutes for any gem and, as a full line, awards
 * the jackpot.
 */
export const SYMBOLS: Symbol[] = [
  { id: 'amethyst', name: 'Amethyst', glyph: '🟣', weight: 30, payout: 5 },
  { id: 'emerald', name: 'Emerald', glyph: '🟢', weight: 24, payout: 8 },
  { id: 'sapphire', name: 'Sapphire', glyph: '🔵', weight: 18, payout: 12 },
  { id: 'ruby', name: 'Ruby', glyph: '🔴', weight: 12, payout: 20 },
  { id: 'crown', name: 'Crown', glyph: '👑', weight: 7, payout: 40 },
  { id: 'diamond', name: 'Diamond', glyph: '💎', weight: 4, payout: 80 },
  { id: 'wild', name: 'Wild Orb', glyph: '🔮', weight: 5, payout: 0, isWild: true },
];

/**
 * Multiplier applied to the bet when all three reels land on the Wild Orb.
 * This is the top prize.
 */
export const JACKPOT_MULTIPLIER = 250;

/** Total of all symbol weights, used for weighted random selection. */
export const TOTAL_WEIGHT = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
