/**
 * The audio clip catalog and prompt-joining logic (pure; no browser APIs).
 *
 * Every spoken line is a list of clip parts. A part has a clip id (what a parent can record) and the
 * text the browser's speech synthesis says when that clip hasn't been recorded yet. Prompts are
 * built by joining a few small clips — "Find the word" + "see" — so ~110 recordings cover every
 * line in the game.
 */
import type { Curriculum } from '../data/types';

export interface ClipPart {
  clip: string;
  text: string;
}

export type ClipSection = 'words' | 'numbers' | 'prompts' | 'praise' | 'sentence-words';

export interface ClipDef extends ClipPart {
  section: ClipSection;
  /** Optional hint shown on the recording screen. */
  hint?: string;
}

/** Prompt templates and short phrases. Keys are stable — they are the saved recording ids. */
export const PROMPTS = {
  welcome: 'Hi! It’s me, Pearl!',
  letsPlay: 'Let’s go on an adventure!',
  warmup: 'Let’s warm up together!',
  findWord: 'Find the word',
  popWord: 'Pop the bubble that says',
  tapWord: 'Tap the word',
  matchCards: 'Find two cards that match!',
  invitation: 'A royal invitation! Listen.',
  howMany: 'How many?',
  countJewels: 'Tap each jewel to count it!',
  whichPearl: 'Which pearl is missing?',
  hmm: 'hmm?',
  comesNext: 'Which number comes next?',
  comesBefore: 'Which number comes before?',
  findNumber: 'Find the number',
  tenAnd: 'Ten and',
  makes: 'makes',
  makeNumber: 'Put shells in the frame to make',
  giveQueen: 'Give the queen',
  pearls: 'pearls',
  tapDone: 'Tap the check when you’re done.',
  letsCount: 'Let’s count them together.',
  tryAgain: 'Let’s try again!',
  thisOne: 'Look! This one.',
  itsThisOne: 'It’s this one!',
  treasure: 'You found a treasure!',
  goodbye: 'Pearl is tired. See you tomorrow!',
  sleeping: 'Pearl is sleeping now. Let’s play dress up!',
  dressUp: 'Let’s play dress up!',
  decorate: 'Let’s decorate!',
  twirl: 'Twirl!',
  starBonus: 'A shiny star for you!',
} as const;

export const PRAISE = {
  praise1: 'Yay!',
  praise2: 'You did it!',
  praise3: 'Great job!',
  praise4: 'So sparkly!',
  praise5: 'Wonderful!',
  praise6: 'Good listening!',
} as const;

export type PromptKey = keyof typeof PROMPTS;
export type PraiseKey = keyof typeof PRAISE;

export const NUMBER_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
  'twenty-one', 'twenty-two', 'twenty-three', 'twenty-four', 'twenty-five', 'twenty-six', 'twenty-seven', 'twenty-eight', 'twenty-nine', 'thirty',
];

// ───────────────────────────── Part builders ─────────────────────────────

export const p = (key: PromptKey): ClipPart => ({ clip: `p:${key}`, text: PROMPTS[key] });
export const praise = (key: PraiseKey): ClipPart => ({ clip: `p:${key}`, text: PRAISE[key] });
export const num = (n: number): ClipPart => ({ clip: `n:${n}`, text: NUMBER_WORDS[n] ?? String(n) });
/** A single word. Sight words and sentence words share one clip per spelling. */
export const word = (text: string): ClipPart => {
  const clean = normalizeToken(text);
  return { clip: `w:${clean}`, text: clean === 'i' ? 'I' : clean };
};

export const PRAISE_KEYS = Object.keys(PRAISE) as PraiseKey[];

/** Lowercases and strips punctuation: "Look!" → "look", "I" → "i". */
export function normalizeToken(token: string): string {
  return token.toLowerCase().replace(/[^a-z0-9'-]/g, '').replace(/^'+|'+$/g, '');
}

/** Splits a sentence into display tokens, keeping punctuation attached ("Look", "up!"). */
export function sentenceTokens(sentence: string): string[] {
  return sentence.split(/\s+/).filter((t) => normalizeToken(t).length > 0);
}

/** The parts to read a sentence word by word (each word is its own clip). */
export function sentenceParts(sentence: string): ClipPart[] {
  return sentenceTokens(sentence).map(word);
}

// ───────────────────────────── Prompt templates ─────────────────────────────

export const prompts = {
  findWord: (w: string) => [p('findWord'), word(w)],
  popWord: (w: string) => [p('popWord'), word(w)],
  tapWord: (w: string) => [p('tapWord'), word(w)],
  howMany: () => [p('howMany')],
  /** "thirteen, fourteen, hmm?, sixteen — which pearl is missing?" */
  necklace: (run: (number | null)[]) => [...run.map((n) => (n == null ? p('hmm') : num(n))), p('whichPearl')],
  /** next: "twelve, thirteen, fourteen — which number comes next?"  before: "Which number comes before fifteen?" */
  comesNext: (run: number[], dir: 'next' | 'before') => (dir === 'next' ? [...run.map(num), p('comesNext')] : [p('comesBefore'), num(run[0])]),
  tenFrame: (extra: number) => [p('tenAnd'), num(extra), p('makes'), num(10 + extra), p('findNumber'), num(10 + extra)],
  buildTen: (target: number) => [p('makeNumber'), num(target)],
  giveQueen: (target: number) => [p('giveQueen'), num(target), p('pearls'), p('tapDone')],
};

// ───────────────────────────── Catalog ─────────────────────────────

/**
 * Every clip the game can use for the given curriculum and counting range, grouped by section.
 * The recording screen lists exactly these.
 */
export function clipCatalog(curriculum: Curriculum, countingMax: number): ClipDef[] {
  const out: ClipDef[] = [];
  const seen = new Set<string>();
  const add = (def: ClipDef) => {
    if (seen.has(def.clip)) return;
    seen.add(def.clip);
    out.push(def);
  };
  // Sight words in teaching order.
  for (const week of curriculum.weeks) {
    for (const id of week.wordIds) {
      const w = curriculum.words[id];
      if (w) add({ ...word(w.text), section: 'words' });
    }
  }
  for (let n = 0; n <= Math.min(countingMax, NUMBER_WORDS.length - 1); n++) add({ ...num(n), section: 'numbers' });
  for (const key of Object.keys(PROMPTS) as PromptKey[]) add({ ...p(key), section: 'prompts' });
  for (const key of PRAISE_KEYS) add({ ...praise(key), section: 'praise' });
  // Remaining words that appear in example sentences ("fish", "boat", "please"…).
  for (const week of curriculum.weeks) {
    for (const id of week.wordIds) {
      const w = curriculum.words[id];
      if (!w) continue;
      for (const part of sentenceParts(w.sentence)) add({ ...part, section: 'sentence-words', hint: `From “${w.sentence}”` });
    }
  }
  return out;
}

export const SECTION_TITLES: Record<ClipSection, string> = {
  words: 'Sight words',
  numbers: 'Numbers',
  prompts: 'Instructions',
  praise: 'Praise',
  'sentence-words': 'Words in example sentences',
};

export interface ResolvedPart extends ClipPart {
  /** 'clip' = play the parent's recording; 'tts' = browser speech synthesis. */
  source: 'clip' | 'tts';
}

/** Decides, per part, whether a recording exists or speech synthesis is needed. */
export function resolveParts(parts: ClipPart[], recorded: ReadonlySet<string>): ResolvedPart[] {
  return parts.map((part) => ({ ...part, source: recorded.has(part.clip) ? 'clip' : 'tts' }));
}

/**
 * Merges consecutive speech-synthesis parts into one utterance so unrecorded prompts sound natural,
 * while recorded clips stay separate. Parts flagged `keepSeparate` (word-by-word reading) stay apart.
 */
export function groupForPlayback(parts: ResolvedPart[], keepSeparate = false): { source: 'clip' | 'tts'; parts: ResolvedPart[] }[] {
  const groups: { source: 'clip' | 'tts'; parts: ResolvedPart[] }[] = [];
  for (const part of parts) {
    const last = groups[groups.length - 1];
    if (!keepSeparate && part.source === 'tts' && last?.source === 'tts') last.parts.push(part);
    else groups.push({ source: part.source, parts: [part] });
  }
  return groups;
}

/** Plain text of a prompt (used for logs, captions for parents, and speech-synthesis utterances). */
export function partsText(parts: ClipPart[]): string {
  return parts
    .map((x) => x.text)
    .join(' ')
    .replace(/\s+([?!.,])/g, '$1');
}
