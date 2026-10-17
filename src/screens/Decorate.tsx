/**
 * Decorate: Word Quest's scene editor with picture-only controls. Drag or tap-to-place, resize,
 * layer, flip, remove, reset (with confirmation), and save as a picture. Three scenes.
 */
import { memo, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { SceneBackground, SCENE_H, SCENE_INFO, SCENE_W } from '../art/scenes';
import { StickerSvg } from '../art/stickers';
import { Icon, type IconName } from '../art/icons';
import { p } from '../audio/clips';
import { ask, HearAgain, KidButton } from '../components/kid';
import { STICKER_ITEMS, REWARD_BY_ID, type StickerItem } from '../data/rewards';
import { flipSticker, moveSticker, placeSticker, removePlacement, resetScene, resizeSticker, restack } from '../engine/scenes';
import { SCENE_IDS } from '../engine/seed';
import type { SceneId, StickerPlacement } from '../engine/types';
import { go, routes } from '../lib/router';
import { play } from '../lib/sound';
import { act, useAppState } from '../store/game';
import { exportSceneImage } from './sceneExport';

const BASE = 200;

export function ScenePicker() {
  const s = useAppState();
  useEffect(() => {
    void ask([p('decorate')]);
  }, []);
  return (
    <div className="play-surface kingdom-bg min-h-screen" data-testid="scene-picker">
      <header className="flex items-center justify-between px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2">
        <KidButton icon="home" label="Go home" data-testid="go-home" onClick={() => go(routes.home())} />
        <HearAgain />
      </header>
      <main className="grid gap-4 p-4 sm:grid-cols-3">
        {SCENE_IDS.map((id) => (
          <button key={id} type="button" data-testid={`scene-${id}`} aria-label={SCENE_INFO[id].title} onClick={() => go(routes.decorate(id))} className="btn-3d overflow-hidden rounded-[2rem] bg-white">
            <svg viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} className="block aspect-[16/10] w-full" aria-hidden>
              <SceneBackground id={id} u={`pick-${id}`} />
              {s.scenes[id].placements.map((pl) => {
                const size = BASE * pl.scale * ((REWARD_BY_ID.get(pl.stickerId) as StickerItem | undefined)?.baseScale ?? 1);
                return <StickerSvg key={pl.id} id={pl.stickerId} variant="plain" x={pl.x * SCENE_W - size / 2} y={pl.y * SCENE_H - size / 2} width={size} height={size} flip={pl.flip} />;
              })}
            </svg>
          </button>
        ))}
      </main>
    </div>
  );
}

const PlacedSticker = memo(function PlacedSticker({
  p: pl,
  baseScale,
  label,
  selected,
  x,
  y,
  onDown,
}: {
  p: StickerPlacement;
  baseScale: number;
  label: string;
  selected: boolean;
  x: number;
  y: number;
  onDown: (e: RPointerEvent<SVGGElement>, p: StickerPlacement) => void;
}) {
  const size = BASE * pl.scale * baseScale;
  const cx = x * SCENE_W;
  const cy = y * SCENE_H;
  return (
    <g data-testid="placed-sticker" data-sticker={pl.stickerId} role="button" aria-label={`${label}${selected ? ', selected' : ''}`} aria-pressed={selected} tabIndex={0} onPointerDown={(e) => onDown(e, pl)} style={{ cursor: 'grab', outline: 'none' }}>
      {selected && <rect data-ui="true" x={cx - size / 2 - 8} y={cy - size / 2 - 8} width={size + 16} height={size + 16} rx={24} fill="rgba(255,255,255,0.25)" stroke="#ffb300" strokeWidth={6} strokeDasharray="18 12" />}
      <StickerSvg id={pl.stickerId} x={cx - size / 2} y={cy - size / 2} width={size} height={size} flip={pl.flip} />
    </g>
  );
});

export function SceneEditor({ sceneId }: { sceneId: SceneId }) {
  const s = useAppState();
  const scene = s.scenes[sceneId];
  const owned = STICKER_ITEMS.filter((c) => s.owned[c.id]);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [trayPick, setTrayPick] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; dx: number; dy: number; moved: boolean } | null>(null);
  const [ghost, setGhost] = useState<{ stickerId: string; cx: number; cy: number } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);

  const placements = [...scene.placements].sort((a, b) => a.layer - b.layer);
  const sel = scene.placements.find((pl) => pl.id === selected) ?? null;
  const baseScale = (id: string) => (REWARD_BY_ID.get(id) as StickerItem | undefined)?.baseScale ?? 1;

  const toFraction = (clientX: number, clientY: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: (clientX - r.left) / r.width, y: (clientY - r.top) / r.height, inside: clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom };
  };

  const place = (stickerId: string, x: number, y: number) => {
    const id = act((d, t) => placeSticker(d, sceneId, stickerId, x, y, t));
    if (id) {
      play('pop');
      setSelected(id);
    }
  };

  // ── Dragging placed stickers ──
  // The ref is the source of truth during a drag: pointer events can arrive faster than React
  // re-renders on a busy tablet, so reading state here could drop the sticker short of the finger.
  const dragRef = useRef<typeof drag>(null);
  const updateDrag = (d: typeof drag) => {
    dragRef.current = d;
    setDrag(d);
  };
  const onStickerDown = (e: RPointerEvent<SVGGElement>, pl: StickerPlacement) => {
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    const f = toFraction(e.clientX, e.clientY);
    setSelected(pl.id);
    setTrayPick(null);
    updateDrag({ id: pl.id, x: pl.x, y: pl.y, dx: f.x - pl.x, dy: f.y - pl.y, moved: false });
  };
  const onCanvasMove = (e: RPointerEvent) => {
    const cur = dragRef.current;
    if (!cur) return;
    const f = toFraction(e.clientX, e.clientY);
    const x = Math.min(1, Math.max(0, f.x - cur.dx));
    const y = Math.min(1, Math.max(0, f.y - cur.dy));
    updateDrag({ ...cur, x, y, moved: cur.moved || Math.abs(x - cur.x) + Math.abs(y - cur.y) > 0.002 });
  };
  const onCanvasUp = () => {
    const cur = dragRef.current;
    if (cur?.moved) act((d, t) => moveSticker(d, sceneId, cur.id, cur.x, cur.y, t));
    updateDrag(null);
  };
  const onCanvasDown = (e: RPointerEvent) => {
    if (trayPick) {
      const f = toFraction(e.clientX, e.clientY);
      place(trayPick, f.x, f.y);
      setTrayPick(null);
    } else setSelected(null);
  };

  // ── Dragging from the tray (vertical drag; horizontal swipes still scroll the tray) ──
  const trayStart = useRef<{ id: string; x: number; y: number; dragging: boolean } | null>(null);
  const onTrayDown = (e: RPointerEvent<HTMLButtonElement>, stickerId: string) => {
    trayStart.current = { id: stickerId, x: e.clientX, y: e.clientY, dragging: false };
  };
  const onTrayMove = (e: RPointerEvent<HTMLButtonElement>) => {
    const t = trayStart.current;
    if (!t) return;
    if (!t.dragging && Math.abs(e.clientY - t.y) > 12) {
      t.dragging = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    if (t.dragging) setGhost({ stickerId: t.id, cx: e.clientX, cy: e.clientY });
  };
  const onTrayUp = (e: RPointerEvent<HTMLButtonElement>) => {
    const t = trayStart.current;
    trayStart.current = null;
    setGhost(null);
    if (!t) return;
    if (t.dragging) {
      const f = toFraction(e.clientX, e.clientY);
      if (f.inside) place(t.id, f.x, f.y);
    } else {
      play('tap');
      setSelected(null);
      setTrayPick((cur) => (cur === t.id ? null : t.id));
    }
  };

  const doExport = async () => {
    if (!svgRef.current) return;
    setBusy(true);
    setSelected(null);
    try {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await exportSceneImage(svgRef.current, `${s.settings.childName}'s ${SCENE_INFO[sceneId].title}`);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="play-surface play-lock kingdom-bg flex flex-col" data-testid="scene-editor">
      <header className="flex items-center gap-3 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2">
        <KidButton icon="back" label="Back" data-testid="go-back" onClick={() => go(routes.decorate())} />
        <div className="flex-1" />
        <KidButton icon="camera" label="Save a picture" data-testid="export-scene" disabled={busy} onClick={doExport} />
        <KidButton icon="broom" label="Clear this scene" data-testid="reset-scene" onClick={() => setConfirmReset(true)} />
        <HearAgain />
      </header>
      <div className="flex min-h-0 flex-1 gap-3 px-3 pb-3 portrait:flex-col landscape:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center">
          <div className="relative w-full max-w-full overflow-hidden rounded-[2rem] border-4 border-white shadow-[0_8px_0_rgba(59,34,87,0.1)] landscape:h-full landscape:w-auto" style={{ touchAction: 'none', aspectRatio: `${SCENE_W} / ${SCENE_H}`, maxHeight: '100%' }}>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
              className="block h-full w-full select-none"
              xmlns="http://www.w3.org/2000/svg"
              data-testid="scene-canvas"
              onPointerDown={onCanvasDown}
              onPointerMove={onCanvasMove}
              onPointerUp={onCanvasUp}
              onPointerCancel={onCanvasUp}
              style={{ touchAction: 'none', cursor: trayPick ? 'copy' : 'default' }}
            >
              <SceneBackground id={sceneId} u={`scene-${sceneId}`} />
              {placements.map((pl) => (
                <PlacedSticker
                  key={pl.id}
                  p={pl}
                  baseScale={baseScale(pl.stickerId)}
                  label={REWARD_BY_ID.get(pl.stickerId)?.name ?? 'Sticker'}
                  selected={pl.id === selected}
                  x={drag?.id === pl.id ? drag.x : pl.x}
                  y={drag?.id === pl.id ? drag.y : pl.y}
                  onDown={onStickerDown}
                />
              ))}
            </svg>
          </div>
        </div>

        <div className="flex min-h-0 shrink-0 flex-col gap-2 landscape:w-[min(34vw,340px)]">
          <div className="min-h-0 flex-1 rounded-[2rem] bg-white/80 p-2">
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar landscape:grid landscape:max-h-full landscape:grid-cols-3 landscape:overflow-y-auto" data-testid="sticker-tray">
              {owned.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  data-testid={`tray-${c.id}`}
                  aria-label={c.name}
                  aria-pressed={trayPick === c.id}
                  onPointerDown={(e) => onTrayDown(e, c.id)}
                  onPointerMove={onTrayMove}
                  onPointerUp={onTrayUp}
                  onPointerCancel={() => ((trayStart.current = null), setGhost(null))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setTrayPick((cur) => (cur === c.id ? null : c.id));
                    }
                  }}
                  style={{ touchAction: 'pan-x' }}
                  className={`h-[88px] w-[88px] shrink-0 rounded-2xl p-1 ${trayPick === c.id ? 'bg-gold-light ring-4 ring-gold' : 'bg-blush'}`}
                >
                  <StickerSvg id={c.id} />
                </button>
              ))}
              {!owned.length && (
                <div className="flex h-[88px] w-full items-center justify-center" data-testid="tray-empty">
                  <Icon name="chest" className="h-16 w-16 opacity-60" />
                </div>
              )}
            </div>
          </div>
          {sel ? (
            <div className="flex flex-wrap justify-center gap-2 rounded-[2rem] bg-white/80 p-2" role="toolbar" aria-label="Selected sticker" data-testid="sticker-toolbar">
              <ToolBtn label="Bigger" icon="bigger" onClick={() => act((d, t) => resizeSticker(d, sceneId, sel.id, 1.2, t))} />
              <ToolBtn label="Smaller" icon="smaller" onClick={() => act((d, t) => resizeSticker(d, sceneId, sel.id, 1 / 1.2, t))} />
              <ToolBtn label="Forward" icon="forward" onClick={() => act((d, t) => restack(d, sceneId, sel.id, 1, t))} />
              <ToolBtn label="Back" icon="backward" onClick={() => act((d, t) => restack(d, sceneId, sel.id, -1, t))} />
              <ToolBtn label="Flip" icon="flip" onClick={() => act((d, t) => flipSticker(d, sceneId, sel.id, t))} />
              <ToolBtn
                label="Remove"
                icon="trash"
                onClick={() => {
                  act((d, t) => removePlacement(d, sceneId, sel.id, t));
                  setSelected(null);
                }}
              />
            </div>
          ) : trayPick ? (
            <div className="flex justify-center gap-3 rounded-[2rem] bg-white/80 p-2">
              <ToolBtn label="Put it in the middle" icon="center" testid="place-center" onClick={() => (place(trayPick, 0.5, 0.5), setTrayPick(null))} />
              <ToolBtn label="Cancel" icon="close" onClick={() => setTrayPick(null)} />
            </div>
          ) : null}
        </div>
      </div>

      {ghost && (
        <div className="pointer-events-none fixed z-50 h-24 w-24 -translate-x-1/2 -translate-y-1/2" style={{ left: ghost.cx, top: ghost.cy }} aria-hidden>
          <StickerSvg id={ghost.stickerId} />
        </div>
      )}

      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center gap-10 bg-ink/50" data-testid="reset-confirm">
          <KidButton
            icon="broom"
            size="lg"
            label="Yes, clear it"
            data-testid="reset-yes"
            color="#fff3c4"
            onClick={() => {
              act((d, t) => resetScene(d, sceneId, t));
              setSelected(null);
              setConfirmReset(false);
            }}
          />
          <KidButton icon="close" size="lg" label="No, keep it" data-testid="reset-no" color="#ffffff" onClick={() => setConfirmReset(false)} />
        </div>
      )}
    </div>
  );
}

function ToolBtn({ label, icon, onClick, testid }: { label: string; icon: IconName; onClick: () => void; testid?: string }) {
  return (
    <KidButton icon={icon} label={label} data-testid={testid ?? `tool-${label.toLowerCase()}`} color="#ffffff" onClick={onClick} />
  );
}


