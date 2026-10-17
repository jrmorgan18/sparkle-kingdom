/**
 * Dress-up studio: pick a character, tap (or drag) earned items onto her, twirl in the mirror, save
 * up to 6 looks, and save a picture of a look.
 */
import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { CHAR_H, CHAR_W, Character, CharacterArt, CHARACTERS, ItemArt } from '../art/characters';
import { Icon } from '../art/icons';
import { p } from '../audio/clips';
import { say } from '../audio/player';
import { ask, HearAgain, KidButton } from '../components/kid';
import { MAX_LOOKS } from '../engine/config';
import { CHARACTER_SLOTS, clearOutfit, deleteLook, saveLook, setCharacter, toggleItem, wearLook } from '../engine/looks';
import { CHARACTER_IDS } from '../engine/seed';
import type { CharacterId } from '../engine/types';
import { DRESS_ITEMS, type Slot } from '../data/rewards';
import { go, routes } from '../lib/router';
import { play } from '../lib/sound';
import { act, useAppState } from '../store/game';
import { exportSceneImage } from './sceneExport';

export function DressUp() {
  const s = useAppState();
  const character = s.dressing.character;
  const outfit = s.dressing.outfits[character];
  const slots = CHARACTER_SLOTS[character];
  const [slot, setSlot] = useState<Slot>(slots[0]);
  const [twirl, setTwirl] = useState(0);
  const [busy, setBusy] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slots.includes(slot)) setSlot(slots[0]);
  }, [character]);
  useEffect(() => {
    void ask([p('dressUp')]);
  }, []);

  const owned = useMemo(() => DRESS_ITEMS.filter((it) => s.owned[it.id] && it.slot === slot), [s.owned, slot]);
  const ownedAny = DRESS_ITEMS.some((it) => s.owned[it.id] && slots.includes(it.slot));

  const wear = (itemId: string) => {
    const on = act((d) => toggleItem(d, character, itemId));
    play(on ? 'reward' : 'tap');
    if (on) setTwirl((n) => n + 1);
  };

  // Drag an item from the wardrobe onto the character (tap works too). Live position lives in a ref.
  const dragStart = useRef<{ id: string; x: number; y: number; dragging: boolean } | null>(null);
  const [ghost, setGhost] = useState<{ id: string; x: number; y: number } | null>(null);
  const down = (e: RPointerEvent<HTMLButtonElement>, id: string) => (dragStart.current = { id, x: e.clientX, y: e.clientY, dragging: false });
  const move = (e: RPointerEvent<HTMLButtonElement>) => {
    const d = dragStart.current;
    if (!d) return;
    if (!d.dragging && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 14) {
      d.dragging = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    if (d.dragging) setGhost({ id: d.id, x: e.clientX, y: e.clientY });
  };
  const up = (e: RPointerEvent<HTMLButtonElement>) => {
    const d = dragStart.current;
    dragStart.current = null;
    setGhost(null);
    if (!d) return;
    if (!d.dragging) return wear(d.id);
    const r = stageRef.current?.getBoundingClientRect();
    if (r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
      if (outfit[slot] !== d.id) wear(d.id);
    }
  };

  const doExport = async () => {
    if (!svgRef.current) return;
    setBusy(true);
    try {
      await exportSceneImage(svgRef.current, `${s.settings.childName}'s ${CHARACTERS[character].name} look`);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="play-surface play-lock kingdom-bg flex flex-col" data-testid="dress-up-screen" data-character={character}>
      <header className="flex items-center gap-3 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2">
        <KidButton icon="home" label="Go home" data-testid="go-home" onClick={() => go(routes.home())} />
        <div className="flex flex-1 justify-center gap-2" role="radiogroup" aria-label="Choose a friend">
          {CHARACTER_IDS.map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={id === character}
              aria-label={CHARACTERS[id].name}
              data-testid={`character-${id}`}
              onClick={() => {
                play('tap');
                act((d) => setCharacter(d, id as CharacterId));
              }}
              className={`h-[76px] w-[76px] overflow-hidden rounded-3xl bg-white ${id === character ? 'ring-4 ring-rose' : 'opacity-80'}`}
            >
              <svg viewBox="70 30 160 130" className="h-full w-full" aria-hidden>
                <CharacterArt id={id} outfit={s.dressing.outfits[id]} />
              </svg>
            </button>
          ))}
        </div>
        <KidButton icon="chest" label="My treasures" data-testid="open-collection" color="#fff3c4" onClick={() => go(routes.collection())} />
        <HearAgain />
      </header>

      <div className="flex min-h-0 flex-1 gap-3 px-3 pb-3 portrait:flex-col landscape:flex-row">
        {/* Stage */}
        <div ref={stageRef} className="relative flex min-h-0 flex-1 items-center justify-center rounded-[2rem] bg-white/50" data-testid="dress-stage">
          <svg ref={svgRef} viewBox={`0 0 ${CHAR_W} ${CHAR_H}`} xmlns="http://www.w3.org/2000/svg" className={`h-full max-h-full w-auto ${twirl ? 'animate-twirl' : ''}`} key={twirl} data-testid="dressed-character">
            <rect data-ui="false" width={CHAR_W} height={CHAR_H} fill="#fff0f8" opacity={0} />
            <CharacterArt id={character} outfit={outfit} />
          </svg>
          <div className="absolute bottom-3 left-3 flex flex-col gap-3">
            <KidButton
              icon="mirror"
              label="Twirl"
              data-testid="twirl"
              color="#ffffff"
              onClick={() => {
                setTwirl((n) => n + 1);
                void say([p('twirl')]);
              }}
            />
            <KidButton icon="undo" label="Take it all off" data-testid="clear-outfit" color="#ffffff" onClick={() => act((d) => clearOutfit(d, character))} />
          </div>
          <div className="absolute bottom-3 right-3 flex flex-col gap-3">
            <KidButton icon="heart" label="Save this look" data-testid="save-look" color="#ffe1f0" disabled={s.dressing.looks.length >= MAX_LOOKS} onClick={() => act((d, t) => saveLook(d, t)) && play('reward')} />
            <KidButton icon="camera" label="Save a picture" data-testid="export-look" color="#ffffff" disabled={busy} onClick={doExport} />
          </div>
        </div>

        {/* Wardrobe */}
        <div className="flex min-h-0 flex-col gap-2 rounded-[2rem] bg-white/80 p-3 portrait:h-[34%] landscape:w-[40%]">
          <div className="flex gap-2 overflow-x-auto no-scrollbar" role="tablist" aria-label="Wardrobe">
            {slots.map((sl) => (
              <button
                key={sl}
                type="button"
                role="tab"
                aria-selected={sl === slot}
                aria-label={sl}
                data-testid={`slot-${sl}`}
                onClick={() => setSlot(sl)}
                className={`flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-2xl p-2 ${sl === slot ? 'bg-rose-light ring-4 ring-rose' : 'bg-royal-light'}`}
              >
                <SlotIcon slot={sl} />
              </button>
            ))}
          </div>
          <div className="grid min-h-0 flex-1 auto-rows-[96px] grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2 overflow-y-auto" data-testid="wardrobe">
            {owned.map((it) => (
              <button
                key={it.id}
                type="button"
                data-testid={`wear-${it.id}`}
                aria-label={it.name}
                aria-pressed={outfit[slot] === it.id}
                onPointerDown={(e) => down(e, it.id)}
                onPointerMove={move}
                onPointerUp={up}
                onPointerCancel={() => ((dragStart.current = null), setGhost(null))}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), wear(it.id))}
                style={{ touchAction: 'none' }}
                className={`flex items-center justify-center rounded-2xl p-1 ${outfit[slot] === it.id ? 'bg-gold-light ring-4 ring-gold' : 'bg-royal-light'}`}
              >
                <ItemArt itemId={it.id} className="h-full w-full" />
              </button>
            ))}
            {!owned.length && (
              <div className="col-span-full flex items-center justify-center gap-3 p-4 text-ink-soft" data-testid="wardrobe-empty">
                <Icon name="chest" className="h-16 w-16 opacity-60" />
                <span className="sr-only">{ownedAny ? 'Nothing here yet' : 'Play to find treasures'}</span>
              </div>
            )}
          </div>
          {s.dressing.looks.length > 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar" data-testid="looks">
              {s.dressing.looks.map((look) => (
                <div key={look.id} className="relative shrink-0">
                  <button
                    type="button"
                    data-testid="look"
                    aria-label={look.name}
                    onClick={() => {
                      play('tap');
                      act((d) => wearLook(d, look.id));
                      setTwirl((n) => n + 1);
                    }}
                    className="h-[84px] w-[76px] rounded-2xl bg-blush"
                  >
                    <Character id={look.character} outfit={look.outfit} className="h-full w-full" />
                  </button>
                  <button type="button" aria-label={`Remove ${look.name}`} onClick={() => act((d) => deleteLook(d, look.id))} className="absolute -right-1 -top-1 h-8 w-8 rounded-full bg-white p-1 shadow">
                    <Icon name="close" className="h-full w-full" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {ghost && (
        <div className="pointer-events-none fixed z-50 h-24 w-24 -translate-x-1/2 -translate-y-1/2" style={{ left: ghost.x, top: ghost.y }} aria-hidden>
          <ItemArt itemId={ghost.id} className="h-full w-full" />
        </div>
      )}
    </div>
  );
}

/** Wardrobe tab icons, drawn from a representative catalog item. */
function SlotIcon({ slot }: { slot: Slot }) {
  const sample: Record<Slot, string> = {
    dress: 'dr-rose-gown',
    tail: 'dr-coral-tail',
    crown: 'dr-gold-crown',
    shoes: 'dr-glass-slippers',
    necklace: 'dr-pearl-necklace',
    wand: 'dr-star-wand',
  };
  return <ItemArt itemId={sample[slot]} className="h-full w-full" />;
}
