/** Curriculum content types. Content lives in data files, never inside components. */
import type { PictureId } from './pictures';

export interface SightWord {
  id: string;
  /** The word exactly as it should be printed ("I" stays capitalized; everything else lowercase). */
  text: string;
  /** A short spoken example sentence that contains the word, e.g. "I see a fish." */
  sentence: string;
  /** Optional picture for the sentence. Many sight words (the, a, is) intentionally have none. */
  picture?: PictureId;
  /** Added by a parent (not part of the bundled list). */
  custom?: boolean;
  /** Edited by a parent — protected from future bundled-content updates. */
  customized?: boolean;
}

export interface WordWeek {
  id: string;
  wordIds: string[];
  /** Added by a parent. */
  custom?: boolean;
}

export interface Curriculum {
  /** Bundled-content version; bump to merge new built-in words into existing saves. */
  version: number;
  words: Record<string, SightWord>;
  /** Teaching order. Week numbers are positions in this array (1-based for display). */
  weeks: WordWeek[];
}
