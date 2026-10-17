import type { MasteryConfig, Settings } from './types';

/**
 * Defaults. These are product-design choices (not research-mandated cutoffs); the parent can change
 * the settings in the grown-ups area.
 */
export const DEFAULT_CONFIG: MasteryConfig = {
  learnedDays: 2,
  reviewIntervalsDays: [1, 3, 7, 14],
  mix: { focus: 0.6, review: 0.25, easy: 0.15 },
  autoUnlockWeeks: true,
};

export const DEFAULT_SETTINGS: Settings = {
  childName: 'Ella',
  soundOn: true,
  voiceOn: true,
  speechRate: 0.85,
  motion: 'system',
  sessionMinutes: 5,
  sessionsPerDay: 2,
  countingMax: 20,
  parentPinHash: null,
};

export const COUNTING_MAX_OPTIONS = [20, 25, 30];
export const SESSION_MINUTES_OPTIONS = [3, 5, 8] as const;

/** Mini-games per adventure for each session length. */
export const GAMES_PER_SESSION: Record<Settings['sessionMinutes'], number> = { 3: 3, 5: 4, 8: 6 };

/** Learn-rewards revealed per adventure (the rest wait in the reward bank for next time). */
export const MAX_LEARN_REWARDS_PER_SESSION = 3;

export const MAX_SESSION_HISTORY = 300;
export const MAX_LOOKS = 6;
