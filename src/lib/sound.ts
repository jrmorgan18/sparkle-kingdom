/** Tiny synthesized sound effects (Web Audio) — no audio files to download. */
type Sfx = 'tap' | 'correct' | 'oops' | 'reward' | 'pop' | 'whoosh';

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(ac: AudioContext, freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.12) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, ac.currentTime + start);
  g.gain.setValueAtTime(0.0001, ac.currentTime + start);
  g.gain.exponentialRampToValueAtTime(vol, ac.currentTime + start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
  o.connect(g).connect(ac.destination);
  o.start(ac.currentTime + start);
  o.stop(ac.currentTime + start + dur + 0.05);
}

export function play(sfx: Sfx): void {
  if (!enabled) return;
  try {
    const ac = audio();
    if (!ac) return;
    switch (sfx) {
      case 'tap':
        tone(ac, 660, 0, 0.06, 'triangle', 0.06);
        break;
      case 'pop':
        tone(ac, 520, 0, 0.05, 'square', 0.04);
        tone(ac, 880, 0.04, 0.07, 'triangle', 0.06);
        break;
      case 'correct':
        tone(ac, 660, 0, 0.12, 'triangle');
        tone(ac, 990, 0.1, 0.18, 'triangle');
        break;
      case 'oops':
        tone(ac, 392, 0, 0.14, 'sine', 0.08);
        tone(ac, 330, 0.12, 0.18, 'sine', 0.08);
        break;
      case 'whoosh':
        tone(ac, 300, 0, 0.2, 'sawtooth', 0.03);
        tone(ac, 600, 0.05, 0.2, 'sawtooth', 0.02);
        break;
      case 'reward':
        [523, 659, 784, 1047].forEach((f, i) => tone(ac, f, i * 0.09, 0.25, 'triangle', 0.1));
        break;
    }
  } catch {
    /* sound is optional */
  }
}
