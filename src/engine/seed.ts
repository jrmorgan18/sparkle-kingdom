import { bundledCurriculum } from '../data/curriculum';
import { DEFAULT_CONFIG, DEFAULT_SETTINGS } from './config';
import { SCHEMA_VERSION, type AppState, type CharacterId, type Dressing, type SceneId } from './types';
import { emptyWeekProgress } from './weeks';

export const SCENE_IDS: SceneId[] = ['castle', 'ballroom', 'lagoon', 'rainbow'];
export const CHARACTER_IDS: CharacterId[] = ['pearl', 'rosie', 'gigi'];

export function emptyDressing(): Dressing {
  return { character: 'pearl', outfits: { pearl: {}, rosie: {}, gigi: {} }, looks: [] };
}

/** First-launch state: week 1 unlocked, nothing learned, placement check pending. */
export function createInitialState(now: number): AppState {
  const curriculum = bundledCurriculum();
  const state: AppState = {
    schemaVersion: SCHEMA_VERSION,
    createdAt: now,
    curriculum,
    skills: {},
    weekProgress: {},
    owned: {},
    rewardBank: [],
    stars: 0,
    scenes: {
      castle: { id: 'castle', placements: [], updatedAt: null },
      ballroom: { id: 'ballroom', placements: [], updatedAt: null },
      lagoon: { id: 'lagoon', placements: [], updatedAt: null },
      rainbow: { id: 'rainbow', placements: [], updatedAt: null },
    },
    dressing: emptyDressing(),
    sessions: [],
    placement: null,
    settings: { ...DEFAULT_SETTINGS },
    config: structuredClone(DEFAULT_CONFIG),
  };
  curriculum.weeks.forEach((w, i) => {
    const wp = emptyWeekProgress(w.id);
    if (i === 0) {
      wp.unlocked = true;
      wp.unlockSource = 'initial';
      wp.unlockedAt = now;
    }
    state.weekProgress[w.id] = wp;
  });
  return state;
}
