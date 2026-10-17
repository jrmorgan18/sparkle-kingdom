/** Game pieces: clams, jewels, shells, the treasure chest, and the queen's basket. */
import { useId } from 'react';
import { INK, PearlBall, Sparkle } from './primitives';

const uid = (raw: string) => raw.replace(/[^a-zA-Z0-9]/g, '');

export function Clam({ open, className, tint = '#c69cff' }: { open: boolean; className?: string; tint?: string }) {
  const u = `cl${uid(useId())}`;
  return (
    <svg viewBox="0 -50 220 250" className={className} aria-hidden>
      {open && (
        <g transform="translate(0 -70)">
          <path d="M20 122 Q20 34 110 30 Q200 34 200 122 Q110 112 20 122Z" fill={tint} opacity={0.9} />
          {[50, 80, 110, 140, 170].map((x) => (
            <path key={x} d={`M${x} 118 Q${x + (x - 110) * 0.1} 70 ${110 + (x - 110) * 0.55} 36`} stroke="#fff" strokeWidth={5} opacity={0.4} fill="none" strokeLinecap="round" />
          ))}
        </g>
      )}
      {/* bottom shell */}
      <path d="M20 120 Q110 108 200 120 Q190 190 110 192 Q30 190 20 120Z" fill={tint} />
      {[60, 85, 110, 135, 160].map((x) => (
        <path key={x} d={`M${x} 124 Q${x + (x - 110) * 0.1} 160 ${110 + (x - 110) * 0.5} 186`} stroke="#fff" strokeWidth={4} opacity={0.4} fill="none" />
      ))}
      {open ? (
        <g>
          <PearlBall cx={110} cy={112} r={30} u={u} />
          <Sparkle cx={160} cy={70} r={12} fill="#fff6a8" className="twinkle" />
          <Sparkle cx={58} cy={80} r={9} fill="#fff6a8" className="twinkle" />
        </g>
      ) : (
        <g>
          <path d="M20 122 Q20 34 110 30 Q200 34 200 122 Q110 112 20 122Z" fill={tint} />
          {[50, 80, 110, 140, 170].map((x) => (
            <path key={x} d={`M${x} 118 Q${x + (x - 110) * 0.1} 70 ${110 + (x - 110) * 0.55} 36`} stroke="#fff" strokeWidth={5} opacity={0.45} fill="none" strokeLinecap="round" />
          ))}
        </g>
      )}
    </svg>
  );
}

const JEWEL_COLORS = ['#ff5ca8', '#3a8dff', '#17b3ad', '#b17aff', '#ffc531', '#ff6b6b'];

export function Jewel({ lit, index, className }: { lit: boolean; index: number; className?: string }) {
  const color = JEWEL_COLORS[index % JEWEL_COLORS.length];
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path d="M18 38 L34 16 H66 L82 38 L50 90Z" fill={lit ? color : '#e8def5'} stroke={lit ? '#fff' : '#cbbde3'} strokeWidth={4} strokeLinejoin="round" />
      <path d="M18 38 H82 M34 16 L42 38 L50 90 L58 38 L66 16" stroke={lit ? '#ffffff' : '#d8cbec'} strokeWidth={3} fill="none" opacity={0.8} strokeLinejoin="round" />
      {lit && <Sparkle cx={78} cy={18} r={9} fill="#fff6a8" className="twinkle" />}
    </svg>
  );
}

export function ShellPiece({ className, faded }: { className?: string; faded?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path d="M14 62 Q12 12 50 8 Q88 12 86 62 Q50 76 14 62Z" fill={faded ? '#f1e6f7' : '#ff9fc8'} />
      {!faded &&
        [-24, -12, 0, 12, 24].map((x) => <path key={x} d={`M${50 + x * 0.3} 68 L${50 + x} 18`} stroke="#ffe3f0" strokeWidth={5} strokeLinecap="round" />)}
      <path d="M38 68 h24 v12 h-24Z" fill={faded ? '#e6d9ef' : '#ff7fb5'} />
    </svg>
  );
}

export function Basket({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 180" className={className} aria-hidden preserveAspectRatio="none">
      <path d="M30 40 Q150 -20 270 40" stroke="#c98a4b" strokeWidth={12} fill="none" strokeLinecap="round" />
      <path d="M14 50 H286 L256 174 H44Z" fill="#e8b57a" />
      {[0, 1, 2].map((r) => (
        <path key={r} d={`M${20 + r * 8} ${80 + r * 34} H${280 - r * 8}`} stroke="#c98a4b" strokeWidth={6} />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M${40 + i * 28} 52 L${54 + i * 24} 172`} stroke="#d49a5c" strokeWidth={5} />
      ))}
      <rect x={10} y={42} width={280} height={16} rx={8} fill="#d49a5c" />
    </svg>
  );
}

export function TreasureChest({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden>
      {open && (
        <g>
          <path d="M120 96 L60 0 M120 96 L120 -10 M120 96 L180 0 M120 96 L20 40 M120 96 L220 40" stroke="#fff3a8" strokeWidth={10} opacity={0.75} strokeLinecap="round" />
          <ellipse cx={120} cy={100} rx={80} ry={18} fill="#fff6c2" />
        </g>
      )}
      <rect x={30} y={100} width={180} height={90} rx={12} fill="#b0612e" />
      <rect x={30} y={100} width={180} height={14} fill="#ffc531" />
      <rect x={110} y={100} width={20} height={90} fill="#ffc531" />
      {open ? (
        <path d="M30 100 L46 34 Q120 10 194 34 L210 100Z" fill="#c9733b" transform="translate(0 -18) skewX(-4)" />
      ) : (
        <g>
          <path d="M30 104 Q30 50 120 48 Q210 50 210 104Z" fill="#c9733b" />
          <rect x={110} y={48} width={20} height={56} fill="#ffc531" />
        </g>
      )}
      <rect x={104} y={104} width={32} height={34} rx={7} fill="#ffe066" />
      <circle cx={120} cy={120} r={5} fill={INK} />
    </svg>
  );
}
