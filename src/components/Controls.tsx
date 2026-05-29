import { DEPOSIT_AMOUNTS, MAX_BET, MIN_BET } from '../state/useGameState';

interface ControlsProps {
  credits: number;
  bet: number;
  isSpinning: boolean;
  muted: boolean;
  lastWin: number | null;
  onSpin: () => void;
  onIncrementBet: () => void;
  onDecrementBet: () => void;
  onDeposit: (amount: number) => void;
  onToggleMute: () => void;
  onResetCredits: () => void;
}

const fmt = (n: number) => n.toLocaleString('en-US');

export function Controls({
  credits,
  bet,
  isSpinning,
  muted,
  lastWin,
  onSpin,
  onIncrementBet,
  onDecrementBet,
  onDeposit,
  onToggleMute,
  onResetCredits,
}: ControlsProps) {
  const broke = credits < bet;

  return (
    <div className="controls">
      <div className="stat-row">
        <div className="stat">
          <span className="stat-label">Balance</span>
          <span className="stat-value">💰 {fmt(credits)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Last Win</span>
          <span className="stat-value">
            {lastWin && lastWin > 0 ? `✨ ${fmt(lastWin)}` : '—'}
          </span>
        </div>
      </div>

      <div className="bet-row">
        <span className="stat-label">Bet</span>
        <div className="bet-controls">
          <button
            className="bet-btn"
            onClick={onDecrementBet}
            disabled={isSpinning || bet <= MIN_BET}
            aria-label="decrease bet"
          >
            −
          </button>
          <span className="bet-value">{fmt(bet)}</span>
          <button
            className="bet-btn"
            onClick={onIncrementBet}
            disabled={isSpinning || bet >= MAX_BET}
            aria-label="increase bet"
          >
            +
          </button>
        </div>
      </div>

      <button className="spin-btn" onClick={onSpin} disabled={isSpinning || broke}>
        {isSpinning ? 'Spinning…' : broke ? 'Out of credits' : 'SPIN'}
      </button>

      <div className="deposit-row">
        <span className="stat-label">Add Credits</span>
        <div className="deposit-btns">
          {DEPOSIT_AMOUNTS.map((amount) => (
            <button
              key={amount}
              className="deposit-btn"
              onClick={() => onDeposit(amount)}
              disabled={isSpinning}
            >
              +{fmt(amount)}
            </button>
          ))}
        </div>
      </div>

      <div className="toggle-row">
        <button className="toggle-btn" onClick={onToggleMute} aria-label="toggle sound">
          {muted ? '🔇 Muted' : '🔊 Sound'}
        </button>
        {broke && (
          <button className="toggle-btn toggle-btn--reset" onClick={onResetCredits}>
            ↻ Reset
          </button>
        )}
      </div>
    </div>
  );
}
