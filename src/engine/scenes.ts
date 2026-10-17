/** Sticker scene decoration (from Word Quest). Placing a sticker never consumes it; removing never revokes it. Mutates. */
import { uid } from '../lib/random';
import type { AppState, SceneId, StickerPlacement } from './types';

export const MIN_SCALE = 0.4;
export const MAX_SCALE = 3;
export const MAX_PLACEMENTS = 80;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function scene(state: AppState, sceneId: SceneId) {
  return state.scenes[sceneId];
}

function topLayer(state: AppState, sceneId: SceneId): number {
  return Math.max(0, ...scene(state, sceneId).placements.map((p) => p.layer));
}

export function placeSticker(state: AppState, sceneId: SceneId, stickerId: string, x: number, y: number, now: number, scale = 1): string | null {
  if (!state.owned[stickerId] || !stickerId.startsWith('st-')) return null; // must own it
  const s = scene(state, sceneId);
  if (s.placements.length >= MAX_PLACEMENTS) return null;
  const p: StickerPlacement = { id: uid('pl'), stickerId, x: clamp01(x), y: clamp01(y), scale, layer: topLayer(state, sceneId) + 1 };
  s.placements.push(p);
  s.updatedAt = now;
  return p.id;
}

function find(state: AppState, sceneId: SceneId, placementId: string) {
  return scene(state, sceneId).placements.find((p) => p.id === placementId);
}

export function moveSticker(state: AppState, sceneId: SceneId, placementId: string, x: number, y: number, now: number): void {
  const p = find(state, sceneId, placementId);
  if (!p) return;
  p.x = clamp01(x);
  p.y = clamp01(y);
  scene(state, sceneId).updatedAt = now;
}

export function resizeSticker(state: AppState, sceneId: SceneId, placementId: string, factor: number, now: number): void {
  const p = find(state, sceneId, placementId);
  if (!p) return;
  p.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(p.scale * factor * 100) / 100));
  scene(state, sceneId).updatedAt = now;
}

export function flipSticker(state: AppState, sceneId: SceneId, placementId: string, now: number): void {
  const p = find(state, sceneId, placementId);
  if (!p) return;
  p.flip = !p.flip;
  scene(state, sceneId).updatedAt = now;
}

/** Moves a sticker one layer forward (+1) or backward (-1) by swapping with its neighbor. */
export function restack(state: AppState, sceneId: SceneId, placementId: string, dir: 1 | -1, now: number): void {
  const list = [...scene(state, sceneId).placements].sort((a, b) => a.layer - b.layer);
  const i = list.findIndex((p) => p.id === placementId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i].layer, list[j].layer] = [list[j].layer, list[i].layer];
  if (list[i].layer === list[j].layer) list[dir === 1 ? i : j].layer++;
  scene(state, sceneId).updatedAt = now;
}

export function removePlacement(state: AppState, sceneId: SceneId, placementId: string, now: number): void {
  const s = scene(state, sceneId);
  s.placements = s.placements.filter((p) => p.id !== placementId);
  s.updatedAt = now;
}

export function resetScene(state: AppState, sceneId: SceneId, now: number): void {
  scene(state, sceneId).placements = [];
  scene(state, sceneId).updatedAt = now;
}
