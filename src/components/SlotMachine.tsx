import { useState } from 'react';
import { useGameState } from '../state/useGameState';
import { setMuted as setAudioMuted } from '../audio/sounds';
import { Reel } from './Reel';
import { Controls } from './Controls';
import { Paytable } from './Paytable';
import { WinOverlay } from './WinOverlay';

/** Top-level game: wires the game-state hook into the UI. */
export function SlotMachine() {
  const game = useGameState();
  const [muted, setMuted] = useState(false);

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      setAudioMuted(next);
      return next;
    });
  };

  const won = !game.isSpinning && (game.lastResult?.win ?? 0) > 0;

  return (
    <div className="slot-machine">
      <header className="header">
        <h1 className="title">💎 Gem Reels 💎</h1>
        <p className="subtitle">Match three gems across the center to win!</p>
      </header>

      <div className="cabinet">
        <WinOverlay result={game.lastResult} />
        <div className="reels">
          {game.grid.reels.map((reel, i) => (
            <Reel
              key={i}
              reel={reel}
              spinning={game.reelSpinning[i]}
              highlight={won}
            />
          ))}
        </div>
        <div className="payline-marker" aria-hidden="true" />
      </div>

      <Controls
        credits={game.credits}
        bet={game.bet}
        isSpinning={game.isSpinning}
        autoplay={game.autoplay}
        muted={muted}
        lastWin={game.lastResult?.win ?? null}
        onSpin={game.spin}
        onIncrementBet={game.incrementBet}
        onDecrementBet={game.decrementBet}
        onToggleAutoplay={game.toggleAutoplay}
        onToggleMute={toggleMute}
        onResetCredits={game.resetCredits}
      />

      <Paytable />
    </div>
  );
}
