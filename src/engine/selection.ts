/**
 * Adaptive item selection (pure). Each session mixes about 60% focus items (current week's words,
 * teen numbers), 25% review (due or recently learned), and 15% easy wins (1–10, long-learned words).
 * Within a category, items she misses — and teen numbers she skips — are picked more often.
 */
import type { Rng } from '../lib/random';
import { DAY } from '../lib/clock';
import { isDue, numKey, peekSkill, wordKey } from './mastery';
import type { AppState, Category, MasteryConfig, NumberSkill, SkillKey } from './types';
import { focusWordIds, knownWordIds } from './weeks';

export interface Pick {
  key: SkillKey;
  category: Category;
}

const RECENT_MS = 10 * DAY;

/**
 * Splits `total` slots into categories by the configured mix (largest-remainder rounding), then
 * orders them: an easy win first (confidence), with review and easy slots spread through the rest.
 */
export function categoryPlan(total: number, mix: MasteryConfig['mix']): Category[] {
  if (total <= 0) return [];
  const cats: Category[] = ['focus', 'review', 'easy'];
  const sum = cats.reduce((a, c) => a + Math.max(0, mix[c]), 0) || 1;
  const raw = cats.map((c) => (Math.max(0, mix[c]) / sum) * total);
  const counts = raw.map(Math.floor);
  let left = total - counts.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, i] of order) {
    if (left-- <= 0) break;
    counts[i]++;
  }
  const [focus, review, easy] = counts;
  const out: (Category | null)[] = Array(total).fill(null);
  let e = easy;
  if (e > 0) {
    out[0] = 'easy';
    e--;
  }
  // Spread the remaining minority slots evenly.
  const spread = (n: number, cat: Category, offset: number) => {
    for (let k = 0; k < n; k++) {
      let pos = Math.min(total - 1, Math.floor(((k + offset) * total) / n));
      while (out[pos] !== null) pos = (pos + 1) % total;
      out[pos] = cat;
    }
  };
  spread(review, 'review', 0.6);
  spread(e, 'easy', 0.8);
  void focus;
  return out.map((c) => c ?? 'focus');
}

interface Candidate {
  key: SkillKey;
  score: number;
}

function weight(state: AppState, key: SkillKey, rng: Rng, extra = 0): number {
  const rec = peekSkill(state, key);
  let s = extra + rng() * 0.8;
  if (!rec || rec.attempts === 0) return s + 0.6;
  s += rec.missWeight * 2 + rec.skips * 1.5;
  return s;
}

/** Where to look when a category's pool is empty. */
const FALLBACK: Record<Category, Category[]> = {
  focus: ['focus', 'review', 'easy'],
  review: ['review', 'focus', 'easy'],
  easy: ['easy', 'review', 'focus'],
};

/** Picks items for a list of category slots, spreading repeats and preferring high-weight items. */
function pickForPlan(pools: Record<Category, Candidate[]>, plan: Category[]): Pick[] {
  const used = new Map<SkillKey, number>();
  const out: Pick[] = [];
  let last: SkillKey | null = null;
  for (const want of plan) {
    const cat = FALLBACK[want].find((c) => pools[c].length > 0);
    if (!cat) continue;
    const pool = pools[cat];
    let best = pool[0];
    let bestScore = -Infinity;
    for (const c of pool) {
      const score = c.score - (used.get(c.key) ?? 0) * 1.8 - (c.key === last && pool.length > 1 ? 10 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    used.set(best.key, (used.get(best.key) ?? 0) + 1);
    last = best.key;
    out.push({ key: best.key, category: cat });
  }
  return out;
}

// ───────────────────────────── Words ─────────────────────────────

export function wordPools(state: AppState, now: number, rng: Rng): Record<Category, Candidate[]> {
  const focusIds = new Set(focusWordIds(state));
  const known = knownWordIds(state);
  const learned = known.filter((id) => peekSkill(state, wordKey(id))?.learnedAt != null);
  const review: Candidate[] = [];
  const easy: Candidate[] = [];
  for (const id of learned) {
    const rec = peekSkill(state, wordKey(id))!;
    if (isDue(rec, now)) review.push({ key: rec.key, score: weight(state, rec.key, rng, 3 + (now - rec.review!.dueAt) / DAY) });
    else if (now - (rec.learnedAt ?? 0) < RECENT_MS) review.push({ key: rec.key, score: weight(state, rec.key, rng, 1) });
    else easy.push({ key: rec.key, score: weight(state, rec.key, rng) });
  }
  // Before anything is long-learned, easy wins come from words she already answers well.
  if (!easy.length) {
    for (const id of known) {
      const rec = peekSkill(state, wordKey(id));
      if (rec && rec.firstTryCorrect > 0 && rec.missWeight === 0 && !review.some((r) => r.key === rec.key)) easy.push({ key: rec.key, score: weight(state, rec.key, rng) });
    }
  }
  const focus = [...focusIds].map((id) => ({ key: wordKey(id), score: weight(state, wordKey(id), rng, 1) }));
  return { focus, review, easy };
}

export function selectWords(state: AppState, count: number, now: number, rng: Rng, plan?: Category[]): Pick[] {
  return pickForPlan(wordPools(state, now, rng), plan ?? categoryPlan(count, state.config.mix));
}

// ───────────────────────────── Numbers ─────────────────────────────

export interface NumberRange {
  lo: number;
  hi: number;
}

export function numberRange(state: AppState, range?: Partial<NumberRange>): NumberRange {
  const max = Math.max(10, state.settings.countingMax);
  return { lo: Math.max(1, range?.lo ?? 1), hi: Math.min(max, range?.hi ?? max) };
}

/** Teen numbers (and any extended range) she hasn't learned for this skill, plus shaky 1–10s. */
export function numberPools(state: AppState, skill: NumberSkill, now: number, rng: Rng, range?: Partial<NumberRange>): Record<Category, Candidate[]> {
  const { lo, hi } = numberRange(state, range);
  const shakyFromPlacement = new Set(state.placement?.shakyTeens ?? []);
  const baselineShaky = state.placement ? !state.placement.baselineOk : false;
  const focus: Candidate[] = [];
  const review: Candidate[] = [];
  const easy: Candidate[] = [];
  for (let n = lo; n <= hi; n++) {
    const key = numKey(skill, n);
    const rec = peekSkill(state, key);
    const learned = rec?.learnedAt != null;
    if (learned) {
      if (isDue(rec, now)) review.push({ key, score: weight(state, key, rng, 3) });
      else if (now - rec!.learnedAt! < RECENT_MS) review.push({ key, score: weight(state, key, rng, 1) });
      else if (n <= 10) easy.push({ key, score: weight(state, key, rng) });
      else easy.push({ key, score: weight(state, key, rng, -0.5) });
      continue;
    }
    if (n >= 11) {
      focus.push({ key, score: weight(state, key, rng, 1 + (shakyFromPlacement.has(n) ? 1.5 : 0)) });
    } else if ((rec && rec.missWeight > 0) || baselineShaky) {
      focus.push({ key, score: weight(state, key, rng) });
    } else {
      easy.push({ key, score: weight(state, key, rng) });
    }
  }
  // Ranges without 1–10 (e.g. ten-frame 11–20): easiest items are the lowest numbers.
  if (!easy.length) {
    for (let n = lo; n <= Math.min(hi, lo + 2); n++) easy.push({ key: numKey(skill, n), score: weight(state, numKey(skill, n), rng) });
  }
  return { focus, review, easy };
}

export function selectNumbers(state: AppState, skill: NumberSkill, count: number, now: number, rng: Rng, opts?: { range?: Partial<NumberRange>; plan?: Category[] }): Pick[] {
  return pickForPlan(numberPools(state, skill, now, rng, opts?.range), opts?.plan ?? categoryPlan(count, state.config.mix));
}

/** How many answer choices to show: 2 for new items, 3 while practicing, up to `max` once learned. */
export function choiceCount(state: AppState, key: SkillKey, max = 4): number {
  const rec = peekSkill(state, key);
  if (!rec || rec.attempts < 2) return Math.min(2, max);
  if (rec.learnedAt == null) return Math.min(3, max);
  return max;
}
