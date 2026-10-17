/**
 * Bundled sight-word curriculum: the Dolch pre-primer list (40 words) in weekly sets of 3.
 * Sentences are kept short (2–5 words) and use other sight words wherever possible, so recorded word
 * clips can be joined to read them aloud word by word.
 */
import type { PictureId } from './pictures';
import type { Curriculum, SightWord } from './types';

export const CURRICULUM_VERSION = 1;

type Row = [text: string, sentence: string, picture?: PictureId];

const WEEKS: Row[][] = [
  [
    ['I', 'I can swim.', 'mermaid'],
    ['a', 'I see a fish.', 'fish'],
    ['see', 'I see a star.', 'star'],
  ],
  [
    ['the', 'Look at the boat.', 'boat'],
    ['my', 'This is my crown.', 'crown'],
    ['can', 'I can jump.', 'frog'],
  ],
  [
    ['go', 'Go to bed.', 'bed'],
    ['to', 'We go to the sea.', 'wave'],
    ['we', 'We can swim.', 'mermaid'],
  ],
  [
    ['is', 'It is a cake.', 'cake'],
    ['it', 'It is a shell.', 'shell'],
    ['in', 'It is in the box.', 'box'],
  ],
  [
    ['up', 'Look up!', 'balloon'],
    ['down', 'Look down!', 'crab'],
    ['look', 'Look at me!'],
  ],
  [
    ['big', 'A big fish.', 'big-fish'],
    ['little', 'A little fish.', 'little-fish'],
    ['run', 'I can run.', 'dog'],
  ],
  [
    ['red', 'A red ball.', 'red-ball'],
    ['blue', 'A blue bird.', 'blue-bird'],
    ['yellow', 'A yellow sun.', 'sun'],
  ],
  [
    ['and', 'You and me.', 'friends'],
    ['you', 'I see you!'],
    ['me', 'Help me!'],
  ],
  [
    ['here', 'Come here!'],
    ['play', 'We can play.', 'friends'],
    ['said', 'Mom said yes.'],
  ],
  [
    ['one', 'I see one star.', 'stars-1'],
    ['two', 'I see two stars.', 'stars-2'],
    ['three', 'I see three stars.', 'stars-3'],
  ],
  [
    ['help', 'Help me, please!'],
    ['jump', 'Jump up!', 'frog'],
    ['make', 'Make a cake.', 'cake'],
  ],
  [
    ['come', 'Come and play!'],
    ['find', 'Find the shell.', 'shell'],
    ['for', 'A cake for you.', 'cake'],
  ],
  [
    ['not', 'It is not big.', 'little-fish'],
    ['where', 'Where is my crown?', 'crown'],
    ['away', 'Run away!', 'dog'],
  ],
  [['funny', 'A funny crab.', 'crab']],
];

export function wordIdFor(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'word';
}

export function bundledCurriculum(): Curriculum {
  const words: Record<string, SightWord> = {};
  const weeks = WEEKS.map((rows, i) => {
    const wordIds = rows.map(([text, sentence, picture]) => {
      const id = wordIdFor(text);
      words[id] = picture ? { id, text, sentence, picture } : { id, text, sentence };
      return id;
    });
    return { id: `week-${i + 1}`, wordIds };
  });
  return { version: CURRICULUM_VERSION, words, weeks };
}
