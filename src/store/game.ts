import { create } from 'zustand';
import { produce, setAutoFreeze } from 'immer';
import { now } from '../lib/clock';
import { createInitialState } from '../engine/seed';
import { migrateState } from '../engine/migrations';
import type { AppState } from '../engine/types';
import { clearClips, clearDoc, loadDoc, saveDoc } from '../persistence/db';
import { loadRecordedClips, reloadRecordings } from '../audio/player';

// Engine functions sometimes hold references across steps; freezing adds no safety here.
setAutoFreeze(false);

interface GameStore {
  state: AppState | null;
  error: string | null;
  rawDoc: unknown;
  init: () => Promise<void>;
  /** Run an engine mutator against a draft of the state, then persist. Returns the mutator's result. */
  act: <T>(fn: (draft: AppState, now: number) => T) => T;
  replaceState: (s: AppState) => void;
  resetAll: (opts?: { recordings?: boolean }) => Promise<void>;
  flush: () => Promise<void>;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pending: AppState | null = null;
let saving: Promise<void> = Promise.resolve();

function scheduleSave(s: AppState) {
  pending = s;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void flushNow(), 250);
}

function flushNow(): Promise<void> {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  const doc = pending;
  pending = null;
  if (doc) saving = saving.then(() => saveDoc(doc));
  return saving;
}

export const useGame = create<GameStore>((set, get) => ({
  state: null,
  error: null,
  rawDoc: null,

  async init() {
    if (get().state) return;
    void loadRecordedClips();
    try {
      const doc = await loadDoc();
      if (!doc) {
        const fresh = createInitialState(now());
        set({ state: fresh });
        await saveDoc(fresh);
      } else {
        const migrated = migrateState(doc as Record<string, unknown>, now());
        set({ state: migrated });
        scheduleSave(migrated);
      }
    } catch (e) {
      console.error(e);
      const doc = await loadDoc().catch(() => null);
      set({ error: e instanceof Error ? e.message : String(e), rawDoc: doc });
    }
  },

  act(fn) {
    const current = get().state;
    if (!current) throw new Error('Game not loaded');
    let result: any;
    const next = produce(current, (draft) => {
      result = fn(draft as AppState, now());
    });
    if (next !== current) {
      set({ state: next });
      scheduleSave(next);
    }
    return result;
  },

  replaceState(s) {
    set({ state: s, error: null });
    scheduleSave(s);
  },

  async resetAll(opts) {
    await clearDoc();
    if (opts?.recordings) {
      await clearClips();
      await reloadRecordings();
    }
    const fresh = createInitialState(now());
    set({ state: fresh, error: null });
    await saveDoc(fresh);
  },

  flush: flushNow,
}));

if (typeof window !== 'undefined') {
  // Save immediately when the tab is hidden or closed (tablets often kill background tabs).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flushNow();
  });
  window.addEventListener('pagehide', () => void flushNow());
}

/** Convenience hook: the loaded state (only use under the loaded app shell). */
export function useAppState(): AppState {
  const s = useGame((g) => g.state);
  if (!s) throw new Error('State not loaded');
  return s;
}

export const act = <T,>(fn: (draft: AppState, now: number) => T): T => useGame.getState().act(fn);
