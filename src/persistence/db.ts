/**
 * IndexedDB persistence.
 *
 *  - `kv` store: the whole game state as one versioned JSON document under a single key (small, and
 *    this keeps saves atomic). Falls back to localStorage if IndexedDB is unavailable.
 *  - `clips` store: the parent's recorded voice clips, one Blob per clip id.
 *
 * Progress is stored per browser, per device. Different tablets do NOT sync; use the grown-ups
 * Backup export/import to move progress (and recordings) between devices.
 */
import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'sparkle-kingdom';
const DB_VERSION = 1;
const STORE = 'kv';
const CLIPS = 'clips';
const KEY = 'state';
const LS_KEY = 'sparkle-kingdom-state';

export interface ClipRecord {
  id: string;
  blob: Blob;
  mime: string;
  recordedAt: number;
  bytes: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function db(): Promise<IDBPDatabase> {
  dbPromise ??= openDB(DB_NAME, DB_VERSION, {
    upgrade(database, oldVersion) {
      // IndexedDB structural migrations go here (document-level migrations live in engine/migrations.ts).
      if (oldVersion < 1) {
        database.createObjectStore(STORE);
        database.createObjectStore(CLIPS, { keyPath: 'id' });
      }
    },
  });
  return dbPromise;
}

function hasIDB(): boolean {
  return typeof indexedDB !== 'undefined';
}

export async function loadDoc(): Promise<unknown | null> {
  if (hasIDB()) {
    try {
      const v = await (await db()).get(STORE, KEY);
      if (v) return v;
    } catch (e) {
      console.warn('[Sparkle] IndexedDB read failed, trying localStorage', e);
    }
  }
  try {
    const raw = globalThis.localStorage?.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveDoc(doc: unknown): Promise<void> {
  if (hasIDB()) {
    try {
      await (await db()).put(STORE, doc, KEY);
      return;
    } catch (e) {
      console.warn('[Sparkle] IndexedDB write failed, using localStorage', e);
    }
  }
  try {
    globalThis.localStorage?.setItem(LS_KEY, JSON.stringify(doc));
  } catch (e) {
    console.error('[Sparkle] Could not save progress', e);
  }
}

export async function clearDoc(): Promise<void> {
  if (hasIDB()) {
    try {
      await (await db()).delete(STORE, KEY);
    } catch {
      /* ignore */
    }
  }
  try {
    globalThis.localStorage?.removeItem(LS_KEY);
  } catch {
    /* ignore */
  }
}

// ───────────────────────────── Voice clips ─────────────────────────────

export async function putClip(clip: ClipRecord): Promise<void> {
  await (await db()).put(CLIPS, clip);
}

export async function getClip(id: string): Promise<ClipRecord | undefined> {
  return (await db()).get(CLIPS, id);
}

export async function allClips(): Promise<ClipRecord[]> {
  if (!hasIDB()) return [];
  try {
    return await (await db()).getAll(CLIPS);
  } catch (e) {
    console.warn('[Sparkle] Could not read voice clips', e);
    return [];
  }
}

export async function deleteClip(id: string): Promise<void> {
  await (await db()).delete(CLIPS, id);
}

export async function clearClips(): Promise<void> {
  if (!hasIDB()) return;
  await (await db()).clear(CLIPS);
}

/** Replaces every clip with the given set (used by backup import). */
export async function replaceAllClips(clips: ClipRecord[]): Promise<void> {
  const tx = (await db()).transaction(CLIPS, 'readwrite');
  await tx.store.clear();
  for (const c of clips) await tx.store.put(c);
  await tx.done;
}

/** Ask the browser not to evict our storage (helps on iOS when installed to the home screen). */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

/** Test helper: forget the cached connection. */
export function _resetDbConnection(): void {
  dbPromise = null;
}
