/**
 * One adventure: a short intro, 3–6 mini-games, a treasure-chest reveal for each reward, then a
 * gentle ending ("Pearl is tired. See you tomorrow!"). No timers, scores, or failure screens.
 */
import { useEffect, useRef, useState } from 'react';
import { create } from 'zustand';
import { Character, ItemArt } from '../art/characters';
import { TreasureChest } from '../art/game';
import { StickerSvg } from '../art/stickers';
import { p, type ClipPart } from '../audio/clips';
import { say, stopSpeaking } from '../audio/player';
import { Confetti } from '../components/Confetti';
import { ask, HearAgain, KidButton, ProgressShells } from '../components/kid';
import { dayKey } from '../engine/mastery';
import { canPlayMore, finishSession, needsPlacement, recordMatchExposure, recordRound, startSession } from '../engine/play';
import type { Award } from '../engine/rewards';
import { buildPlacement, buildSession, type GamePlan, type SessionPlan } from '../engine/session';
import type { Outcome } from '../engine/types';
import { REWARD_BY_ID } from '../data/rewards';
import { now } from '../lib/clock';
import { go, routes } from '../lib/router';
import { play } from '../lib/sound';
import { act, useAppState } from '../store/game';
import { BubblePop, RoyalInvitation, ShellSearch, WordMatch } from './games/WordGames';
import { CountJewels, PearlNecklace, TenFrameTreasure, TreasureShop, WhatComesNext } from './games/NumberGames';
import type { InviteRound, JewelsRound, MatchRound, NecklaceRound, NextRound, ShopRound, TenFrameRound, WordChoiceRound } from '../engine/session';

type Phase = 'intro' | 'game' | 'reward' | 'goodbye';

interface AdventureStore {
  plan: SessionPlan | null;
  sessionId: string | null;
  gameIndex: number;
  phase: Phase;
  awards: Award[];
  set: (patch: Partial<Omit<AdventureStore, 'set'>>) => void;
}

/** In-memory adventure progress (answers themselves are saved as they happen). */
export const useAdventure = create<AdventureStore>((set) => ({
  plan: null,
  sessionId: null,
  gameIndex: 0,
  phase: 'intro',
  awards: [],
  set: (patch) => set(patch),
}));

export function resetAdventure() {
  useAdventure.getState().set({ plan: null, sessionId: null, gameIndex: 0, phase: 'intro', awards: [] });
}

/** Starts a new adventure unless one from today is already in progress (idempotent under StrictMode). */
function begin() {
  const a = useAdventure.getState();
  const t = now();
  if (a.plan && a.phase !== 'goodbye' && dayKey(a.plan.createdAt) === dayKey(t)) return;
  const plan = act((d, at) => {
    const pl = needsPlacement(d) ? buildPlacement(d, at) : buildSession(d, at);
    startSession(d, pl, at);
    return pl;
  });
  useAdventure.getState().set({ plan, sessionId: plan.id, gameIndex: 0, phase: 'intro', awards: [] });
}

export function AdventureScreen() {
  const s = useAppState();
  const a = useAdventure();
  const [blocked] = useState(() => !canPlayMore(s, now()) && !(a.plan && a.phase !== 'goodbye'));

  useEffect(() => {
    if (!blocked) begin();
  }, [blocked]);

  useEffect(() => () => stopSpeaking(), []);

  if (blocked) return <Sleeping />;
  if (!a.plan) return null;

  const plan = a.plan;
  const games = plan.games;
  const onAnswer = (key: string, outcome: Outcome) => act((d, t) => recordRound(d, a.sessionId!, key, outcome, t));
  const nextGame = () => {
    if (a.gameIndex + 1 < games.length) {
      play('whoosh');
      a.set({ gameIndex: a.gameIndex + 1 });
    } else {
      const res = act((d, t) => finishSession(d, a.sessionId!, t));
      a.set({ phase: 'reward', awards: res.awards });
    }
  };

  return (
    <div
      className="play-surface play-lock sea-bg flex flex-col"
      data-testid="adventure"
      data-phase={a.phase}
      data-game-index={a.gameIndex}
      data-game-count={games.length}
      data-game-kind={a.phase === 'game' ? games[a.gameIndex]?.kind : undefined}
      data-placement={plan.placement || undefined}
    >
      <TopBar done={a.phase === 'game' ? a.gameIndex : a.phase === 'intro' ? 0 : games.length} total={games.length} showHear={a.phase !== 'goodbye'} />
      <div className="relative min-h-0 flex-1">
        {a.phase === 'intro' && <Intro placement={plan.placement} onStart={() => a.set({ phase: 'game' })} />}
        {a.phase === 'game' && <GameView key={`${plan.id}-${a.gameIndex}`} game={games[a.gameIndex]} onAnswer={onAnswer} onDone={nextGame} />}
        {a.phase === 'reward' && <RewardReveal awards={a.awards} onDone={() => a.set({ phase: 'goodbye' })} />}
        {a.phase === 'goodbye' && <Goodbye />}
      </div>
    </div>
  );
}

function GameView({ game, onAnswer, onDone }: { game: GamePlan; onAnswer: (key: string, o: Outcome) => void; onDone: () => void }) {
  switch (game.kind) {
    case 'shell':
      return <ShellSearch rounds={game.rounds as WordChoiceRound[]} onAnswer={onAnswer} onDone={onDone} />;
    case 'bubble':
      return <BubblePop rounds={game.rounds as WordChoiceRound[]} onAnswer={onAnswer} onDone={onDone} />;
    case 'invite':
      return <RoyalInvitation rounds={game.rounds as InviteRound[]} onAnswer={onAnswer} onDone={onDone} />;
    case 'match':
      return <WordMatch rounds={game.rounds as MatchRound[]} onAnswer={onAnswer} onDone={onDone} onExposure={(ids) => act((d, t) => recordMatchExposure(d, ids, t))} />;
    case 'necklace':
      return <PearlNecklace rounds={game.rounds as NecklaceRound[]} onAnswer={onAnswer} onDone={onDone} />;
    case 'jewels':
      return <CountJewels rounds={game.rounds as JewelsRound[]} onAnswer={onAnswer} onDone={onDone} />;
    case 'tenframe':
      return <TenFrameTreasure rounds={game.rounds as TenFrameRound[]} onAnswer={onAnswer} onDone={onDone} />;
    case 'shop':
      return <TreasureShop rounds={game.rounds as ShopRound[]} onAnswer={onAnswer} onDone={onDone} />;
    case 'next':
      return <WhatComesNext rounds={game.rounds as NextRound[]} onAnswer={onAnswer} onDone={onDone} />;
  }
}

function TopBar({ done, total, showHear }: { done: number; total: number; showHear: boolean }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <header className="flex items-center justify-between gap-3 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2">
      <KidButton icon="home" label="Go home" data-testid="go-home" onClick={() => setConfirm(true)} />
      <ProgressShells total={total} done={done} />
      {showHear ? <HearAgain /> : <span className="w-[76px]" />}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center gap-10 bg-ink/50" data-testid="leave-confirm">
          <KidButton icon="home" size="lg" label="Yes, go home" data-testid="leave-yes" color="#ffe1f0" onClick={() => leave()} />
          <KidButton icon="play" size="lg" label="Keep playing" data-testid="leave-no" color="#ffffff" onClick={() => setConfirm(false)} />
        </div>
      )}
    </header>
  );
}

function leave() {
  stopSpeaking();
  const a = useAdventure.getState();
  if (a.phase === 'goodbye' || a.phase === 'reward') resetAdventure();
  go(routes.home());
}

function Intro({ placement, onStart }: { placement: boolean; onStart: () => void }) {
  const startRef = useRef(onStart);
  startRef.current = onStart;
  useEffect(() => {
    const onStart = () => startRef.current();
    let cancelled = false;
    const line: ClipPart[] = [placement ? p('warmup') : p('letsPlay')];
    const t = setTimeout(() => !cancelled && onStart(), 4500);
    void ask(line).then(() => {
      if (!cancelled) {
        clearTimeout(t);
        onStart();
      }
    });
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [placement]);
  return (
    <button type="button" className="flex h-full w-full flex-col items-center justify-center" onClick={onStart} aria-label="Start" data-testid="intro">
      <Character id="pearl" className="h-[60vh] w-auto animate-bob" />
    </button>
  );
}

// ───────────────────────────── Rewards ─────────────────────────────

export function RewardArt({ itemId, className }: { itemId: string; className?: string }) {
  const item = REWARD_BY_ID.get(itemId);
  if (!item) return null;
  return item.kind === 'sticker' ? <StickerSvg id={itemId} className={className} title={item.name} /> : <ItemArt itemId={itemId} className={className} />;
}

/** A treasure chest per reward: tap it, it opens, and the new item sparkles. */
function RewardReveal({ awards, onDone }: { awards: Award[]; onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const award = awards[idx];
  useEffect(() => {
    if (!open) void ask([p('treasure')]);
  }, [idx, open]);
  useEffect(() => {
    if (!award) onDone();
  }, [award, onDone]);
  if (!award) return null;
  const openIt = () => {
    if (open) return;
    play('reward');
    setOpen(true);
    void say([award.itemId ? p('twirl') : p('starBonus')]);
  };
  const next = () => {
    setOpen(false);
    if (idx + 1 < awards.length) setIdx(idx + 1);
    else onDone();
  };
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6" data-testid="reward-reveal" data-index={idx} data-total={awards.length}>
      {!open ? (
        <button type="button" data-testid="open-chest" aria-label="Open the treasure chest" onClick={openIt} className="animate-gentle-pulse" style={{ width: 'min(60vw, 46vh)' }}>
          <TreasureChest open={false} className="w-full" />
        </button>
      ) : (
        <>
          <Confetti />
          <div className="relative flex flex-col items-center" data-testid="reward-item" data-item={award.itemId ?? 'star'}>
            <TreasureChest open className="absolute bottom-0 w-[min(50vw,38vh)] opacity-60" />
            <div className="relative animate-twirl rounded-full bg-white/80 p-6 shadow-[0_0_60px_20px_rgba(255,230,120,0.8)]" style={{ width: 'min(54vw, 40vh)', height: 'min(54vw, 40vh)' }}>
              {award.itemId ? (
                <RewardArt itemId={award.itemId} className="h-full w-full" />
              ) : (
                <svg viewBox="0 0 100 100" className="h-full w-full" aria-label="A shiny star">
                  <polygon points="50,6 61,38 95,38 67,58 78,92 50,72 22,92 33,58 5,38 39,38" fill="#ffc531" />
                </svg>
              )}
            </div>
          </div>
          <KidButton icon="play" size="lg" label="Next" data-testid="reward-next" color="#ffffff" onClick={next} />
        </>
      )}
    </div>
  );
}

function Goodbye() {
  useEffect(() => {
    void ask([p('goodbye')]);
  }, []);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-4" data-testid="goodbye">
      <SleepyPearl />
      <div className="flex gap-6">
        <KidButton
          icon="home"
          size="lg"
          label="Home"
          data-testid="goodbye-home"
          color="#ffffff"
          onClick={() => {
            resetAdventure();
            go(routes.home());
          }}
        />
        <KidButton
          icon="dress"
          size="lg"
          label="Dress up"
          color="#ffe1f0"
          onClick={() => {
            resetAdventure();
            go(routes.dressUp());
          }}
        />
      </div>
    </div>
  );
}

function SleepyPearl() {
  return (
    <div className="relative">
      <Character id="pearl" className="h-[46vh] w-auto" />
      <svg viewBox="0 0 120 80" className="absolute -right-10 top-0 h-24 w-36" aria-hidden>
        <text x={10} y={60} fontSize={36} fontFamily="Fredoka Variable, sans-serif" fill="#7b4bd6" opacity={0.8}>
          z
        </text>
        <text x={44} y={40} fontSize={30} fontFamily="Fredoka Variable, sans-serif" fill="#7b4bd6" opacity={0.6}>
          z
        </text>
        <text x={76} y={22} fontSize={24} fontFamily="Fredoka Variable, sans-serif" fill="#7b4bd6" opacity={0.4}>
          z
        </text>
      </svg>
    </div>
  );
}

/** Shown when today's adventures are used up: Pearl is resting; dress-up and decorating stay open. */
function Sleeping() {
  useEffect(() => {
    void ask([p('sleeping')]);
  }, []);
  return (
    <div className="play-surface play-lock sea-bg flex flex-col" data-testid="sleeping">
      <header className="flex items-center justify-between px-4 pt-[max(12px,env(safe-area-inset-top))]">
        <KidButton icon="home" label="Go home" data-testid="go-home" onClick={() => go(routes.home())} />
        <HearAgain />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <SleepyPearl />
        <div className="flex gap-6">
          <KidButton icon="dress" size="lg" label="Dress up" color="#ffe1f0" onClick={() => go(routes.dressUp())} />
          <KidButton icon="castle" size="lg" label="Decorate" color="#efe6ff" onClick={() => go(routes.decorate())} />
        </div>
      </div>
    </div>
  );
}
