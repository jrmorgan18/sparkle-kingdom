/** Small reusable SVG shapes. Flat fills; a sticker filter adds the outline where needed. */
import type { ReactNode } from 'react';
import type { Pattern } from '../data/rewards';

export const INK = '#3b2257';

export function starPoints(cx: number, cy: number, r: number, inner = 0.45, points = 5, rotate = 0): string {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = (Math.PI / points) * i - Math.PI / 2 + (rotate * Math.PI) / 180;
    const rr = i % 2 === 0 ? r : r * inner;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

export function Star({ cx, cy, r, fill = '#ffd23f', rotate = 0, className }: { cx: number; cy: number; r: number; fill?: string; rotate?: number; className?: string }) {
  return <polygon points={starPoints(cx, cy, r, 0.45, 5, rotate)} fill={fill} strokeLinejoin="round" className={className} />;
}

export function Sparkle({ cx, cy, r = 8, fill = '#fffbe0', className }: { cx: number; cy: number; r?: number; fill?: string; className?: string }) {
  return (
    <path
      className={className}
      d={`M${cx} ${cy - r} Q${cx + r * 0.18} ${cy - r * 0.18} ${cx + r} ${cy} Q${cx + r * 0.18} ${cy + r * 0.18} ${cx} ${cy + r} Q${cx - r * 0.18} ${cy + r * 0.18} ${cx - r} ${cy} Q${cx - r * 0.18} ${cy - r * 0.18} ${cx} ${cy - r}Z`}
      fill={fill}
    />
  );
}

export function heartPath(cx: number, cy: number, s = 1): string {
  const p = (x: number, y: number) => `${(cx + x * s).toFixed(1)} ${(cy + y * s).toFixed(1)}`;
  return `M${p(0, 8)} C${p(-14, -2)} ${p(-10, -14)} ${p(-3, -12)} C${p(-1, -11.5)} ${p(0, -10)} ${p(0, -9)} C${p(0, -10)} ${p(1, -11.5)} ${p(3, -12)} C${p(10, -14)} ${p(14, -2)} ${p(0, 8)}Z`;
}

export function Heart({ cx, cy, s = 1, fill = '#ff5c8a' }: { cx: number; cy: number; s?: number; fill?: string }) {
  return <path d={heartPath(cx, cy, s)} fill={fill} />;
}

/** A shiny round pearl. `u` must be unique per SVG for the gradient id. */
export function PearlBall({ cx, cy, r, u, tint = '#f3e8ff' }: { cx: number; cy: number; r: number; u: string; tint?: string }) {
  return (
    <g>
      <defs>
        <radialGradient id={`${u}pg`} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor={tint} />
          <stop offset="1" stopColor="#c9b6e8" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${u}pg)`} />
      <ellipse cx={cx - r * 0.32} cy={cy - r * 0.35} rx={r * 0.28} ry={r * 0.18} fill="#fff" opacity={0.9} />
    </g>
  );
}

/** Repeating fill patterns for dresses and tails. Returns <pattern> defs; use fill={`url(#${id})`}. */
export function PatternDef({ id, pattern, color }: { id: string; pattern: Pattern; color: string }): ReactNode {
  switch (pattern) {
    case 'dots':
      return (
        <pattern id={id} width={22} height={22} patternUnits="userSpaceOnUse">
          <circle cx={6} cy={6} r={3.2} fill={color} />
          <circle cx={17} cy={17} r={3.2} fill={color} />
        </pattern>
      );
    case 'stars':
      return (
        <pattern id={id} width={34} height={34} patternUnits="userSpaceOnUse">
          <polygon points={starPoints(9, 9, 6)} fill={color} />
          <polygon points={starPoints(26, 25, 4.5)} fill={color} />
        </pattern>
      );
    case 'hearts':
      return (
        <pattern id={id} width={30} height={30} patternUnits="userSpaceOnUse">
          <path d={heartPath(9, 10, 0.5)} fill={color} />
          <path d={heartPath(23, 24, 0.45)} fill={color} />
        </pattern>
      );
    case 'stripes':
      return (
        <pattern id={id} width={20} height={20} patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width={8} height={20} fill={color} />
        </pattern>
      );
    case 'scales':
      return (
        <pattern id={id} width={24} height={16} patternUnits="userSpaceOnUse">
          <path d="M0 16 A12 12 0 0 1 24 16" fill="none" stroke={color} strokeWidth={2.4} />
          <path d="M-12 8 A12 12 0 0 1 12 8 M12 8 A12 12 0 0 1 36 8" fill="none" stroke={color} strokeWidth={2.4} />
        </pattern>
      );
    case 'waves':
      return (
        <pattern id={id} width={40} height={18} patternUnits="userSpaceOnUse">
          <path d="M0 10 Q10 2 20 10 T40 10" fill="none" stroke={color} strokeWidth={3} />
        </pattern>
      );
    default:
      return null;
  }
}
