/**
 * Skill records, the two-day "learned" rule, and lightweight spaced review. All mutators take the
 * (draft) state and `now`, so they are pure with respect to time and easy to unit test.
 *
 *  - An item is LEARNED after first-try-correct answers on `config.learnedDays` (2) different local
 *    calendar days. Several correct answers on the same day count once — this rewards next-day recall.
 *  - Learned items come back on a spaced schedule (1, 3, 7, 14 days). A first-try correct answer on or
 *    after the due day advances the schedule; a miss steps it back and makes it due tomorrow.
 *  - Nothing here ever un-learns an item or touches rewards.
 */
import { DAY } from '../lib/clock';
import type { AppState, NumberSkill, Outcome, ReviewState, SkillKey, SkillRecord } from './types';

export const wordKey = (wordId: string): SkillKey => `w:${wordId}`;
export const numKey = (skill: NumberSkill, n: number): SkillKey => `n:${skill}:${n}`;

export type ParsedKey = { kind: 'word'; wordId: string } | { kind: 'number'; skill: NumberSkill; n: number };

export function parseKey(key: SkillKey): ParsedKey | null {
  if (key.startsWith('w:')) return { kind: 'word', wordId: key.slice(2) };
  const m = /^n:(seq|count|numeral):(\d+)$/.exec(key);
  return m ? { kind: 'number', skill: m[1] as NumberSkill, n: Number(m[2]) } : null;
}

/** Local calendar day, e.g. "2026-10-16". */
export function dayKey(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Local midnight at the end of the day containing `t`. */
export function endOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

export function emptySkill(key: SkillKey): SkillRecord {
  return {
    key,
    attempts: 0,
    firstTryCorrect: 0,
    misses: 0,
    skips: 0,
    correctDays: [],
    missWeight: 0,
    firstSeenAt: null,
    lastSeenAt: null,
    lastMissAt: null,
    learnedAt: null,
    learnedSource: null,
    review: null,
  };
}

export function skill(state: AppState, key: SkillKey): SkillRecord {
  return (state.skills[key] ??= emptySkill(key));
}

/** Read-only lookup that doesn't create a record. */
export function peekSkill(state: AppState, key: SkillKey): SkillRecord | undefined {
  return state.skills[key];
}

export function isLearned(state: AppState, key: SkillKey): boolean {
  return state.skills[key]?.learnedAt != null;
}

/** Is a learned item due for review by the end of today? */
export function isDue(rec: SkillRecord | undefined, now: number): boolean {
  return Boolean(rec?.learnedAt != null && rec.review && rec.review.dueAt < endOfDay(now));
}

function intervalMs(state: AppState, stage: number): number {
  const list = state.config.reviewIntervalsDays.length ? state.config.reviewIntervalsDays : [1, 3, 7, 14];
  return list[Math.min(stage, list.length - 1)] * DAY;
}

export function firstReview(state: AppState, now: number): ReviewState {
  return { stage: 0, dueAt: now + intervalMs(state, 0), lastReviewedAt: null, lapses: 0 };
}

export interface AnswerResult {
  newlyLearned: boolean;
}

/** Records one question's outcome for a skill. Mutates. */
export function recordAnswer(state: AppState, key: SkillKey, outcome: Outcome, now: number): AnswerResult {
  const rec = skill(state, key);
  const wasDue = isDue(rec, now);
  rec.attempts++;
  rec.firstSeenAt ??= now;
  rec.lastSeenAt = now;

  if (outcome.firstTry) {
    rec.firstTryCorrect++;
    rec.missWeight = Math.max(0, rec.missWeight - 0.5);
    const day = dayKey(now);
    if (!rec.correctDays.includes(day)) rec.correctDays = [...rec.correctDays, day].slice(-12);

    if (rec.learnedAt == null) {
      if (rec.correctDays.length >= Math.max(1, state.config.learnedDays)) {
        rec.learnedAt = now;
        rec.learnedSource = 'earned';
        rec.review = firstReview(state, now);
        return { newlyLearned: true };
      }
    } else if (rec.review && wasDue) {
      const stage = rec.review.stage + 1;
      rec.review = { ...rec.review, stage, dueAt: now + intervalMs(state, stage), lastReviewedAt: now };
    }
    return { newlyLearned: false };
  }

  rec.misses++;
  rec.missWeight = Math.min(6, rec.missWeight + 1);
  rec.lastMissAt = now;
  if (outcome.skipped) rec.skips++;
  if (rec.learnedAt != null) {
    // A miss shortens the interval. It never removes "learned" status or rewards.
    const r = rec.review ?? firstReview(state, now);
    rec.review = { ...r, stage: Math.max(0, r.stage - 1), dueAt: now + DAY, lastReviewedAt: now, lapses: r.lapses + 1 };
  }
  return { newlyLearned: false };
}

/** Exposure without a scored answer (e.g. flipping cards in Word Match). */
export function recordExposure(state: AppState, key: SkillKey, now: number): void {
  const rec = skill(state, key);
  rec.firstSeenAt ??= now;
  rec.lastSeenAt = now;
}

/** Parent override: mark learned now. Mutates. */
export function markLearned(state: AppState, key: SkillKey, now: number, source: 'earned' | 'parent' = 'parent'): boolean {
  const rec = skill(state, key);
  if (rec.learnedAt != null) return false;
  rec.learnedAt = now;
  rec.learnedSource = source;
  rec.review = firstReview(state, now);
  return true;
}

/** "Shaky": has been missed recently and isn't learned yet. Used for parent views and prioritizing. */
export function isShaky(rec: SkillRecord | undefined): boolean {
  return Boolean(rec && rec.learnedAt == null && (rec.missWeight > 0 || rec.skips > 0));
}

export type ItemStatus = 'new' | 'practicing' | 'shaky' | 'learned';

export function itemStatus(rec: SkillRecord | undefined): ItemStatus {
  if (!rec || rec.attempts === 0) return 'new';
  if (rec.learnedAt != null) return 'learned';
  return isShaky(rec) ? 'shaky' : 'practicing';
}
