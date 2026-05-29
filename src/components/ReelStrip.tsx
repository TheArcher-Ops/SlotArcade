import { SYMBOLS } from '../game/symbols';
import type { Reel } from '../game/types';

interface ReelStripProps {
  /** The three symbols this reel will show when stopped. */
  reel: Reel;
  /** True while this reel is still spinning. */
  spinning: boolean;
}

// A longer strip of symbols used for the blur-scroll while spinning.
const SPIN_STRIP = [...SYMBOLS, ...SYMBOLS, ...SYMBOLS, ...SYMBOLS];

/**
 * Renders a single reel column. While spinning it shows a fast vertical
 * scroll of symbols; when stopped it settles on the three result symbols
 * with the center (payline) row highlighted.
 */
export function ReelStrip({ reel, spinning }: ReelStripProps) {
  if (spinning) {
    return (
      <div className="reel" aria-label="spinning reel">
        <div className="reel-strip reel-strip--spinning">
          {SPIN_STRIP.map((s, i) => (
            <div className="reel-cell" key={i} aria-hidden="true">
              {s.glyph}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="reel" aria-label="reel">
      <div className="reel-strip">
        {reel.map((s, row) => (
          <div
            className={`reel-cell${row === 1 ? ' reel-cell--payline' : ''}`}
            key={row}
            title={s.name}
          >
            {s.glyph}
          </div>
        ))}
      </div>
    </div>
  );
}
