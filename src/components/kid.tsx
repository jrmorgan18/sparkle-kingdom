/**
 * Child-facing building blocks. Everything is a picture, at least 72px, and spoken aloud.
 *  - KidButton: big picture button.
 *  - HearAgain: replays the current prompt (always visible during play).
 *  - useChoice: errorless-leaning answer logic shared by every multiple-choice game.
 */
import { useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { create } from 'zustand';
import { Icon, type IconName } from '../art/icons';
import { p, praise, PRAISE_KEYS, type ClipPart } from '../audio/clips';
import { say } from '../audio/player';
import type { Outcome } from '../engine/types';
import { play } from '../lib/sound';

// ───────────────────────────── Current prompt ─────────────────────────────

/** The line the "hear it again" button replays. Games set it whenever they ask something. */
export const usePrompt = create<{ parts: ClipPart[]; set: (parts: ClipPart[]) => void }>((set) => ({
  parts: [],
  set: (parts) => set({ parts }),
}));

/** Speak a prompt and remember it for "hear it again". */
export function ask(parts: ClipPart[], opts?: Parameters<typeof say>[1]): Promise<void> {
  usePrompt.getState().set(parts);
  return say(parts, opts);
}

// ───────────────────────────── Buttons ─────────────────────────────

export function KidButton({
  icon,
  label,
  className = '',
  size = 'md',
  color = '#ffffff',
  shadow = 'rgba(59,34,87,0.22)',
  onClick,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: IconName; label: string; size?: 'md' | 'lg' | 'xl'; color?: string; shadow?: string; children?: ReactNode }) {
  const sz = size === 'xl' ? 'h-40 w-40 sm:h-48 sm:w-48 rounded-[2.5rem]' : size === 'lg' ? 'h-28 w-28 rounded-[2rem]' : 'h-[76px] w-[76px] rounded-3xl';
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`btn-3d inline-flex shrink-0 items-center justify-center p-2 ${sz} ${className}`}
      style={{ background: color, ['--btn-shadow' as string]: shadow }}
      onClick={(e) => {
        play('tap');
        onClick?.(e);
      }}
      {...rest}
    >
      {children ?? (icon && <Icon name={icon} className="h-full w-full" />)}
    </button>
  );
}

export function HearAgain({ className = '' }: { className?: string }) {
  return (
    <KidButton
      icon="ear"
      label="Hear it again"
      data-testid="hear-again"
      className={className}
      color="#fff3c4"
      shadow="#d99a00"
      onClick={() => {
        const parts = usePrompt.getState().parts;
        if (parts.length) void say(parts);
      }}
    />
  );
}

/** A row of shells showing how far through the adventure she is (no numbers, no score). */
export function ProgressShells({ total, done }: { total: number; done: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {Array.from({ length: total }).map((_, i) => (
        <svg key={i} viewBox="0 0 40 40" className="h-7 w-7">
          <path d="M6 26 Q5 6 20 4 Q35 6 34 26 Q20 32 6 26Z" fill={i < done ? '#ff8cc6' : '#ffffff'} stroke={i < done ? '#ff5ca8' : '#e6d9ef'} strokeWidth={2.5} />
        </svg>
      ))}
    </div>
  );
}

// ───────────────────────────── Errorless choice logic ─────────────────────────────

let praiseIndex = 0;
export function nextPraise(): ClipPart {
  return praise(PRAISE_KEYS[praiseIndex++ % PRAISE_KEYS.length]);
}

export const CORRECT_PAUSE_MS = 1300;

export interface ChoiceState<T> {
  /** Option currently wiggling after a gentle miss. */
  wiggle: T | null;
  /** After a second miss, the correct answer glows. */
  glow: boolean;
  solved: boolean;
  misses: number;
  /** Call when an option is tapped. */
  choose: (option: T) => void;
}

/**
 * Shared answer flow for one question:
 *   - first tap is what counts for learning (recorded once via onResult)
 *   - a wrong tap wiggles the item and replays the prompt — never a red X or "wrong"
 *   - a second miss makes the correct answer glow
 *   - a correct tap gets brief, warm praise, then onSolved after a short pause
 */
export function useChoice<T>({
  answer,
  prompt,
  onResult,
  onSolved,
  isSkip,
  resetKey,
}: {
  answer: T;
  prompt: () => ClipPart[];
  onResult: (outcome: Outcome) => void;
  onSolved: () => void;
  isSkip?: (option: T) => boolean;
  resetKey: unknown;
}): ChoiceState<T> {
  const [wiggle, setWiggle] = useState<T | null>(null);
  const [glow, setGlow] = useState(false);
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);
  const recorded = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setWiggle(null);
    setGlow(false);
    setSolved(false);
    setMisses(0);
    recorded.current = false;
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [resetKey]);

  const choose = useCallback(
    (option: T) => {
      if (solved) return;
      const correct = option === answer;
      if (!recorded.current) {
        recorded.current = true;
        onResult({ firstTry: correct, skipped: !correct && Boolean(isSkip?.(option)) });
      }
      if (correct) {
        setSolved(true);
        setGlow(false);
        play('correct');
        void say([nextPraise()]);
        timers.current.push(setTimeout(onSolved, CORRECT_PAUSE_MS));
        return;
      }
      play('pop');
      const m = misses + 1;
      setMisses(m);
      setWiggle(option);
      timers.current.push(setTimeout(() => setWiggle(null), 550));
      if (m >= 2) {
        setGlow(true);
        void say([p('thisOne')]);
      } else {
        void ask(prompt());
      }
    },
    [answer, isSkip, misses, onResult, onSolved, prompt, solved],
  );

  return { wiggle, glow, solved, misses, choose };
}
