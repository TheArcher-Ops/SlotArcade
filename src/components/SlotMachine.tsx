import { useRef, useState } from 'react';
import { useGameState } from '../state/useGameState';
import { setMuted as setAudioMuted, startBgMusic } from '../audio/sounds';
import { Reel } from './Reel';
import { Controls } from './Controls';
import { Paylines } from './Paylines';
import { Paytable } from './Paytable';
import { WinOverlay } from './WinOverlay';

export function SlotMachine() {
  const game = useGameState();
  const [muted, setMuted] = useState(false);
  const musicStarted = useRef(false);

  // Start background music on the very first user interaction so the
  // AudioContext is unlocked by a gesture (browser requirement).
  const ensureMusic = () => {
    if (!musicStarted.current) {
      musicStarted.current = true;
      startBgMusic();
    }
  };

  const handleSpin = () => {
    ensureMusic();
    game.spin();
  };

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
            <Reel key={i} reel={reel} spinning={game.reelSpinning[i]} highlight={won} />
          ))}
          <Paylines lineWins={game.lastResult?.lineWins ?? []} active={won} />
        </div>
      </div>

      <Controls
        credits={game.credits}
        bet={game.bet}
        isSpinning={game.isSpinning}
        muted={muted}
        lastWin={game.lastResult?.win ?? null}
        onSpin={handleSpin}
        onIncrementBet={game.incrementBet}
        onDecrementBet={game.decrementBet}
        onDeposit={game.deposit}
        onToggleMute={toggleMute}
        onResetCredits={game.resetCredits}
      />

      <Paytable />
    </div>
  );
}
