/**
 * Adventure lifecycle. All functions mutate the given (draft) state.
 *
 *   startSession → recordRound (per question) → finishSession (rewards + gentle ending)
 */
import { MAX_LEARN_REWARDS_PER_SESSION, MAX_SESSION_HISTORY } from './config';
import { dayKey, parseKey, recordAnswer, recordExposure, wordKey } from './mastery';
import { awardNext, type Award } from './rewards';
import { PLACEMENT_BASELINE_COUNT, PLACEMENT_TEENS, type SessionPlan } from './session';
import type { AppState, Outcome, SessionRecord, SkillKey } from './types';
import { autoUnlock } from './weeks';

export function startSession(state: AppState, plan: SessionPlan, now: number): string {
  const rec: SessionRecord = {
    id: plan.id,
    startedAt: now,
    endedAt: null,
    placement: plan.placement,
    games: plan.games.map((g) => g.kind),
    answers: 0,
    firstTryCorrect: 0,
    newlyLearned: [],
    rewards: [],
    stars: 0,
  };
  state.sessions.push(rec);
  if (state.sessions.length > MAX_SESSION_HISTORY) state.sessions.splice(0, state.sessions.length - MAX_SESSION_HISTORY);
  return rec.id;
}

function session(state: AppState, id: string): SessionRecord | undefined {
  return state.sessions.find((s) => s.id === id);
}

export interface RoundResult {
  newlyLearned: boolean;
  unlockedWeeks: string[];
}

/** Records one question. A newly learned item banks a reward (revealed at the end of the adventure). */
export function recordRound(state: AppState, sessionId: string, key: SkillKey, outcome: Outcome, now: number): RoundResult {
  const { newlyLearned } = recordAnswer(state, key, outcome, now);
  const s = session(state, sessionId);
  if (s) {
    s.answers++;
    if (outcome.firstTry) s.firstTryCorrect++;
    if (newlyLearned) s.newlyLearned.push(key);
  }
  let unlockedWeeks: string[] = [];
  if (newlyLearned) {
    state.rewardBank.push({ reason: key });
    if (key.startsWith('w:')) unlockedWeeks = autoUnlock(state, now);
  }
  return { newlyLearned, unlockedWeeks };
}

export function recordMatchExposure(state: AppState, wordIds: string[], now: number): void {
  for (const id of wordIds) recordExposure(state, wordKey(id), now);
}

export interface FinishResult {
  awards: Award[];
}

/**
 * Ends an adventure: one reward for finishing, plus up to MAX_LEARN_REWARDS_PER_SESSION banked
 * learn-rewards (any extra stay banked for next time, so every learned item is eventually rewarded).
 * Calling it twice is harmless.
 */
export function finishSession(state: AppState, sessionId: string, now: number): FinishResult {
  const s = session(state, sessionId);
  if (!s || s.endedAt != null) return { awards: [] };
  s.endedAt = now;
  const awards: Award[] = [awardNext(state, 'session', now)];
  const learnRewards = state.rewardBank.splice(0, MAX_LEARN_REWARDS_PER_SESSION);
  for (const r of learnRewards) awards.push(awardNext(state, r.reason, now));
  s.rewards = awards.map((a) => a.itemId).filter((x): x is string => Boolean(x));
  s.stars = awards.filter((a) => !a.itemId).length;
  if (s.placement) applyPlacement(state, now);
  return { awards };
}

/** Finished adventures today (placement included). */
export function sessionsToday(state: AppState, now: number): number {
  const today = dayKey(now);
  return state.sessions.filter((s) => s.endedAt != null && dayKey(s.endedAt) === today).length;
}

export function canPlayMore(state: AppState, now: number): boolean {
  const limit = state.settings.sessionsPerDay;
  return !limit || sessionsToday(state, now) < limit;
}

/**
 * Reads placement answers back out of the skill records and stores the summary that seeds the
 * starting focus (shaky teens get extra weight in selection; a missed baseline brings 1–10 into focus).
 */
export function applyPlacement(state: AppState, now: number): void {
  const firstTry = (key: SkillKey) => {
    const r = state.skills[key];
    return Boolean(r && r.firstTryCorrect > 0 && r.misses === 0);
  };
  const baseline = [`n:count:${PLACEMENT_BASELINE_COUNT}`, 'n:seq:6', 'n:seq:9'];
  const baselineOk = baseline.every(firstTry);
  const teens = PLACEMENT_TEENS.filter((n) => n <= state.settings.countingMax);
  const shakyTeens = teens.filter((n) => !firstTry(`n:seq:${n}`));
  const solidTeens = teens.filter((n) => firstTry(`n:seq:${n}`));
  state.placement = { doneAt: now, baselineOk, shakyTeens, solidTeens };
}

export function needsPlacement(state: AppState): boolean {
  return state.placement == null;
}

/** Parent-facing summary of which teen numbers are shaky, across all three skills. */
export function shakyTeenReport(state: AppState): { n: number; skips: number; misses: number; learnedSkills: number }[] {
  const out = [];
  for (let n = 11; n <= state.settings.countingMax; n++) {
    let skips = 0;
    let misses = 0;
    let learnedSkills = 0;
    for (const sk of ['seq', 'count', 'numeral']) {
      const r = state.skills[`n:${sk}:${n}`];
      if (!r) continue;
      skips += r.skips;
      misses += r.misses;
      if (r.learnedAt != null) learnedSkills++;
    }
    out.push({ n, skips, misses, learnedSkills });
  }
  return out;
}

export function describeKey(state: AppState, key: SkillKey): string {
  const p = parseKey(key);
  if (!p) return key;
  if (p.kind === 'word') return `“${state.curriculum.words[p.wordId]?.text ?? p.wordId}”`;
  const label = { seq: 'sequence', count: 'counting', numeral: 'numeral' }[p.skill];
  return `${p.n} (${label})`;
}
