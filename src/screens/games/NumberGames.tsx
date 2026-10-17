/** Counting mini-games: Pearl Necklace, Count the Jewels, Ten-Frame Treasure, Treasure Shop, What Comes Next. */
import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { Character } from '../../art/characters';
import { Basket, Jewel, ShellPiece } from '../../art/game';
import { Icon } from '../../art/icons';
import { StickerSvg } from '../../art/stickers';
import { num, p, prompts, type ClipPart } from '../../audio/clips';
import { say } from '../../audio/player';
import { ask, CORRECT_PAUSE_MS, nextPraise, useChoice } from '../../components/kid';
import { Confetti } from '../../components/Confetti';
import type { JewelsRound, NecklaceRound, NextRound, ShopRound, TenFrameRound } from '../../engine/session';
import type { Outcome } from '../../engine/types';
import { play } from '../../lib/sound';
import { choiceClass, GameFrame, useOnRound, useRounds, type GameProps } from './common';

const pearlStyle = (size: string): React.CSSProperties => ({
  width: size,
  height: size,
  background: 'radial-gradient(circle at 34% 30%, #ffffff 0 14%, #fbefff 40%, #e3d0fb 78%, #c9b2ee 100%)',
  boxShadow: '0 6px 0 rgba(123,75,214,0.25), inset -6px -8px 14px rgba(123,75,214,0.15)',
});

function Numeral({ n, className = '' }: { n: number; className?: string }) {
  return <span className={`font-display font-semibold leading-none text-ink ${className}`}>{n}</span>;
}

/** A big numeral choice (pearl, rock, or plain tile). */
function NumberChoice({
  n,
  isAnswer,
  state,
  onClick,
  look = 'pearl',
}: {
  n: number;
  isAnswer: boolean;
  state: { wiggle: number | null; glow: boolean; solved: boolean };
  onClick: () => void;
  look?: 'pearl' | 'rock' | 'tile';
}) {
  const size = 'max(104px, min(17vw, 20vh))';
  const base =
    look === 'pearl'
      ? { ...pearlStyle(size), borderRadius: '9999px' }
      : look === 'rock'
        ? { width: size, height: `calc(${size} * 0.82)`, borderRadius: '46% 54% 42% 58% / 58% 50% 50% 42%', background: 'linear-gradient(180deg, #c9bfe0, #9f93c2)', boxShadow: '0 6px 0 rgba(59,34,87,0.25)' }
        : { width: size, height: size, borderRadius: '1.75rem', background: '#ffffff', boxShadow: '0 6px 0 rgba(59,34,87,0.18)' };
  return (
    <button
      type="button"
      data-testid="option"
      data-correct={isAnswer || undefined}
      data-value={n}
      aria-label={String(n)}
      onClick={onClick}
      className={`flex items-center justify-center ${choiceClass({ wiggle: state.wiggle === n, glow: state.glow, solved: state.solved, isAnswer })}`}
      style={base}
    >
      <Numeral n={n} className={`text-[max(40px,min(8vw,9vh))] ${look === 'rock' ? 'text-white drop-shadow' : ''}`} />
    </button>
  );
}

// ───────────────────────────── Pearl Necklace ─────────────────────────────

/** A run like 13, 14, __, 16 on a pearl string. The gap is spoken "hmm?". Skipping is tracked. */
export function PearlNecklace({ rounds, onAnswer, onDone }: GameProps<NecklaceRound>) {
  const { i, round, next } = useRounds(rounds, onDone);
  const answer = round.run[round.gapIndex];
  const runParts = round.run.map((n, k) => (k === round.gapIndex ? null : n));
  const prompt = useCallback(() => prompts.necklace(runParts), [round]);
  const c = useChoice({
    answer,
    prompt,
    onResult: (o) => onAnswer(round.key, o),
    onSolved: next,
    resetKey: i,
    isSkip: (opt) => opt === answer + 1,
  });
  useOnRound(i, () => void ask(prompt()));
  useEffect(() => {
    // Celebrate by saying the whole run, now complete.
    if (c.solved) setTimeout(() => void say(round.run.map(num)), 500);
  }, [c.solved]);

  const bead = 'max(84px, min(15vw, 17vh))';
  return (
    <GameFrame kind="necklace" round={i}>
      <div className="relative flex items-center justify-center gap-[1.5vmin] px-4 pt-6" data-testid="necklace">
        <svg className="pointer-events-none absolute inset-x-0 top-1/2 h-1/2 w-full -translate-y-1/4" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden>
          <path d="M0 2 Q50 26 100 2" stroke="#ff8cc6" strokeWidth={1.2} fill="none" />
        </svg>
        {round.run.map((n, k) => {
          const gap = k === round.gapIndex;
          const dip = Math.sin((k / Math.max(1, round.run.length - 1)) * Math.PI) * 4;
          return (
            <div
              key={`${i}-${k}`}
              data-testid={gap ? 'necklace-gap' : 'necklace-pearl'}
              className={`relative flex items-center justify-center rounded-full ${gap && !c.solved ? 'border-[5px] border-dashed border-rose bg-white/60' : ''}`}
              style={{ ...(gap && !c.solved ? { width: bead, height: bead } : pearlStyle(bead)), marginTop: `${dip}vmin` }}
            >
              {gap && !c.solved ? <span className="font-display text-[max(36px,min(7vw,8vh))] font-bold text-rose">?</span> : <Numeral n={n} className="text-[max(36px,min(7vw,8vh))]" />}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap justify-center gap-[3vmin]">
        {round.options.map((n) => (
          <NumberChoice key={`${i}-${n}`} n={n} isAnswer={n === answer} state={c} onClick={() => c.choose(n)} />
        ))}
      </div>
      {c.solved && <Confetti pieces={18} />}
    </GameFrame>
  );
}

// ───────────────────────────── Count the Jewels ─────────────────────────────

/**
 * Tap each jewel: it lights up and the count is spoken, so every jewel is counted exactly once.
 * Then "How many?" — pick the numeral. Jewels sit in rows of five (ten-frame style).
 */
export function CountJewels({ rounds, onAnswer, onDone }: GameProps<JewelsRound>) {
  const { i, round, next } = useRounds(rounds, onDone);
  const [lit, setLit] = useState<number[]>([]);
  const counted = lit.length === round.count;
  const prompt = useCallback(() => prompts.howMany(), []);
  const c = useChoice({ answer: round.count, prompt, onResult: (o) => onAnswer(round.key, o), onSolved: next, resetKey: i });
  useEffect(() => setLit([]), [i]);
  useOnRound(i, () => void ask([p('countJewels')]));
  useEffect(() => {
    if (counted) setTimeout(() => void ask(prompt()), 700);
  }, [counted, prompt]);

  const tap = (k: number) => {
    if (lit.includes(k)) {
      // Already counted: gently repeat its number (each jewel keeps the number it got).
      void say([num(lit.indexOf(k) + 1)]);
      return;
    }
    play('pop');
    const nextLit = [...lit, k];
    setLit(nextLit);
    void say([num(nextLit.length)]);
  };

  const rows: number[][] = [];
  for (let k = 0; k < round.count; k += 5) rows.push(Array.from({ length: Math.min(5, round.count - k) }, (_, j) => k + j));
  const many = round.count > 10;
  const gem = many ? 'max(64px, min(9vw, 9.5vh))' : 'max(80px, min(12vw, 13vh))';

  return (
    <GameFrame kind="jewels" round={i}>
      <div className={`grid gap-[1.2vmin] ${many ? 'grid-cols-1 landscape:grid-cols-2 landscape:gap-x-[5vmin]' : 'grid-cols-1'}`} data-counted={counted || undefined}>
        {rows.map((row, r) => (
          <div key={r} className="flex justify-center gap-[1vmin]">
            {row.map((k) => (
              <button
                key={`${i}-${k}`}
                type="button"
                data-testid="jewel"
                data-lit={lit.includes(k) || undefined}
                aria-label={lit.includes(k) ? `Jewel ${lit.indexOf(k) + 1}` : 'Jewel'}
                onClick={() => tap(k)}
                className="relative flex items-center justify-center"
                style={{ width: gem, height: gem, minWidth: 72, minHeight: 72 }}
              >
                <Jewel lit={lit.includes(k)} index={k} className="h-full w-full" />
                {lit.includes(k) && <span className="absolute bottom-0 right-0 rounded-full bg-white px-1.5 font-display text-lg font-bold text-royal shadow">{lit.indexOf(k) + 1}</span>}
              </button>
            ))}
          </div>
        ))}
      </div>
      {counted && (
        <div className="flex flex-wrap justify-center gap-[3vmin]">
          {round.options.map((n) => (
            <NumberChoice key={`${i}-${n}`} n={n} look="tile" isAnswer={n === round.count} state={c} onClick={() => c.choose(n)} />
          ))}
        </div>
      )}
      {c.solved && <Confetti pieces={18} />}
    </GameFrame>
  );
}

// ───────────────────────────── Build helper (ten-frame build, treasure shop) ─────────────────────────────

/** Shared check for "make this many" games. Same errorless rules as multiple choice. */
function useBuildCheck({ target, key, onAnswer, onSolved, resetKey, reprompt }: { target: number; key: string; onAnswer: (k: string, o: Outcome) => void; onSolved: () => void; resetKey: unknown; reprompt: () => ClipPart[] }) {
  const [misses, setMisses] = useState(0);
  const [solved, setSolved] = useState(false);
  const [wiggle, setWiggle] = useState(false);
  const recorded = useRef(false);
  useEffect(() => {
    setMisses(0);
    setSolved(false);
    recorded.current = false;
  }, [resetKey]);
  const check = (count: number) => {
    if (solved) return;
    const ok = count === target;
    if (!recorded.current) {
      recorded.current = true;
      onAnswer(key, { firstTry: ok });
    }
    if (ok) {
      setSolved(true);
      play('correct');
      void say([nextPraise()]);
      setTimeout(onSolved, CORRECT_PAUSE_MS);
      return;
    }
    play('pop');
    setWiggle(true);
    setTimeout(() => setWiggle(false), 550);
    setMisses((m) => m + 1);
    void ask([p('letsCount'), ...reprompt()]);
  };
  return { misses, solved, wiggle, check, hint: misses >= 2 };
}

function DoneButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      data-testid="done"
      aria-label="Done"
      disabled={disabled}
      onClick={onClick}
      className="btn-3d flex h-[96px] w-[96px] items-center justify-center rounded-full bg-good p-2 disabled:opacity-40"
      style={{ ['--btn-shadow' as string]: '#146b3a' }}
    >
      <Icon name="check" className="h-full w-full" />
    </button>
  );
}

// ───────────────────────────── Ten-Frame Treasure ─────────────────────────────

function TenFrame({ filled, hint = 0, onCell, testid }: { filled: number; hint?: number; onCell?: (k: number) => void; testid: string }) {
  const cell = 'max(52px, min(8.5vw, 9vh))';
  return (
    <div data-testid={testid} data-filled={filled} className="grid grid-cols-5 gap-1 rounded-2xl border-4 border-royal bg-white p-1.5" style={{ boxShadow: '0 5px 0 rgba(90,50,171,0.3)' }}>
      {Array.from({ length: 10 }, (_, k) => (
        <button
          key={k}
          type="button"
          tabIndex={onCell ? 0 : -1}
          aria-label={k < filled ? 'Shell' : 'Empty spot'}
          onClick={() => onCell?.(k)}
          className={`flex items-center justify-center rounded-xl bg-lagoon-light ${!onCell ? 'pointer-events-none' : ''} ${k >= filled && k < hint ? 'glow-hint' : ''}`}
          style={{ width: cell, height: cell }}
        >
          {k < filled ? <ShellPiece className="h-[85%] w-[85%]" /> : k < hint ? <ShellPiece faded className="h-[80%] w-[80%]" /> : null}
        </button>
      ))}
    </div>
  );
}

/**
 * Pick mode: a full ten-frame plus extra shells, spoken "ten and four makes fourteen!" — find 14.
 * Build mode: "make fifteen" by tapping (or dragging) shells into the second frame, then tap the check.
 */
export function TenFrameTreasure({ rounds, onAnswer, onDone }: GameProps<TenFrameRound>) {
  const { i, round, next } = useRounds(rounds, onDone);
  return round.mode === 'pick' ? (
    <TenFramePick key={i} i={i} round={round} onAnswer={onAnswer} next={next} />
  ) : (
    <TenFrameBuild key={i} i={i} round={round} onAnswer={onAnswer} next={next} />
  );
}

function TenFramePick({ i, round, onAnswer, next }: { i: number; round: TenFrameRound; onAnswer: GameProps<TenFrameRound>['onAnswer']; next: () => void }) {
  const extra = round.target - 10;
  const prompt = useCallback(() => prompts.tenFrame(extra), [extra]);
  const c = useChoice({ answer: round.target, prompt, onResult: (o) => onAnswer(round.key, o), onSolved: next, resetKey: i });
  useOnRound(i, () => void ask(prompt()));
  return (
    <GameFrame kind="tenframe" round={i}>
      <div className="flex flex-wrap items-center justify-center gap-[2vmin]" data-mode="pick">
        <TenFrame filled={10} testid="frame-ten" />
        <span className="font-display text-5xl font-bold text-royal" aria-hidden>
          +
        </span>
        <TenFrame filled={extra} testid="frame-extra" />
      </div>
      <div className="flex flex-wrap justify-center gap-[3vmin]">
        {round.options.map((n) => (
          <NumberChoice key={`${i}-${n}`} n={n} look="tile" isAnswer={n === round.target} state={c} onClick={() => c.choose(n)} />
        ))}
      </div>
      {c.solved && <Confetti pieces={18} />}
    </GameFrame>
  );
}

function TenFrameBuild({ i, round, onAnswer, next }: { i: number; round: TenFrameRound; onAnswer: GameProps<TenFrameRound>['onAnswer']; next: () => void }) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const prompt = useCallback(() => prompts.buildTen(round.target), [round.target]);
  const b = useBuildCheck({ target: round.target, key: round.key, onAnswer, onSolved: next, resetKey: i, reprompt: prompt });
  useOnRound(i, () => void ask(prompt()));

  const setN = (n: number) => {
    const v = Math.max(0, Math.min(10, n));
    countRef.current = v;
    setCount(v);
    play('pop');
    void say([num(10 + v)]);
  };
  const drag = useShellDrag(frameRef, () => setN(countRef.current + 1));

  return (
    <GameFrame kind="tenframe" round={i}>
      <div className="flex flex-wrap items-center justify-center gap-[2vmin]" data-mode="build" data-target={round.target}>
        <TenFrame filled={10} testid="frame-ten" />
        <span className="font-display text-5xl font-bold text-royal" aria-hidden>
          +
        </span>
        <div ref={frameRef} className={b.wiggle ? 'animate-wiggle' : ''}>
          <TenFrame filled={count} hint={b.hint ? round.target - 10 : 0} testid="frame-build" onCell={(k) => setN(k < count ? countRef.current - 1 : countRef.current + 1)} />
        </div>
      </div>
      <div className="flex items-center gap-[4vmin]">
        <button
          type="button"
          data-testid="add-shell"
          aria-label="Add a shell"
          onClick={() => !drag.suppressClick.current && setN(countRef.current + 1)}
          onPointerDown={drag.down}
          onPointerMove={drag.move}
          onPointerUp={drag.up}
          onPointerCancel={drag.cancel}
          style={{ touchAction: 'none' }}
          className="btn-3d flex h-[110px] w-[110px] items-center justify-center rounded-full bg-rose-light p-3"
        >
          <ShellPiece className="h-full w-full" />
        </button>
        <DoneButton onClick={() => b.check(10 + countRef.current)} />
      </div>
      {drag.ghost && (
        <div className="pointer-events-none fixed z-50 h-20 w-20 -translate-x-1/2 -translate-y-1/2" style={{ left: drag.ghost.x, top: drag.ghost.y }} aria-hidden>
          <ShellPiece className="h-full w-full" />
        </div>
      )}
      {b.solved && <Confetti pieces={18} />}
    </GameFrame>
  );
}

/**
 * Drag a piece from a tray onto a drop zone. Live position is kept in a ref (not React state) so a
 * fast finger can't outrun re-renders — the Word Quest drag lesson. A short tap is handled by onClick.
 */
function useShellDrag(zone: React.RefObject<HTMLElement | null>, onDrop: () => void) {
  const start = useRef<{ x: number; y: number; dragging: boolean; lastX: number; lastY: number } | null>(null);
  const suppressClick = useRef(false);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const down = (e: RPointerEvent<HTMLElement>) => {
    start.current = { x: e.clientX, y: e.clientY, dragging: false, lastX: e.clientX, lastY: e.clientY };
  };
  const move = (e: RPointerEvent<HTMLElement>) => {
    const s = start.current;
    if (!s) return;
    s.lastX = e.clientX;
    s.lastY = e.clientY;
    if (!s.dragging && Math.hypot(e.clientX - s.x, e.clientY - s.y) > 14) {
      s.dragging = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    if (s.dragging) setGhost({ x: e.clientX, y: e.clientY });
  };
  const up = (e: RPointerEvent<HTMLElement>) => {
    const s = start.current;
    start.current = null;
    setGhost(null);
    if (!s?.dragging) return;
    suppressClick.current = true;
    setTimeout(() => (suppressClick.current = false), 50);
    const r = zone.current?.getBoundingClientRect();
    const x = e.clientX || s.lastX;
    const y = e.clientY || s.lastY;
    if (r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) onDrop();
  };
  const cancel = () => {
    start.current = null;
    setGhost(null);
  };
  return { down, move, up, cancel, ghost, suppressClick };
}

// ───────────────────────────── Treasure Shop ─────────────────────────────

const QUEEN = { crown: 'dr-gold-crown', dress: 'dr-ruby-gown', necklace: 'dr-pearl-necklace', shoes: 'dr-ruby-shoes' };

/** "Give the queen fourteen pearls." Tap or drag pearls into the basket; the running total is spoken. */
export function TreasureShop({ rounds, onAnswer, onDone }: GameProps<ShopRound>) {
  const { i, round, next } = useRounds(rounds, onDone);
  const [inBasket, setInBasket] = useState(0);
  const countRef = useRef(0);
  const basketRef = useRef<HTMLDivElement>(null);
  const pile = Math.min(24, round.target + 4);
  const prompt = useCallback(() => prompts.giveQueen(round.target), [round.target]);
  const b = useBuildCheck({ target: round.target, key: round.key, onAnswer, onSolved: next, resetKey: i, reprompt: prompt });
  useEffect(() => {
    countRef.current = 0;
    setInBasket(0);
  }, [i]);
  useOnRound(i, () => void ask(prompt()));

  const setN = (n: number) => {
    const v = Math.max(0, Math.min(pile, n));
    if (v === countRef.current) return;
    countRef.current = v;
    setInBasket(v);
    play('pop');
    void say(v === 0 ? [num(0)] : [num(v)]);
  };
  const drag = useShellDrag(basketRef, () => setN(countRef.current + 1));
  const pearl = 'max(56px, min(7.5vw, 8vh))';

  return (
    <GameFrame kind="shop" round={i}>
      <div className="flex w-full max-w-5xl flex-1 items-center justify-center gap-[3vmin] portrait:flex-col">
        <div className="flex items-end gap-[2vmin]">
          <Character id="rosie" outfit={QUEEN} className="h-[min(34vh,40vw)] w-auto" title="The queen" />
          <div ref={basketRef} className={`relative ${b.wiggle ? 'animate-wiggle' : ''}`} data-testid="basket" data-count={inBasket} data-target={round.target}>
            <button type="button" aria-label="Take a pearl out" onClick={() => setN(countRef.current - 1)} className="relative block" style={{ width: 'min(42vw, 40vh)', height: 'min(25vw, 24vh)' }}>
              <Basket className="absolute inset-0 h-full w-full" />
              <div className="absolute inset-x-[12%] top-[26%] flex flex-wrap justify-center gap-[2px]">
                {Array.from({ length: inBasket }, (_, k) => (
                  <span key={k} className="rounded-full" style={pearlStyle('min(3.6vw, 3.4vh)')} />
                ))}
                {b.hint &&
                  Array.from({ length: Math.max(0, round.target - inBasket) }, (_, k) => (
                    <span key={`h${k}`} className="glow-hint rounded-full bg-white/50" style={{ width: 'min(3.6vw,3.4vh)', height: 'min(3.6vw,3.4vh)' }} />
                  ))}
              </div>
            </button>
          </div>
        </div>
        <div className="flex max-w-[min(90vw,560px)] flex-wrap justify-center gap-[1vmin]" data-testid="pearl-pile">
          {Array.from({ length: pile - inBasket }, (_, k) => (
            <button
              key={k}
              type="button"
              data-testid="pile-pearl"
              aria-label="Pearl"
              onClick={() => !drag.suppressClick.current && setN(countRef.current + 1)}
              onPointerDown={drag.down}
              onPointerMove={drag.move}
              onPointerUp={drag.up}
              onPointerCancel={drag.cancel}
              className="rounded-full"
              style={{ ...pearlStyle(pearl), minWidth: 56, minHeight: 56, touchAction: 'none' }}
            />
          ))}
        </div>
      </div>
      <DoneButton onClick={() => b.check(countRef.current)} disabled={b.solved} />
      {drag.ghost && <span className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ ...pearlStyle('64px'), left: drag.ghost.x, top: drag.ghost.y }} aria-hidden />}
      {b.solved && <Confetti pieces={18} />}
    </GameFrame>
  );
}

// ───────────────────────────── What Comes Next ─────────────────────────────

/** A seahorse swims along numbered rocks; pick the rock that comes next (or before). */
export function WhatComesNext({ rounds, onAnswer, onDone }: GameProps<NextRound>) {
  const { i, round, next } = useRounds(rounds, onDone);
  const prompt = useCallback(() => prompts.comesNext(round.run, round.dir), [round]);
  const c = useChoice({ answer: round.answer, prompt, onResult: (o) => onAnswer(round.key, o), onSolved: next, resetKey: i });
  useOnRound(i, () => void ask(prompt()));
  const shown: (number | null)[] = round.dir === 'next' ? [...round.run, null] : [null, ...round.run];
  const rock = 'max(84px, min(14vw, 16vh))';
  const horseAt = c.solved ? shown.indexOf(null) : round.dir === 'next' ? shown.length - 2 : 1;
  return (
    <GameFrame kind="next" round={i}>
      <div className="flex items-end justify-center gap-[2vmin]" data-testid="rocks">
        {shown.map((n, k) => (
          <div key={`${i}-${k}`} className="flex flex-col items-center">
            <div className="flex items-end justify-center transition-all duration-500" style={{ height: 'min(16vh, 15vw)', width: rock }}>
              {k === horseAt && <StickerSvg id="st-seahorse" variant="plain" className="h-full w-full animate-bob" />}
            </div>
            <div
              className={`flex items-center justify-center ${n == null && !c.solved ? 'border-[5px] border-dashed border-lagoon bg-white/50' : ''}`}
              style={{ width: rock, height: `calc(${rock} * 0.8)`, borderRadius: '46% 54% 42% 58% / 58% 50% 50% 42%', background: n == null && !c.solved ? undefined : 'linear-gradient(180deg, #c9bfe0, #9f93c2)' }}
            >
              {n == null ? (
                c.solved ? <Numeral n={round.answer} className="text-[max(36px,min(7vw,8vh))] text-white" /> : <span className="font-display text-5xl font-bold text-lagoon">?</span>
              ) : (
                <Numeral n={n} className="text-[max(36px,min(7vw,8vh))] text-white" />
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-[3vmin]">
        {round.options.map((n) => (
          <NumberChoice key={`${i}-${n}`} n={n} look="rock" isAnswer={n === round.answer} state={c} onClick={() => c.choose(n)} />
        ))}
      </div>
      {c.solved && <Confetti pieces={18} />}
    </GameFrame>
  );
}
