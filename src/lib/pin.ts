/**
 * Grown-up PIN helpers. The PIN is stored as a salted hash so it doesn't appear as plain digits in
 * saved data or exported backups. This is a family "keep little fingers out" gate, not security.
 */
const SALT = 'sparkle-kingdom-parent-gate-v1';

export function hashPin(pin: string): string {
  // FNV-1a (two rounds with different seeds) — synchronous and works without a secure context.
  const input = `${SALT}:${pin}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193 ^ 0x5bd1e995;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x01000193 + 0x2) >>> 0;
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}

export function checkPin(pin: string, hash: string | null | undefined): boolean {
  return Boolean(hash) && hashPin(pin) === hash;
}

export const PIN_MIN = 4;
export const PIN_MAX = 8;

export function validPin(pin: string): boolean {
  return new RegExp(`^\\d{${PIN_MIN},${PIN_MAX}}$`).test(pin);
}

/** Math challenge used when no PIN is set (two-digit × two-digit) or to reset a forgotten PIN (three-digit × two-digit). */
export function makeChallenge(kind: 'fallback' | 'reset', rnd: () => number = Math.random): { a: number; b: number; answer: number } {
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const a = kind === 'reset' ? int(213, 789) : int(23, 89);
  const b = kind === 'reset' ? int(23, 89) : int(13, 49);
  return { a, b, answer: a * b };
}

export const MAX_TRIES = 3;
export const COOLDOWN_MS = 30_000;
