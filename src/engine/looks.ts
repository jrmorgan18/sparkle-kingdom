/** Dress-up studio state: equipping owned items and saving looks. Mutates. */
import { REWARD_BY_ID, type Slot } from '../data/rewards';
import { uid } from '../lib/random';
import { MAX_LOOKS } from './config';
import type { AppState, CharacterId, Outfit } from './types';

/** Which slots each character uses. Pearl is a mermaid (tail, no shoes); the others wear dresses. */
export const CHARACTER_SLOTS: Record<CharacterId, Slot[]> = {
  pearl: ['tail', 'crown', 'necklace', 'wand'],
  rosie: ['dress', 'crown', 'shoes', 'necklace', 'wand'],
  gigi: ['dress', 'crown', 'shoes', 'necklace', 'wand'],
};

export const LOOK_NAMES = ['Sparkle Look', 'Starfish Look', 'Rainbow Look', 'Party Look', 'Royal Look', 'Bubble Look', 'Moonlight Look', 'Sunshine Look'];

export function canWear(character: CharacterId, itemId: string): boolean {
  const item = REWARD_BY_ID.get(itemId);
  return Boolean(item && item.kind === 'dress' && CHARACTER_SLOTS[character].includes(item.slot));
}

export function setCharacter(state: AppState, character: CharacterId): void {
  state.dressing.character = character;
}

/** Puts an owned item on a character; tapping the same item again takes it off. Returns true if worn. */
export function toggleItem(state: AppState, character: CharacterId, itemId: string): boolean {
  const item = REWARD_BY_ID.get(itemId);
  if (!item || item.kind !== 'dress' || !state.owned[itemId] || !canWear(character, itemId)) return false;
  const outfit = state.dressing.outfits[character];
  if (outfit[item.slot] === itemId) {
    outfit[item.slot] = null;
    return false;
  }
  outfit[item.slot] = itemId;
  return true;
}

export function clearOutfit(state: AppState, character: CharacterId): void {
  state.dressing.outfits[character] = {};
}

/** Saves the current outfit as a named look (up to MAX_LOOKS). Returns the look id, or null when full. */
export function saveLook(state: AppState, now: number, name?: string): string | null {
  if (state.dressing.looks.length >= MAX_LOOKS) return null;
  const used = new Set(state.dressing.looks.map((l) => l.name));
  const id = uid('look');
  const character = state.dressing.character;
  state.dressing.looks.push({
    id,
    name: name?.trim() || LOOK_NAMES.find((n) => !used.has(n)) || `Look ${state.dressing.looks.length + 1}`,
    character,
    outfit: { ...state.dressing.outfits[character] },
    savedAt: now,
  });
  return id;
}

export function wearLook(state: AppState, lookId: string): void {
  const look = state.dressing.looks.find((l) => l.id === lookId);
  if (!look) return;
  state.dressing.character = look.character;
  const outfit: Outfit = {};
  for (const [slot, id] of Object.entries(look.outfit)) if (id && state.owned[id]) outfit[slot as Slot] = id;
  state.dressing.outfits[look.character] = outfit;
}

export function deleteLook(state: AppState, lookId: string): void {
  state.dressing.looks = state.dressing.looks.filter((l) => l.id !== lookId);
}

export function renameLook(state: AppState, lookId: string, name: string): void {
  const look = state.dressing.looks.find((l) => l.id === lookId);
  if (look && name.trim()) look.name = name.trim().slice(0, 30);
}
