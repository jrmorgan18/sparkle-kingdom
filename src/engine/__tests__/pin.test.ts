import { describe, expect, it } from 'vitest';
import { createRng } from '../../lib/random';
import { checkPin, hashPin, makeChallenge, validPin } from '../../lib/pin';

describe('grown-ups PIN', () => {
  it('stores a hash, not the digits, and verifies correctly', () => {
    const h = hashPin('482915');
    expect(h).not.toContain('482915');
    expect(hashPin('482915')).toBe(h);
    expect(checkPin('482915', h)).toBe(true);
    expect(checkPin('482916', h)).toBe(false);
    expect(checkPin('482915', null)).toBe(false);
  });

  it('accepts 4–8 digit PINs only', () => {
    expect(validPin('1234')).toBe(true);
    expect(validPin('12345678')).toBe(true);
    expect(validPin('123')).toBe(false);
    expect(validPin('123456789')).toBe(false);
    expect(validPin('12a4')).toBe(false);
  });

  it('uses two-digit × two-digit for the fallback and three-digit × two-digit for PIN reset', () => {
    const rng = createRng(3);
    for (let i = 0; i < 200; i++) {
      const f = makeChallenge('fallback', rng);
      expect(f.a).toBeGreaterThanOrEqual(23);
      expect(f.b).toBeGreaterThanOrEqual(13);
      expect(f.answer).toBe(f.a * f.b);
      const r = makeChallenge('reset', rng);
      expect(r.a).toBeGreaterThanOrEqual(213);
      expect(r.b).toBeGreaterThanOrEqual(23);
    }
  });

});
