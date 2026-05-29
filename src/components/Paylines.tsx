import type { LineWin } from '../game/types';

// Line geometry in a 0–100 box overlaid on the reels. Column centers sit at
// ~16.67 / 50 / 83.33 and row centers likewise, so the diagonals run corner to
// corner through the middle cell, forming the X.
const LINES: { id: string; d: string }[] = [
  { id: 'center', d: 'M 3,50 L 97,50' },
  { id: 'diagDown', d: 'M 16.67,16.67 L 83.33,83.33' },
  { id: 'diagUp', d: 'M 83.33,16.67 L 16.67,83.33' },
];

interface PaylinesProps {
  lineWins: LineWin[];
  /** Only highlight winners once the reels have settled. */
  active: boolean;
}

/** Subtle always-on guides for the three paylines; winners glow on a win. */
export function Paylines({ lineWins, active }: PaylinesProps) {
  const winning = new Set(active ? lineWins.map((w) => w.lineId) : []);
  return (
    <svg className="paylines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {LINES.map((l) => (
        <path
          key={l.id}
          d={l.d}
          className={`payline-path${winning.has(l.id) ? ' payline-path--win' : ''}`}
        />
      ))}
    </svg>
  );
}
