/**
 * Reward catalog: dress-up items and decoration stickers. Art is generated from these parameters in
 * src/art/dressup.tsx and src/art/stickers.tsx, so adding an item here is all that's needed.
 * Names are for parents (the child never needs to read them).
 */

export type Slot = 'dress' | 'tail' | 'crown' | 'shoes' | 'necklace' | 'wand';
export type Pattern = 'none' | 'dots' | 'stars' | 'hearts' | 'stripes' | 'scales' | 'waves';

export interface DressItem {
  id: string;
  kind: 'dress';
  slot: Slot;
  name: string;
  /** Silhouette / shape variant, interpreted per slot by the art. */
  style: string;
  /** [main, accent, trim] colors. */
  colors: [string, string, string];
  pattern?: Pattern;
}

export interface StickerItem {
  id: string;
  kind: 'sticker';
  name: string;
  /** Visual size multiplier when placed in a scene. */
  baseScale?: number;
}

export type RewardItem = DressItem | StickerItem;

const d = (id: string, slot: Slot, name: string, style: string, colors: [string, string, string], pattern: Pattern = 'none'): DressItem => ({
  id: `dr-${id}`,
  kind: 'dress',
  slot,
  name,
  style,
  colors,
  pattern,
});

export const DRESS_ITEMS: DressItem[] = [
  // Dresses (for the land princess and the designer)
  d('rose-gown', 'dress', 'Rose ball gown', 'ballgown', ['#ff7eb6', '#ffc2dd', '#ffd84d'], 'none'),
  d('lilac-tutu', 'dress', 'Lilac tutu', 'tutu', ['#b48cff', '#e3d2ff', '#ffffff'], 'dots'),
  d('sunny-dress', 'dress', 'Sunshine dress', 'aline', ['#ffd23f', '#fff2a8', '#ff9f43'], 'stars'),
  d('mint-bubble', 'dress', 'Mint bubble dress', 'bubble', ['#5fe0b7', '#c8fbe9', '#ffffff'], 'hearts'),
  d('ocean-layers', 'dress', 'Ocean layer gown', 'layered', ['#3aa0ff', '#9fd6ff', '#e6f6ff'], 'waves'),
  d('ruby-gown', 'dress', 'Ruby jewel gown', 'ballgown', ['#e8335d', '#ff9fb6', '#ffd84d'], 'stars'),
  d('cotton-candy', 'dress', 'Cotton candy tutu', 'tutu', ['#ff9fd2', '#a8e6ff', '#ffffff'], 'stripes'),
  d('emerald-dress', 'dress', 'Emerald party dress', 'aline', ['#1fb57a', '#a8f0cf', '#ffd84d'], 'dots'),
  d('starlight-gown', 'dress', 'Starlight gown', 'layered', ['#5b3cc4', '#a99bff', '#fff6a8'], 'stars'),
  d('peach-bubble', 'dress', 'Peach bubble dress', 'bubble', ['#ffa07a', '#ffd9c7', '#ffffff'], 'dots'),
  d('rainbow-gown', 'dress', 'Rainbow gown', 'rainbow', ['#ff6b6b', '#ffd23f', '#5fb8ff'], 'none'),
  // Mermaid tails (for Pearl)
  d('coral-tail', 'tail', 'Coral tail', 'classic', ['#ff7f7f', '#ffc2b3', '#ffe08a'], 'scales'),
  d('lagoon-tail', 'tail', 'Lagoon tail', 'ruffle', ['#1fc8c0', '#a2f2ec', '#ffffff'], 'scales'),
  d('amethyst-tail', 'tail', 'Amethyst tail', 'classic', ['#9b5cff', '#d9c2ff', '#ffd84d'], 'scales'),
  d('gold-tail', 'tail', 'Golden tail', 'sparkle', ['#ffc531', '#fff0a8', '#ffffff'], 'stars'),
  d('rainbow-tail', 'tail', 'Rainbow tail', 'rainbow', ['#ff6b9e', '#ffd23f', '#5fd0ff'], 'scales'),
  d('midnight-tail', 'tail', 'Midnight tail', 'sparkle', ['#3b3bb8', '#8f8cff', '#fff6a8'], 'stars'),
  d('bubblegum-tail', 'tail', 'Bubblegum tail', 'ruffle', ['#ff8cc6', '#ffd1ea', '#ffffff'], 'hearts'),
  d('seafoam-tail', 'tail', 'Seafoam tail', 'classic', ['#7fe3a8', '#d4fbe4', '#ffffff'], 'waves'),
  // Crowns and tiaras
  d('gold-crown', 'crown', 'Golden crown', 'crown', ['#ffc531', '#ff5c8a', '#5fd0ff']),
  d('pearl-tiara', 'crown', 'Pearl tiara', 'tiara', ['#f2f2ff', '#ffd1ea', '#ffffff']),
  d('flower-crown', 'crown', 'Flower crown', 'flower', ['#ff8cc6', '#ffd23f', '#5fd38a']),
  d('star-tiara', 'crown', 'Star tiara', 'star', ['#ffd23f', '#fff6a8', '#b48cff']),
  d('shell-crown', 'crown', 'Seashell crown', 'shell', ['#ffb3c7', '#fff0f5', '#ffc531']),
  d('heart-tiara', 'crown', 'Heart tiara', 'heart', ['#ff5c8a', '#ffc2d6', '#ffc531']),
  d('moon-tiara', 'crown', 'Moon tiara', 'moon', ['#c6c3ff', '#fff6a8', '#8f8cff']),
  d('jewel-crown', 'crown', 'Jewel crown', 'crown', ['#b48cff', '#1fc8c0', '#ff5c8a']),
  // Shoes (land characters)
  d('glass-slippers', 'shoes', 'Sparkle slippers', 'slipper', ['#bfe9ff', '#ffffff', '#8fd3ff']),
  d('pink-boots', 'shoes', 'Pink boots', 'boot', ['#ff8cc6', '#ffd1ea', '#ffffff']),
  d('gold-sandals', 'shoes', 'Golden sandals', 'sandal', ['#ffc531', '#fff0a8', '#ff9f43']),
  d('purple-sneakers', 'shoes', 'Purple sneakers', 'sneaker', ['#9b5cff', '#ffffff', '#ffd23f']),
  d('ruby-shoes', 'shoes', 'Ruby shoes', 'slipper', ['#e8335d', '#ffb3c7', '#ffd84d']),
  d('mint-boots', 'shoes', 'Mint boots', 'boot', ['#5fe0b7', '#ffffff', '#ff8cc6']),
  // Necklaces
  d('pearl-necklace', 'necklace', 'Pearl necklace', 'pearls', ['#ffffff', '#f3e8ff', '#ffd1ea']),
  d('heart-locket', 'necklace', 'Heart locket', 'heart', ['#ff5c8a', '#ffc531', '#ffffff']),
  d('star-pendant', 'necklace', 'Star pendant', 'star', ['#ffd23f', '#ffc531', '#ffffff']),
  d('shell-necklace', 'necklace', 'Shell necklace', 'shell', ['#ffb3c7', '#ffc531', '#ffffff']),
  d('gem-necklace', 'necklace', 'Gem necklace', 'gem', ['#1fc8c0', '#ffc531', '#b48cff']),
  d('rainbow-beads', 'necklace', 'Rainbow beads', 'rainbow', ['#ff6b6b', '#ffd23f', '#5fb8ff']),
  // Wands
  d('star-wand', 'wand', 'Star wand', 'star', ['#ffd23f', '#ff8cc6', '#ffffff']),
  d('heart-wand', 'wand', 'Heart wand', 'heart', ['#ff5c8a', '#ffd1ea', '#ffc531']),
  d('shell-wand', 'wand', 'Seashell wand', 'shell', ['#ffb3c7', '#5fd0ff', '#ffffff']),
  d('moon-wand', 'wand', 'Moon wand', 'moon', ['#c6c3ff', '#5b3cc4', '#fff6a8']),
  d('flower-wand', 'wand', 'Flower wand', 'flower', ['#ff8cc6', '#5fd38a', '#ffd23f']),
  d('gem-wand', 'wand', 'Gem wand', 'gem', ['#1fc8c0', '#b48cff', '#ffffff']),
];

const s = (id: string, name: string, baseScale?: number): StickerItem => (baseScale ? { id: `st-${id}`, kind: 'sticker', name, baseScale } : { id: `st-${id}`, kind: 'sticker', name });

export const STICKER_ITEMS: StickerItem[] = [
  s('pink-shell', 'Pink scallop shell', 0.8),
  s('conch', 'Spiral shell', 0.8),
  s('pearl', 'Shiny pearl', 0.6),
  s('clam-pearl', 'Clam with a pearl', 0.9),
  s('starfish', 'Orange starfish', 0.8),
  s('purple-starfish', 'Purple starfish', 0.8),
  s('coral-castle', 'Coral castle', 1.8),
  s('pink-castle', 'Pink castle', 1.8),
  s('shell-carriage', 'Seashell carriage', 1.5),
  s('flower-carriage', 'Flower carriage', 1.5),
  s('seahorse', 'Bubbles the seahorse'),
  s('crab', 'Sandy the crab'),
  s('dolphin', 'Dolphin', 1.2),
  s('octopus', 'Octopus'),
  s('turtle', 'Sea turtle'),
  s('jellyfish', 'Jellyfish'),
  s('whale', 'Happy whale', 1.4),
  s('stripe-fish', 'Stripy fish', 0.8),
  s('puffer', 'Pufferfish', 0.8),
  s('seaweed', 'Seaweed', 1.2),
  s('coral', 'Coral', 1.1),
  s('treasure', 'Treasure chest'),
  s('crown', 'Crown', 0.8),
  s('rainbow', 'Rainbow', 1.5),
  s('bubbles', 'Bubbles', 0.8),
  s('mirror', 'Magic mirror', 1.1),
  s('throne', 'Shell throne', 1.3),
  s('chandelier', 'Sparkly chandelier', 1.2),
  s('cake', 'Party cake'),
  s('balloons', 'Balloons', 1.1),
];

export const ALL_REWARDS: RewardItem[] = [...DRESS_ITEMS, ...STICKER_ITEMS];
export const REWARD_BY_ID: Map<string, RewardItem> = new Map(ALL_REWARDS.map((r) => [r.id, r]));

/**
 * The order rewards are given in. Interleaves dress-up and stickers (and rotates through dress-up
 * slots) so early rewards are immediately useful in both the studio and the scenes.
 */
export const REWARD_ORDER: string[] = (() => {
  const bySlot = new Map<Slot, DressItem[]>();
  for (const it of DRESS_ITEMS) bySlot.set(it.slot, [...(bySlot.get(it.slot) ?? []), it]);
  const slotOrder: Slot[] = ['crown', 'tail', 'dress', 'necklace', 'wand', 'shoes'];
  const dress: string[] = [];
  for (let round = 0; dress.length < DRESS_ITEMS.length; round++) {
    for (const slot of slotOrder) {
      const it = bySlot.get(slot)?.[round];
      if (it) dress.push(it.id);
    }
  }
  const stickers = STICKER_ITEMS.map((x) => x.id);
  const out: string[] = [];
  // Pattern: dress, sticker, dress, ... (dress-up items are a little more plentiful).
  while (dress.length || stickers.length) {
    if (dress.length) out.push(dress.shift()!);
    if (stickers.length) out.push(stickers.shift()!);
    if (dress.length && out.length % 5 === 0) out.push(dress.shift()!);
  }
  return out;
})();

export const SLOT_LABELS: Record<Slot, string> = {
  dress: 'Dresses',
  tail: 'Mermaid tails',
  crown: 'Crowns',
  shoes: 'Shoes',
  necklace: 'Necklaces',
  wand: 'Wands',
};
