type SoundName = 'spin' | 'stop' | 'win' | 'jackpot';

let ctx: AudioContext | null = null;
let muted = false;

// Background music state
let bgMasterGain: GainNode | null = null;
let bgOscs: OscillatorNode[] = [];
let bgStarted = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

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
    tone(audio, 160, audio.currentTime, 0.08, 'square', 0.1);
  },
  win: (audio) => {
    const now = audio.currentTime;
    [523.25, 659.25, 783.99].forEach((f, i) => tone(audio, f, now + i * 0.1, 0.18, 'triangle'));
  },
  jackpot: (audio) => {
    const now = audio.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) =>
      tone(audio, f, now + i * 0.09, 0.25, 'triangle', 0.18),
    );
  },
};

export function playSound(name: SoundName) {
  if (muted) return;
  const audio = getCtx();
  if (!audio) return;
  try {
    RECIPES[name](audio);
  } catch {
    // Non-essential — never break gameplay.
  }
}

/**
 * Start the ambient background music loop. Safe to call multiple times —
 * only starts once. Requires a prior user gesture to unlock the AudioContext.
 */
export function startBgMusic() {
  if (muted || bgStarted) return;
  const audio = getCtx();
  if (!audio) return;

  bgStarted = true;

  const master = audio.createGain();
  // Fade in gently over 3 seconds.
  master.gain.setValueAtTime(0.0001, audio.currentTime);
  master.gain.exponentialRampToValueAtTime(0.055, audio.currentTime + 3);
  master.connect(audio.destination);
  bgMasterGain = master;

  // Ambient minor chord: A1 E2 A2 C3 — low, mysterious, gem-cave feel.
  const layers: Array<{ freq: number; type: OscillatorType; detune: number; vol: number }> = [
    { freq: 55,     type: 'sine',     detune:  0,  vol: 0.5 },
    { freq: 82.41,  type: 'sine',     detune:  4,  vol: 0.4 },
    { freq: 110,    type: 'triangle', detune: -4,  vol: 0.3 },
    { freq: 130.81, type: 'triangle', detune:  3,  vol: 0.25 },
    { freq: 220,    type: 'sine',     detune: -3,  vol: 0.15 },
  ];

  bgOscs = layers.map(({ freq, type, detune, vol }) => {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audio.currentTime);
    osc.detune.setValueAtTime(detune, audio.currentTime);
    g.gain.setValueAtTime(vol, audio.currentTime);
    osc.connect(g).connect(master);
    osc.start();
    return osc;
  });

  // Very slow LFO (0.12 Hz) for a subtle breathing pulse on the master gain.
  const lfo = audio.createOscillator();
  const lfoGain = audio.createGain();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(0.12, audio.currentTime);
  lfoGain.gain.setValueAtTime(0.012, audio.currentTime);
  lfo.connect(lfoGain).connect(master.gain);
  lfo.start();
  bgOscs.push(lfo);
}

function stopBgMusicInternal() {
  bgOscs.forEach((osc) => { try { osc.stop(); } catch { /* already stopped */ } });
  bgOscs = [];
  bgMasterGain?.disconnect();
  bgMasterGain = null;
  bgStarted = false;
}

export function setMuted(value: boolean) {
  muted = value;
  if (value) {
    stopBgMusicInternal();
  } else {
    // Restart music when unmuted (requires AudioContext — needs prior gesture).
    startBgMusic();
  }
}

export function isMuted() {
  return muted;
}
