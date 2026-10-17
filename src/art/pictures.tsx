/** Pictures for sight-word example sentences (200 × 200). Many reuse sticker art. */
import { useId, type ReactNode } from 'react';
import type { PictureId } from '../data/pictures';
import { Character } from './characters';
import { INK, starPoints } from './primitives';
import { StickerArtRaw } from './stickers';

const star = (cx: number, cy: number, r: number) => <polygon points={starPoints(cx, cy, r)} fill="#ffd23f" stroke="#f0a800" strokeWidth={3} strokeLinejoin="round" />;

const ART: Partial<Record<PictureId, (u: string) => ReactNode>> = {
  fish: (u) => <StickerArtRaw id="st-stripe-fish" u={u} />,
  shell: (u) => <StickerArtRaw id="st-pink-shell" u={u} />,
  crown: (u) => <StickerArtRaw id="st-crown" u={u} />,
  cake: (u) => <StickerArtRaw id="st-cake" u={u} />,
  crab: (u) => <StickerArtRaw id="st-crab" u={u} />,
  castle: (u) => <StickerArtRaw id="st-pink-castle" u={u} />,
  unicorn: (u) => <StickerArtRaw id="st-unicorn" u={u} />,
  rainbow: (u) => <StickerArtRaw id="st-rainbow" u={u} />,
  star: () => star(100, 104, 74),
  'stars-1': () => star(100, 104, 50),
  'stars-2': () => (
    <g>
      {star(56, 104, 40)}
      {star(144, 104, 40)}
    </g>
  ),
  'stars-3': () => (
    <g>
      {star(42, 112, 32)}
      {star(100, 82, 32)}
      {star(158, 112, 32)}
    </g>
  ),
  'big-fish': (u) => <StickerArtRaw id="st-stripe-fish" u={u} />,
  'little-fish': (u) => (
    <g transform="translate(60 60) scale(0.4)">
      <StickerArtRaw id="st-stripe-fish" u={u} />
    </g>
  ),
  boat: () => (
    <g>
      <path d="M100 30 V130" stroke="#a0603c" strokeWidth={8} />
      <path d="M104 36 L160 116 H104Z" fill="#fff" stroke="#dcd3f0" strokeWidth={3} />
      <path d="M96 50 L52 116 H96Z" fill="#ff8cc6" />
      <path d="M30 130 H170 L150 166 H50Z" fill="#ff6f6f" />
      <path d="M10 176 q20 -12 40 0 t40 0 t40 0 t40 0 t40 0" stroke="#5fb8ff" strokeWidth={8} fill="none" strokeLinecap="round" />
    </g>
  ),
  frog: () => (
    <g>
      <path d="M50 150 Q30 170 20 160 M150 150 Q170 170 180 160" stroke="#5cc98b" strokeWidth={14} strokeLinecap="round" fill="none" />
      <ellipse cx={100} cy={120} rx={56} ry={44} fill="#69db7c" />
      <circle cx={76} cy={78} r={20} fill="#69db7c" />
      <circle cx={124} cy={78} r={20} fill="#69db7c" />
      {[76, 124].map((x) => (
        <g key={x}>
          <circle cx={x} cy={78} r={10} fill="#fff" />
          <circle cx={x + 2} cy={80} r={6} fill={INK} />
        </g>
      ))}
      <path d="M78 128 Q100 146 122 128" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M40 40 q8 -12 16 0 M150 34 q8 -12 16 0" stroke="#8fd8ff" strokeWidth={4} fill="none" strokeLinecap="round" />
    </g>
  ),
  bed: () => (
    <g>
      <rect x={24} y={60} width={16} height={110} rx={6} fill="#b48cff" />
      <rect x={160} y={96} width={16} height={74} rx={6} fill="#b48cff" />
      <rect x={30} y={110} width={140} height={40} rx={10} fill="#ffd1ea" />
      <rect x={40} y={92} width={44} height={24} rx={10} fill="#fff" />
      <path d="M84 110 Q130 96 170 110 V136 H84Z" fill="#ff8cc6" />
      <path d="M140 40 a14 14 0 1 0 14 22 a11 11 0 1 1 -14 -22Z" fill="#ffd23f" />
    </g>
  ),
  box: () => (
    <g>
      <path d="M30 80 L100 56 L170 80 L100 104Z" fill="#ffd8a8" />
      <path d="M30 80 V156 L100 182 V104Z" fill="#e8a46a" />
      <path d="M170 80 V156 L100 182 V104Z" fill="#d48d52" />
      <path d="M100 56 V104" stroke="#c97a3e" strokeWidth={4} />
      <path d="M86 66 Q100 30 116 66" fill="#ff5ca8" />
    </g>
  ),
  balloon: (u) => (
    <g>
      <path d="M100 30 V10" stroke="#5fb8ff" strokeWidth={6} strokeLinecap="round" />
      <path d="M90 20 L100 6 L110 20" stroke="#5fb8ff" strokeWidth={6} fill="none" strokeLinecap="round" />
      <g transform="translate(20 30) scale(0.8)">
        <StickerArtRaw id="st-balloons" u={u} />
      </g>
    </g>
  ),
  dog: () => (
    <g>
      <path d="M40 120 L24 112 M40 130 L20 134" stroke="#c9a6ff" strokeWidth={4} strokeLinecap="round" opacity={0.6} />
      <ellipse cx={100} cy={124} rx={50} ry={30} fill="#e8b57a" />
      <path d="M62 140 L50 170 M86 148 L84 176 M120 148 L130 174 M140 138 L156 164" stroke="#e8b57a" strokeWidth={12} strokeLinecap="round" />
      <path d="M150 112 Q156 80 140 70" stroke="#e8b57a" strokeWidth={10} strokeLinecap="round" fill="none" />
      <circle cx={60} cy={92} r={30} fill="#f0c48a" />
      <ellipse cx={42} cy={80} rx={10} ry={20} fill="#a8703c" transform="rotate(20 42 80)" />
      <circle cx={54} cy={88} r={5} fill={INK} />
      <circle cx={36} cy={100} r={5} fill={INK} />
      <path d="M44 108 q8 6 16 0" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
    </g>
  ),
  'red-ball': () => (
    <g>
      <circle cx={100} cy={104} r={70} fill="#ff4d4d" />
      <path d="M38 80 Q100 120 162 80" stroke="#fff" strokeWidth={10} fill="none" />
      <ellipse cx={74} cy={64} rx={16} ry={10} fill="#fff" opacity={0.5} transform="rotate(-30 74 64)" />
    </g>
  ),
  'blue-bird': () => (
    <g>
      <path d="M150 90 L186 76 L170 106Z" fill="#3a8dff" />
      <ellipse cx={104} cy={108} rx={56} ry={44} fill="#5fa8ff" />
      <circle cx={64} cy={80} r={30} fill="#5fa8ff" />
      <path d="M36 78 L16 86 L36 92Z" fill="#ffc531" />
      <circle cx={56} cy={74} r={6} fill={INK} />
      <path d="M90 100 Q120 80 150 108 Q120 130 90 100Z" fill="#3a8dff" />
      <path d="M90 150 V172 M110 150 V172" stroke="#ff9a4d" strokeWidth={5} strokeLinecap="round" />
    </g>
  ),
  sun: () => (
    <g>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <path key={i} d={`M${100 + 56 * Math.cos(a)} ${100 + 56 * Math.sin(a)} L${100 + 84 * Math.cos(a)} ${100 + 84 * Math.sin(a)}`} stroke="#ffc531" strokeWidth={10} strokeLinecap="round" />;
      })}
      <circle cx={100} cy={100} r={48} fill="#ffe066" />
      <circle cx={84} cy={94} r={5} fill={INK} />
      <circle cx={116} cy={94} r={5} fill={INK} />
      <path d="M84 112 Q100 126 116 112" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
    </g>
  ),
  heart: () => <path d="M100 170 C20 120 30 40 80 46 C90 48 98 56 100 66 C102 56 110 48 120 46 C170 40 180 120 100 170Z" fill="#ff5c8a" />,
  wave: () => (
    <g>
      <path d="M10 120 Q50 60 90 110 Q120 60 150 100 Q170 70 190 90 V190 H10Z" fill="#5fb8ff" />
      <path d="M10 150 Q50 120 90 150 T190 140 V190 H10Z" fill="#3a8dff" />
      <circle cx={150} cy={40} r={22} fill="#ffe066" />
    </g>
  ),
};

export function PictureArt({ id, className }: { id: PictureId; className?: string }) {
  const raw = useId();
  const u = `p${raw.replace(/[^a-zA-Z0-9]/g, '')}`;
  if (id === 'mermaid' || id === 'friends') {
    return (
      <svg viewBox={id === 'friends' ? '0 0 600 460' : '0 0 300 460'} className={className} aria-hidden>
        {id === 'friends' ? (
          <>
            <svg x={0} width={300} height={460} viewBox="0 0 300 460">
              <Character id="pearl" />
            </svg>
            <svg x={280} width={300} height={460} viewBox="0 0 300 460">
              <Character id="rosie" />
            </svg>
          </>
        ) : (
          <Character id="pearl" />
        )}
      </svg>
    );
  }
  const art = ART[id];
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      {art?.(u)}
    </svg>
  );
}
