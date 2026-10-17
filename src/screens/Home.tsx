/** Home: one big Play button, Dress Up, Decorate — nothing else child-facing. */
import { useEffect, useState } from 'react';
import { Character } from '../art/characters';
import { Icon } from '../art/icons';
import { StickerSvg } from '../art/stickers';
import { p } from '../audio/clips';
import { audioUnlocked, say } from '../audio/player';
import { ask, KidButton } from '../components/kid';
import { go, routes } from '../lib/router';
import { play } from '../lib/sound';
import { useAppState } from '../store/game';

let greeted = false;

export function Home() {
  const s = useAppState();
  const [twirl, setTwirl] = useState(0);
  useEffect(() => {
    if (!greeted && audioUnlocked()) {
      greeted = true;
      void ask([p('welcome')]);
    }
  }, []);
  const pearl = s.dressing.outfits.pearl;
  return (
    <div className="play-surface play-lock kingdom-bg flex flex-col items-center justify-between overflow-hidden px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))]" data-testid="home">
      <h1 className="sr-only">Pearl’s Sparkle Kingdom</h1>
      <div className="flex w-full items-start justify-between">
        <StickerSvg id="st-seahorse" variant="plain" className="h-[14vh] w-[14vh] animate-bob" />
        <div className="relative hidden sm:block" aria-hidden>
          <StickerSvg id="st-rainbow" variant="plain" className="absolute left-1/2 top-[-2vh] h-[14vh] w-[22vh] -translate-x-1/2 opacity-70" />
          <p className="relative pt-[5vh] font-display text-3xl font-semibold text-royal/90">Pearl’s Sparkle Kingdom</p>
        </div>
        <StickerSvg id="st-unicorn" variant="plain" className="h-[16vh] w-[16vh] animate-bob" />
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center gap-[4vmin] portrait:flex-col landscape:flex-row">
        <button
          type="button"
          aria-label="Pearl"
          onClick={() => {
            play('reward');
            setTwirl((n) => n + 1);
            void say([p('welcome')]);
          }}
          className="h-[min(46vh,60vw)] landscape:h-[62vh]"
        >
          <Character key={twirl} id="pearl" outfit={pearl} className={`h-full w-auto ${twirl ? 'animate-twirl' : 'animate-bob'}`} />
        </button>
        <button
          type="button"
          data-testid="play"
          aria-label="Play"
          onClick={() => {
            play('tap');
            go(routes.play());
          }}
          className="btn-3d flex items-center justify-center rounded-full bg-rose p-[2.5vmin] animate-gentle-pulse"
          style={{ width: 'max(170px, min(34vw, 30vh))', height: 'max(170px, min(34vw, 30vh))', ['--btn-shadow' as string]: '#d63c86' }}
        >
          <Icon name="play" className="h-full w-full" />
        </button>
      </div>
      <div className="flex w-full items-end justify-center gap-[6vmin]">
        <KidButton icon="dress" size="lg" label="Dress up" data-testid="dress-up" color="#ffe1f0" shadow="#ff9fc8" onClick={() => go(routes.dressUp())} />
        <KidButton icon="castle" size="lg" label="Decorate" data-testid="decorate" color="#efe6ff" shadow="#c9a6ff" onClick={() => go(routes.decorate())} />
      </div>
      {/* Grown-ups: small and tucked in the corner; the PIN gate protects it. */}
      <button type="button" aria-label="Grown-ups" data-testid="parent-link" onClick={() => go(routes.parent())} className="absolute bottom-[max(10px,env(safe-area-inset-bottom))] right-3 h-12 w-12 rounded-2xl bg-white/60 p-2 opacity-70">
        <Icon name="lock" className="h-full w-full" />
      </button>
    </div>
  );
}
