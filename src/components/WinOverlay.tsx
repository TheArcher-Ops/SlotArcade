import { useEffect, useState } from 'react';
import type { SpinEvaluation } from '../game/types';

interface WinOverlayProps {
  result: SpinEvaluation | null;
}

/**
 * Brief celebratory overlay shown after a winning spin. Bigger flourish for
 * the jackpot. Auto-dismisses; keyed on each new result.
 */
export function WinOverlay({ result }: WinOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (result && result.win > 0) {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), result.isJackpot ? 3000 : 1800);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [result]);

  if (!visible || !result || result.win <= 0) return null;

  const fmt = (n: number) => n.toLocaleString('en-US');

  return (
    <div className={`win-overlay${result.isJackpot ? ' win-overlay--jackpot' : ''}`}>
      <div className="win-card">
        {result.isJackpot ? (
          <>
            <div className="win-sparkles" aria-hidden="true">
              ✨💎✨💎✨
            </div>
            <div className="win-title">JACKPOT!</div>
          </>
        ) : (
          <div className="win-title">
            {result.matchedSymbol?.glyph} Big Win!
          </div>
        )}
        <div className="win-amount">+{fmt(result.win)}</div>
      </div>
    </div>
  );
}
