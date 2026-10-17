/**
 * Plays spoken lines: the parent's recorded clip for each part when it exists, otherwise the
 * browser's speech synthesis (best available English voice, slightly slow). Never blocks the game —
 * every wait has a timeout, and when no voice is available the game simply continues silently.
 */
import { create } from 'zustand';
import { allClips, deleteClip, putClip, type ClipRecord } from '../persistence/db';
import { groupForPlayback, partsText, resolveParts, type ClipPart } from './clips';

// ───────────────────────────── Recorded clip registry ─────────────────────────────

interface ClipStore {
  /** Clip ids that have a recording. */
  ids: Set<string>;
  loaded: boolean;
}

export const useClips = create<ClipStore>(() => ({ ids: new Set(), loaded: false }));

const urls = new Map<string, string>();

function setUrl(id: string, blob: Blob | null) {
  const old = urls.get(id);
  if (old) URL.revokeObjectURL(old);
  if (blob) urls.set(id, URL.createObjectURL(blob));
  else urls.delete(id);
  useClips.setState({ ids: new Set(urls.keys()) });
}

export async function loadRecordedClips(): Promise<void> {
  try {
    for (const c of await allClips()) setUrl(c.id, c.blob);
  } catch (e) {
    console.warn('[Sparkle] Could not load recordings', e);
  }
  useClips.setState({ loaded: true, ids: new Set(urls.keys()) });
}

export async function saveRecording(id: string, blob: Blob, now: number): Promise<void> {
  const rec: ClipRecord = { id, blob, mime: blob.type || 'audio/webm', recordedAt: now, bytes: blob.size };
  await putClip(rec);
  setUrl(id, blob);
}

export async function removeRecording(id: string): Promise<void> {
  await deleteClip(id);
  setUrl(id, null);
}

/** After a backup import or reset: forget everything and reload from storage. */
export async function reloadRecordings(): Promise<void> {
  for (const id of [...urls.keys()]) setUrl(id, null);
  await loadRecordedClips();
}

// ───────────────────────────── Voice settings ─────────────────────────────

let voiceOn = true;
let rate = 0.85;

export function configureVoice(opts: { on: boolean; rate: number }): void {
  voiceOn = opts.on;
  rate = opts.rate;
  if (!voiceOn) stopSpeaking();
}

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

let cachedVoice: SpeechSynthesisVoice | null | undefined;

/** Best available English voice: known natural-sounding voices first, then "enhanced/premium" ones. */
export function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const en = voices.filter((v) => v.lang?.toLowerCase().startsWith('en'));
  if (!en.length) return null;
  const preferred = ['Samantha', 'Ava', 'Allison', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny', 'Microsoft Ana', 'Karen', 'Moira', 'Serena', 'Tessa'];
  const score = (v: SpeechSynthesisVoice) => {
    let s = 0;
    const i = preferred.findIndex((n) => v.name.includes(n));
    if (i >= 0) s += 50 - i;
    if (/premium|enhanced|natural|neural/i.test(v.name)) s += 30;
    if (v.lang.toLowerCase() === 'en-us') s += 5;
    if (v.localService) s += 2;
    if (/novelty|whisper|bad news|bells|boing|bubbles|cellos|zarvox|trinoids|albert|jester|organ|superstar|wobble/i.test(v.name)) s -= 100;
    return s;
  };
  return en.slice().sort((a, b) => score(b) - score(a))[0] ?? null;
}

function voice(): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined) return cachedVoice;
  const list = window.speechSynthesis.getVoices();
  if (!list.length) return null;
  cachedVoice = pickVoice(list);
  return cachedVoice;
}

if (speechSupported()) {
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    cachedVoice = undefined;
  });
}

// ───────────────────────────── Playback ─────────────────────────────

let token = 0;
let audioEl: HTMLAudioElement | null = null;

function el(): HTMLAudioElement {
  audioEl ??= new Audio();
  return audioEl;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Speech-synthesis "end" events are unreliable on some devices, so every wait has a cap. */
function estimateMs(text: string): number {
  return Math.min(9000, (500 + text.length * 75) / Math.max(0.5, rate));
}

function playUrl(url: string, myToken: number): Promise<void> {
  return new Promise((resolve) => {
    const a = el();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      a.onended = null;
      a.onerror = null;
      resolve();
    };
    a.onended = finish;
    a.onerror = finish;
    a.src = url;
    a.currentTime = 0;
    a.play().catch(finish);
    setTimeout(finish, 10_000);
    const check = setInterval(() => {
      if (token !== myToken) {
        clearInterval(check);
        a.pause();
        finish();
      }
      if (done) clearInterval(check);
    }, 100);
  });
}

function speakTts(text: string, myToken: number): Promise<boolean> {
  if (!speechSupported()) return Promise.resolve(false);
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      resolve(ok);
    };
    try {
      const u = new SpeechSynthesisUtterance(text);
      const v = voice();
      if (v) u.voice = v;
      u.lang = v?.lang ?? 'en-US';
      u.rate = rate;
      u.pitch = 1.08;
      u.onend = () => finish(true);
      u.onerror = () => finish(false);
      window.speechSynthesis.speak(u);
      setTimeout(() => finish(true), estimateMs(text));
      const check = setInterval(() => {
        if (token !== myToken) finish(false);
        if (done) clearInterval(check);
      }, 100);
    } catch {
      finish(false);
    }
  });
}

export interface SayOptions {
  /** Called as each part starts (index into `parts`), e.g. to highlight a word. */
  onPart?: (index: number) => void;
  /** Keep every part as its own utterance (word-by-word reading). */
  separate?: boolean;
}

/** Recent lines, for tests and debugging (window.__sparkleSpoken). */
const spokenLog: string[] = [];
if (typeof window !== 'undefined') (window as unknown as { __sparkleSpoken: string[] }).__sparkleSpoken = spokenLog;

/** Speaks a line. A new call interrupts the previous one. Resolves when done (or interrupted). */
export async function say(parts: ClipPart[], opts: SayOptions = {}): Promise<void> {
  const my = ++token;
  if (speechSupported()) window.speechSynthesis.cancel();
  audioEl?.pause();
  spokenLog.push(partsText(parts));
  if (spokenLog.length > 200) spokenLog.splice(0, spokenLog.length - 200);

  if (!voiceOn) {
    // Silent mode still steps through parts (so word highlighting works), briskly.
    for (let i = 0; i < parts.length && token === my; i++) {
      opts.onPart?.(i);
      await sleep(opts.separate ? 450 : 60);
    }
    return;
  }

  const groups = groupForPlayback(resolveParts(parts, useClips.getState().ids), opts.separate);
  let index = 0;
  for (const g of groups) {
    if (token !== my) return;
    opts.onPart?.(index);
    const url = g.source === 'clip' ? urls.get(g.parts[0].clip) : undefined;
    if (url) await playUrl(url, my);
    else {
      const text = partsText(g.parts);
      const ok = await speakTts(text, my);
      if (!ok && token === my) await sleep(opts.separate ? 400 : 150);
    }
    index += g.parts.length;
    if (opts.separate && token === my) await sleep(120);
  }
}

export function stopSpeaking(): void {
  token++;
  if (speechSupported()) window.speechSynthesis.cancel();
  audioEl?.pause();
}

export function isSpeaking(): boolean {
  return speechSupported() && window.speechSynthesis.speaking;
}

/**
 * iOS only allows audio after a user gesture. Call from the first touch: it primes both the audio
 * element and speech synthesis so later prompts can play automatically.
 */
let unlocked = false;
export function unlockAudio(): void {
  if (unlocked) return;
  unlocked = true;
  try {
    const a = el();
    a.muted = true;
    a.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';
    void a
      .play()
      .catch(() => undefined)
      .finally(() => {
        a.muted = false;
      });
  } catch {
    /* optional */
  }
  if (speechSupported()) {
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      window.speechSynthesis.speak(u);
    } catch {
      /* optional */
    }
  }
}

export function audioUnlocked(): boolean {
  return unlocked;
}
