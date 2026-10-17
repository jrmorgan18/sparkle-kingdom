/** Sight-word mini-games: Shell Search, Bubble Pop, Royal Invitation, Word Match. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clam } from '../../art/game';
import { PictureArt } from '../../art/pictures';
import { normalizeToken, p, prompts, sentenceParts, sentenceTokens, word } from '../../audio/clips';
import { say } from '../../audio/player';
import { ask, CORRECT_PAUSE_MS, nextPraise, useChoice } from '../../components/kid';
import { Confetti } from '../../components/Confetti';
import type { InviteRound, MatchRound, WordChoiceRound } from '../../engine/session';
import { shuffle, createRng } from '../../lib/random';
import { play } from '../../lib/sound';
import { useAppState } from '../../store/game';
import { choiceClass, GameFrame, useOnRound, useRounds, WordText, type GameProps } from './common';

function useWordText() {
  const s = useAppState();
  return (id: string) => s.curriculum.words[id]?.text ?? id;
}

const CLAM_TINTS = ['#c69cff', '#ff9fc8', '#7fd6e8', '#ffc58a'];

// ───────────────────────────── Shell Search ─────────────────────────────

export function ShellSearch({ rounds, onAnswer, onDone }: GameProps<WordChoiceRound>) {
  const text = useWordText();
  const { i, round, next } = useRounds(rounds, onDone);
  const prompt = useCallback(() => prompts.findWord(text(round.wordId)), [round, text]);
  const c = useChoice({ answer: round.wordId, prompt, onResult: (o) => onAnswer(round.key, o), onSolved: next, resetKey: i });
  useOnRound(i, () => void ask(prompt()));
  return (
    <GameFrame kind="shell" round={i}>
      <div className="flex flex-wrap items-end justify-center gap-[3vmin]">
        {round.options.map((id, k) => {
          const isAnswer = id === round.wordId;
          return (
            <button
              key={`${i}-${id}`}
              type="button"
              data-testid="option"
              data-correct={isAnswer || undefined}
              aria-label={text(id)}
              onClick={() => c.choose(id)}
              className={`relative flex flex-col items-center rounded-[2rem] p-2 ${choiceClass({ wiggle: c.wiggle === id, glow: c.glow, solved: c.solved, isAnswer })}`}
              style={{ width: 'max(132px, min(24vw, 30vh))' }}
            >
              <Clam open={c.solved && isAnswer} tint={CLAM_TINTS[k % CLAM_TINTS.length]} className="w-full" />
              <span className="-mt-[2vmin] rounded-2xl bg-white px-4 py-2 shadow-[0_4px_0_rgba(59,34,87,0.15)]">
                <WordText text={text(id)} className="text-[max(34px,min(7vw,8vh))]" />
              </span>
            </button>
          );
        })}
      </div>
      {c.solved && <Confetti pieces={18} />}
    </GameFrame>
  );
}

// ───────────────────────────── Bubble Pop ─────────────────────────────

/**
 * Words float slowly in bubbles. Movement pauses whenever she hasn't touched the screen for a while
 * (and when the tablet is hidden), and stops entirely in reduced-motion mode.
 */
export function BubblePop({ rounds, onAnswer, onDone }: GameProps<WordChoiceRound>) {
  const text = useWordText();
  const { i, round, next } = useRounds(rounds, onDone);
  const prompt = useCallback(() => prompts.popWord(text(round.wordId)), [round, text]);
  const c = useChoice({ answer: round.wordId, prompt, onResult: (o) => onAnswer(round.key, o), onSolved: next, resetKey: i });
  useOnRound(i, () => void ask(prompt()));

  const [paused, setPaused] = useState(false);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wake = useCallback(() => {
    setPaused(false);
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => setPaused(true), 12_000);
  }, []);
  useEffect(() => {
    wake();
    const onVis = () => (document.hidden ? setPaused(true) : wake());
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      if (idle.current) clearTimeout(idle.current);
    };
  }, [wake]);

  const layout = useMemo(() => {
    const rng = createRng(i * 97 + round.options.length);
    const slots = shuffle([12, 37, 62, 87].slice(0, Math.max(round.options.length, 2)).map((x, k, arr) => (arr.length === 2 ? [28, 72][k] : arr.length === 3 ? [18, 50, 82][k] : x)), rng);
    return round.options.map((id, k) => ({ id, left: slots[k], delay: -(rng() * 6), dur: 6 + rng() * 2.5, top: 18 + rng() * 34 }));
  }, [i, round]);

  return (
    <GameFrame kind="bubble" round={i}>
      <div className="relative h-full w-full max-w-4xl overflow-hidden" onPointerDown={wake} data-paused={paused || undefined} data-testid="bubble-field">
        {layout.map(({ id, left, delay, dur, top }) => {
          const isAnswer = id === round.wordId;
          const popped = c.solved && isAnswer;
          return (
            <div
              key={`${i}-${id}`}
              className="absolute"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <div
                style={{
                  animation: `sk-float ${dur}s ease-in-out ${delay}s infinite alternate`,
                  animationPlayState: paused || c.solved ? 'paused' : 'running',
                }}
              >
                <button
                  type="button"
                  data-testid="option"
                  data-correct={isAnswer || undefined}
                  aria-label={text(id)}
                  onClick={() => c.choose(id)}
                  className={`flex items-center justify-center rounded-full transition-transform duration-300 ${choiceClass({ wiggle: c.wiggle === id, glow: c.glow, solved: c.solved, isAnswer })} ${popped ? 'scale-125 opacity-0' : ''}`}
                  style={{
                    width: 'max(140px, min(24vw, 30vh))',
                    height: 'max(140px, min(24vw, 30vh))',
                    background: 'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95) 0 10%, rgba(220,245,255,0.75) 11% 55%, rgba(170,225,255,0.6) 100%)',
                    border: '5px solid rgba(255,255,255,0.9)',
                    boxShadow: '0 8px 24px rgba(58,141,255,0.25), inset -8px -10px 20px rgba(160,140,255,0.25)',
                  }}
                >
                  <WordText text={text(id)} className="text-[max(34px,min(7vw,8vh))]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {c.solved && <Confetti pieces={18} />}
    </GameFrame>
  );
}

// ───────────────────────────── Royal Invitation ─────────────────────────────

/**
 * A sentence on a royal invitation is read word by word, each word lighting up as it's spoken (print
 * carries meaning). Then she taps the target word in the sentence.
 */
export function RoyalInvitation({ rounds, onAnswer, onDone }: GameProps<InviteRound>) {
  const s = useAppState();
  const { i, round, next } = useRounds(rounds, onDone);
  const w = s.curriculum.words[round.wordId];
  const sentence = w?.sentence ?? round.wordId;
  const tokens = sentenceTokens(sentence);
  const target = normalizeToken(w?.text ?? round.wordId);
  const [lit, setLit] = useState<number | null>(null);
  const prompt = useCallback(() => prompts.tapWord(w?.text ?? round.wordId), [w, round]);
  const c = useChoice({ answer: target, prompt, onResult: (o) => onAnswer(round.key, o), onSolved: next, resetKey: i });

  const readSentence = useCallback(async () => {
    await say(sentenceParts(sentence), { separate: true, onPart: setLit });
    setLit(null);
  }, [sentence]);

  useOnRound(i, () => {
    void (async () => {
      if (i === 0) await say([p('invitation')]);
      await readSentence();
      await ask(prompt());
    })();
  });

  return (
    <GameFrame kind="invite" round={i}>
      <div className="relative flex w-full max-w-4xl flex-col items-center gap-[2vmin] rounded-[2.5rem] border-[6px] border-gold bg-[#fffaf0] px-[3vmin] py-[3vmin] shadow-[0_10px_0_rgba(217,154,0,0.35)]">
        <div className="absolute -top-6 left-1/2 h-12 w-12 -translate-x-1/2 rounded-full bg-rose shadow-[0_4px_0_#d63c86]" aria-hidden>
          <svg viewBox="0 0 40 40" className="h-full w-full">
            <path d="M20 30 C8 22 10 12 16 13 C18 13.5 19.5 15 20 16 C20.5 15 22 13.5 24 13 C30 12 32 22 20 30Z" fill="#fff" />
          </svg>
        </div>
        {w?.picture && <PictureArt id={w.picture} className="h-[min(22vh,22vw)] w-auto" />}
        <button type="button" aria-label="Read it to me" onClick={() => void readSentence()} className="sr-only">
          read
        </button>
        <div className="flex flex-wrap items-center justify-center gap-[2vmin]">
          {tokens.map((tok, k) => {
            const norm = normalizeToken(tok);
            const isAnswer = norm === target;
            return (
              <button
                key={`${i}-${k}`}
                type="button"
                data-testid="option"
                data-correct={isAnswer || undefined}
                aria-label={norm}
                onClick={() => c.choose(norm)}
                className={`min-h-[88px] min-w-[88px] rounded-3xl px-[2.5vmin] py-2 transition-colors ${lit === k ? 'bg-gold-light ring-4 ring-gold' : 'bg-white'} ${c.solved && isAnswer ? 'bg-rose-light ring-4 ring-rose' : ''} ${choiceClass({ wiggle: c.wiggle === norm, glow: c.glow, solved: false, isAnswer })}`}
                style={{ boxShadow: '0 5px 0 rgba(59,34,87,0.12)' }}
              >
                <WordText text={tok} className="text-[max(38px,min(8vw,9vh))]" />
              </button>
            );
          })}
        </div>
      </div>
      {c.solved && <Confetti pieces={18} />}
    </GameFrame>
  );
}

// ───────────────────────────── Word Match ─────────────────────────────

/** Memory match with 4–6 cards; each card's word is read aloud when flipped. Exposure only (no scoring). */
export function WordMatch({ rounds, onDone, onExposure }: GameProps<MatchRound> & { onExposure: (wordIds: string[]) => void }) {
  const text = useWordText();
  const round = rounds[0];
  const cards = useMemo(() => shuffle([...round.wordIds, ...round.wordIds].map((id, k) => ({ id, k })), createRng(round.wordIds.join('').length * 31 + 7)), [round]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);
  const busy = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useOnRound(0, () => void ask([p('matchCards')]));

  const flip = (idx: number) => {
    if (busy.current || done || flipped.includes(idx) || matched.has(cards[idx].id)) return;
    play('tap');
    void say([word(text(cards[idx].id))]);
    const now = [...flipped, idx];
    setFlipped(now);
    if (now.length < 2) return;
    const [a, b] = now.map((n) => cards[n]);
    if (a.id === b.id) {
      const m = new Set(matched).add(a.id);
      setMatched(m);
      setFlipped([]);
      play('correct');
      if (m.size === round.wordIds.length) {
        setDone(true);
        onExposure(round.wordIds);
        setTimeout(() => void say([nextPraise()]), 700);
        setTimeout(() => doneRef.current(), CORRECT_PAUSE_MS + 700);
      }
    } else {
      busy.current = true;
      setTimeout(() => {
        setFlipped([]);
        busy.current = false;
      }, 1100);
    }
  };

  const cols = cards.length <= 4 ? 'grid-cols-2' : 'grid-cols-3';
  return (
    <GameFrame kind="match" round={0}>
      <div className={`grid ${cols} gap-[2.5vmin]`} data-done={done || undefined}>
        {cards.map((card, idx) => {
          const face = flipped.includes(idx) || matched.has(card.id);
          return (
            <button
              key={idx}
              type="button"
              data-testid="card"
              data-word={card.id}
              data-face={face || undefined}
              aria-label={face ? text(card.id) : 'Card'}
              onClick={() => flip(idx)}
              className={`flex items-center justify-center rounded-3xl transition-transform duration-300 ${matched.has(card.id) ? 'ring-4 ring-gold' : ''}`}
              style={{
                width: 'max(110px, min(22vw, 22vh))',
                height: 'max(120px, min(26vw, 26vh))',
                background: face ? '#ffffff' : 'linear-gradient(135deg, #ff9fd2, #b48cff)',
                boxShadow: '0 6px 0 rgba(59,34,87,0.18)',
              }}
            >
              {face ? (
                <WordText text={text(card.id)} className="text-[max(32px,min(6vw,6vh))]" />
              ) : (
                <svg viewBox="0 0 60 60" className="h-1/2 w-1/2" aria-hidden>
                  <path d="M10 38 Q8 10 30 8 Q52 10 50 38 Q30 48 10 38Z" fill="#fff" opacity={0.85} />
                </svg>
              )}
            </button>
          );
        })}
      </div>
      {done && <Confetti pieces={22} />}
    </GameFrame>
  );
}
