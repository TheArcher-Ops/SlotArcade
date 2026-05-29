import { useCallback, useEffect, useRef, useState } from 'react';
import { createRng, evaluateSpin, spinReels } from '../game/engine';
import type { Rng, SpinEvaluation, SpinResult } from '../game/types';
import { playSound } from '../audio/sounds';

export const STARTING_CREDITS = 1000;
export const MIN_BET = 5;
export const MAX_BET = 100;
export const BET_STEP = 5;
export const DEPOSIT_AMOUNTS = [100, 500, 1000] as const;
const STORAGE_KEY = 'gem-reels:credits';

const REEL_COUNT = 3;
const BASE_SPIN_MS = 700;
const REEL_STAGGER_MS = 350;

export interface GameState {
  credits: number;
  bet: number;
  isSpinning: boolean;
  grid: SpinResult;
  lastResult: SpinEvaluation | null;
  reelSpinning: boolean[];
  spin: () => void;
  setBet: (bet: number) => void;
  incrementBet: () => void;
  decrementBet: () => void;
  deposit: (amount: number) => void;
  resetCredits: () => void;
}

function loadCredits(): number {
  if (typeof localStorage === 'undefined') return STARTING_CREDITS;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return STARTING_CREDITS;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : STARTING_CREDITS;
}

const clampBet = (b: number) => Math.min(MAX_BET, Math.max(MIN_BET, b));

export function useGameState(rng: Rng = Math.random as Rng): GameState {
  const [credits, setCredits] = useState<number>(loadCredits);
  const [bet, setBetRaw] = useState<number>(MIN_BET * 2);
  const [isSpinning, setIsSpinning] = useState(false);
  const [grid, setGrid] = useState<SpinResult>(() => spinReels(createRng(1)));
  const [lastResult, setLastResult] = useState<SpinEvaluation | null>(null);
  const [reelSpinning, setReelSpinning] = useState<boolean[]>(() =>
    new Array(REEL_COUNT).fill(false),
  );

  // Synchronous guard — prevents double-fire from touch + click events on mobile.
  const isSpinningRef = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(credits));
    }
  }, [credits]);

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const setBet = useCallback((value: number) => setBetRaw(clampBet(value)), []);
  const incrementBet = useCallback(() => setBetRaw((b) => clampBet(b + BET_STEP)), []);
  const decrementBet = useCallback(() => setBetRaw((b) => clampBet(b - BET_STEP)), []);
  const deposit = useCallback((amount: number) => setCredits((c) => c + amount), []);
  const resetCredits = useCallback(() => setCredits(STARTING_CREDITS), []);

  const spin = useCallback(() => {
    // Use a ref so the guard is synchronous — state updates are async and would
    // let a second tap through before the first render commits isSpinning=true.
    if (isSpinningRef.current) return;
    if (credits < bet) return;

    isSpinningRef.current = true;
    setIsSpinning(true);
    setCredits((c) => c - bet);
    playSound('spin');
    setLastResult(null);
    setReelSpinning(new Array(REEL_COUNT).fill(true));

    const result = spinReels(rng);

    for (let i = 0; i < REEL_COUNT; i++) {
      const t = setTimeout(() => {
        playSound('stop');
        setReelSpinning((prev) => {
          const next = [...prev];
          next[i] = false;
          return next;
        });
      }, BASE_SPIN_MS + i * REEL_STAGGER_MS);
      timers.current.push(t);
    }

    const settle = setTimeout(() => {
      setGrid(result);
      const evaluation = evaluateSpin(result, bet);
      setLastResult(evaluation);
      if (evaluation.win > 0) {
        setCredits((c) => c + evaluation.win);
        playSound(evaluation.isJackpot ? 'jackpot' : 'win');
      }
      isSpinningRef.current = false;
      setIsSpinning(false);
    }, BASE_SPIN_MS + (REEL_COUNT - 1) * REEL_STAGGER_MS + 150);
    timers.current.push(settle);
  }, [credits, bet, rng]);

  return {
    credits,
    bet,
    isSpinning,
    grid,
    lastResult,
    reelSpinning,
    spin,
    setBet,
    incrementBet,
    decrementBet,
    deposit,
    resetCredits,
  };
}
