import { ReelStrip } from './ReelStrip';
import type { Reel as ReelType } from '../game/types';

interface ReelProps {
  reel: ReelType;
  spinning: boolean;
  /** Highlight this reel as part of a winning line. */
  highlight: boolean;
}

/** A framed reel column, optionally highlighted when it forms a win. */
export function Reel({ reel, spinning, highlight }: ReelProps) {
  return (
    <div className={`reel-frame${highlight ? ' reel-frame--win' : ''}`}>
      <ReelStrip reel={reel} spinning={spinning} />
    </div>
  );
}
