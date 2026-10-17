import { describe, expect, it } from 'vitest';
import { clipCatalog, normalizeToken, sentenceTokens } from '../../audio/clips';
import { bundledCurriculum } from '../../data/curriculum';
import { isPictureId } from '../../data/pictures';
import { ALL_REWARDS, DRESS_ITEMS, REWARD_ORDER, STICKER_ITEMS } from '../../data/rewards';

const DOLCH_PRE_PRIMER = [
  'I', 'a', 'see', 'the', 'my', 'can', 'go', 'to', 'we', 'is', 'it', 'in', 'up', 'down', 'look', 'big', 'little', 'run',
  'red', 'blue', 'yellow', 'and', 'you', 'me', 'here', 'play', 'said', 'one', 'two', 'three', 'help', 'jump', 'make',
  'come', 'find', 'for', 'not', 'where', 'away', 'funny',
];

describe('sight-word curriculum', () => {
  const c = bundledCurriculum();

  it('seeds the full Dolch pre-primer list in order, in weekly sets of 3', () => {
    const order = c.weeks.flatMap((w) => w.wordIds.map((id) => c.words[id].text));
    expect(order).toEqual(DOLCH_PRE_PRIMER);
    expect(c.weeks).toHaveLength(14);
    c.weeks.slice(0, 13).forEach((w) => expect(w.wordIds).toHaveLength(3));
    expect(c.weeks[13].wordIds.map((id) => c.words[id].text)).toEqual(['funny']);
  });

  it('has unique ids and every word in exactly one week', () => {
    const all = c.weeks.flatMap((w) => w.wordIds);
    expect(new Set(all).size).toBe(all.length);
    expect(Object.keys(c.words).sort()).toEqual([...all].sort());
    expect(new Set(c.weeks.map((w) => w.id)).size).toBe(c.weeks.length);
  });

  it('every example sentence contains its word and is short', () => {
    for (const w of Object.values(c.words)) {
      const tokens = sentenceTokens(w.sentence).map(normalizeToken);
      expect(tokens, w.sentence).toContain(normalizeToken(w.text));
      expect(tokens.length, w.sentence).toBeLessThanOrEqual(5);
    }
  });

  it('pictures are valid, and words without a natural picture have none', () => {
    for (const w of Object.values(c.words)) if (w.picture) expect(isPictureId(w.picture), w.id).toBe(true);
    for (const id of ['look', 'you', 'here', 'said']) expect(c.words[id].picture).toBeUndefined();
  });

  it('prints "I" capitalized and every other word lowercase', () => {
    for (const w of Object.values(c.words)) expect(w.text).toBe(w.text === 'I' ? 'I' : w.text.toLowerCase());
  });
});

describe('reward catalog', () => {
  it('has at least 40 dress-up items across every slot and at least 25 stickers', () => {
    expect(DRESS_ITEMS.length).toBeGreaterThanOrEqual(40);
    expect(STICKER_ITEMS.length).toBeGreaterThanOrEqual(25);
    const slots = new Set(DRESS_ITEMS.map((d) => d.slot));
    expect([...slots].sort()).toEqual(['crown', 'dress', 'necklace', 'shoes', 'tail', 'wand']);
  });

  it('has unique ids and a reward order that contains each item exactly once', () => {
    const ids = ALL_REWARDS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...REWARD_ORDER].sort()).toEqual([...ids].sort());
  });

  it('interleaves dress-up items and stickers early on', () => {
    const first6 = REWARD_ORDER.slice(0, 6);
    expect(first6.some((id) => id.startsWith('dr-'))).toBe(true);
    expect(first6.some((id) => id.startsWith('st-'))).toBe(true);
  });
});

describe('voice clip catalog', () => {
  it('lists every sight word, every number 0–20, the prompts, and sentence words — once each', () => {
    const cat = clipCatalog(bundledCurriculum(), 20);
    const ids = cat.map((c) => c.clip);
    expect(new Set(ids).size).toBe(ids.length);
    for (const w of DOLCH_PRE_PRIMER) expect(ids).toContain(`w:${w.toLowerCase()}`);
    for (let n = 0; n <= 20; n++) expect(ids).toContain(`n:${n}`);
    expect(ids).not.toContain('n:21');
    expect(ids).toContain('p:findWord');
    expect(ids).toContain('p:hmm');
    expect(ids).toContain('w:fish');
    // Sentence words that are also sight words are not listed twice.
    expect(cat.filter((c) => c.section === 'sentence-words').map((c) => c.clip)).not.toContain('w:see');
  });

  it('grows when the counting range is extended', () => {
    const ids = clipCatalog(bundledCurriculum(), 30).map((c) => c.clip);
    expect(ids).toContain('n:30');
  });
});
