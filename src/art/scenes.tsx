/** Scene backgrounds for decorating (1600 × 1000 coordinate space). Static, no animation. */
import type { SceneId } from '../engine/types';
import { Sparkle, starPoints } from './primitives';

export const SCENE_W = 1600;
export const SCENE_H = 1000;

export const SCENE_INFO: Record<SceneId, { title: string; color: string }> = {
  castle: { title: 'Undersea Castle', color: '#17b3ad' },
  ballroom: { title: 'Royal Ballroom', color: '#7b4bd6' },
  lagoon: { title: 'Seashell Lagoon', color: '#3a8dff' },
  rainbow: { title: 'Rainbow Cloud Kingdom', color: '#ff8cc6' },
};

function Bubbles({ seed = 1 }: { seed?: number }) {
  const pts = [
    [120, 300, 14],
    [180, 220, 9],
    [1420, 260, 16],
    [1480, 180, 10],
    [760, 140, 12],
    [980, 320, 8],
    [400, 120, 10],
  ];
  return (
    <g opacity={0.7}>
      {pts.map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={(x * seed) % SCENE_W} cy={y} r={r} fill="none" stroke="#e6fbff" strokeWidth={4} />
          <circle cx={((x * seed) % SCENE_W) - r * 0.3} cy={y - r * 0.3} r={r * 0.25} fill="#fff" />
        </g>
      ))}
    </g>
  );
}

function UnderseaCastle({ u }: { u: string }) {
  return (
    <g>
      <defs>
        <linearGradient id={`${u}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fe0f0" />
          <stop offset="1" stopColor="#1f8fb8" />
        </linearGradient>
      </defs>
      <rect width={SCENE_W} height={SCENE_H} fill={`url(#${u}w)`} />
      {[200, 600, 1000, 1400].map((x) => (
        <path key={x} d={`M${x - 80} 0 L${x + 60} 0 L${x + 160} 700 L${x - 20} 700Z`} fill="#fff" opacity={0.08} />
      ))}
      {/* castle */}
      <g transform="translate(560 170)">
        <rect x={60} y={260} width={360} height={360} rx={20} fill="#ffc2d6" />
        {[0, 180, 400].map((x, i) => (
          <g key={x}>
            <rect x={x} y={i === 1 ? 80 : 200} width={i === 1 ? 120 : 80} height={i === 1 ? 540 : 420} rx={14} fill="#ffb0c9" />
            <path d={`M${x - 20} ${i === 1 ? 90 : 210} L${x + (i === 1 ? 60 : 40)} ${i === 1 ? -30 : 110} L${x + (i === 1 ? 140 : 100)} ${i === 1 ? 90 : 210}Z`} fill="#b17aff" />
            <circle cx={x + (i === 1 ? 60 : 40)} cy={i === 1 ? -40 : 100} r={14} fill="#ffd23f" />
            <rect x={x + (i === 1 ? 40 : 24)} y={i === 1 ? 160 : 260} width={i === 1 ? 40 : 32} height={56} rx={16} fill="#7b4bd6" opacity={0.55} />
          </g>
        ))}
        <path d="M190 620 V500 Q240 440 290 500 V620Z" fill="#7b4bd6" />
        {[90, 140, 330, 380].map((x) => (
          <circle key={x} cx={x} cy={330} r={14} fill="#fff" opacity={0.9} />
        ))}
      </g>
      {/* seaweed and coral */}
      {[80, 260, 1320, 1500].map((x, i) => (
        <path key={x} d={`M${x} 1000 Q${x - 40} 880 ${x} 800 Q${x + 40} 720 ${x} 620 Q${x - 30} 560 ${x + 10} ${480 + i * 20}`} stroke={i % 2 ? '#2fa36b' : '#5fd38a'} strokeWidth={30} fill="none" strokeLinecap="round" />
      ))}
      <path d="M0 860 Q400 800 800 850 T1600 830 V1000 H0Z" fill="#ffe2b0" />
      <path d="M0 930 Q400 890 800 930 T1600 920 V1000 H0Z" fill="#ffd28a" />
      {[[420, 900], [1180, 890], [1450, 940]].map(([x, y], i) => (
        <polygon key={i} points={starPoints(x, y, 26, 0.5)} fill={['#ff9a4d', '#b17aff', '#ff6f91'][i]} />
      ))}
      <Bubbles />
    </g>
  );
}

function RoyalBallroom({ u }: { u: string }) {
  return (
    <g>
      <defs>
        <linearGradient id={`${u}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3e3ff" />
          <stop offset="1" stopColor="#ffd9ec" />
        </linearGradient>
      </defs>
      <rect width={SCENE_W} height={SCENE_H} fill={`url(#${u}b)`} />
      {/* tall windows */}
      {[180, 560, 940, 1320].map((x) => (
        <g key={x}>
          <path d={`M${x} 620 V200 Q${x + 50} 100 ${x + 100} 200 V620Z`} fill="#bfe9ff" />
          <path d={`M${x + 50} 140 V620 M${x} 380 H${x + 100}`} stroke="#fff" strokeWidth={8} />
          <path d={`M${x - 20} 620 h140`} stroke="#d9b8ff" strokeWidth={14} strokeLinecap="round" />
        </g>
      ))}
      {/* curtains */}
      {[0, 1].map((side) => (
        <path key={side} d={side ? 'M1600 0 V700 Q1500 600 1520 300 Q1510 120 1420 0Z' : 'M0 0 V700 Q100 600 80 300 Q90 120 180 0Z'} fill="#ff6fa8" />
      ))}
      <path d="M0 0 H1600 V60 Q1500 110 1400 60 Q1300 110 1200 60 Q1100 110 1000 60 Q900 110 800 60 Q700 110 600 60 Q500 110 400 60 Q300 110 200 60 Q100 110 0 60Z" fill="#ff8cc6" />
      {/* checkered floor */}
      <path d="M0 680 H1600 V1000 H0Z" fill="#fff4fa" />
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} d={`M${i * 100} 680 h50 l${(i - 8) * 30 + 30} 320 h-50Z`} fill="#f0d9ff" opacity={0.7} />
      ))}
      <path d="M0 680 H1600" stroke="#d9b8ff" strokeWidth={10} />
      {/* royal rug */}
      <path d="M700 1000 L740 700 H860 L900 1000Z" fill="#d63c86" />
      <path d="M720 1000 L752 710 H848 L880 1000Z" fill="none" stroke="#ffc531" strokeWidth={6} />
      <Sparkle cx={300} cy={140} r={18} fill="#fff" />
      <Sparkle cx={1300} cy={160} r={14} fill="#fff" />
      <Sparkle cx={800} cy={120} r={20} fill="#fff" />
    </g>
  );
}

function SeashellLagoon({ u }: { u: string }) {
  return (
    <g>
      <defs>
        <linearGradient id={`${u}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd6e8" />
          <stop offset="0.6" stopColor="#ffe9c7" />
        </linearGradient>
      </defs>
      <rect width={SCENE_W} height={SCENE_H} fill={`url(#${u}s)`} />
      <circle cx={1300} cy={190} r={110} fill="#ffe066" />
      <g fill="#fff" opacity={0.9}>
        <ellipse cx={300} cy={160} rx={130} ry={40} />
        <ellipse cx={370} cy={130} rx={80} ry={40} />
        <ellipse cx={850} cy={110} rx={100} ry={32} />
      </g>
      {/* rocky arch */}
      <path d="M1040 560 Q1060 300 1260 300 Q1460 300 1480 560 H1400 Q1390 400 1260 400 Q1130 400 1120 560Z" fill="#c9a28a" />
      {/* lagoon water */}
      <path d="M0 520 Q400 470 800 520 T1600 510 V780 H0Z" fill="#5fd0e8" />
      <path d="M0 600 Q400 570 800 600 T1600 590" stroke="#c9f4ff" strokeWidth={10} fill="none" opacity={0.8} />
      <path d="M0 680 Q400 650 800 680 T1600 670" stroke="#c9f4ff" strokeWidth={8} fill="none" opacity={0.6} />
      {/* sand */}
      <path d="M0 760 Q400 720 800 760 T1600 750 V1000 H0Z" fill="#ffe2b0" />
      {/* palm tree */}
      <g transform="translate(220 780)">
        <path d="M0 0 Q30 -150 -10 -300" stroke="#b0703c" strokeWidth={30} fill="none" strokeLinecap="round" />
        <path d="M-10 -300 Q-130 -320 -200 -240 Q-100 -290 -10 -290Z M-10 -300 Q110 -350 190 -270 Q90 -310 -10 -290Z M-10 -300 Q-80 -400 -10 -430 Q-20 -360 -4 -296Z" fill="#3ca35a" />
      </g>
      {/* big shells on the beach */}
      {[[640, 860, '#ff9fc8'], [1000, 900, '#c69cff']].map(([x, y, c], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <path d="M-60 20 Q-64 -50 0 -60 Q64 -50 60 20 Q0 40 -60 20Z" fill={c as string} />
          {[-40, -20, 0, 20, 40].map((dx) => (
            <path key={dx} d={`M${dx * 0.4} 30 L${dx} -44`} stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.7} />
          ))}
        </g>
      ))}
      <Bubbles seed={3} />
    </g>
  );
}


function RainbowKingdom({ u }: { u: string }) {
  const bands = ['#ff6b6b', '#ffa94d', '#ffd23f', '#69db7c', '#5fb8ff', '#b48cff'];
  const cloud = (x: number, y: number, s: number) => (
    <g fill="#ffffff" transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx={-70} cy={10} r={50} />
      <circle cx={0} cy={-20} r={70} />
      <circle cx={75} cy={10} r={50} />
      <rect x={-120} y={0} width={240} height={60} rx={30} />
    </g>
  );
  return (
    <g>
      <defs>
        <linearGradient id={`${u}r`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd9f0" />
          <stop offset="0.55" stopColor="#e9dcff" />
          <stop offset="1" stopColor="#d4f1ff" />
        </linearGradient>
      </defs>
      <rect width={SCENE_W} height={SCENE_H} fill={`url(#${u}r)`} />
      {/* big rainbow */}
      {bands.map((c, i) => (
        <path key={c} d={`M${160 + i * 46} 760 A${640 - i * 46} ${640 - i * 46} 0 0 1 ${1440 - i * 46} 760`} stroke={c} strokeWidth={48} fill="none" />
      ))}
      {/* cloud castle */}
      <g transform="translate(800 520)">
        <rect x={-110} y={-120} width={220} height={170} rx={20} fill="#ffc9e3" />
        {[-150, 0, 150].map((x, i) => (
          <g key={x}>
            <rect x={x - 34} y={i === 1 ? -230 : -170} width={68} height={i === 1 ? 280 : 220} rx={14} fill="#ffb3d6" />
            <rect x={x - 12} y={i === 1 ? -160 : -110} width={24} height={34} rx={12} fill="#9a6ae0" opacity={0.7} />
            <path d={`M${x - 46} ${i === 1 ? -224 : -164} L${x} ${i === 1 ? -320 : -250} L${x + 46} ${i === 1 ? -224 : -164}Z`} fill="#b48cff" />
            <circle cx={x} cy={i === 1 ? -330 : -260} r={12} fill="#ffd23f" />
          </g>
        ))}
        <path d="M-36 50 V-20 Q0 -60 36 -20 V50Z" fill="#ff8cc6" />
      </g>
      {/* clouds and floating islands */}
      {cloud(170, 790, 1.2)}
      {cloud(1430, 790, 1.2)}
      {cloud(800, 600, 1.25)}
      {cloud(340, 200, 0.6)}
      {cloud(1250, 160, 0.5)}
      <path d="M0 880 Q400 820 800 870 T1600 860 V1000 H0Z" fill="#ffffff" />
      <path d="M0 940 Q400 900 800 940 T1600 930 V1000 H0Z" fill="#f3eaff" />
      {[[220, 380], [1380, 330], [600, 120], [1050, 90]].map(([x, y], i) => (
        <polygon key={i} points={starPoints(x, y, 22)} fill="#ffd23f" opacity={0.9} />
      ))}
      <Sparkle cx={480} cy={420} r={16} fill="#ffffff" />
      <Sparkle cx={1120} cy={420} r={14} fill="#ffffff" />
    </g>
  );
}

export function SceneBackground({ id, u }: { id: SceneId; u: string }) {
  if (id === 'castle') return <UnderseaCastle u={u} />;
  if (id === 'ballroom') return <RoyalBallroom u={u} />;
  if (id === 'rainbow') return <RainbowKingdom u={u} />;
  return <SeashellLagoon u={u} />;
}

export function SceneThumb({ id, className }: { id: SceneId; className?: string }) {
  return (
    <svg viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
      <SceneBackground id={id} u={`th-${id}`} />
    </svg>
  );
}
