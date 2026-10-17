import { beforeEach, describe, expect, it } from 'vitest';
import { groupForPlayback, partsText, prompts, resolveParts, sentenceParts } from '../../audio/clips';
import { bundledCurriculum } from '../../data/curriculum';
import { _resetDbConnection, allClips, clearClips, clearDoc, deleteClip, getClip, loadDoc, putClip, replaceAllClips, saveDoc, type ClipRecord } from '../../persistence/db';
import { base64ToBytes, bytesToBase64, estimateBackupBytes, exportFull, importFull, LARGE_BACKUP_BYTES, parseBackup } from '../backup';
import { saveLook } from '../looks';
import { mergeBundledCurriculum, migrateState } from '../migrations';
import { parentUpdateWord } from '../parent';
import { finishSession, recordRound, startSession } from '../play';
import { moveSticker, placeSticker, removePlacement, resetScene, resizeSticker, restack } from '../scenes';
import { buildSession } from '../session';
import { SCHEMA_VERSION } from '../types';
import { DAY, freshState, HOUR, T0 } from './helpers';

const clip = (id: string, bytes: number[], mime = 'audio/webm'): ClipRecord => ({
  id,
  blob: new Blob([new Uint8Array(bytes)], { type: mime }),
  mime,
  recordedAt: T0,
  bytes: bytes.length,
});

async function blobBytes(b: Blob) {
  return [...new Uint8Array(await b.arrayBuffer())];
}

function playedState() {
  const s = freshState();
  for (const at of [T0, T0 + DAY]) {
    const plan = buildSession(s, at, 2);
    const id = startSession(s, plan, at);
    recordRound(s, id, 'w:see', { firstTry: true }, at);
    recordRound(s, id, 'n:seq:15', { firstTry: false, skipped: true }, at);
    finishSession(s, id, at);
  }
  return s;
}

describe('audio clip joining', () => {
  it('builds prompts from small clips', () => {
    expect(prompts.findWord('see')).toEqual([
      { clip: 'p:findWord', text: 'Find the word' },
      { clip: 'w:see', text: 'see' },
    ]);
    expect(partsText(prompts.necklace([13, 14, null, 16]))).toBe('thirteen fourteen hmm? sixteen Which pearl is missing?');
    expect(partsText(prompts.tenFrame(4)).startsWith('Ten and four makes fourteen')).toBe(true);
    expect(sentenceParts('Look up!').map((p) => p.clip)).toEqual(['w:look', 'w:up']);
    expect(sentenceParts('I see a fish.').map((p) => p.text)).toEqual(['I', 'see', 'a', 'fish']);
  });

  it('uses recordings where they exist and speech synthesis for the rest', () => {
    const parts = resolveParts(prompts.giveQueen(14), new Set(['p:giveQueen', 'n:14']));
    expect(parts.map((p) => p.source)).toEqual(['clip', 'clip', 'tts', 'tts']);
    // Consecutive speech-synthesis parts merge into one natural utterance.
    const groups = groupForPlayback(parts);
    expect(groups.map((g) => [g.source, g.parts.length])).toEqual([
      ['clip', 1],
      ['clip', 1],
      ['tts', 2],
    ]);
    // Word-by-word reading keeps every part separate (for highlighting).
    expect(groupForPlayback(resolveParts(sentenceParts('I see a fish.'), new Set()), true)).toHaveLength(4);
  });
});

describe('voice clip storage (IndexedDB)', () => {
  beforeEach(async () => {
    _resetDbConnection();
    await clearClips();
  });

  it('stores, lists, replaces, and deletes Blob clips', async () => {
    await putClip(clip('w:see', [1, 2, 3]));
    await putClip(clip('n:14', [9, 9]));
    expect((await allClips()).map((c) => c.id).sort()).toEqual(['n:14', 'w:see']);
    const got = await getClip('w:see');
    expect(got!.blob).toBeInstanceOf(Blob);
    expect(await blobBytes(got!.blob)).toEqual([1, 2, 3]);
    // Re-record replaces.
    await putClip(clip('w:see', [4, 5]));
    expect(await blobBytes((await getClip('w:see'))!.blob)).toEqual([4, 5]);
    await deleteClip('n:14');
    expect((await allClips()).map((c) => c.id)).toEqual(['w:see']);
    await replaceAllClips([clip('p:hmm', [7])]);
    expect((await allClips()).map((c) => c.id)).toEqual(['p:hmm']);
  });
});

describe('IndexedDB game state', () => {
  beforeEach(async () => {
    _resetDbConnection();
    await clearDoc();
  });

  it('saves and reloads progress, scenes, and looks', async () => {
    const s = playedState();
    const sticker = Object.keys(s.owned).find((id) => id.startsWith('st-'))!;
    placeSticker(s, 'lagoon', sticker, 0.4, 0.6, T0, 1.5);
    saveLook(s, T0);
    await saveDoc(s);
    _resetDbConnection();
    const loaded = migrateState((await loadDoc()) as any, T0 + HOUR);
    expect(loaded).toEqual(s);
    expect(loaded.skills['n:seq:15'].skips).toBe(2);
  });
});

describe('backup export / import', () => {
  it('base64 round-trips binary data', () => {
    const bytes = new Uint8Array(70000).map((_, i) => (i * 31) % 256);
    expect([...base64ToBytes(bytesToBase64(bytes))]).toEqual([...bytes]);
  });

  it('round-trips full progress including recorded audio', async () => {
    const s = playedState();
    const clips = [clip('w:see', [1, 2, 3, 250]), clip('p:findWord', [0, 128], 'audio/mp4')];
    const json = await exportFull(s, clips, T0);
    const { state, clips: restored } = importFull(parseBackup(json), T0 + HOUR);
    expect(state).toEqual(s);
    expect(restored.map((c) => [c.id, c.mime, c.bytes])).toEqual([
      ['w:see', 'audio/webm', 4],
      ['p:findWord', 'audio/mp4', 2],
    ]);
    expect(await blobBytes(restored[0].blob)).toEqual([1, 2, 3, 250]);
  });

  it('estimates size so large backups can be flagged', () => {
    const s = freshState();
    const small = estimateBackupBytes(s, [{ bytes: 10_000 }]);
    expect(small).toBeLessThan(LARGE_BACKUP_BYTES);
    const big = estimateBackupBytes(s, Array.from({ length: 120 }, () => ({ bytes: 150_000 })));
    expect(big).toBeGreaterThan(LARGE_BACKUP_BYTES);
  });

  it('rejects files that are not backups', () => {
    expect(() => parseBackup('{"hello":1}')).toThrow(/not a Sparkle Kingdom backup/);
    expect(() => parseBackup('nope')).toThrow(/not valid JSON/);
  });

  it('accepts an older backup without an audio section', () => {
    const s = freshState();
    const file = JSON.stringify({ app: 'sparkle-kingdom-backup', kind: 'full', exportedAt: '', schemaVersion: 1, state: s });
    expect(importFull(parseBackup(file), T0).clips).toEqual([]);
  });
});

describe('schema migrations', () => {
  it('upgrades a schema-0 document and fills missing fields', () => {
    const old: any = { ...freshState(), stickers: { 'st-pearl': { unlockedAt: T0 } } };
    delete old.schemaVersion;
    delete old.owned;
    delete old.dressing;
    delete old.scenes;
    delete old.rewardBank;
    const m = migrateState(old, T0);
    expect(m.schemaVersion).toBe(SCHEMA_VERSION);
    expect(m.owned['st-pearl']).toMatchObject({ at: T0, source: 'earned' });
    expect((m as any).stickers).toBeUndefined();
    expect(m.dressing.outfits.pearl).toEqual({});
    expect(m.scenes.ballroom.placements).toEqual([]);
    expect(m.rewardBank).toEqual([]);
  });

  it('fills missing skill fields and always keeps a week unlocked', () => {
    const s: any = freshState();
    s.skills = { 'w:see': { key: 'w:see', attempts: 2 } };
    for (const w of Object.values<any>(s.weekProgress)) w.unlocked = false;
    const m = migrateState(s, T0);
    expect(m.skills['w:see']).toMatchObject({ attempts: 2, correctDays: [], skips: 0, learnedAt: null });
    expect(m.weekProgress['week-1'].unlocked).toBe(true);
  });

  it('refuses documents from a newer schema', () => {
    expect(() => migrateState({ ...freshState(), schemaVersion: 999 }, T0)).toThrow(/newer version/);
  });

  it('merges a newer bundled curriculum without losing progress or parent edits', () => {
    const s = playedState();
    parentUpdateWord(s, 'see', { sentence: 'I see Mom.' });
    const skillsBefore = structuredClone(s.skills);
    const next = bundledCurriculum();
    next.version = 2;
    next.words.a.sentence = 'A new bundled sentence with a.';
    next.words.see.sentence = 'Bundled should NOT win, see.';
    next.words.zoo = { id: 'zoo', text: 'zoo', sentence: 'A big zoo.' };
    next.weeks.push({ id: 'week-15', wordIds: ['zoo'] });
    const summary = mergeBundledCurriculum(s, next);
    expect(summary.added).toEqual(['zoo']);
    expect(summary.weeksAdded).toEqual(['week-15']);
    expect(s.curriculum.words.a.sentence).toBe('A new bundled sentence with a.');
    expect(s.curriculum.words.see.sentence).toBe('I see Mom.');
    expect(s.skills).toEqual(skillsBefore);
    expect(s.weekProgress['week-15'].unlocked).toBe(false);
    expect(mergeBundledCurriculum(s, next).added).toEqual([]);
  });
});

describe('scene stickers', () => {
  it('only allows owned stickers and never consumes them', () => {
    const s = freshState();
    expect(placeSticker(s, 'castle', 'st-pearl', 0.5, 0.5, T0)).toBeNull();
    s.owned['st-pearl'] = { at: T0, source: 'earned' };
    s.owned['dr-coral-tail'] = { at: T0, source: 'earned' };
    expect(placeSticker(s, 'castle', 'dr-coral-tail', 0.5, 0.5, T0)).toBeNull(); // dress-up items aren't stickers
    const a = placeSticker(s, 'castle', 'st-pearl', 0.2, 0.3, T0)!;
    const b = placeSticker(s, 'castle', 'st-pearl', 0.6, 0.7, T0)!;
    moveSticker(s, 'castle', a, 1.5, -1, T0);
    expect(s.scenes.castle.placements[0]).toMatchObject({ x: 1, y: 0 });
    resizeSticker(s, 'castle', a, 10, T0);
    expect(s.scenes.castle.placements[0].scale).toBe(3);
    const layerA = s.scenes.castle.placements[0].layer;
    restack(s, 'castle', a, 1, T0);
    expect(s.scenes.castle.placements[0].layer).toBeGreaterThan(layerA);
    removePlacement(s, 'castle', b, T0);
    resetScene(s, 'castle', T0);
    expect(s.scenes.castle.placements).toHaveLength(0);
    expect(s.owned['st-pearl']).toBeDefined();
  });
});
