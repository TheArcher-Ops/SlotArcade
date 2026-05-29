import { describe, it, expect } from 'vitest';
import { createRng, pickSymbol, spinReels, evaluateSpin } from './engine';
import { SYMBOLS, JACKPOT_MULTIPLIER } from './symbols';
import type { Reel, SpinResult, Symbol } from './types';

const byId = (id: string): Symbol => {
  const s = SYMBOLS.find((x) => x.id === id);
  if (!s) throw new Error(`unknown symbol ${id}`);
  return s;
};

/** Build a SpinResult whose center payline is the given three symbols. */
const lineOf = (a: Symbol, b: Symbol, c: Symbol): SpinResult => {
  const filler = byId('amethyst');
  const reel = (mid: Symbol): Reel => [filler, mid, filler];
  return { reels: [reel(a), reel(b), reel(c)] };
};

describe('createRng', () => {
  it('is deterministic for a given seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = [a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it('returns values in [0, 1)', () => {
    const rng = createRng(123);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('produces different sequences for different seeds', () => {
    expect(createRng(1)()).not.toEqual(createRng(2)());
  });
});

describe('pickSymbol', () => {
  it('always returns a defined symbol from the set', () => {
    const rng = createRng(7);
    for (let i = 0; i < 500; i++) {
      const s = pickSymbol(rng);
      expect(SYMBOLS).toContain(s);
    }
  });

  it('respects weighting — common gems appear far more than rare ones', () => {
    const rng = createRng(99);
    const counts: Record<string, number> = {};
    for (let i = 0; i < 20000; i++) {
      const s = pickSymbol(rng);
      counts[s.id] = (counts[s.id] ?? 0) + 1;
    }
    // Amethyst (weight 30) should clearly out-appear Diamond (weight 4).
    expect(counts['amethyst']).toBeGreaterThan(counts['diamond']);
  });
});

describe('spinReels', () => {
  it('returns a 3x3 grid of valid symbols', () => {
    const result = spinReels(createRng(5));
    expect(result.reels).toHaveLength(3);
    for (const reel of result.reels) {
      expect(reel).toHaveLength(3);
      for (const sym of reel) {
        expect(SYMBOLS).toContain(sym);
      }
    }
  });
});

describe('evaluateSpin', () => {
  it('pays the gem multiplier for a 3-of-a-kind on the payline', () => {
    const ruby = byId('ruby');
    const result = lineOf(ruby, ruby, ruby);
    const evalResult = evaluateSpin(result, 10);
    expect(evalResult.win).toBe(10 * ruby.payout);
    expect(evalResult.isJackpot).toBe(false);
    expect(evalResult.matchedSymbol?.id).toBe('ruby');
  });

  it('uses each gem\'s own multiplier', () => {
    for (const id of ['amethyst', 'emerald', 'sapphire', 'ruby', 'crown', 'diamond']) {
      const gem = byId(id);
      const evalResult = evaluateSpin(lineOf(gem, gem, gem), 5);
      expect(evalResult.win).toBe(5 * gem.payout);
    }
  });

  it('substitutes wilds for a gem to complete a line', () => {
    const diamond = byId('diamond');
    const wild = byId('wild');
    const result = lineOf(diamond, wild, diamond);
    const evalResult = evaluateSpin(result, 10);
    expect(evalResult.win).toBe(10 * diamond.payout);
    expect(evalResult.isJackpot).toBe(false);
    expect(evalResult.matchedSymbol?.id).toBe('diamond');
  });

  it('treats two wilds plus a gem as that gem', () => {
    const crown = byId('crown');
    const wild = byId('wild');
    const evalResult = evaluateSpin(lineOf(wild, crown, wild), 2);
    expect(evalResult.win).toBe(2 * crown.payout);
    expect(evalResult.matchedSymbol?.id).toBe('crown');
  });

  it('awards the jackpot for three wilds', () => {
    const wild = byId('wild');
    const evalResult = evaluateSpin(lineOf(wild, wild, wild), 10);
    expect(evalResult.isJackpot).toBe(true);
    expect(evalResult.win).toBe(10 * JACKPOT_MULTIPLIER);
    expect(evalResult.matchedSymbol?.id).toBe('wild');
  });

  it('pays nothing for a non-matching line', () => {
    const evalResult = evaluateSpin(lineOf(byId('ruby'), byId('emerald'), byId('diamond')), 10);
    expect(evalResult.win).toBe(0);
    expect(evalResult.isJackpot).toBe(false);
    expect(evalResult.matchedSymbol).toBeNull();
  });

  it('ignores symbols off the payline (only the center row counts)', () => {
    const ruby = byId('ruby');
    const emerald = byId('emerald');
    // Center row is all ruby; top/bottom rows differ but must not matter.
    const result: SpinResult = {
      reels: [
        [emerald, ruby, emerald],
        [emerald, ruby, emerald],
        [emerald, ruby, emerald],
      ],
    };
    expect(evaluateSpin(result, 10).win).toBe(10 * ruby.payout);
  });

  it('scales the win with the bet', () => {
    const diamond = byId('diamond');
    const line = lineOf(diamond, diamond, diamond);
    expect(evaluateSpin(line, 1).win).toBe(diamond.payout);
    expect(evaluateSpin(line, 100).win).toBe(100 * diamond.payout);
  });
});
