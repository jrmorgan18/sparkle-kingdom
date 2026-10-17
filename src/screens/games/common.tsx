import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Outcome } from '../../engine/types';

export interface GameProps<R> {
  rounds: R[];
  onAnswer: (key: string, outcome: Outcome) => void;
  onDone: () => void;
}

/** Steps through rounds; finishing the last one calls onDone. */
export function useRounds<R>(rounds: R[], onDone: () => void) {
  const [i, setI] = useState(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const next = () => {
    if (i + 1 < rounds.length) setI(i + 1);
    else doneRef.current();
  };
  return { i, round: rounds[Math.min(i, rounds.length - 1)], next };
}

/** Standard game frame: testid + round number are the explicit progress signals tests wait on. */
export function GameFrame({ kind, round, children, className = '' }: { kind: string; round: number; children: ReactNode; className?: string }) {
  return (
    <div data-testid={`game-${kind}`} data-round={round} className={`flex h-full w-full flex-col items-center justify-center gap-[3vmin] px-4 pb-4 ${className}`}>
      {children}
    </div>
  );
}

/** Big printed word (decorative print for her to look at; she never has to read instructions). */
export function WordText({ text, className = '' }: { text: string; className?: string }) {
  return <span className={`font-display font-semibold leading-none tracking-wide text-ink ${className}`}>{text}</span>;
}

/** Runs once each time `key` changes (after mount). Used to speak a round's prompt. */
export function useOnRound(key: unknown, fn: () => void) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    const t = setTimeout(() => fnRef.current(), 250);
    return () => clearTimeout(t);
  }, [key]);
}

/** Classes for a choice button given errorless state. */
export function choiceClass({ wiggle, glow, solved, isAnswer }: { wiggle: boolean; glow: boolean; solved: boolean; isAnswer: boolean }): string {
  return [wiggle ? 'animate-wiggle' : '', glow && isAnswer ? 'glow-hint' : '', solved && !isAnswer ? 'opacity-40' : ''].join(' ');
}

export const tapTarget = 'min-h-[88px] min-w-[88px]';
