import { describe, expect, it } from 'vitest';
import { createRng } from '../../lib/random';
import { numKey, recordAnswer, wordKey } from '../mastery';
import { applyPlacement, finishSession, recordRound, startSession } from '../play';
import { categoryPlan, numberPools, selectNumbers, selectWords } from '../selection';
import { buildPlacement, buildSession, numberOptions, PLACEMENT_TEENS, type Round, type SessionPlan } from '../session';
import { NUMBER_GAMES, WORD_GAMES } from '../types';
import { DAY, freshState, learnWeek, T0 } from './helpers';

const scored = (plan: SessionPlan) => plan.games.flatMap((g) => g.rounds).filter((r): r is Exclude<Round, { game: 'match' }> => r.game !== 'match');

describe('category mix', () => {
  it('splits slots about 60 / 25 / 15 with an easy win first', () => {
    const plan = categoryPlan(20, { focus: 0.6, review: 0.25, easy: 0.15 });
    expect(plan.filter((c) => c === 'focus')).toHaveLength(12);
    expect(plan.filter((c) => c === 'review')).toHaveLength(5);
    expect(plan.filter((c) => c === 'easy')).toHaveLength(3);
    expect(plan[0]).toBe('easy');
  });

  it('handles tiny sessions', () => {
    expect(categoryPlan(0, { focus: 0.6, review: 0.25, easy: 0.15 })).toEqual([]);
    expect(categoryPlan(1, { focus: 0.6, review: 0.25, easy: 0.15 })).toEqual(['focus']);
  });
});

describe('session composition', () => {
  it('alternates word and number games, sized by session length', () => {
    const s = freshState();
    for (const [minutes, games] of [[3, 3], [5, 4], [8, 6]] as const) {
      s.settings.sessionMinutes = minutes;
      const plan = buildSession(s, T0, 7);
      expect(plan.games).toHaveLength(games);
      plan.games.forEach((g, i) => expect((i % 2 === 0 ? WORD_GAMES : NUMBER_GAMES).includes(g.kind)).toBe(true));
      expect(new Set(plan.games.map((g) => g.kind)).size).toBe(games);
    }
  });

  it('every round has a valid answer among 2–4 choices', () => {
    const s = freshState();
    s.settings.sessionMinutes = 8;
    for (let seed = 1; seed < 40; seed++) {
      const plan = buildSession(s, T0, seed);
      for (const r of plan.games.flatMap((g) => g.rounds)) {
        switch (r.game) {
          case 'shell':
          case 'bubble':
            expect(r.options).toContain(r.wordId);
            expect(r.options.length).toBeGreaterThanOrEqual(2);
            expect(r.options.length).toBeLessThanOrEqual(4);
            expect(new Set(r.options).size).toBe(r.options.length);
            break;
          case 'necklace':
            expect(r.run[r.gapIndex]).toBe(Number(r.key.split(':')[2]));
            expect(r.options).toContain(r.run[r.gapIndex]);
            expect(r.options.length).toBeLessThanOrEqual(3);
            r.run.forEach((n) => expect(n).toBeGreaterThanOrEqual(0));
            r.run.forEach((n) => expect(n).toBeLessThanOrEqual(20));
            break;
          case 'next':
            expect(r.options).toContain(r.answer);
            r.run.forEach((n) => expect(r.options).not.toContain(n));
            break;
          case 'jewels':
            expect(r.options).toContain(r.count);
            expect(r.count).toBeGreaterThanOrEqual(1);
            expect(r.count).toBeLessThanOrEqual(20);
            break;
          case 'tenframe':
            expect(r.target).toBeGreaterThanOrEqual(11);
            expect(r.target).toBeLessThanOrEqual(20);
            expect(r.options).toContain(r.target);
            break;
          case 'shop':
            expect(r.target).toBeGreaterThanOrEqual(1);
            break;
          case 'match':
            expect(r.wordIds.length).toBeGreaterThanOrEqual(2);
            expect(r.wordIds.length).toBeLessThanOrEqual(3);
        }
      }
    }
  });

  it('starts new items with 2 choices and offers more as they are practiced', () => {
    const s = freshState();
    const plan = buildSession(s, T0, 3);
    const shellOrBubble = scored(plan).filter((r) => r.game === 'shell' || r.game === 'bubble');
    for (const r of shellOrBubble) if ('options' in r) expect(r.options).toHaveLength(2);
    for (let i = 0; i < 3; i++) recordAnswer(s, wordKey('see'), { firstTry: true }, T0);
    const r = selectWords(s, 1, T0, createRng(1));
    expect(r).toHaveLength(1);
  });

  it('includes every current-week word at least once', () => {
    const s = freshState();
    for (let seed = 1; seed < 30; seed++) {
      const plan = buildSession(s, T0, seed);
      const words = new Set(scored(plan).filter((r) => r.key.startsWith('w:')).map((r) => r.key));
      // Word Match shows its words too (as exposure).
      for (const r of plan.games.flatMap((g) => g.rounds)) if (r.game === 'match') r.wordIds.forEach((id) => words.add(wordKey(id)));
      for (const id of s.curriculum.weeks[0].wordIds) expect(words.has(wordKey(id)), `seed ${seed}`).toBe(true);
    }
  });

  it('mixes focus, review, and easy items once there is something to review', () => {
    const s = freshState();
    learnWeek(s, 0, [-20, -19]); // long-learned → easy
    learnWeek(s, 1, [-2, -1]); // recently learned → review
    s.weekProgress['week-2'].unlocked = true;
    s.weekProgress['week-3'].unlocked = true;
    for (let n = 1; n <= 10; n++) for (const d of [-20, -19]) recordAnswer(s, numKey('seq', n), { firstTry: true }, T0 + d * DAY);
    const counts = { focus: 0, review: 0, easy: 0 };
    for (let seed = 1; seed <= 30; seed++) for (const r of scored(buildSession(s, T0, seed))) counts[r.category]++;
    const total = counts.focus + counts.review + counts.easy;
    expect(counts.focus / total).toBeGreaterThan(0.5);
    expect(counts.focus / total).toBeLessThan(0.7);
    expect(counts.review / total).toBeGreaterThan(0.15);
    expect(counts.easy / total).toBeGreaterThan(0.08);
  });

  it('focus numbers are the teens; 1–10 are warm-ups only', () => {
    const s = freshState();
    const pools = numberPools(s, 'seq', T0, createRng(1));
    expect(pools.focus.map((c) => Number(c.key.split(':')[2])).sort((a, b) => a - b)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(pools.easy.every((c) => Number(c.key.split(':')[2]) <= 10)).toBe(true);
  });

  it('extends the focus range when the parent raises the counting max', () => {
    const s = freshState();
    s.settings.countingMax = 30;
    const pools = numberPools(s, 'seq', T0, createRng(1));
    expect(pools.focus.map((c) => c.key)).toContain('n:seq:27');
  });
});

describe('adaptive prioritization', () => {
  it('picks missed words more often', () => {
    const s = freshState();
    for (let i = 0; i < 3; i++) recordAnswer(s, wordKey('a'), { firstTry: false }, T0);
    recordAnswer(s, wordKey('see'), { firstTry: true }, T0);
    recordAnswer(s, wordKey('i'), { firstTry: true }, T0);
    const tally: Record<string, number> = {};
    for (let seed = 1; seed <= 50; seed++) {
      for (const p of selectWords(s, 3, T0, createRng(seed), ['focus', 'focus', 'focus'])) tally[p.key] = (tally[p.key] ?? 0) + 1;
    }
    expect(tally['w:a']).toBeGreaterThan(tally['w:see']);
    expect(tally['w:a']).toBeGreaterThan(tally['w:i']);
  });

  it('records teen-number skips and shows skipped teens more often', () => {
    const s = freshState();
    const plan = buildSession(s, T0, 1);
    const id = startSession(s, plan, T0);
    // Necklace 13, 14, __, 16 — she picks 16 (skipping fifteen).
    recordRound(s, id, numKey('seq', 15), { firstTry: false, skipped: true }, T0);
    recordRound(s, id, numKey('seq', 15), { firstTry: false, skipped: true }, T0);
    expect(s.skills['n:seq:15'].skips).toBe(2);
    const tally: Record<string, number> = {};
    for (let seed = 1; seed <= 60; seed++) {
      const picks = selectNumbers(s, 'seq', 2, T0, createRng(seed), { plan: ['focus', 'focus'] });
      for (const p of picks) tally[p.key] = (tally[p.key] ?? 0) + 1;
    }
    const others = Object.entries(tally).filter(([k]) => k !== 'n:seq:15').map(([, v]) => v);
    expect(tally['n:seq:15']).toBeGreaterThan(Math.max(...others));
  });

  it('always offers the number after the gap so skipping can be detected', () => {
    const rng = createRng(5);
    for (let n = 11; n < 20; n++) expect(numberOptions(n, 2, 20, rng, [n + 1])).toEqual(expect.arrayContaining([n, n + 1]));
  });
});

describe('placement check', () => {
  it('is a short game-like adventure covering the 1–10 baseline and the teens', () => {
    const s = freshState();
    const plan = buildPlacement(s, T0, 1);
    expect(plan.placement).toBe(true);
    const keys = scored(plan).map((r) => r.key);
    expect(keys).toContain('n:count:6');
    expect(keys).toContain('n:seq:6');
    expect(keys).toContain('n:seq:9');
    for (const n of PLACEMENT_TEENS) expect(keys).toContain(`n:seq:${n}`);
    expect(scored(plan).length).toBeLessThanOrEqual(12);
  });

  it('sets the starting focus from the results', () => {
    const s = freshState();
    const plan = buildPlacement(s, T0, 1);
    const id = startSession(s, plan, T0);
    for (const r of scored(plan)) {
      const shaky = r.key === 'n:seq:13' || r.key === 'n:seq:17';
      recordRound(s, id, r.key, { firstTry: !shaky, skipped: shaky }, T0);
    }
    finishSession(s, id, T0);
    expect(s.placement).toMatchObject({ baselineOk: true, shakyTeens: [13, 17] });
    expect(s.placement!.solidTeens).toEqual([12, 14, 15, 19]);
    // Shaky teens are weighted up in selection.
    const pools = numberPools(s, 'count', T0, createRng(2));
    const score = (n: number) => pools.focus.find((c) => c.key === `n:count:${n}`)!.score;
    expect(score(13)).toBeGreaterThan(score(14));
    expect(score(17)).toBeGreaterThan(score(19));
  });

  it('a missed baseline brings 1–10 into focus', () => {
    const s = freshState();
    s.placement = { doneAt: T0, baselineOk: false, shakyTeens: [], solidTeens: [] };
    const pools = numberPools(s, 'seq', T0, createRng(1));
    expect(pools.focus.map((c) => c.key)).toContain('n:seq:5');
    applyPlacement(s, T0); // re-reading with no answers is harmless
    expect(s.placement!.baselineOk).toBe(false);
  });
});
