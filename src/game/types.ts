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
 * reel (index 0 = top, 1 = center, 2 = bottom).
 */
export type Reel = [Symbol, Symbol, Symbol];

/** The visible 3x3 grid produced by a spin. */
export interface SpinResult {
  reels: [Reel, Reel, Reel];
}

/** A coordinate on the grid: [reelIndex, rowIndex]. */
export type Cell = readonly [number, number];

/** A winning line pattern — three cells, ordered left-to-right by reel. */
export interface Payline {
  id: string;
  name: string;
  cells: readonly [Cell, Cell, Cell];
}

/** A single payline that won on a spin. */
export interface LineWin {
  /** Which payline won (matches a Payline.id). */
  lineId: string;
  /** The symbol that formed the line. */
  symbol: Symbol;
  /** True when this line is the all-wild jackpot. */
  isJackpot: boolean;
  /** Credits won on this line. */
  win: number;
}

/** The outcome of evaluating a spin across all paylines. */
export interface SpinEvaluation {
  /** Total credits won across every winning line (0 when there is no win). */
  win: number;
  /** True when any winning line is the all-wild jackpot. */
  isJackpot: boolean;
  /** The symbol of the highest-paying winning line, for display (null if no win). */
  matchedSymbol: Symbol | null;
  /** Every payline that won this spin. */
  lineWins: LineWin[];
}

/** A pseudo-random number generator returning a float in [0, 1). */
export type Rng = () => number;
