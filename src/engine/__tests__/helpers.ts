import { DAY, HOUR } from '../../lib/clock';
import { recordAnswer, wordKey } from '../mastery';
import { createInitialState } from '../seed';
import type { AppState } from '../types';

/** 11:00 local-ish on 16 Oct 2026 (UTC 15:00) — mid-day so ±few hours stays on the same date. */
export const T0 = new Date(2026, 9, 16, 11, 0, 0).getTime();
export { DAY, HOUR };

export function freshState(): AppState {
  return createInitialState(T0);
}

/** Answers a word correctly on the first try on each of the given days. */
export function learnWord(s: AppState, wordId: string, days: number[] = [0, 1]): void {
  for (const d of days) recordAnswer(s, wordKey(wordId), { firstTry: true }, T0 + d * DAY);
}

export function learnWeek(s: AppState, weekIndex: number, days: number[] = [0, 1]): void {
  for (const id of s.curriculum.weeks[weekIndex].wordIds) learnWord(s, id, days);
}
