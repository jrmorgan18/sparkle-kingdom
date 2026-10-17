/** Picture icons for child-facing controls (no reading needed). */
import type { ReactNode } from 'react';
import { heartPath, INK, Sparkle, starPoints } from './primitives';

type IconName =
  | 'play'
  | 'dress'
  | 'castle'
  | 'ear'
  | 'home'
  | 'check'
  | 'chest'
  | 'camera'
  | 'broom'
  | 'bigger'
  | 'smaller'
  | 'forward'
  | 'backward'
  | 'flip'
  | 'trash'
  | 'heart'
  | 'lock'
  | 'mirror'
  | 'back'
  | 'undo'
  | 'center'
  | 'close';

const ICONS: Record<IconName, ReactNode> = {
  play: (
    <g>
      <circle cx={50} cy={50} r={44} fill="#ff5ca8" />
      <path d="M40 28 L74 50 L40 72Z" fill="#fff" strokeLinejoin="round" stroke="#fff" strokeWidth={6} />
      <Sparkle cx={82} cy={16} r={10} fill="#ffe066" />
    </g>
  ),
  dress: (
    <g>
      <path d="M50 10 q-6 0 -6 6 q0 6 6 6 q6 0 6 -6" stroke="#9a7bbf" strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M50 22 L20 34 H80Z" stroke="#9a7bbf" strokeWidth={4} fill="none" strokeLinejoin="round" />
      <path d="M38 34 H62 L60 52 L80 90 H20 L40 52Z" fill="#ff8cc6" />
      <path d="M40 52 H60" stroke="#ffd23f" strokeWidth={5} />
      <path d={heartPath(50, 70, 0.7)} fill="#fff" />
    </g>
  ),
  castle: (
    <g>
      <rect x={20} y={46} width={60} height={44} fill="#c9a6ff" />
      {[14, 42, 70].map((x, i) => (
        <g key={x}>
          <rect x={x} y={i === 1 ? 28 : 38} width={16} height={i === 1 ? 62 : 52} fill="#b48cff" />
          <path d={`M${x - 3} ${i === 1 ? 30 : 40} L${x + 8} ${i === 1 ? 8 : 20} L${x + 19} ${i === 1 ? 30 : 40}Z`} fill="#ff5ca8" />
        </g>
      ))}
      <path d="M42 90 V72 Q50 62 58 72 V90Z" fill="#7b4bd6" />
      <Sparkle cx={86} cy={14} r={8} fill="#ffe066" />
    </g>
  ),
  ear: (
    <g>
      <path d="M22 62 Q18 20 50 14 Q82 20 78 62 Q50 74 22 62Z" fill="#ffc2dd" />
      {[-18, -9, 0, 9, 18].map((x) => (
        <path key={x} d={`M${50 + x * 0.3} 66 L${50 + x} 22`} stroke="#fff" strokeWidth={4} strokeLinecap="round" />
      ))}
      <path d="M40 66 h20 v10 h-20Z" fill="#ff8cc6" />
      <path d="M84 36 q8 14 0 28 M92 30 q12 20 0 40" stroke="#7b4bd6" strokeWidth={5} fill="none" strokeLinecap="round" />
    </g>
  ),
  home: (
    <g>
      <path d="M14 50 L50 18 L86 50" stroke="#7b4bd6" strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 46 V86 H76 V46 L50 24Z" fill="#ffc2dd" />
      <path d="M42 86 V64 H58 V86Z" fill="#7b4bd6" />
    </g>
  ),
  check: (
    <g>
      <circle cx={50} cy={50} r={44} fill="#1d9a5c" />
      <path d="M28 52 L44 68 L74 34" stroke="#fff" strokeWidth={11} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  chest: (
    <g>
      <path d="M14 46 Q14 22 50 22 Q86 22 86 46Z" fill="#c9733b" />
      <rect x={14} y={44} width={72} height={40} rx={5} fill="#b0612e" />
      <rect x={44} y={22} width={12} height={62} fill="#ffc531" />
      <rect x={42} y={46} width={16} height={16} rx={3} fill="#ffe066" />
      <Sparkle cx={84} cy={16} r={9} fill="#ffe066" />
    </g>
  ),
  camera: (
    <g>
      <rect x={10} y={30} width={80} height={56} rx={12} fill="#7b4bd6" />
      <rect x={34} y={20} width={32} height={16} rx={5} fill="#7b4bd6" />
      <circle cx={50} cy={58} r={18} fill="#fff" />
      <circle cx={50} cy={58} r={10} fill="#bfe9ff" />
    </g>
  ),
  broom: (
    <g>
      <path d="M70 10 L46 56" stroke="#c98a4b" strokeWidth={8} strokeLinecap="round" />
      <path d="M36 50 L62 62 L52 92 Q30 92 18 80Z" fill="#ffd23f" />
      <path d="M30 66 L24 84 M40 70 L34 90 M50 72 L46 92" stroke="#e8a800" strokeWidth={3} />
    </g>
  ),
  bigger: (
    <g>
      <circle cx={50} cy={50} r={40} fill="#17b3ad" />
      <path d="M50 30 V70 M30 50 H70" stroke="#fff" strokeWidth={10} strokeLinecap="round" />
    </g>
  ),
  smaller: (
    <g>
      <circle cx={50} cy={50} r={40} fill="#17b3ad" />
      <path d="M30 50 H70" stroke="#fff" strokeWidth={10} strokeLinecap="round" />
    </g>
  ),
  forward: (
    <g>
      <rect x={30} y={14} width={50} height={50} rx={10} fill="#ff8cc6" />
      <rect x={18} y={36} width={50} height={50} rx={10} fill="#e6d9ef" />
      <path d="M55 26 V52 M44 37 L55 26 L66 37" stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  backward: (
    <g>
      <rect x={30} y={14} width={50} height={50} rx={10} fill="#e6d9ef" />
      <rect x={18} y={36} width={50} height={50} rx={10} fill="#ff8cc6" />
      <path d="M43 50 V76 M32 65 L43 76 L54 65" stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  flip: (
    <g>
      <path d="M46 20 L14 80 H46Z" fill="#b48cff" />
      <path d="M54 20 L86 80 H54Z" fill="#e6d9ef" />
      <path d="M50 10 V90" stroke={INK} strokeWidth={4} strokeDasharray="6 6" />
    </g>
  ),
  trash: (
    <g>
      <rect x={24} y={30} width={52} height={60} rx={8} fill="#ff8c8c" />
      <rect x={16} y={20} width={68} height={12} rx={6} fill="#ff6b6b" />
      <rect x={40} y={10} width={20} height={12} rx={4} fill="#ff6b6b" />
      <path d="M40 44 V78 M60 44 V78" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
    </g>
  ),
  heart: <path d={heartPath(50, 54, 3.4)} fill="#ff5ca8" />,
  lock: (
    <g>
      <path d="M32 44 V32 Q32 14 50 14 Q68 14 68 32 V44" stroke="#9a8bb0" strokeWidth={9} fill="none" />
      <rect x={22} y={42} width={56} height={44} rx={10} fill="#b8aacb" />
      <circle cx={50} cy={62} r={7} fill="#fff" />
    </g>
  ),
  mirror: (
    <g>
      <ellipse cx={50} cy={44} rx={30} ry={36} fill="#ffc531" />
      <ellipse cx={50} cy={44} rx={22} ry={28} fill="#bfe9ff" />
      <rect x={45} y={78} width={10} height={18} rx={4} fill="#ffc531" />
      <path d="M38 30 L48 22 M40 42 L58 26" stroke="#fff" strokeWidth={5} strokeLinecap="round" />
    </g>
  ),
  back: (
    <g>
      <circle cx={50} cy={50} r={42} fill="#fff" />
      <path d="M58 26 L34 50 L58 74" stroke="#7b4bd6" strokeWidth={11} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  undo: (
    <g>
      <path d="M30 40 H62 Q82 40 82 60 Q82 80 62 80 H40" stroke="#7b4bd6" strokeWidth={9} fill="none" strokeLinecap="round" />
      <path d="M40 24 L24 40 L40 56" stroke="#7b4bd6" strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  center: (
    <g>
      <circle cx={50} cy={50} r={40} fill="#ffe066" />
      <polygon points={starPoints(50, 50, 22)} fill="#ff8cc6" />
    </g>
  ),
  close: (
    <g>
      <circle cx={50} cy={50} r={40} fill="#e6d9ef" />
      <path d="M34 34 L66 66 M66 34 L34 66" stroke="#7b4bd6" strokeWidth={9} strokeLinecap="round" />
    </g>
  ),
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      {ICONS[name]}
    </svg>
  );
}

export type { IconName };
