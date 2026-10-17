/**
 * Schema versioning and curriculum migration (same approach as Word Quest).
 *
 *  - `migrateState` upgrades saved documents from older schema versions step by step, then
 *    `normalizeState` fills any missing fields with defaults (useful for hand-edited imports).
 *  - `mergeBundledCurriculum` brings in new bundled words/weeks without touching progress and without
 *    overwriting parent-customized words or week lists.
 */
import { bundledCurriculum, CURRICULUM_VERSION } from '../data/curriculum';
import type { Curriculum } from '../data/types';
import { DEFAULT_CONFIG, DEFAULT_SETTINGS } from './config';
import { emptySkill } from './mastery';
import { emptyDressing, SCENE_IDS } from './seed';
import { SCHEMA_VERSION, type AppState } from './types';
import { emptyWeekProgress } from './weeks';

type AnyDoc = Record<string, any>;

/**
 * Ordered list of migrations. Key N upgrades a document from version N to N+1.
 * Add a new entry (and bump SCHEMA_VERSION) whenever the persisted shape changes.
 */
export const MIGRATIONS: Record<number, (doc: AnyDoc) => AnyDoc> = {
  // Version 0 = pre-release documents: no schemaVersion, and stickers/outfits kept in separate maps.
  0: (doc) => {
    const owned: AnyDoc = { ...(doc.owned ?? {}) };
    for (const [id, v] of Object.entries<AnyDoc>(doc.stickers ?? {})) owned[id] ??= { at: v?.unlockedAt ?? null, source: 'earned' };
    const { stickers: _drop, ...rest } = doc;
    void _drop;
    return { ...rest, owned, schemaVersion: 1 };
  },
};

export class MigrationError extends Error {}

export function migrateState(doc: AnyDoc, now: number): AppState {
  if (!doc || typeof doc !== 'object') throw new MigrationError('Not a Sparkle Kingdom save file.');
  let d: AnyDoc = { ...doc };
  let v = typeof d.schemaVersion === 'number' ? d.schemaVersion : 0;
  if (v > SCHEMA_VERSION) throw new MigrationError(`This save is from a newer version of the game (schema ${v}).`);
  while (v < SCHEMA_VERSION) {
    const step = MIGRATIONS[v];
    if (!step) throw new MigrationError(`No migration from schema ${v}.`);
    d = step(d);
    v = d.schemaVersion;
  }
  const state = normalizeState(d, now);
  mergeBundledCurriculum(state);
  return state;
}

export function normalizeState(d: AnyDoc, now: number): AppState {
  if (!d.curriculum || !d.curriculum.words || !Array.isArray(d.curriculum.weeks)) {
    throw new MigrationError('Save file is missing its curriculum.');
  }
  const dressing = emptyDressing();
  const state: AppState = {
    schemaVersion: SCHEMA_VERSION,
    createdAt: typeof d.createdAt === 'number' ? d.createdAt : now,
    curriculum: d.curriculum,
    skills: {},
    weekProgress: d.weekProgress ?? {},
    owned: d.owned ?? {},
    rewardBank: Array.isArray(d.rewardBank) ? d.rewardBank : [],
    stars: typeof d.stars === 'number' ? d.stars : 0,
    scenes: d.scenes ?? {},
    dressing: {
      character: d.dressing?.character ?? dressing.character,
      outfits: { ...dressing.outfits, ...(d.dressing?.outfits ?? {}) },
      looks: Array.isArray(d.dressing?.looks) ? d.dressing.looks : [],
    },
    sessions: Array.isArray(d.sessions) ? d.sessions : [],
    placement: d.placement ?? null,
    settings: { ...DEFAULT_SETTINGS, ...(d.settings ?? {}) },
    config: { ...structuredClone(DEFAULT_CONFIG), ...(d.config ?? {}), mix: { ...DEFAULT_CONFIG.mix, ...(d.config?.mix ?? {}) } },
  };
  for (const [key, rec] of Object.entries<AnyDoc>(d.skills ?? {})) state.skills[key] = { ...emptySkill(key), ...rec };
  for (const w of state.curriculum.weeks) state.weekProgress[w.id] = { ...emptyWeekProgress(w.id), ...(state.weekProgress[w.id] ?? {}) };
  for (const id of SCENE_IDS) {
    const s = state.scenes[id];
    state.scenes[id] = { id, placements: Array.isArray(s?.placements) ? s.placements : [], updatedAt: s?.updatedAt ?? null };
  }
  // A save must always have at least one unlocked week.
  if (state.curriculum.weeks.length && !state.curriculum.weeks.some((w) => state.weekProgress[w.id].unlocked)) {
    const first = state.weekProgress[state.curriculum.weeks[0].id];
    first.unlocked = true;
    first.unlockSource = 'initial';
  }
  return state;
}

/** Merges the bundled curriculum into the saved one when the bundle is newer. Mutates. */
export function mergeBundledCurriculum(state: AppState, bundled: Curriculum = bundledCurriculum()): { added: string[]; updated: string[]; weeksAdded: string[] } {
  const summary = { added: [] as string[], updated: [] as string[], weeksAdded: [] as string[] };
  const saved = state.curriculum;
  if ((saved.version ?? 0) >= bundled.version) return summary;
  for (const [id, word] of Object.entries(bundled.words)) {
    const existing = saved.words[id];
    if (!existing) {
      saved.words[id] = structuredClone(word);
      summary.added.push(id);
    } else if (!existing.customized) {
      saved.words[id] = structuredClone(word);
      summary.updated.push(id);
    }
  }
  for (const week of bundled.weeks) {
    if (!saved.weeks.some((w) => w.id === week.id)) {
      // Only add words that aren't already placed somewhere by a parent.
      const placed = new Set(saved.weeks.flatMap((w) => w.wordIds));
      saved.weeks.push({ ...structuredClone(week), wordIds: week.wordIds.filter((id) => !placed.has(id)) });
      state.weekProgress[week.id] ??= emptyWeekProgress(week.id);
      summary.weeksAdded.push(week.id);
    }
  }
  saved.version = bundled.version;
  return summary;
}

export { CURRICULUM_VERSION };
