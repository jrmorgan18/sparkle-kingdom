import type { Curriculum } from '../data/types';
import type { Slot } from '../data/rewards';

export const SCHEMA_VERSION = 1;

/** The three separately-tracked number skills. */
export type NumberSkill = 'seq' | 'count' | 'numeral';
export const NUMBER_SKILLS: NumberSkill[] = ['seq', 'count', 'numeral'];

/**
 * Skill keys:
 *   w:<wordId>            sight word recognition
 *   n:seq:<n>             rote sequence (what comes next / before / missing)
 *   n:count:<n>           counting objects one-to-one / making a set
 *   n:numeral:<n>         recognizing the written numeral
 */
export type SkillKey = string;

export interface ReviewState {
  /** Index into config.reviewIntervalsDays of the interval currently scheduled. */
  stage: number;
  dueAt: number;
  lastReviewedAt: number | null;
  lapses: number;
}

export interface SkillRecord {
  key: SkillKey;
  /** Questions asked (first taps only). */
  attempts: number;
  firstTryCorrect: number;
  /** First-try misses. */
  misses: number;
  /** Sequence only: times she picked the number AFTER the gap (skipped the missing number). */
  skips: number;
  /** Distinct local calendar days (YYYY-MM-DD) with at least one first-try correct answer. */
  correctDays: string[];
  /** Adaptive weight: grows with misses, decays with first-try successes. */
  missWeight: number;
  firstSeenAt: number | null;
  lastSeenAt: number | null;
  lastMissAt: number | null;
  learnedAt: number | null;
  learnedSource: 'earned' | 'parent' | null;
  review: ReviewState | null;
}

export interface Outcome {
  /** Was the first tap correct? */
  firstTry: boolean;
  /** Sequence questions: did the wrong pick skip over the missing number? */
  skipped?: boolean;
}

export type GameKind = 'shell' | 'bubble' | 'invite' | 'match' | 'necklace' | 'jewels' | 'tenframe' | 'shop' | 'next';
export const WORD_GAMES: GameKind[] = ['shell', 'bubble', 'invite', 'match'];
export const NUMBER_GAMES: GameKind[] = ['necklace', 'jewels', 'tenframe', 'shop', 'next'];

export type Category = 'focus' | 'review' | 'easy';

export interface WeekProgress {
  weekId: string;
  unlocked: boolean;
  unlockSource: 'initial' | 'progression' | 'parent' | null;
  unlockedAt: number | null;
  /** A parent re-locked this week: automatic unlocking leaves it alone until a parent unlocks it. */
  lockedByParent: boolean;
}

export interface Ownership {
  at: number | null;
  source: 'earned' | 'parent';
  /** Why it was given (parent-facing history): a skill key, or "session". */
  reason?: string;
}

export interface StickerPlacement {
  id: string;
  stickerId: string;
  /** Center position as a fraction (0–1) of scene width/height. */
  x: number;
  y: number;
  scale: number;
  /** Higher numbers draw on top. */
  layer: number;
  flip?: boolean;
}

export type SceneId = 'castle' | 'ballroom' | 'lagoon';

export interface SceneState {
  id: SceneId;
  placements: StickerPlacement[];
  updatedAt: number | null;
}

export type CharacterId = 'pearl' | 'rosie' | 'gigi';

/** Item ids by slot. `null` = the character's own starter outfit / nothing. */
export type Outfit = Partial<Record<Slot, string | null>>;

export interface SavedLook {
  id: string;
  name: string;
  character: CharacterId;
  outfit: Outfit;
  savedAt: number;
}

export interface SessionRecord {
  id: string;
  startedAt: number;
  endedAt: number | null;
  placement: boolean;
  games: GameKind[];
  answers: number;
  firstTryCorrect: number;
  newlyLearned: SkillKey[];
  rewards: string[];
  /** Stars given when every reward was already owned. */
  stars: number;
}

export interface PlacementResult {
  doneAt: number;
  /** Did she get the 1–10 baseline items right on the first try? */
  baselineOk: boolean;
  shakyTeens: number[];
  solidTeens: number[];
}

export interface Settings {
  childName: string;
  soundOn: boolean;
  /** Speak prompts aloud (recorded voice first, then speech synthesis). */
  voiceOn: boolean;
  speechRate: number;
  motion: 'system' | 'reduced' | 'full';
  /** Session length in minutes. Controls how many mini-games an adventure has. */
  sessionMinutes: 3 | 5 | 8;
  /** Adventures per day before Pearl "goes to sleep" (0 = no limit). */
  sessionsPerDay: number;
  /** Highest number used in counting games (20 by default; can be extended to 30). */
  countingMax: number;
  /** Salted hash of the grown-ups PIN, or null when no PIN is set. */
  parentPinHash: string | null;
}

export interface MasteryConfig {
  /** Distinct days with a first-try correct answer required to count as learned. */
  learnedDays: number;
  reviewIntervalsDays: number[];
  mix: { focus: number; review: number; easy: number };
  /** Let a new week unlock automatically when the current week's words are learned. */
  autoUnlockWeeks: boolean;
}

export interface Dressing {
  character: CharacterId;
  outfits: Record<CharacterId, Outfit>;
  looks: SavedLook[];
}

export interface AppState {
  schemaVersion: number;
  createdAt: number;
  curriculum: Curriculum;
  skills: Record<SkillKey, SkillRecord>;
  weekProgress: Record<string, WeekProgress>;
  owned: Record<string, Ownership>;
  /** Rewards earned but not yet revealed (capped per session so reveals stay short). */
  rewardBank: { reason: string }[];
  /** Bonus stars given after every catalog item is owned. */
  stars: number;
  scenes: Record<SceneId, SceneState>;
  dressing: Dressing;
  sessions: SessionRecord[];
  placement: PlacementResult | null;
  settings: Settings;
  config: MasteryConfig;
}
