import { describe, expect, it } from 'vitest';
import { dayKey, isDue, isLearned, itemStatus, numKey, parseKey, recordAnswer, wordKey } from '../mastery';
import { DAY, freshState, HOUR, T0 } from './helpers';

describe('the two-day learned rule', () => {
  it('does not count several correct answers on the same day', () => {
    const s = freshState();
    for (let i = 0; i < 5; i++) recordAnswer(s, wordKey('see'), { firstTry: true }, T0 + i * HOUR);
    expect(isLearned(s, wordKey('see'))).toBe(false);
    expect(s.skills['w:see'].correctDays).toEqual([dayKey(T0)]);
  });

  it('marks an item learned after first-try correct answers on two different days', () => {
    const s = freshState();
    expect(recordAnswer(s, wordKey('see'), { firstTry: true }, T0).newlyLearned).toBe(false);
    const r = recordAnswer(s, wordKey('see'), { firstTry: true }, T0 + DAY);
    expect(r.newlyLearned).toBe(true);
    expect(s.skills['w:see'].learnedAt).toBe(T0 + DAY);
    expect(s.skills['w:see'].learnedSource).toBe('earned');
    // Only reported once.
    expect(recordAnswer(s, wordKey('see'), { firstTry: true }, T0 + 2 * DAY).newlyLearned).toBe(false);
  });

  it('a second-try answer does not count toward learning', () => {
    const s = freshState();
    recordAnswer(s, wordKey('see'), { firstTry: true }, T0);
    recordAnswer(s, wordKey('see'), { firstTry: false }, T0 + DAY);
    expect(isLearned(s, wordKey('see'))).toBe(false);
    recordAnswer(s, wordKey('see'), { firstTry: true }, T0 + 2 * DAY);
    expect(isLearned(s, wordKey('see'))).toBe(true);
  });

  it('days need not be consecutive', () => {
    const s = freshState();
    recordAnswer(s, numKey('seq', 14), { firstTry: true }, T0);
    recordAnswer(s, numKey('seq', 14), { firstTry: true }, T0 + 5 * DAY);
    expect(isLearned(s, numKey('seq', 14))).toBe(true);
  });

  it('tracks number skills separately', () => {
    const s = freshState();
    recordAnswer(s, numKey('seq', 15), { firstTry: true }, T0);
    recordAnswer(s, numKey('seq', 15), { firstTry: true }, T0 + DAY);
    expect(isLearned(s, numKey('seq', 15))).toBe(true);
    expect(isLearned(s, numKey('count', 15))).toBe(false);
    expect(isLearned(s, numKey('numeral', 15))).toBe(false);
  });
});

describe('spaced review scheduling', () => {
  function learned() {
    const s = freshState();
    recordAnswer(s, wordKey('see'), { firstTry: true }, T0);
    recordAnswer(s, wordKey('see'), { firstTry: true }, T0 + DAY);
    return s;
  }

  it('schedules learned items about 1, 3, 7, then 14 days out', () => {
    const s = learned();
    let t = T0 + DAY;
    const rec = () => s.skills['w:see'];
    expect(rec().review!.dueAt).toBe(t + DAY);
    for (const days of [3, 7, 14, 14]) {
      t = rec().review!.dueAt;
      expect(isDue(rec(), t)).toBe(true);
      recordAnswer(s, wordKey('see'), { firstTry: true }, t);
      expect(rec().review!.dueAt).toBe(t + days * DAY);
    }
  });

  it('correct answers before the due day do not advance the schedule', () => {
    const s = learned();
    const due = s.skills['w:see'].review!.dueAt;
    recordAnswer(s, wordKey('see'), { firstTry: true }, T0 + DAY + HOUR);
    expect(s.skills['w:see'].review!.dueAt).toBe(due);
    expect(s.skills['w:see'].review!.stage).toBe(0);
  });

  it('a miss shortens the interval but never removes learned status', () => {
    const s = learned();
    // Advance to the 7-day stage.
    for (let i = 0; i < 2; i++) recordAnswer(s, wordKey('see'), { firstTry: true }, s.skills['w:see'].review!.dueAt);
    expect(s.skills['w:see'].review!.stage).toBe(2);
    const t = s.skills['w:see'].review!.dueAt;
    recordAnswer(s, wordKey('see'), { firstTry: false }, t);
    const r = s.skills['w:see'];
    expect(r.learnedAt).not.toBeNull();
    expect(r.review!.stage).toBe(1);
    expect(r.review!.dueAt).toBe(t + DAY);
    expect(r.review!.lapses).toBe(1);
    expect(itemStatus(r)).toBe('learned');
  });
});

describe('skill keys', () => {
  it('parses word and number keys', () => {
    expect(parseKey('w:see')).toEqual({ kind: 'word', wordId: 'see' });
    expect(parseKey('n:numeral:17')).toEqual({ kind: 'number', skill: 'numeral', n: 17 });
    expect(parseKey('x:1')).toBeNull();
  });
});
