/**
 * Reward awarding. Rewards come only from learning (a newly learned item, or a completed adventure),
 * never from tapping alone. Owned items are never removed by gameplay, misses, or parent progress
 * edits. After the whole catalog is owned, each reward becomes a bonus star.
 */
import { ALL_REWARDS, DRESS_ITEMS, REWARD_BY_ID, REWARD_ORDER, STICKER_ITEMS } from '../data/rewards';
import type { AppState } from './types';

export interface Award {
  /** The item given, or null when the catalog is complete and a star was given instead. */
  itemId: string | null;
  reason: string;
}

/** Gives the next unowned item in reward order. Mutates. */
export function awardNext(state: AppState, reason: string, now: number): Award {
  const itemId = REWARD_ORDER.find((id) => !state.owned[id]) ?? null;
  if (itemId) state.owned[itemId] = { at: now, source: 'earned', reason };
  else state.stars++;
  return { itemId, reason };
}

/** Parent grant of a specific item (no-op if already owned). Mutates. */
export function grantItem(state: AppState, itemId: string, now: number): boolean {
  if (!REWARD_BY_ID.has(itemId) || state.owned[itemId]) return false;
  state.owned[itemId] = { at: now, source: 'parent' };
  return true;
}

export function owns(state: AppState, itemId: string): boolean {
  return Boolean(state.owned[itemId]);
}

export function ownedCounts(state: AppState) {
  return {
    dress: DRESS_ITEMS.filter((i) => state.owned[i.id]).length,
    dressTotal: DRESS_ITEMS.length,
    stickers: STICKER_ITEMS.filter((i) => state.owned[i.id]).length,
    stickersTotal: STICKER_ITEMS.length,
    total: ALL_REWARDS.filter((i) => state.owned[i.id]).length,
  };
}
