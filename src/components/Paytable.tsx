import { JACKPOT_MULTIPLIER, SYMBOLS } from '../game/symbols';

/** Lists each gem's 3-of-a-kind payout and explains the Wild + jackpot. */
export function Paytable() {
  const gems = SYMBOLS.filter((s) => !s.isWild);
  const wild = SYMBOLS.find((s) => s.isWild);

  return (
    <div className="paytable">
      <h2 className="paytable-title">Paytable</h2>
      <ul className="paytable-list">
        {gems.map((s) => (
          <li className="paytable-row" key={s.id}>
            <span className="paytable-glyphs">
              {s.glyph}
              {s.glyph}
              {s.glyph}
            </span>
            <span className="paytable-name">{s.name}</span>
            <span className="paytable-payout">×{s.payout}</span>
          </li>
        ))}
        {wild && (
          <li className="paytable-row paytable-row--wild">
            <span className="paytable-glyphs">
              {wild.glyph}
              {wild.glyph}
              {wild.glyph}
            </span>
            <span className="paytable-name">Jackpot!</span>
            <span className="paytable-payout">×{JACKPOT_MULTIPLIER}</span>
          </li>
        )}
      </ul>
      <p className="paytable-note">
        <strong>3 paylines:</strong> the center row and both diagonals (an X). Match three of a
        kind on any line to win — multiple lines can pay on the same spin and the payouts add up.
      </p>
      {wild && (
        <p className="paytable-note">
          {wild.glyph} <strong>Wild Orb</strong> substitutes for any gem to complete a line.
          Three Wilds on a line wins the jackpot.
        </p>
      )}
    </div>
  );
}
