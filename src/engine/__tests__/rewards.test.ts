import { describe, expect, it } from 'vitest';
import { ALL_REWARDS, REWARD_ORDER } from '../../data/rewards';
import { MAX_LEARN_REWARDS_PER_SESSION } from '../config';
import { clearOutfit, saveLook, toggleItem, wearLook } from '../looks';
import { numKey, recordAnswer, wordKey } from '../mastery';
import { canPlayMore, finishSession, recordMatchExposure, recordRound, sessionsToday, startSession } from '../play';
import { awardNext } from '../rewards';
import { buildSession } from '../session';
import { DAY, freshState, HOUR, T0 } from './helpers';

function play(s: ReturnType<typeof freshState>, at: number, answers: [string, boolean][]) {
  const plan = buildSession(s, at, 1);
  const id = startSession(s, plan, at);
  for (const [key, ok] of answers) recordRound(s, id, key, { firstTry: ok }, at);
  return { id, ...finishSession(s, id, at) };
}

describe('reward awarding', () => {
  it('gives one reward for finishing an adventure', () => {
    const s = freshState();
    const r = play(s, T0, [[wordKey('see'), true]]);
    expect(r.awards).toHaveLength(1);
    expect(r.awards[0].itemId).toBe(REWARD_ORDER[0]);
    expect(s.owned[REWARD_ORDER[0]]).toMatchObject({ source: 'earned', reason: 'session' });
  });

  it('gives a reward for each newly learned item', () => {
    const s = freshState();
    play(s, T0, [[wordKey('see'), true], [wordKey('a'), true]]);
    const r = play(s, T0 + DAY, [[wordKey('see'), true], [wordKey('a'), true]]);
    expect(r.awards).toHaveLength(3);
    expect(r.awards.map((a) => a.reason)).toEqual(['session', 'w:see', 'w:a']);
  });

  it('caps learn-rewards per adventure and banks the rest for next time', () => {
    const s = freshState();
    const keys = [1, 2, 3, 4, 5].map((n) => numKey('seq', n));
    play(s, T0, keys.map((k) => [k, true]));
    const r = play(s, T0 + DAY, keys.map((k) => [k, true]));
    expect(r.awards).toHaveLength(1 + MAX_LEARN_REWARDS_PER_SESSION);
    expect(s.rewardBank).toHaveLength(5 - MAX_LEARN_REWARDS_PER_SESSION);
    const next = play(s, T0 + DAY + HOUR, []);
    expect(next.awards).toHaveLength(1 + 5 - MAX_LEARN_REWARDS_PER_SESSION);
    expect(s.rewardBank).toHaveLength(0);
  });

  it('never gives rewards for taps alone (exposure, misses)', () => {
    const s = freshState();
    const plan = buildSession(s, T0, 1);
    const id = startSession(s, plan, T0);
    recordMatchExposure(s, ['see', 'a'], T0);
    for (let i = 0; i < 10; i++) recordRound(s, id, wordKey('i'), { firstTry: false }, T0);
    expect(Object.keys(s.owned)).toHaveLength(0);
    expect(s.rewardBank).toHaveLength(0);
  });

  it('never removes rewards — misses on learned items leave everything owned', () => {
    const s = freshState();
    play(s, T0, [[wordKey('see'), true]]);
    play(s, T0 + DAY, [[wordKey('see'), true]]);
    const owned = structuredClone(s.owned);
    expect(Object.keys(owned)).toHaveLength(3);
    for (let i = 0; i < 5; i++) recordAnswer(s, wordKey('see'), { firstTry: false }, T0 + 2 * DAY);
    play(s, T0 + 3 * DAY, [[wordKey('see'), false]]);
    for (const id of Object.keys(owned)) expect(s.owned[id]).toEqual(owned[id]);
    expect(s.skills['w:see'].learnedAt).not.toBeNull();
  });

  it('gives bonus stars once the whole catalog is owned', () => {
    const s = freshState();
    for (let i = 0; i < ALL_REWARDS.length; i++) expect(awardNext(s, 'session', T0).itemId).not.toBeNull();
    expect(awardNext(s, 'session', T0).itemId).toBeNull();
    expect(s.stars).toBe(1);
  });

  it('finishing twice does not double-award', () => {
    const s = freshState();
    const { id } = play(s, T0, []);
    expect(finishSession(s, id, T0).awards).toEqual([]);
  });
});

describe('daily adventure limit', () => {
  it('lets Pearl rest after the configured number of adventures', () => {
    const s = freshState();
    s.settings.sessionsPerDay = 2;
    play(s, T0, []);
    expect(canPlayMore(s, T0)).toBe(true);
    play(s, T0 + HOUR, []);
    expect(sessionsToday(s, T0 + HOUR)).toBe(2);
    expect(canPlayMore(s, T0 + HOUR)).toBe(false);
    expect(canPlayMore(s, T0 + DAY)).toBe(true);
    s.settings.sessionsPerDay = 0;
    expect(canPlayMore(s, T0 + HOUR)).toBe(true);
  });
});

describe('dress-up', () => {
  it('equips only owned items in slots the character can wear, and saves looks', () => {
    const s = freshState();
    expect(toggleItem(s, 'pearl', 'dr-coral-tail')).toBe(false); // not owned
    s.owned['dr-coral-tail'] = { at: T0, source: 'earned' };
    s.owned['dr-rose-gown'] = { at: T0, source: 'earned' };
    expect(toggleItem(s, 'pearl', 'dr-rose-gown')).toBe(false); // mermaids wear tails
    expect(toggleItem(s, 'pearl', 'dr-coral-tail')).toBe(true);
    expect(s.dressing.outfits.pearl.tail).toBe('dr-coral-tail');
    const look = saveLook(s, T0)!;
    clearOutfit(s, 'pearl');
    expect(s.dressing.outfits.pearl.tail).toBeUndefined();
    wearLook(s, look);
    expect(s.dressing.outfits.pearl.tail).toBe('dr-coral-tail');
    expect(s.dressing.looks[0].name).toBe('Sparkle Look');
    for (let i = 0; i < 5; i++) saveLook(s, T0);
    expect(saveLook(s, T0)).toBeNull(); // max 6
    expect(toggleItem(s, 'pearl', 'dr-coral-tail')).toBe(false); // tapping again takes it off
  });
});
