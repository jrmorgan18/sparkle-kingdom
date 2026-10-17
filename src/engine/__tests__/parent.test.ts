import { describe, expect, it } from 'vitest';
import { isLearned, recordAnswer, wordKey } from '../mastery';
import {
  parentAddWeek,
  parentAddWord,
  parentDeleteWeek,
  parentMarkNumberLearned,
  parentMarkWeekLearned,
  parentMarkWordLearned,
  parentMoveWeek,
  parentMoveWord,
  parentMoveWordToWeek,
  parentRemoveWord,
  parentReplaceWord,
  parentSetCountingMax,
  parentSetWeekLocked,
  parentUpdateWord,
  validateWordInput,
} from '../parent';
import { autoUnlock, currentWeek, focusWordIds, isWeekUnlocked } from '../weeks';
import { DAY, freshState, learnWeek, T0 } from './helpers';

describe('week unlocking', () => {
  it('starts with week 1 unlocked and the rest locked', () => {
    const s = freshState();
    expect(isWeekUnlocked(s, 'week-1')).toBe(true);
    expect(isWeekUnlocked(s, 'week-2')).toBe(false);
    expect(currentWeek(s)!.id).toBe('week-1');
  });

  it('unlocks the next week when the current week is learned', () => {
    const s = freshState();
    learnWeek(s, 0);
    expect(autoUnlock(s, T0 + DAY)).toEqual(['week-2']);
    expect(s.weekProgress['week-2'].unlockSource).toBe('progression');
    expect(currentWeek(s)!.id).toBe('week-2');
    expect(focusWordIds(s)).toEqual(['the', 'my', 'can']);
  });

  it('parents can unlock early and relock; a relock sticks until they unlock again', () => {
    const s = freshState();
    parentSetWeekLocked(s, 'week-3', false, T0);
    expect(isWeekUnlocked(s, 'week-3')).toBe(true);
    parentSetWeekLocked(s, 'week-2', true, T0);
    learnWeek(s, 0);
    expect(autoUnlock(s, T0 + DAY)).toEqual([]);
    expect(isWeekUnlocked(s, 'week-2')).toBe(false);
    parentSetWeekLocked(s, 'week-2', false, T0 + DAY);
    expect(isWeekUnlocked(s, 'week-2')).toBe(true);
  });

  it('respects the auto-unlock setting', () => {
    const s = freshState();
    s.config.autoUnlockWeeks = false;
    learnWeek(s, 0);
    expect(autoUnlock(s, T0 + DAY)).toEqual([]);
  });

  it('mark learned (word or whole week) unlocks the next week but gives no reward', () => {
    const s = freshState();
    parentMarkWordLearned(s, 'i', T0);
    expect(s.skills['w:i'].learnedSource).toBe('parent');
    parentMarkWeekLearned(s, 'week-1', T0);
    expect(isWeekUnlocked(s, 'week-2')).toBe(true);
    expect(Object.keys(s.owned)).toHaveLength(0);
  });

  it('can mark a number learned for every skill', () => {
    const s = freshState();
    parentMarkNumberLearned(s, 16, undefined, T0);
    for (const sk of ['seq', 'count', 'numeral']) expect(isLearned(s, `n:${sk}:16`)).toBe(true);
  });

  it('accepts only supported counting ranges', () => {
    const s = freshState();
    parentSetCountingMax(s, 30);
    expect(s.settings.countingMax).toBe(30);
    parentSetCountingMax(s, 99);
    expect(s.settings.countingMax).toBe(20);
  });
});

describe('curriculum editor', () => {
  it('requires the sentence to contain the word', () => {
    expect(validateWordInput({ text: 'cat', sentence: 'I see a dog.' })).toBe('word-not-in-sentence');
    expect(validateWordInput({ text: 'cat', sentence: 'A cat!' })).toBeNull();
    expect(validateWordInput({ text: '', sentence: 'x' })).toBe('empty-word');
  });

  it('adds a word to a week and rejects duplicates', () => {
    const s = freshState();
    const r = parentAddWord(s, 'week-1', { text: 'Cat', sentence: 'I see a cat.', picture: '' });
    expect(r.id).toBe('cat');
    expect(s.curriculum.words.cat).toMatchObject({ text: 'cat', custom: true });
    expect(s.curriculum.weeks[0].wordIds).toEqual(['i', 'a', 'see', 'cat']);
    expect(parentAddWord(s, 'week-2', { text: 'see', sentence: 'I see.' }).error).toBe('duplicate');
  });

  it('replacing or removing a word keeps its learning history', () => {
    const s = freshState();
    recordAnswer(s, wordKey('see'), { firstTry: true }, T0);
    const r = parentReplaceWord(s, 'week-1', 'see', { text: 'look', sentence: 'Look!' });
    expect(r.error).toBe('duplicate'); // "look" is already in week 5
    const ok = parentReplaceWord(s, 'week-1', 'see', { text: 'fish', sentence: 'A fish.', picture: 'fish' });
    expect(s.curriculum.weeks[0].wordIds).toEqual(['i', 'a', ok.id]);
    expect(s.skills['w:see'].firstTryCorrect).toBe(1);
    // Re-adding the old spelling reuses its id and history.
    parentRemoveWord(s, 'week-1', 'a');
    expect(s.curriculum.weeks[0].wordIds).toEqual(['i', 'fish']);
    const back = parentAddWord(s, 'week-1', { text: 'see', sentence: 'I see you.' });
    expect(back.id).toBe('see');
    expect(s.curriculum.words.see.sentence).toBe('I see you.');
  });

  it('edits sentence and picture, flagging the word as customized', () => {
    const s = freshState();
    expect(parentUpdateWord(s, 'see', { sentence: 'No match here.' })).toBe('word-not-in-sentence');
    expect(parentUpdateWord(s, 'see', { sentence: 'I see the sea.', picture: 'wave' })).toBeNull();
    expect(s.curriculum.words.see).toMatchObject({ sentence: 'I see the sea.', picture: 'wave', customized: true });
    parentUpdateWord(s, 'see', { picture: '' });
    expect(s.curriculum.words.see.picture).toBeUndefined();
  });

  it('reorders words and weeks, and moves words between weeks', () => {
    const s = freshState();
    parentMoveWord(s, 'week-1', 'see', -1);
    expect(s.curriculum.weeks[0].wordIds).toEqual(['i', 'see', 'a']);
    parentMoveWordToWeek(s, 'week-1', 'a', 1);
    expect(s.curriculum.weeks[1].wordIds[0]).toBe('a');
    parentMoveWeek(s, 'week-3', -1);
    expect(s.curriculum.weeks.map((w) => w.id).slice(0, 3)).toEqual(['week-1', 'week-3', 'week-2']);
  });

  it('adds weeks after the last one and deletes only empty weeks', () => {
    const s = freshState();
    const id = parentAddWeek(s, T0);
    expect(s.curriculum.weeks.at(-1)!.id).toBe(id);
    expect(isWeekUnlocked(s, id)).toBe(false);
    parentAddWord(s, id, { text: 'zoo', sentence: 'A big zoo.' });
    expect(parentDeleteWeek(s, id)).toBe(false);
    parentRemoveWord(s, id, 'zoo');
    expect(parentDeleteWeek(s, id)).toBe(true);
  });
});
