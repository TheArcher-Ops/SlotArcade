import { useCallback, useEffect, useRef, useState } from 'react';
import { createRng, evaluateSpin, spinReels } from '../game/engine';
import type { Rng, SpinEvaluation, SpinResult } from '../game/types';
import { playSound } from '../audio/sounds';

export const STARTING_CREDITS = 1000;
export const MIN_BET = 5;
export const MAX_BET = 100;
export const BET_STEP = 5;
const STORAGE_KEY = 'gem-reels:credits';

/** Number of reels, kept here so timings can stagger per reel. */
const REEL_COUNT = 3;
/** How long the first reel spins; each subsequent reel stops a bit later. */
const BASE_SPIN_MS = 700;
const REEL_STAGGER_MS = 350;

export interface GameState {
  credits: number;
  bet: number;
  isSpinning: boolean;
  /** The grid currently shown on the reels. */
  grid: SpinResult;
  /** Evaluation of the most recently completed spin (null before first spin). */
  lastResult: SpinEvaluation | null;
  autoplay: boolean;
  /** Per-reel flag: true while that reel is still spinning. */
  reelSpinning: boolean[];
  spin: () => void;
  setBet: (bet: number) => void;
  incrementBet: () => void;
  decrementBet: () => void;
  toggleAutoplay: () => void;
  resetCredits: () => void;
}

function loadCredits(): number {
  if (typeof localStorage === 'undefined') return STARTING_CREDITS;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return STARTING_CREDITS;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : STARTING_CREDITS;
}

const clampBet = (bet: number) => Math.min(MAX_BET, Math.max(MIN_BET, bet));

export function useGameState(rng: Rng = Math.random as Rng): GameState {
  const [credits, setCredits] = useState<number>(loadCredits);
  const [bet, setBetRaw] = useState<number>(MIN_BET * 2);
  const [isSpinning, setIsSpinning] = useState(false);
  const [grid, setGrid] = useState<SpinResult>(() => spinReels(createRng(1)));
  const [lastResult, setLastResult] = useState<SpinEvaluation | null>(null);
  const [autoplay, setAutoplay] = useState(false);
  const [reelSpinning, setReelSpinning] = useState<boolean[]>(() =>
    new Array(REEL_COUNT).fill(false),
  );

  // Timers we must clear on unmount.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Persist credits whenever they change.
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(credits));
    }
  }, [credits]);

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const setBet = useCallback((value: number) => {
    setBetRaw(clampBet(value));
  }, []);

  const incrementBet = useCallback(() => setBetRaw((b) => clampBet(b + BET_STEP)), []);
  const decrementBet = useCallback(() => setBetRaw((b) => clampBet(b - BET_STEP)), []);

  const spin = useCallback(() => {
    setIsSpinning((alreadySpinning) => {
      if (alreadySpinning) return true;
      // Read the latest credits/bet via functional updates to avoid stale closures.
      let canSpin = false;
      setCredits((c) => {
        if (c < bet) return c;
        canSpin = true;
        return c - bet;
      });
      if (!canSpin) return false;

      playSound('spin');
      setLastResult(null);
      setReelSpinning(new Array(REEL_COUNT).fill(true));

      const result = spinReels(rng);

      // Reveal reels one at a time for the classic staggered stop.
      for (let i = 0; i < REEL_COUNT; i++) {
        const stopAt = BASE_SPIN_MS + i * REEL_STAGGER_MS;
        const t = setTimeout(() => {
          playSound('stop');
          setReelSpinning((prev) => {
            const next = [...prev];
            next[i] = false;
            return next;
          });
        }, stopAt);
        timers.current.push(t);
      }

      // Settle the final outcome after the last reel stops.
      const settleAt = BASE_SPIN_MS + (REEL_COUNT - 1) * REEL_STAGGER_MS + 150;
      const settle = setTimeout(() => {
        setGrid(result);
        const evaluation = evaluateSpin(result, bet);
        setLastResult(evaluation);
        if (evaluation.win > 0) {
          setCredits((c) => c + evaluation.win);
          playSound(evaluation.isJackpot ? 'jackpot' : 'win');
        }
        setIsSpinning(false);
      }, settleAt);
      timers.current.push(settle);

      return true;
    });
  }, [bet, rng]);

  const toggleAutoplay = useCallback(() => setAutoplay((a) => !a), []);

  const resetCredits = useCallback(() => setCredits(STARTING_CREDITS), []);

  // Autoplay: keep spinning while enabled, idle, and affordable.
  useEffect(() => {
    if (!autoplay || isSpinning) return;
    if (credits < bet) {
      setAutoplay(false);
      return;
    }
    const t = setTimeout(() => spin(), 600);
    return () => clearTimeout(t);
  }, [autoplay, isSpinning, credits, bet, spin]);

  return {
    credits,
    bet,
    isSpinning,
    grid,
    lastResult,
    autoplay,
    reelSpinning,
    spin,
    setBet,
    incrementBet,
    decrementBet,
    toggleAutoplay,
    resetCredits,
  };
}
