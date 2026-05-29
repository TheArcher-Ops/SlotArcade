import { describe, it, expect } from 'vitest';
import { createRng, pickSymbol, spinReels, evaluateSpin, PAYLINES } from './engine';
import { SYMBOLS, JACKPOT_MULTIPLIER, TOTAL_WEIGHT } from './symbols';
import type { SpinResult, Symbol } from './types';

const byId = (id: string): Symbol => {
  const s = SYMBOLS.find((x) => x.id === id);
  if (!s) throw new Error(`unknown symbol ${id}`);
  return s;
};

/**
 * Build a SpinResult from three visual rows (top, center, bottom), each of
 * three symbols left-to-right. Transposes into the reel-major grid the engine
 * expects (reels[reel][row]).
 */
const grid = (
  top: [Symbol, Symbol, Symbol],
  center: [Symbol, Symbol, Symbol],
  bottom: [Symbol, Symbol, Symbol],
): SpinResult => ({
  reels: [
    [top[0], center[0], bottom[0]],
    [top[1], center[1], bottom[1]],
    [top[2], center[2], bottom[2]],
  ],
});

const amethyst = byId('amethyst');
const emerald = byId('emerald');
const sapphire = byId('sapphire');
const ruby = byId('ruby');
const crown = byId('crown');
const diamond = byId('diamond');
const wild = byId('wild');

describe('createRng', () => {
  it('is deterministic for a given seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a(), a(), a(), a()]).toEqual([b(), b(), b(), b()]);
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
      expect(SYMBOLS).toContain(pickSymbol(rng));
    }
  });

  it('respects weighting — common gems appear far more than rare ones', () => {
    const rng = createRng(99);
    const counts: Record<string, number> = {};
    for (let i = 0; i < 20000; i++) {
      const s = pickSymbol(rng);
      counts[s.id] = (counts[s.id] ?? 0) + 1;
    }
    expect(counts['amethyst']).toBeGreaterThan(counts['diamond']);
  });
});

describe('spinReels', () => {
  it('returns a 3x3 grid of valid symbols', () => {
    const result = spinReels(createRng(5));
    expect(result.reels).toHaveLength(3);
    for (const reel of result.reels) {
      expect(reel).toHaveLength(3);
      for (const sym of reel) expect(SYMBOLS).toContain(sym);
    }
  });
});

describe('evaluateSpin — center row (D-E-F)', () => {
  it('pays the gem multiplier for 3-of-a-kind on the center row', () => {
    // Center = ruby; corners emerald so the diagonals do not win.
    const result = grid([emerald, emerald, emerald], [ruby, ruby, ruby], [emerald, emerald, emerald]);
    const e = evaluateSpin(result, 10);
    expect(e.win).toBe(10 * ruby.payout);
    expect(e.isJackpot).toBe(false);
    expect(e.matchedSymbol?.id).toBe('ruby');
    expect(e.lineWins.map((w) => w.lineId)).toEqual(['center']);
  });

  it('uses each gem\'s own multiplier', () => {
    for (const gem of [amethyst, emerald, sapphire, ruby, crown, diamond]) {
      const filler = gem.id === 'amethyst' ? emerald : amethyst;
      const result = grid([filler, filler, filler], [gem, gem, gem], [filler, filler, filler]);
      expect(evaluateSpin(result, 5).win).toBe(5 * gem.payout);
    }
  });

  it('scales the win with the bet', () => {
    const result = grid([emerald, emerald, emerald], [diamond, diamond, diamond], [emerald, emerald, emerald]);
    expect(evaluateSpin(result, 1).win).toBe(diamond.payout);
    expect(evaluateSpin(result, 100).win).toBe(100 * diamond.payout);
  });
});

describe('evaluateSpin — diagonals', () => {
  it('pays the ↘ diagonal A-E-I (top-left → bottom-right)', () => {
    const result = grid([ruby, emerald, emerald], [emerald, ruby, emerald], [emerald, emerald, ruby]);
    const e = evaluateSpin(result, 10);
    expect(e.win).toBe(10 * ruby.payout);
    expect(e.lineWins.map((w) => w.lineId)).toEqual(['diagDown']);
  });

  it('pays the ↗ diagonal C-E-G (top-right → bottom-left)', () => {
    const result = grid([emerald, emerald, ruby], [emerald, ruby, emerald], [ruby, emerald, emerald]);
    const e = evaluateSpin(result, 10);
    expect(e.win).toBe(10 * ruby.payout);
    expect(e.lineWins.map((w) => w.lineId)).toEqual(['diagUp']);
  });
});

describe('evaluateSpin — multiple lines stack', () => {
  it('pays both diagonals (an X) and sums the payouts', () => {
    // Both diagonals ruby; center (emerald,ruby,emerald) does not win.
    const result = grid([ruby, emerald, ruby], [emerald, ruby, emerald], [ruby, emerald, ruby]);
    const e = evaluateSpin(result, 10);
    expect(e.win).toBe(2 * 10 * ruby.payout);
    expect(e.lineWins.map((w) => w.lineId).sort()).toEqual(['diagDown', 'diagUp']);
  });

  it('pays all three lines when every cell matches', () => {
    const result = grid([ruby, ruby, ruby], [ruby, ruby, ruby], [ruby, ruby, ruby]);
    const e = evaluateSpin(result, 10);
    expect(e.win).toBe(3 * 10 * ruby.payout);
    expect(e.lineWins).toHaveLength(3);
  });

  it('reports the highest-paying line as the matched symbol', () => {
    // Center diamond (high), ↘ diagonal emerald (low). diagUp does not win.
    const result = grid([emerald, diamond, ruby], [diamond, diamond, diamond], [crown, emerald, emerald]);
    const e = evaluateSpin(result, 10);
    // center = diamond x3 win; diagDown = emerald,diamond,emerald -> no; diagUp = ruby,diamond,crown -> no.
    expect(e.lineWins.map((w) => w.lineId)).toEqual(['center']);
    expect(e.matchedSymbol?.id).toBe('diamond');
  });
});

describe('evaluateSpin — wilds & jackpot', () => {
  it('substitutes a wild to complete a diagonal', () => {
    // ↘ diagonal: diamond, wild, diamond. Center & ↗ kept non-winning.
    const result = grid([diamond, amethyst, sapphire], [emerald, wild, ruby], [crown, amethyst, diamond]);
    const e = evaluateSpin(result, 10);
    expect(e.lineWins.map((w) => w.lineId)).toEqual(['diagDown']);
    expect(e.win).toBe(10 * diamond.payout);
    expect(e.matchedSymbol?.id).toBe('diamond');
  });

  it('awards the jackpot for three wilds on a line', () => {
    // Center all wild; diagonals deliberately mismatched so they do not win.
    const result = grid([emerald, amethyst, sapphire], [wild, wild, wild], [crown, amethyst, ruby]);
    const e = evaluateSpin(result, 10);
    expect(e.isJackpot).toBe(true);
    expect(e.win).toBe(10 * JACKPOT_MULTIPLIER);
    expect(e.lineWins.map((w) => w.lineId)).toEqual(['center']);
  });
});

describe('evaluateSpin — no win', () => {
  it('pays nothing when no line matches', () => {
    const result = grid([ruby, emerald, sapphire], [crown, diamond, amethyst], [emerald, ruby, crown]);
    const e = evaluateSpin(result, 10);
    expect(e.win).toBe(0);
    expect(e.isJackpot).toBe(false);
    expect(e.matchedSymbol).toBeNull();
    expect(e.lineWins).toEqual([]);
  });
});

describe('return-to-player (RTP)', () => {
  it('stays in a balanced band (~95%) given the paytable and paylines', () => {
    // Each payline is 3 independent reel draws. A line wins symbol G when every
    // cell is G-or-wild, excluding the all-wild jackpot case. Expectation is
    // linear, so total RTP = (number of paylines) x (expected payout per line),
    // in units of the bet.
    const wild = SYMBOLS.find((s) => s.isWild);
    if (!wild) throw new Error('expected a wild symbol');
    const w = wild.weight / TOTAL_WEIGHT;
    const cells = PAYLINES[0].cells.length; // 3

    let perLine = 0;
    for (const s of SYMBOLS) {
      if (s.isWild) continue;
      const p = s.weight / TOTAL_WEIGHT;
      const winProb = (p + w) ** cells - w ** cells;
      perLine += winProb * s.payout;
    }
    perLine += w ** cells * JACKPOT_MULTIPLIER; // jackpot: all wilds

    const rtp = PAYLINES.length * perLine;
    expect(rtp).toBeGreaterThan(0.92);
    expect(rtp).toBeLessThan(0.97);
  });
});
