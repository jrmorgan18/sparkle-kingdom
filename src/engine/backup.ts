/**
 * Backup export/import. A full backup is one JSON file holding the game state AND every recorded
 * voice clip (base64), so moving to a new tablet keeps the parent's voice.
 */
import type { ClipRecord } from '../persistence/db';
import { migrateState, MigrationError } from './migrations';
import type { AppState } from './types';

export const BACKUP_APP_TAG = 'sparkle-kingdom-backup';
/** Warn before exporting a file bigger than this. */
export const LARGE_BACKUP_BYTES = 15 * 1024 * 1024;

export interface SerializedClip {
  id: string;
  mime: string;
  recordedAt: number;
  /** base64 of the raw audio bytes */
  data: string;
}

export interface BackupFile {
  app: typeof BACKUP_APP_TAG;
  kind: 'full';
  exportedAt: string;
  schemaVersion: number;
  state: AppState;
  audio: SerializedClip[];
}

// ───────────────────────────── base64 ─────────────────────────────

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return btoa(bin);
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function serializeClips(clips: ClipRecord[]): Promise<SerializedClip[]> {
  const out: SerializedClip[] = [];
  for (const c of clips) {
    const bytes = new Uint8Array(await c.blob.arrayBuffer());
    out.push({ id: c.id, mime: c.mime, recordedAt: c.recordedAt, data: bytesToBase64(bytes) });
  }
  return out;
}

export function deserializeClips(list: SerializedClip[]): ClipRecord[] {
  return list
    .filter((c) => c && typeof c.id === 'string' && typeof c.data === 'string')
    .map((c) => {
      const bytes = base64ToBytes(c.data);
      const mime = c.mime || 'audio/webm';
      return { id: c.id, mime, recordedAt: c.recordedAt ?? 0, bytes: bytes.length, blob: new Blob([bytes as BlobPart], { type: mime }) };
    });
}

/** Rough size of the exported file (base64 grows audio by 4/3). */
export function estimateBackupBytes(state: AppState, clips: Pick<ClipRecord, 'bytes'>[]): number {
  const audio = clips.reduce((a, c) => a + Math.ceil((c.bytes * 4) / 3) + 120, 0);
  return JSON.stringify(state).length + audio;
}

// ───────────────────────────── Export / import ─────────────────────────────

export async function exportFull(state: AppState, clips: ClipRecord[], now: number): Promise<string> {
  const file: BackupFile = {
    app: BACKUP_APP_TAG,
    kind: 'full',
    exportedAt: new Date(now).toISOString(),
    schemaVersion: state.schemaVersion,
    state,
    audio: await serializeClips(clips),
  };
  return JSON.stringify(file);
}

export function parseBackup(json: string): BackupFile {
  let data: any;
  try {
    data = JSON.parse(json);
  } catch {
    throw new MigrationError('That file is not valid JSON.');
  }
  if (data?.app !== BACKUP_APP_TAG) throw new MigrationError('That file is not a Sparkle Kingdom backup.');
  if (!data.state) throw new MigrationError('Backup is missing progress data.');
  if (!Array.isArray(data.audio)) data.audio = [];
  return data as BackupFile;
}

/** Full restore: the migrated state plus the voice clips to write back to storage. */
export function importFull(file: BackupFile, now: number): { state: AppState; clips: ClipRecord[] } {
  return { state: migrateState(file.state, now), clips: deserializeClips(file.audio) };
}
