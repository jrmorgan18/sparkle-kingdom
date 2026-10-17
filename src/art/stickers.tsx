/**
 * Original sticker artwork, each drawn in a 200 × 200 box (content inside ~14px margins so the white
 * die-cut border fits). `u` is a unique prefix for gradient ids so many copies can share one SVG.
 * The die-cut filter is the same technique as Word Quest's stickers.
 */
import { useId, type ReactNode } from 'react';
import { heartPath, INK, PearlBall, Sparkle, starPoints } from './primitives';

type Art = (u: string) => ReactNode;

const eyes = (x1: number, x2: number, y: number, r = 6) => (
  <g>
    {[x1, x2].map((x) => (
      <g key={x}>
        <circle cx={x} cy={y} r={r} fill={INK} />
        <circle cx={x + r * 0.35} cy={y - r * 0.35} r={r * 0.38} fill="#fff" />
      </g>
    ))}
  </g>
);
const smile = (cx: number, cy: number, w = 12) => <path d={`M${cx - w / 2} ${cy} Q${cx} ${cy + w * 0.6} ${cx + w / 2} ${cy}`} stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />;
const cheeks = (x1: number, x2: number, y: number) => (
  <g fill="#ff8fb3" opacity={0.55}>
    <ellipse cx={x1} cy={y} rx={7} ry={4.5} />
    <ellipse cx={x2} cy={y} rx={7} ry={4.5} />
  </g>
);

function scallop(fill: string, ridge: string, cx = 100, cy = 110, s = 1): ReactNode {
  const t = (x: number, y: number) => `${cx + x * s} ${cy + y * s}`;
  return (
    <g>
      <path d={`M${t(-70, 20)} Q${t(-74, -60)} ${t(0, -72)} Q${t(74, -60)} ${t(70, 20)} Q${t(0, 44)} ${t(-70, 20)}Z`} fill={fill} />
      {[-52, -26, 0, 26, 52].map((x) => (
        <path key={x} d={`M${t(x * 0.35, 34)} L${t(x, -50 + Math.abs(x) * 0.5)}`} stroke={ridge} strokeWidth={6 * s} strokeLinecap="round" />
      ))}
      <path d={`M${t(-24, 34)} h${48 * s} v${18 * s} h${-48 * s}Z`} fill={ridge} />
    </g>
  );
}

function castle(main: string, roof: string, flag: string): ReactNode {
  return (
    <g>
      <rect x={40} y={90} width={120} height={90} rx={6} fill={main} />
      {[28, 86, 144].map((x, i) => (
        <g key={x}>
          <rect x={x} y={i === 1 ? 58 : 76} width={28} height={i === 1 ? 122 : 104} rx={4} fill={main} />
          <path d={`M${x - 6} ${i === 1 ? 60 : 78} L${x + 14} ${i === 1 ? 14 : 34} L${x + 34} ${i === 1 ? 60 : 78}Z`} fill={roof} />
          <rect x={x + 9} y={i === 1 ? 80 : 96} width={10} height={14} rx={5} fill="#7b4bd6" opacity={0.6} />
        </g>
      ))}
      <path d="M100 14 V2 L116 7 L100 12" fill={flag} stroke={flag} strokeWidth={2} />
      <path d="M84 180 V144 Q100 124 116 144 V180Z" fill="#a0603c" />
      <circle cx={110} cy={162} r={2.5} fill="#ffd23f" />
      <Sparkle cx={60} cy={120} r={6} />
      <Sparkle cx={140} cy={128} r={5} />
    </g>
  );
}

function fishBody(u: string, body: string, fin: string, stripe?: string): ReactNode {
  return (
    <g>
      <path d="M150 100 L186 70 Q178 100 186 130Z" fill={fin} />
      <ellipse cx={96} cy={100} rx={66} ry={46} fill={body} />
      {stripe && (
        <g>
          <defs>
            <clipPath id={`${u}fc`}>
              <ellipse cx={96} cy={100} rx={66} ry={46} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${u}fc)`} fill={stripe}>
            <rect x={70} y={40} width={16} height={130} rx={6} />
            <rect x={116} y={40} width={14} height={130} rx={6} />
          </g>
        </g>
      )}
      <path d="M90 58 Q104 36 124 60Z" fill={fin} />
      <path d="M96 140 Q110 158 124 138Z" fill={fin} />
      {eyes(58, 58, 92, 8)}
      {smile(52, 116, 14)}
    </g>
  );
}


const RAINBOW = ['#ff6b6b', '#ffa94d', '#ffd23f', '#69db7c', '#5fb8ff', '#b48cff'];

/** A cute unicorn head (facing right) with a golden horn and rainbow mane. Head center ≈ (cx, cy). */
function unicornHead(cx: number, cy: number, s = 1): ReactNode {
  const t = (x: number, y: number) => `${cx + x * s} ${cy + y * s}`;
  return (
    <g>
      {/* rainbow mane behind the head */}
      {RAINBOW.map((c, i) => (
        <circle key={c} cx={cx - (14 + i * 4) * s} cy={cy + (-26 + i * 12) * s} r={13 * s} fill={c} />
      ))}
      <path d={`M${t(-8, -28)} L${t(-2, -48)} L${t(6, -28)}Z`} fill="#fff0fb" />
      <path d={`M${t(-3, -30)} L${t(-1, -42)} L${t(3, -30)}Z`} fill="#ffc2dd" />
      <ellipse cx={cx} cy={cy} rx={30 * s} ry={27 * s} fill="#fffaff" />
      <ellipse cx={cx + 22 * s} cy={cy + 12 * s} rx={17 * s} ry={14 * s} fill="#ffe3f2" />
      <circle cx={cx + 27 * s} cy={cy + 10 * s} r={2.2 * s} fill="#e88ab5" />
      {/* horn */}
      <path d={`M${t(4, -24)} L${t(14, -66)} L${t(20, -22)}Z`} fill="#ffd23f" />
      {[0, 1, 2].map((k) => (
        <path key={k} d={`M${t(6 + k * 2.4, -30 - k * 11)} L${t(18 - k * 1.6, -34 - k * 10)}`} stroke="#e8a800" strokeWidth={2.5 * s} strokeLinecap="round" />
      ))}
      {/* happy closed eye + lashes */}
      <path d={`M${t(0, -2)} Q${t(7, 5)} ${t(14, -2)}`} stroke={INK} strokeWidth={3 * s} fill="none" strokeLinecap="round" />
      <path d={`M${t(2, 1)} l${-3 * s} ${4 * s} M${t(7, 3)} l0 ${5 * s} M${t(12, 1)} l${3 * s} ${4 * s}`} stroke={INK} strokeWidth={2 * s} strokeLinecap="round" />
      <ellipse cx={cx + 8 * s} cy={cy + 14 * s} rx={7 * s} ry={4.5 * s} fill="#ff9fc8" opacity={0.6} />
      <path d={`M${t(26, 20)} q${-5 * s} ${4 * s} ${-10 * s} ${1 * s}`} stroke={INK} strokeWidth={2.5 * s} fill="none" strokeLinecap="round" />
    </g>
  );
}

export const STICKER_ART: Record<string, Art> = {
  'st-unicorn': () => (
    <g>
      {/* rainbow tail */}
      {RAINBOW.map((c, i) => (
        <path key={c} d={`M44 ${104 + i * 3} Q${14 - i * 2} ${118 + i * 6} ${30 - i} ${160 + i * 3}`} stroke={c} strokeWidth={7} fill="none" strokeLinecap="round" />
      ))}
      {[56, 76, 104, 124].map((x, i) => (
        <g key={x}>
          <rect x={x} y={126} width={14} height={50} rx={7} fill={i % 2 ? '#fff4fb' : '#fffaff'} />
          <rect x={x} y={166} width={14} height={11} rx={4} fill="#ff9fc8" />
        </g>
      ))}
      <ellipse cx={92} cy={120} rx={52} ry={30} fill="#fffaff" />
      <path d="M120 112 Q132 82 138 70 L160 84 Q150 108 140 124Z" fill="#fffaff" />
      {unicornHead(148, 70, 0.85)}
      <Sparkle cx={34} cy={40} r={9} fill="#ffd23f" />
      <Sparkle cx={70} cy={66} r={6} fill="#ff9fc8" />
    </g>
  ),
  'st-baby-unicorn': () => (
    <g>
      {unicornHead(96, 116, 1.45)}
      <Sparkle cx={170} cy={40} r={10} fill="#ffd23f" />
      <Sparkle cx={34} cy={170} r={7} fill="#b48cff" />
    </g>
  ),
  'st-sea-unicorn': () => (
    <g>
      <path d="M96 130 Q70 150 80 172 Q96 186 120 176" stroke="#ffc2e6" strokeWidth={30} fill="none" strokeLinecap="round" />
      <path d="M118 176 Q140 160 160 172 Q146 180 150 196 Q134 186 118 176Z" fill="#b48cff" />
      <path d="M120 176 L150 170 M120 176 L146 188" stroke="#d9c2ff" strokeWidth={3} />
      <ellipse cx={100} cy={118} rx={34} ry={30} fill="#fffaff" />
      {[0, 1, 2].map((k) => (
        <path key={k} d={`M${84 + k * 6} ${132 + k * 14} q12 -6 22 2`} stroke="#d9c2ff" strokeWidth={4} fill="none" strokeLinecap="round" />
      ))}
      {unicornHead(112, 76, 0.95)}
      <circle cx={160} cy={130} r={7} fill="none" stroke="#8fd8ff" strokeWidth={3} />
      <circle cx={170} cy={110} r={4} fill="none" stroke="#8fd8ff" strokeWidth={3} />
    </g>
  ),
  'st-rainbow-cloud': () => (
    <g>
      {RAINBOW.map((c, i) => (
        <rect key={c} x={56 + i * 15} y={96} width={15} height={84 - Math.abs(i - 2.5) * 10} rx={7} fill={c} />
      ))}
      <g fill="#ffffff">
        <circle cx={60} cy={92} r={30} />
        <circle cx={100} cy={70} r={40} />
        <circle cx={142} cy={92} r={30} />
        <rect x={50} y={88} width={104} height={32} rx={16} />
      </g>
      <path d="M84 84 q6 6 12 0 M108 84 q6 6 12 0" stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />
      <path d="M94 100 Q102 108 110 100" stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />
      {cheeks(78, 126, 98)}
    </g>
  ),
  'st-rainbow-heart': (u) => (
    <g>
      <defs>
        <clipPath id={`${u}rh`}>
          <path d="M100 172 C24 124 30 44 78 46 C90 47 98 56 100 66 C102 56 110 47 122 46 C170 44 176 124 100 172Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${u}rh)`}>
        {RAINBOW.map((c, i) => (
          <rect key={c} x={20} y={40 + i * 23} width={160} height={24} fill={c} />
        ))}
      </g>
      <ellipse cx={70} cy={74} rx={12} ry={8} fill="#fff" opacity={0.6} transform="rotate(-30 70 74)" />
    </g>
  ),
  'st-pink-shell': () => scallop('#ff9fc8', '#ffd1e6'),
  'st-conch': () => (
    <g>
      <path d="M40 150 Q30 80 90 40 Q150 10 170 70 Q182 120 130 156 Q90 182 40 150Z" fill="#ffc9a8" />
      <path d="M60 140 Q60 90 104 70 Q140 60 146 92 Q148 122 116 132 Q92 138 90 116 Q90 98 110 98" fill="none" stroke="#ff9466" strokeWidth={9} strokeLinecap="round" />
      <path d="M40 150 Q70 176 110 168 L84 186 Q50 182 40 150Z" fill="#ffe3d1" />
      <Sparkle cx={160} cy={40} r={9} />
    </g>
  ),
  'st-pearl': (u) => (
    <g>
      <PearlBall cx={100} cy={104} r={70} u={u} />
      <Sparkle cx={160} cy={40} r={12} fill="#ffe8f6" />
      <Sparkle cx={40} cy={160} r={8} fill="#ffe8f6" />
    </g>
  ),
  'st-clam-pearl': (u) => (
    <g>
      <path d="M24 110 Q24 30 100 26 Q176 30 176 110Z" fill="#c69cff" />
      {[50, 75, 100, 125, 150].map((x) => (
        <path key={x} d={`M${x} 106 Q${x + (x - 100) * 0.1} 60 ${100 + (x - 100) * 0.6} 34`} stroke="#e2cdff" strokeWidth={5} fill="none" />
      ))}
      <path d="M22 112 Q100 100 178 112 Q170 176 100 178 Q30 176 22 112Z" fill="#a77bff" />
      <PearlBall cx={100} cy={118} r={28} u={u} />
      {eyes(70, 130, 152, 5)}
      {smile(100, 160, 14)}
    </g>
  ),
  'st-starfish': () => (
    <g>
      <polygon points={starPoints(100, 106, 84, 0.48, 5)} fill="#ff9a4d" strokeLinejoin="round" />
      {[[100, 46], [154, 92], [132, 158], [68, 158], [46, 92]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r={4} fill="#ffd4a8" />
      ))}
      {eyes(86, 114, 102, 6)}
      {smile(100, 118, 14)}
      {cheeks(76, 124, 118)}
    </g>
  ),
  'st-purple-starfish': () => (
    <g>
      <polygon points={starPoints(100, 106, 84, 0.5, 5, 18)} fill="#b17aff" strokeLinejoin="round" />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i * 72 + 18 - 90) * (Math.PI / 180);
        return <circle key={i} cx={100 + 48 * Math.cos(a)} cy={106 + 48 * Math.sin(a)} r={5} fill="#e5d1ff" />;
      })}
      <circle cx={100} cy={106} r={10} fill="#e5d1ff" />
    </g>
  ),
  'st-coral-castle': () => castle('#ffb3c7', '#ff6fa3', '#ffd23f'),
  'st-pink-castle': () => castle('#f3d9ff', '#b17aff', '#ff5ca8'),
  'st-shell-carriage': () => (
    <g>
      <path d="M30 130 Q30 40 100 36 Q170 40 170 130Z" fill="#ffc2dd" />
      {[52, 76, 100, 124, 148].map((x) => (
        <path key={x} d={`M${x} 128 L${100 + (x - 100) * 0.55} 44`} stroke="#ffe3f0" strokeWidth={6} strokeLinecap="round" />
      ))}
      <rect x={24} y={124} width={152} height={16} rx={8} fill="#ffc531" />
      {[56, 144].map((x) => (
        <g key={x}>
          <circle cx={x} cy={160} r={24} fill="#7fd6ff" />
          <circle cx={x} cy={160} r={9} fill="#ffc531" />
          {[0, 60, 120].map((a) => (
            <path key={a} d={`M${x} 160 l${22 * Math.cos((a * Math.PI) / 180)} ${22 * Math.sin((a * Math.PI) / 180)} M${x} 160 l${-22 * Math.cos((a * Math.PI) / 180)} ${-22 * Math.sin((a * Math.PI) / 180)}`} stroke="#fff" strokeWidth={3} />
          ))}
        </g>
      ))}
      <Sparkle cx={170} cy={40} r={9} />
    </g>
  ),
  'st-flower-carriage': () => (
    <g>
      <path d="M36 128 Q30 56 100 50 Q170 56 164 128Z" fill="#9fe6c4" />
      <path d="M70 128 V84 Q100 64 130 84 V128Z" fill="#fff" opacity={0.7} />
      {[[50, 64], [100, 42], [150, 64], [40, 110], [160, 110]].map(([x, y], i) => (
        <g key={i}>
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={x + 8 * Math.cos((a * Math.PI) / 180)} cy={y + 8 * Math.sin((a * Math.PI) / 180)} r={7} fill={i % 2 ? '#ff8cc6' : '#ffd23f'} />
          ))}
          <circle cx={x} cy={y} r={5} fill="#fff" />
        </g>
      ))}
      <rect x={28} y={124} width={144} height={14} rx={7} fill="#ff8cc6" />
      {[58, 142].map((x) => (
        <g key={x}>
          <circle cx={x} cy={160} r={24} fill="#ffd23f" />
          <circle cx={x} cy={160} r={10} fill="#ff8cc6" />
        </g>
      ))}
    </g>
  ),
  'st-seahorse': () => (
    <g>
      <path d="M110 40 Q150 40 150 74 Q150 96 128 104 Q150 122 140 150 Q130 176 100 180 Q84 182 82 168 Q100 168 108 150 Q114 132 96 122 Q74 108 78 80 Q82 46 110 40Z" fill="#ffc531" />
      <path d="M150 62 L182 58 Q184 70 150 76Z" fill="#ffc531" />
      <path d="M86 70 Q60 64 56 86 Q70 84 84 92Z" fill="#ff9a4d" />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${96 + i * 4} ${64 + i * 26} q-14 4 -18 14`} stroke="#ff9a4d" strokeWidth={6} strokeLinecap="round" fill="none" />
      ))}
      {eyes(124, 124, 64, 8)}
      <ellipse cx={138} cy={84} rx={6} ry={4} fill="#ff8fb3" opacity={0.6} />
      <path d="M100 180 Q70 182 74 158 Q78 146 90 150" stroke="#ffc531" strokeWidth={10} fill="none" strokeLinecap="round" />
    </g>
  ),
  'st-crab': () => (
    <g>
      {[-1, 1].map((d) => (
        <g key={d}>
          <path d={`M${100 + d * 50} 118 Q${100 + d * 76} 90 ${100 + d * 70} 62`} stroke="#ff5a5f" strokeWidth={10} fill="none" strokeLinecap="round" />
          <path d={`M${100 + d * 70} 62 q${d * -20} -20 ${d * -4} -32 q${d * 18} 4 ${d * 20} 24 q${d * -6} -10 ${d * -16} 8Z`} fill="#ff5a5f" />
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M${100 + d * 40} ${140 + i * 10} l${d * 34} ${8 + i * 6}`} stroke="#ff5a5f" strokeWidth={7} strokeLinecap="round" />
          ))}
        </g>
      ))}
      <ellipse cx={100} cy={132} rx={58} ry={40} fill="#ff6f6f" />
      <path d="M82 96 V76 M118 96 V76" stroke="#ff6f6f" strokeWidth={6} strokeLinecap="round" />
      {eyes(82, 118, 72, 9)}
      {smile(100, 136, 22)}
      {cheeks(72, 128, 132)}
    </g>
  ),
  'st-dolphin': () => (
    <g>
      <path d="M24 130 Q40 60 120 56 Q160 56 178 80 L188 76 Q186 92 172 96 Q150 120 110 128 Q80 150 60 170 Q62 146 72 134 Q46 140 24 130Z" fill="#6cb8ff" />
      <path d="M100 58 Q110 30 130 28 Q122 44 124 60Z" fill="#4a9cf0" />
      <path d="M60 122 Q90 128 120 116 Q100 132 76 132Z" fill="#d6ebff" />
      {eyes(146, 146, 74, 6)}
      <path d="M162 90 q-8 6 -18 4" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d="M40 132 Q20 140 14 156 Q32 152 46 142Z" fill="#4a9cf0" />
    </g>
  ),
  'st-octopus': () => (
    <g>
      {[0, 1, 2, 3, 4].map((i) => {
        const x = 46 + i * 27;
        return <path key={i} d={`M${x} 110 Q${x - 10} 150 ${x + 6} 170 Q${x + 16} 178 ${x + 18} 166`} stroke="#ff8cc6" strokeWidth={16} fill="none" strokeLinecap="round" />;
      })}
      <ellipse cx={100} cy={86} rx={60} ry={58} fill="#ff9fd2" />
      {eyes(80, 120, 88, 9)}
      {smile(100, 108, 18)}
      {cheeks(66, 134, 106)}
      <circle cx={84} cy={46} r={8} fill="#ffd1ea" />
      <circle cx={112} cy={40} r={5} fill="#ffd1ea" />
    </g>
  ),
  'st-turtle': () => (
    <g>
      <ellipse cx={164} cy={104} rx={22} ry={18} fill="#8fdc8c" />
      {[[56, 70], [140, 70], [56, 140], [140, 140]].map(([x, y]) => (
        <ellipse key={`${x}${y}`} cx={x} cy={y} rx={18} ry={11} fill="#8fdc8c" transform={`rotate(${x < 100 ? -30 : 30} ${x} ${y})`} />
      ))}
      <ellipse cx={96} cy={106} rx={62} ry={50} fill="#36a86b" />
      <path d="M96 60 L120 82 L112 116 L80 116 L72 82Z" fill="#5cc98b" />
      <path d="M96 60 V56 M120 82 L150 78 M112 116 L130 146 M80 116 L62 146 M72 82 L42 78" stroke="#5cc98b" strokeWidth={6} strokeLinecap="round" />
      {eyes(168, 168, 98, 5)}
      {smile(170, 110, 10)}
    </g>
  ),
  'st-jellyfish': () => (
    <g>
      {[60, 80, 100, 120, 140].map((x, i) => (
        <path key={x} d={`M${x} 104 q${i % 2 ? 10 : -10} 20 0 38 q${i % 2 ? -10 : 10} 18 0 36`} stroke="#c9a6ff" strokeWidth={7} fill="none" strokeLinecap="round" />
      ))}
      <path d="M36 108 Q36 30 100 28 Q164 30 164 108 Q150 98 136 108 Q118 96 100 108 Q82 96 64 108 Q50 98 36 108Z" fill="#e3c8ff" />
      {eyes(82, 118, 72, 7)}
      {smile(100, 88, 14)}
      {cheeks(70, 130, 86)}
      <ellipse cx={74} cy={48} rx={12} ry={6} fill="#fff" opacity={0.6} transform="rotate(-25 74 48)" />
    </g>
  ),
  'st-whale': () => (
    <g>
      <path d="M22 110 Q22 50 96 48 Q170 50 170 104 Q170 150 106 156 Q60 158 42 144 L20 160 Q16 136 28 128 Q22 120 22 110Z" fill="#5b8cff" />
      <path d="M40 124 Q100 150 166 114 Q160 148 106 156 Q60 158 40 124Z" fill="#cfe0ff" />
      <path d="M120 48 Q114 22 98 18 M120 48 Q128 22 146 20 M120 48 V16" stroke="#8fd8ff" strokeWidth={6} strokeLinecap="round" fill="none" />
      {eyes(134, 134, 92, 7)}
      {smile(140, 112, 16)}
      <ellipse cx={150} cy={106} rx={7} ry={4} fill="#ff8fb3" opacity={0.6} />
    </g>
  ),
  'st-stripe-fish': (u) => fishBody(u, '#ff9a4d', '#ff7a2d', '#fff'),
  'st-puffer': () => (
    <g>
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return <path key={i} d={`M${100 + 58 * Math.cos(a)} ${104 + 58 * Math.sin(a)} L${100 + 78 * Math.cos(a)} ${104 + 78 * Math.sin(a)}`} stroke="#ffd23f" strokeWidth={6} strokeLinecap="round" />;
      })}
      <circle cx={100} cy={104} r={62} fill="#ffe066" />
      <ellipse cx={100} cy={130} rx={40} ry={24} fill="#fff6c2" />
      {eyes(80, 120, 92, 9)}
      <circle cx={100} cy={124} r={7} fill="#ff8fb3" stroke={INK} strokeWidth={3} />
    </g>
  ),
  'st-seaweed': () => (
    <g>
      {[[70, '#3fbf7f'], [100, '#2fa36b'], [130, '#5fd38a']].map(([x, col], i) => (
        <path key={i} d={`M${x} 186 Q${(x as number) - 24} 150 ${x} 120 Q${(x as number) + 24} 90 ${x} 60 Q${(x as number) - 16} 40 ${(x as number) + 4} ${18 + i * 10}`} stroke={col as string} strokeWidth={16} fill="none" strokeLinecap="round" />
      ))}
      <circle cx={146} cy={50} r={6} fill="#e6f9ff" />
      <circle cx={156} cy={30} r={4} fill="#e6f9ff" />
    </g>
  ),
  'st-coral': () => (
    <g>
      <path d="M100 186 V110 M100 130 Q70 120 64 80 M64 80 Q60 60 48 50 M64 80 Q72 62 70 44 M100 110 Q104 70 96 40 M100 120 Q132 110 140 76 M140 76 Q150 60 160 56 M140 76 Q138 56 128 44" stroke="#ff6f91" strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {[[48, 50], [70, 44], [96, 40], [160, 56], [128, 44]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r={9} fill="#ff9fb4" />
      ))}
      <ellipse cx={100} cy={184} rx={40} ry={8} fill="#ffd8a8" />
    </g>
  ),
  'st-treasure': () => (
    <g>
      <path d="M30 96 Q30 50 100 50 Q170 50 170 96Z" fill="#c9733b" />
      <rect x={30} y={92} width={140} height={84} rx={8} fill="#b0612e" />
      <rect x={30} y={92} width={140} height={14} fill="#ffc531" />
      <rect x={92} y={50} width={16} height={126} fill="#ffc531" />
      <rect x={86} y={98} width={28} height={30} rx={6} fill="#ffe066" />
      <circle cx={100} cy={112} r={5} fill={INK} />
      {[[50, 46], [80, 36], [130, 40], [150, 50]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={9} fill={['#ff5ca8', '#5fd0ff', '#ffd23f', '#b48cff'][i]} />
      ))}
      <Sparkle cx={170} cy={30} r={10} />
    </g>
  ),
  'st-crown': () => (
    <g>
      <path d="M30 150 L22 56 L66 96 L100 38 L134 96 L178 56 L170 150Z" fill="#ffc531" />
      <rect x={28} y={140} width={144} height={30} rx={8} fill="#ffb300" />
      <circle cx={100} cy={154} r={10} fill="#ff5ca8" />
      <circle cx={60} cy={155} r={7} fill="#5fd0ff" />
      <circle cx={140} cy={155} r={7} fill="#5fd0ff" />
      {[[22, 56], [100, 38], [178, 56]].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r={9} fill="#fff" />
      ))}
    </g>
  ),
  'st-rainbow': () => (
    <g>
      {['#ff6b6b', '#ffa94d', '#ffd23f', '#69db7c', '#5fb8ff', '#b48cff'].map((c, i) => (
        <path key={c} d={`M${24 + i * 10} 150 A${76 - i * 10} ${76 - i * 10} 0 0 1 ${176 - i * 10} 150`} stroke={c} strokeWidth={11} fill="none" />
      ))}
      {[34, 166].map((x) => (
        <g key={x} fill="#fff">
          <circle cx={x - 14} cy={152} r={16} />
          <circle cx={x + 6} cy={148} r={20} />
          <circle cx={x + 24} cy={156} r={14} />
        </g>
      ))}
    </g>
  ),
  'st-bubbles': () => (
    <g>
      {[[80, 120, 44], [140, 70, 30], [146, 150, 22], [56, 50, 18]].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill="#d4f3ff" opacity={0.85} />
          <circle cx={x} cy={y} r={r} fill="none" stroke="#8fd8ff" strokeWidth={4} />
          <ellipse cx={x - r * 0.35} cy={y - r * 0.4} rx={r * 0.3} ry={r * 0.18} fill="#fff" transform={`rotate(-30 ${x - r * 0.35} ${y - r * 0.4})`} />
        </g>
      ))}
    </g>
  ),
  'st-mirror': () => (
    <g>
      <rect x={92} y={150} width={16} height={36} rx={6} fill="#ffc531" />
      <ellipse cx={100} cy={86} rx={60} ry={72} fill="#ffc531" />
      <ellipse cx={100} cy={86} rx={46} ry={58} fill="#bfe9ff" />
      <path d="M72 60 L90 44 M74 80 L106 52" stroke="#fff" strokeWidth={8} strokeLinecap="round" opacity={0.8} />
      <path d={heartPath(100, 22, 1.1)} fill="#ff5ca8" />
      <circle cx={46} cy={86} r={6} fill="#ff5ca8" />
      <circle cx={154} cy={86} r={6} fill="#ff5ca8" />
    </g>
  ),
  'st-throne': () => (
    <g>
      <path d="M40 130 Q30 40 100 26 Q170 40 160 130Z" fill="#ff9fc8" />
      {[60, 80, 100, 120, 140].map((x) => (
        <path key={x} d={`M${x} 126 L${100 + (x - 100) * 0.5} 40`} stroke="#ffd1e6" strokeWidth={6} strokeLinecap="round" />
      ))}
      <rect x={34} y={120} width={132} height={30} rx={14} fill="#b48cff" />
      <rect x={44} y={146} width={14} height={36} rx={5} fill="#ffc531" />
      <rect x={142} y={146} width={14} height={36} rx={5} fill="#ffc531" />
      <circle cx={100} cy={30} r={8} fill="#fff" />
    </g>
  ),
  'st-chandelier': () => (
    <g>
      <path d="M100 10 V50" stroke="#ffc531" strokeWidth={5} />
      <path d="M30 80 Q100 130 170 80" stroke="#ffc531" strokeWidth={9} fill="none" strokeLinecap="round" />
      <path d="M50 60 Q100 90 150 60" stroke="#ffc531" strokeWidth={7} fill="none" strokeLinecap="round" />
      <circle cx={100} cy={56} r={12} fill="#ffc531" />
      {[30, 65, 100, 135, 170].map((x, i) => {
        const y = i === 2 ? 106 : i % 4 === 0 ? 80 : 98;
        return (
          <g key={x}>
            <path d={`M${x} ${y} l-8 18 l8 18 l8 -18Z`} fill="#c9f0ff" stroke="#8fd8ff" strokeWidth={2} />
            <rect x={x - 4} y={y - 26} width={8} height={18} rx={3} fill="#fff" />
            <path d={`M${x} ${y - 38} q6 6 0 12 q-6 -6 0 -12Z`} fill="#ffb347" />
          </g>
        );
      })}
    </g>
  ),
  'st-cake': () => (
    <g>
      <rect x={36} y={110} width={128} height={64} rx={12} fill="#ff9fc8" />
      <path d="M36 128 q16 14 32 0 q16 14 32 0 q16 14 32 0 q16 14 32 0" fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" />
      <rect x={56} y={66} width={88} height={48} rx={10} fill="#ffe0f0" />
      <path d="M56 82 q11 10 22 0 q11 10 22 0 q11 10 22 0 q11 10 22 0" fill="none" stroke="#b48cff" strokeWidth={6} strokeLinecap="round" />
      <rect x={95} y={36} width={10} height={32} rx={4} fill="#5fd0ff" />
      <path d="M100 18 q10 10 0 18 q-10 -8 0 -18Z" fill="#ffb347" />
      <ellipse cx={100} cy={176} rx={78} ry={8} fill="#e6d9ff" />
    </g>
  ),
  'st-balloons': () => (
    <g>
      {[[64, 70, '#ff5ca8'], [104, 50, '#ffd23f'], [142, 76, '#5fd0ff']].map(([x, y, c], i) => (
        <g key={i}>
          <path d={`M${x} ${(y as number) + 40} Q${(x as number) + 10} 140 100 186`} stroke={INK} strokeWidth={2.5} fill="none" opacity={0.6} />
          <ellipse cx={x as number} cy={y as number} rx={30} ry={38} fill={c as string} />
          <path d={`M${(x as number) - 5} ${(y as number) + 37} h10 l-5 8Z`} fill={c as string} />
          <ellipse cx={(x as number) - 10} cy={(y as number) - 14} rx={7} ry={11} fill="#fff" opacity={0.5} />
        </g>
      ))}
    </g>
  ),
};

/** Raw art (no die-cut border) — reused by picture cards and game pieces. */
export function StickerArtRaw({ id, u }: { id: string; u: string }) {
  const art = STICKER_ART[id];
  return <>{art ? art(u) : <polygon points={starPoints(100, 100, 70)} fill="#ffd23f" />}</>;
}

interface StickerSvgProps {
  id: string;
  label?: string;
  variant?: 'sticker' | 'silhouette' | 'plain';
  x?: number;
  y?: number;
  width?: number | string;
  height?: number | string;
  className?: string;
  title?: string;
  flip?: boolean;
}

export function StickerSvg({ id, variant = 'sticker', x, y, width = '100%', height = '100%', className, title, flip }: StickerSvgProps) {
  const raw = useId();
  const u = `s${raw.replace(/[^a-zA-Z0-9]/g, '')}`;
  const filterId = `${u}f`;
  return (
    <svg viewBox="0 0 200 200" x={x} y={y} width={width} height={height} className={className} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} overflow="visible">
      <defs>
        {variant === 'silhouette' ? (
          <filter id={filterId} x="-15%" y="-15%" width="130%" height="130%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="7" result="d" />
            <feFlood floodColor="#ffffff" />
            <feComposite in2="d" operator="in" result="white" />
            <feFlood floodColor="#d9c8f5" />
            <feComposite in2="SourceAlpha" operator="in" result="shape" />
            <feMerge>
              <feMergeNode in="white" />
              <feMergeNode in="shape" />
            </feMerge>
          </filter>
        ) : (
          <filter id={filterId} x="-15%" y="-15%" width="130%" height="135%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="2.4" result="d1" />
            <feFlood floodColor={INK} floodOpacity="0.85" />
            <feComposite in2="d1" operator="in" result="outline" />
            {variant === 'sticker' && (
              <>
                <feMorphology in="SourceAlpha" operator="dilate" radius="8" result="d2" />
                <feFlood floodColor="#ffffff" />
                <feComposite in2="d2" operator="in" result="white" />
                <feGaussianBlur in="d2" stdDeviation="2.5" result="blur" />
                <feOffset in="blur" dy="4" result="off" />
                <feFlood floodColor="#3b2257" floodOpacity="0.2" />
                <feComposite in2="off" operator="in" result="shadow" />
              </>
            )}
            <feMerge>
              {variant === 'sticker' && <feMergeNode in="shadow" />}
              {variant === 'sticker' && <feMergeNode in="white" />}
              <feMergeNode in="outline" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      <g filter={`url(#${filterId})`} transform={flip ? 'translate(200 0) scale(-1 1)' : undefined}>
        <StickerArtRaw id={id} u={u} />
      </g>
    </svg>
  );
}
