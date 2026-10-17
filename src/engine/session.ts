/**
 * Session builder (pure): turns the current learning state into a short "adventure" — a few
 * mini-games, alternating sight words and numbers, each with pre-generated rounds.
 */
import { createRng, shuffle, type Rng } from '../lib/random';
import { GAMES_PER_SESSION } from './config';
import { numKey, parseKey, wordKey } from './mastery';
import { categoryPlan, choiceCount, selectNumbers, selectWords, type Pick } from './selection';
import type { AppState, Category, GameKind, NumberSkill, SkillKey } from './types';
import { NUMBER_GAMES, WORD_GAMES } from './types';
import { currentWeek, knownWordIds } from './weeks';

interface Scored {
  key: SkillKey;
  category: Category;
}

export interface WordChoiceRound extends Scored {
  game: 'shell' | 'bubble';
  wordId: string;
  options: string[];
}
export interface InviteRound extends Scored {
  game: 'invite';
  wordId: string;
}
export interface MatchRound {
  game: 'match';
  wordIds: string[];
}
export interface NecklaceRound extends Scored {
  game: 'necklace';
  run: number[];
  gapIndex: number;
  options: number[];
}
export interface JewelsRound extends Scored {
  game: 'jewels';
  count: number;
  options: number[];
}
export interface TenFrameRound extends Scored {
  game: 'tenframe';
  mode: 'pick' | 'build';
  target: number;
  options: number[];
}
export interface ShopRound extends Scored {
  game: 'shop';
  target: number;
}
export interface NextRound extends Scored {
  game: 'next';
  /** The numbers shown on rocks (the answer is not among them). */
  run: number[];
  dir: 'next' | 'before';
  answer: number;
  options: number[];
}

export type Round = WordChoiceRound | InviteRound | MatchRound | NecklaceRound | JewelsRound | TenFrameRound | ShopRound | NextRound;

export interface GamePlan {
  kind: GameKind;
  rounds: Round[];
}

export interface SessionPlan {
  id: string;
  createdAt: number;
  placement: boolean;
  games: GamePlan[];
}

export const ROUNDS: Record<GameKind, number> = { shell: 3, bubble: 3, invite: 3, match: 1, necklace: 3, jewels: 2, tenframe: 3, shop: 2, next: 3 };

/** Which number skill each game practices (ten-frame "build" rounds practice counting). */
export const GAME_SKILL: Partial<Record<GameKind, NumberSkill>> = { necklace: 'seq', next: 'seq', jewels: 'count', shop: 'count', tenframe: 'numeral' };

/** Relative preference for number games: the necklace directly targets skipped teens. */
const NUMBER_WEIGHT: Record<string, number> = { necklace: 2.2, next: 1.4, jewels: 1.4, tenframe: 1.3, shop: 1.1 };

export function scoredRounds(plan: SessionPlan): number {
  return plan.games.reduce((a, g) => a + g.rounds.filter((r) => 'key' in r).length, 0);
}

// ───────────────────────────── Game choice ─────────────────────────────

/** How many sessions ago each game kind was played (Infinity = never). */
function recency(state: AppState): Map<GameKind, number> {
  const m = new Map<GameKind, number>();
  const sessions = state.sessions.slice().reverse();
  sessions.forEach((s, i) => s.games.forEach((g) => (m.has(g) ? null : m.set(g, i))));
  return m;
}

export function chooseGames(state: AppState, count: number, rng: Rng): GameKind[] {
  const rec = recency(state);
  const rank = (kinds: GameKind[], weights: Record<string, number>) =>
    kinds
      .map((k) => ({ k, s: Math.min(rec.get(k) ?? 6, 6) * (weights[k] ?? 1) + rng() * 1.5 }))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.k);
  const words = rank(WORD_GAMES, {});
  const numbers = rank(NUMBER_GAMES, NUMBER_WEIGHT);
  const out: GameKind[] = [];
  for (let i = 0; out.length < count; i++) {
    const list = i % 2 === 0 ? words : numbers;
    out.push(list[Math.floor(i / 2) % list.length]);
  }
  return out;
}

// ───────────────────────────── Distractors ─────────────────────────────

function wordOptions(state: AppState, targetId: string, n: number, rng: Rng): string[] {
  const known = knownWordIds(state).filter((id) => id !== targetId);
  const target = state.curriculum.words[targetId]?.text.toLowerCase();
  const pool = shuffle(known, rng).filter((id) => state.curriculum.words[id]?.text.toLowerCase() !== target);
  if (pool.length < n - 1) {
    // Early on, borrow words from upcoming weeks so there are always enough clams to choose from.
    const extra = state.curriculum.weeks.flatMap((w) => w.wordIds).filter((id) => id !== targetId && !pool.includes(id) && state.curriculum.words[id]?.text.toLowerCase() !== target);
    pool.push(...extra.slice(0, n - 1 - pool.length));
  }
  return shuffle([targetId, ...pool.slice(0, n - 1)], rng);
}

/** Nearby numbers first (±1, ±2), then teen/ten confusions (14 vs 4, 12 vs 21), then anything in range. */
export function numberOptions(answer: number, n: number, max: number, rng: Rng, mustInclude: number[] = [], exclude: number[] = []): number[] {
  const ok = (x: number) => x >= 0 && x <= max && x !== answer && !exclude.includes(x);
  const picks: number[] = [];
  const add = (x: number) => {
    if (ok(x) && !picks.includes(x) && picks.length < n - 1) picks.push(x);
  };
  mustInclude.forEach(add);
  const near = shuffle([answer + 1, answer - 1, answer + 2, answer - 2], rng);
  const confusable = [answer >= 10 ? answer - 10 : answer + 10, Number(String(answer).split('').reverse().join(''))];
  [...near, ...confusable].forEach(add);
  for (let d = 3; picks.length < n - 1 && d <= max; d++) {
    add(answer + d);
    add(answer - d);
  }
  return shuffle([answer, ...picks], rng);
}

// ───────────────────────────── Round builders ─────────────────────────────

function wordIdOf(key: SkillKey): string {
  const p = parseKey(key);
  return p?.kind === 'word' ? p.wordId : '';
}
function numOf(key: SkillKey): number {
  const p = parseKey(key);
  return p?.kind === 'number' ? p.n : 0;
}

export function necklaceRound(state: AppState, pick: Pick, rng: Rng, opts: { len?: number; choices?: number } = {}): NecklaceRound {
  const max = state.settings.countingMax;
  const n = numOf(pick.key);
  const len = opts.len ?? 4;
  // Keep the gap inside the run when possible so numbers on both sides are spoken.
  const interior = Array.from({ length: Math.max(1, len - 2) }, (_, i) => i + 1);
  let gapIndex = interior[Math.floor(rng() * interior.length)];
  let start = n - gapIndex;
  if (start < 0) start = 0;
  if (start + len - 1 > max) start = Math.max(0, max - len + 1);
  gapIndex = n - start;
  const run = Array.from({ length: len }, (_, i) => start + i);
  const choices = opts.choices ?? choiceCount(state, pick.key, 3);
  // Always offer the number AFTER the gap when it exists, so a skip shows up as a distinct pick.
  return { game: 'necklace', key: pick.key, category: pick.category, run, gapIndex, options: numberOptions(n, choices, max, rng, [n + 1]) };
}

export function nextRound(state: AppState, pick: Pick, rng: Rng, forceDir?: 'next' | 'before', choicesOverride?: number): NextRound {
  const max = state.settings.countingMax;
  const n = numOf(pick.key);
  const learned = state.skills[pick.key]?.learnedAt != null;
  let dir: 'next' | 'before' = forceDir ?? (learned && rng() < 0.6 ? 'before' : rng() < 0.25 ? 'before' : 'next');
  if (dir === 'before' && n + 3 > max) dir = 'next';
  if (dir === 'next' && n < 1) dir = 'before';
  const run = dir === 'next' ? [n - 3, n - 2, n - 1].filter((x) => x >= 0) : [n + 1, n + 2, n + 3];
  const choices = choicesOverride ?? choiceCount(state, pick.key, 3);
  return { game: 'next', key: pick.key, category: pick.category, run, dir, answer: n, options: numberOptions(n, choices, max, rng, [], run) };
}

function buildRounds(state: AppState, kind: GameKind, picks: Pick[], rng: Rng): Round[] {
  const max = state.settings.countingMax;
  switch (kind) {
    case 'shell':
    case 'bubble':
      return picks.map((p) => ({ game: kind, key: p.key, category: p.category, wordId: wordIdOf(p.key), options: wordOptions(state, wordIdOf(p.key), choiceCount(state, p.key), rng) }));
    case 'invite':
      return picks.map((p) => ({ game: 'invite', key: p.key, category: p.category, wordId: wordIdOf(p.key) }));
    case 'match': {
      const ids = [...new Set(picks.map((p) => wordIdOf(p.key)))];
      for (const id of shuffle(knownWordIds(state), rng)) if (ids.length < 3 && !ids.includes(id)) ids.push(id);
      return [{ game: 'match', wordIds: ids.slice(0, 3) }];
    }
    case 'necklace':
      return picks.map((p) => necklaceRound(state, p, rng));
    case 'next':
      return picks.map((p) => nextRound(state, p, rng));
    case 'jewels':
      return picks.map((p) => ({ game: 'jewels', key: p.key, category: p.category, count: numOf(p.key), options: numberOptions(numOf(p.key), choiceCount(state, p.key), max, rng) }));
    case 'tenframe':
      return picks.map((p, i) => {
        const n = numOf(p.key);
        const mode = i === 1 ? 'build' : 'pick';
        const key = mode === 'build' ? numKey('count', n) : p.key;
        return { game: 'tenframe', key, category: p.category, mode, target: n, options: numberOptions(n, choiceCount(state, key), Math.min(max, 20), rng) };
      });
    case 'shop':
      return picks.map((p) => ({ game: 'shop', key: p.key, category: p.category, target: numOf(p.key) }));
  }
}

/** Ten-frame needs "ten and some more", and the shop basket stays manageable. */
function rangeFor(kind: GameKind, max: number) {
  if (kind === 'tenframe') return { lo: 11, hi: Math.min(20, max) };
  if (kind === 'shop') return { lo: 1, hi: Math.min(20, max) };
  return undefined;
}

// ───────────────────────────── Sessions ─────────────────────────────

export function buildSession(state: AppState, now: number, seed: number = now): SessionPlan {
  const rng = createRng(seed);
  const count = GAMES_PER_SESSION[state.settings.sessionMinutes] ?? 4;
  const kinds = chooseGames(state, count, rng);

  // One category plan per domain across the whole session, so the 60/25/15 mix holds overall.
  const wordKinds = kinds.filter((k) => WORD_GAMES.includes(k));
  const numberKinds = kinds.filter((k) => NUMBER_GAMES.includes(k));
  const wordPlan = categoryPlan(wordKinds.reduce((a, k) => a + ROUNDS[k], 0), state.config.mix);
  const numberPlan = categoryPlan(numberKinds.reduce((a, k) => a + ROUNDS[k], 0), state.config.mix);

  // Make sure every current-week word shows up at least once in word games.
  const week = currentWeek(state);
  let wi = 0;
  let ni = 0;
  const games: GamePlan[] = kinds.map((kind) => {
    const n = ROUNDS[kind];
    if (WORD_GAMES.includes(kind)) {
      const plan = wordPlan.slice(wi, wi + n);
      wi += n;
      return { kind, rounds: buildRounds(state, kind, selectWords(state, n, now, rng, plan), rng) };
    }
    const plan = numberPlan.slice(ni, ni + n);
    ni += n;
    const picks = selectNumbers(state, GAME_SKILL[kind]!, n, now, rng, { range: rangeFor(kind, state.settings.countingMax), plan });
    return { kind, rounds: buildRounds(state, kind, picks, rng) };
  });
  ensureWeekCoverage(state, games, week?.wordIds ?? []);
  return { id: `ses-${now.toString(36)}-${Math.floor(rng() * 1e6).toString(36)}`, createdAt: now, placement: false, games };
}

/**
 * Makes sure she meets every unlearned current-week word: swaps repeated focus words in scored
 * rounds first, then puts any still-missing word into Word Match.
 */
function ensureWeekCoverage(state: AppState, games: GamePlan[], weekWordIds: string[]): void {
  const unlearned = weekWordIds.filter((id) => state.curriculum.words[id] && state.skills[wordKey(id)]?.learnedAt == null);
  const all = games.flatMap((g) => g.rounds);
  const rounds = all.filter((r): r is WordChoiceRound | InviteRound => r.game === 'shell' || r.game === 'bubble' || r.game === 'invite');
  const match = all.find((r): r is MatchRound => r.game === 'match');
  const present = () => new Set([...rounds.map((r) => r.wordId), ...(match?.wordIds ?? [])]);
  for (const id of unlearned) {
    if (present().has(id)) continue;
    const counts = new Map<string, number>();
    rounds.forEach((r) => counts.set(r.wordId, (counts.get(r.wordId) ?? 0) + 1));
    const victim = rounds.find((r) => r.category === 'focus' && (counts.get(r.wordId) ?? 0) > 1);
    if (victim) {
      const oldId = victim.wordId;
      victim.wordId = id;
      victim.key = wordKey(id);
      if (victim.game !== 'invite') {
        victim.options = victim.options.includes(id) ? victim.options.map((o) => (o === id ? oldId : o === oldId ? id : o)) : victim.options.map((o) => (o === oldId ? id : o));
      }
    } else if (match) {
      const swap = match.wordIds.findIndex((w) => !weekWordIds.includes(w) || (rounds.some((r) => r.wordId === w) && !unlearned.includes(w)));
      if (swap >= 0) match.wordIds[swap] = id;
      else if (match.wordIds.length < 3) match.wordIds.push(id);
    }
  }
}

// ───────────────────────────── Placement check ─────────────────────────────

export const PLACEMENT_TEENS = [12, 13, 14, 15, 17, 19];
export const PLACEMENT_BASELINE_COUNT = 6;

/**
 * First-launch placement, presented as a normal adventure: count a few jewels and say what comes
 * next (1–10 baseline), then a run of missing-pearl necklaces across the teens, then meet the first
 * sight words. Results set the starting focus.
 */
export function buildPlacement(state: AppState, now: number, seed: number = now): SessionPlan {
  const rng = createRng(seed);
  const max = state.settings.countingMax;
  const focus = (key: SkillKey): Pick => ({ key, category: 'focus' });
  const jewels: JewelsRound = { game: 'jewels', key: numKey('count', PLACEMENT_BASELINE_COUNT), category: 'easy', count: PLACEMENT_BASELINE_COUNT, options: numberOptions(PLACEMENT_BASELINE_COUNT, 3, max, rng) };
  const next = [6, 9].map((n) => nextRound(state, { key: numKey('seq', n), category: 'easy' }, rng, 'next', 3));
  const teens = PLACEMENT_TEENS.filter((n) => n <= max).map((n) => necklaceRound(state, focus(numKey('seq', n)), rng, { choices: 3 }));
  const week = state.curriculum.weeks[0];
  const words = (week?.wordIds ?? []).slice(0, 2).map((id) => focus(wordKey(id)));
  const games: GamePlan[] = [
    { kind: 'jewels', rounds: [jewels] },
    { kind: 'next', rounds: next },
    { kind: 'necklace', rounds: teens },
  ];
  if (words.length) games.push({ kind: 'shell', rounds: buildRounds(state, 'shell', words, rng) });
  return { id: `plc-${now.toString(36)}`, createdAt: now, placement: true, games };
}
