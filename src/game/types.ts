/** A single slot symbol (a gem, or the wild). */
export interface Symbol {
  /** Stable identifier, e.g. "diamond". */
  id: string;
  /** Human-readable name shown in the paytable. */
  name: string;
  /** The glyph rendered on the reel. */
  glyph: string;
  /**
   * Relative selection weight. Higher = more common. Rare gems have low
   * weights and correspondingly high payouts.
   */
  weight: number;
  /** Payout multiplier applied to the bet for a 3-of-a-kind on the payline. */
  payout: number;
  /** True for the wild symbol, which substitutes for any gem. */
  isWild?: boolean;
}

/**
 * One reel is the column of symbols currently visible. We show 3 rows per
 * reel; index 1 (the center row) is the active payline.
 */
export type Reel = [Symbol, Symbol, Symbol];

/** The visible 3x3 grid produced by a spin. */
export interface SpinResult {
  reels: [Reel, Reel, Reel];
}

/** The outcome of evaluating a spin against the payline. */
export interface SpinEvaluation {
  /** Credits won (0 when there is no winning combination). */
  win: number;
  /** True when the win is the all-wild jackpot. */
  isJackpot: boolean;
  /** The symbol that formed the winning line, if any. */
  matchedSymbol: Symbol | null;
}

/** A pseudo-random number generator returning a float in [0, 1). */
export type Rng = () => number;
