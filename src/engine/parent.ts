/**
 * Parent overrides and curriculum editing. All functions mutate the given (draft) state.
 * Nothing here deletes learning history or removes rewards: skill records are keyed by word id and
 * kept even when a word is removed from or replaced in a week.
 */
import { wordIdFor } from '../data/curriculum';
import { isPictureId, type PictureId } from '../data/pictures';
import type { SightWord } from '../data/types';
import { normalizeToken, sentenceTokens } from '../audio/clips';
import { COUNTING_MAX_OPTIONS } from './config';
import { markLearned, numKey, wordKey } from './mastery';
import { NUMBER_SKILLS, type AppState, type NumberSkill } from './types';
import { autoUnlock, emptyWeekProgress, findWeek } from './weeks';

export function parentSetWeekLocked(state: AppState, weekId: string, locked: boolean, now: number): void {
  if (!findWeek(state, weekId)) return;
  const wp = (state.weekProgress[weekId] ??= emptyWeekProgress(weekId));
  wp.unlocked = !locked;
  wp.unlockSource = locked ? null : 'parent';
  wp.unlockedAt = locked ? null : now;
  wp.lockedByParent = locked;
}

/** Marks a word learned (no reward — rewards come from her own learning). May unlock the next week. */
export function parentMarkWordLearned(state: AppState, wordId: string, now: number): void {
  if (!state.curriculum.words[wordId]) return;
  markLearned(state, wordKey(wordId), now, 'parent');
  autoUnlock(state, now);
}

export function parentMarkWeekLearned(state: AppState, weekId: string, now: number): void {
  const week = findWeek(state, weekId);
  if (!week) return;
  for (const id of week.wordIds) markLearned(state, wordKey(id), now, 'parent');
  autoUnlock(state, now);
}

export function parentMarkNumberLearned(state: AppState, n: number, skills: NumberSkill[] = NUMBER_SKILLS, now: number): void {
  for (const sk of skills) markLearned(state, numKey(sk, n), now, 'parent');
}

export function parentSetCountingMax(state: AppState, max: number): void {
  const options = COUNTING_MAX_OPTIONS;
  state.settings.countingMax = options.includes(max) ? max : 20;
}

// ───────────────────────────── Curriculum editing ─────────────────────────────

export interface WordInput {
  text: string;
  sentence: string;
  picture?: PictureId | '' | null;
}

export type EditError = 'empty-word' | 'empty-sentence' | 'word-not-in-sentence' | 'duplicate' | 'no-week';

/** The example sentence must contain the word, so Royal Invitation can ask her to find it. */
export function validateWordInput(input: WordInput): EditError | null {
  const text = input.text.trim();
  if (!text || !normalizeToken(text)) return 'empty-word';
  if (!input.sentence.trim()) return 'empty-sentence';
  const target = normalizeToken(text);
  if (!sentenceTokens(input.sentence).some((t) => normalizeToken(t) === target)) return 'word-not-in-sentence';
  return null;
}

function cleanText(text: string): string {
  const t = text.trim();
  return t.toLowerCase() === 'i' ? 'I' : t.toLowerCase();
}

function uniqueWordId(state: AppState, text: string): string {
  const base = wordIdFor(text);
  let id = base;
  let n = 2;
  while (state.curriculum.words[id]) id = `${base}-${n++}`;
  return id;
}

function inAnyWeek(state: AppState, wordId: string): boolean {
  return state.curriculum.weeks.some((w) => w.wordIds.includes(wordId));
}

/** Finds an existing word (with history) by spelling so re-adding a removed word reuses its progress. */
function existingWordByText(state: AppState, text: string): SightWord | undefined {
  const t = normalizeToken(text);
  return Object.values(state.curriculum.words).find((w) => normalizeToken(w.text) === t);
}

export function parentAddWord(state: AppState, weekId: string, input: WordInput): { id?: string; error?: EditError } {
  const week = findWeek(state, weekId);
  if (!week) return { error: 'no-week' };
  const err = validateWordInput(input);
  if (err) return { error: err };
  const existing = existingWordByText(state, input.text);
  if (existing && inAnyWeek(state, existing.id)) return { error: 'duplicate' };
  const picture = isPictureId(input.picture) ? input.picture : undefined;
  let id: string;
  if (existing) {
    id = existing.id;
    Object.assign(existing, { sentence: input.sentence.trim(), picture, customized: true });
  } else {
    id = uniqueWordId(state, input.text);
    const word: SightWord = { id, text: cleanText(input.text), sentence: input.sentence.trim(), custom: true, customized: true };
    if (picture) word.picture = picture;
    state.curriculum.words[id] = word;
  }
  week.wordIds.push(id);
  return { id };
}

/** Edits a word's sentence or picture. (To change the spelling, replace the word.) */
export function parentUpdateWord(state: AppState, wordId: string, edit: { sentence?: string; picture?: PictureId | '' | null }): EditError | null {
  const w = state.curriculum.words[wordId];
  if (!w) return 'no-week';
  if (edit.sentence !== undefined) {
    const err = validateWordInput({ text: w.text, sentence: edit.sentence });
    if (err) return err;
    w.sentence = edit.sentence.trim();
  }
  if (edit.picture !== undefined) {
    if (isPictureId(edit.picture)) w.picture = edit.picture;
    else delete w.picture;
  }
  w.customized = true;
  return null;
}

/** Replaces a word in its week position. The old word's progress stays in history. */
export function parentReplaceWord(state: AppState, weekId: string, oldWordId: string, input: WordInput): { id?: string; error?: EditError } {
  const week = findWeek(state, weekId);
  if (!week || !week.wordIds.includes(oldWordId)) return { error: 'no-week' };
  const idx = week.wordIds.indexOf(oldWordId);
  week.wordIds.splice(idx, 1);
  const res = parentAddWord(state, weekId, input);
  if (!res.id) {
    week.wordIds.splice(idx, 0, oldWordId);
    return res;
  }
  week.wordIds = week.wordIds.filter((id) => id !== res.id);
  week.wordIds.splice(idx, 0, res.id);
  return res;
}

/** Takes a word out of its week. Its record and history are kept (re-adding restores them). */
export function parentRemoveWord(state: AppState, weekId: string, wordId: string): void {
  const week = findWeek(state, weekId);
  if (week) week.wordIds = week.wordIds.filter((id) => id !== wordId);
}

export function parentMoveWord(state: AppState, weekId: string, wordId: string, dir: -1 | 1): void {
  const week = findWeek(state, weekId);
  if (!week) return;
  const i = week.wordIds.indexOf(wordId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= week.wordIds.length) return;
  [week.wordIds[i], week.wordIds[j]] = [week.wordIds[j], week.wordIds[i]];
}

/** Moves a word to the neighboring week (dir -1 = earlier, +1 = later). */
export function parentMoveWordToWeek(state: AppState, weekId: string, wordId: string, dir: -1 | 1): void {
  const weeks = state.curriculum.weeks;
  const i = weeks.findIndex((w) => w.id === weekId);
  const target = weeks[i + dir];
  if (i < 0 || !target || !weeks[i].wordIds.includes(wordId)) return;
  weeks[i].wordIds = weeks[i].wordIds.filter((id) => id !== wordId);
  if (dir === -1) target.wordIds.push(wordId);
  else target.wordIds.unshift(wordId);
}

/** Reorders weeks. Unlock flags stay with their week. */
export function parentMoveWeek(state: AppState, weekId: string, dir: -1 | 1): void {
  const weeks = state.curriculum.weeks;
  const i = weeks.findIndex((w) => w.id === weekId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= weeks.length) return;
  [weeks[i], weeks[j]] = [weeks[j], weeks[i]];
}

export function parentAddWeek(state: AppState, now: number): string {
  let n = state.curriculum.weeks.length + 1;
  let id = `week-${n}`;
  while (findWeek(state, id)) id = `week-${++n}`;
  state.curriculum.weeks.push({ id, wordIds: [], custom: true });
  state.weekProgress[id] = emptyWeekProgress(id);
  // If everything before it is already learned, the new week opens right away.
  autoUnlock(state, now);
  return id;
}

/** Removes an empty parent-added week. Weeks with words must be emptied first. */
export function parentDeleteWeek(state: AppState, weekId: string): boolean {
  const week = findWeek(state, weekId);
  if (!week || week.wordIds.length) return false;
  state.curriculum.weeks = state.curriculum.weeks.filter((w) => w.id !== weekId);
  return true;
}
