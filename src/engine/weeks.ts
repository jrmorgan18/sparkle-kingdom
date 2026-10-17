/** Weekly sight-word sets: which week is current, what's unlocked, and automatic unlocking. */
import type { WordWeek } from '../data/types';
import { isLearned, wordKey } from './mastery';
import type { AppState, WeekProgress } from './types';

export function emptyWeekProgress(weekId: string): WeekProgress {
  return { weekId, unlocked: false, unlockSource: null, unlockedAt: null, lockedByParent: false };
}

export function weekIndex(state: AppState, weekId: string): number {
  return state.curriculum.weeks.findIndex((w) => w.id === weekId);
}

export function findWeek(state: AppState, weekId: string): WordWeek | undefined {
  return state.curriculum.weeks.find((w) => w.id === weekId);
}

export function isWeekUnlocked(state: AppState, weekId: string): boolean {
  return Boolean(state.weekProgress[weekId]?.unlocked);
}

export function unlockedWeeks(state: AppState): WordWeek[] {
  return state.curriculum.weeks.filter((w) => isWeekUnlocked(state, w.id));
}

export function weekLearned(state: AppState, week: WordWeek): boolean {
  return week.wordIds.length > 0 && week.wordIds.every((id) => isLearned(state, wordKey(id)));
}

/**
 * The current week: the earliest unlocked week that still has unlearned words; if every unlocked
 * week is learned, the latest unlocked week; if nothing is unlocked, the first week.
 */
export function currentWeek(state: AppState): WordWeek | undefined {
  const unlocked = unlockedWeeks(state).filter((w) => w.wordIds.length > 0);
  return unlocked.find((w) => !weekLearned(state, w)) ?? unlocked[unlocked.length - 1] ?? state.curriculum.weeks[0];
}

/** Words from unlocked weeks (the pool for distractors and review). */
export function knownWordIds(state: AppState): string[] {
  const ids = unlockedWeeks(state).flatMap((w) => w.wordIds);
  return [...new Set(ids)].filter((id) => state.curriculum.words[id]);
}

/** Focus words: unlearned words in the current week and any earlier unlocked weeks. */
export function focusWordIds(state: AppState): string[] {
  const cur = currentWeek(state);
  const curIdx = cur ? weekIndex(state, cur.id) : 0;
  const ids: string[] = [];
  state.curriculum.weeks.forEach((w, i) => {
    if (i > curIdx) return;
    if (i < curIdx && !isWeekUnlocked(state, w.id)) return;
    for (const id of w.wordIds) if (state.curriculum.words[id] && !isLearned(state, wordKey(id))) ids.push(id);
  });
  return [...new Set(ids)];
}

/**
 * Unlocks the next locked week whenever the current one is fully learned. Returns unlocked ids.
 * Respects config.autoUnlockWeeks (the parent can switch it off and unlock manually). Mutates.
 */
export function autoUnlock(state: AppState, now: number): string[] {
  if (!state.config.autoUnlockWeeks) return [];
  const out: string[] = [];
  const weeks = state.curriculum.weeks;
  for (let i = 0; i < weeks.length - 1; i++) {
    const w = weeks[i];
    if (!isWeekUnlocked(state, w.id) || !weekLearned(state, w)) continue;
    const next = weeks[i + 1];
    const wp = (state.weekProgress[next.id] ??= emptyWeekProgress(next.id));
    if (wp.lockedByParent) break;
    if (!wp.unlocked) {
      wp.unlocked = true;
      wp.unlockSource = 'progression';
      wp.unlockedAt = now;
      out.push(next.id);
      // Only one new week at a time: stop once the newly unlocked week has unlearned words.
      if (!weekLearned(state, next)) break;
    }
  }
  return out;
}
