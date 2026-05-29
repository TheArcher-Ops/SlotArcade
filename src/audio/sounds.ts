/**
 * Sound effects synthesized with the Web Audio API so the game ships with no
 * binary audio assets (works fully offline). Each effect is a short sequence
 * of oscillator tones.
 */

type SoundName = 'spin' | 'stop' | 'win' | 'jackpot';

let ctx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  // Browsers start the context suspended until a user gesture occurs.
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Play a single tone. */
function tone(
  audio: AudioContext,
  freq: number,
  startAt: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.15,
) {
  const osc = audio.createOscillator();
  const env = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startAt);

  env.gain.setValueAtTime(0.0001, startAt);
  env.gain.exponentialRampToValueAtTime(gain, startAt + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(env).connect(audio.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

const RECIPES: Record<SoundName, (audio: AudioContext) => void> = {
  spin: (audio) => {
    const now = audio.currentTime;
    tone(audio, 220, now, 0.12, 'sawtooth', 0.08);
    tone(audio, 330, now + 0.06, 0.12, 'sawtooth', 0.06);
  },
  stop: (audio) => {
    const now = audio.currentTime;
    tone(audio, 160, now, 0.08, 'square', 0.1);
  },
  win: (audio) => {
    const now = audio.currentTime;
    [523.25, 659.25, 783.99].forEach((f, i) => tone(audio, f, now + i * 0.1, 0.18, 'triangle'));
  },
  jackpot: (audio) => {
    const now = audio.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((f, i) => tone(audio, f, now + i * 0.09, 0.25, 'triangle', 0.18));
  },
};

/** Play a named sound effect (no-op when muted or unsupported). */
export function playSound(name: SoundName) {
  if (muted) return;
  const audio = getCtx();
  if (!audio) return;
  try {
    RECIPES[name](audio);
  } catch {
    // Audio is non-essential; never let it break gameplay.
  }
}

export function setMuted(value: boolean) {
  muted = value;
}

export function isMuted() {
  return muted;
}
