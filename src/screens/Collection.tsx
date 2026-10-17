/** Collection: every earned treasure; the rest show as sparkly silhouettes. */
import { ItemArt } from '../art/characters';
import { Sparkle } from '../art/primitives';
import { StickerSvg } from '../art/stickers';
import { HearAgain, KidButton } from '../components/kid';
import { DRESS_ITEMS, STICKER_ITEMS, type RewardItem } from '../data/rewards';
import { back, go, routes } from '../lib/router';
import { useAppState } from '../store/game';

export function Collection() {
  const s = useAppState();
  const Tile = ({ item }: { item: RewardItem }) => {
    const owned = Boolean(s.owned[item.id]);
    return (
      <div data-testid={`collect-${item.id}`} data-owned={owned} className={`relative flex aspect-square items-center justify-center rounded-3xl p-2 ${owned ? 'bg-white shadow-[0_5px_0_rgba(59,34,87,0.1)]' : 'bg-white/40'}`} aria-label={owned ? item.name : 'Not found yet'}>
        {item.kind === 'sticker' ? <StickerSvg id={item.id} variant={owned ? 'sticker' : 'silhouette'} className="h-full w-full" /> : <ItemArt itemId={item.id} silhouette={!owned} className="h-full w-full" />}
        {!owned && (
          <svg viewBox="0 0 40 40" className="pointer-events-none absolute right-1 top-1 h-8 w-8" aria-hidden>
            <Sparkle cx={20} cy={20} r={14} fill="#fff6a8" className="twinkle" />
          </svg>
        )}
      </div>
    );
  };
  return (
    <div className="play-surface kingdom-bg min-h-screen" data-testid="collection">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white/40 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2 backdrop-blur-sm">
        <KidButton icon="back" label="Back" data-testid="go-back" onClick={() => back(routes.dressUp())} />
        <KidButton icon="home" label="Go home" onClick={() => go(routes.home())} />
        <HearAgain />
      </header>
      <main className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3 p-4">
        {[...DRESS_ITEMS, ...STICKER_ITEMS].map((it) => (
          <Tile key={it.id} item={it} />
        ))}
      </main>
    </div>
  );
}
