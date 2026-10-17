/**
 * Original dress-up characters and parametric outfit art, drawn in a 300 × 460 box.
 *   Pearl  — mermaid princess (tail)
 *   Rosie  — land princess (dresses, shoes)
 *   Gigi   — fashion designer (dresses, shoes)
 * Outfit items come from the reward catalog (src/data/rewards.ts) and are drawn from their
 * style + colors + pattern, so every catalog item renders without bespoke art.
 */
import { useId, type ReactNode } from 'react';
import { REWARD_BY_ID, type DressItem, type Slot } from '../data/rewards';
import type { CharacterId, Outfit } from '../engine/types';
import { heartPath, INK, PatternDef, Sparkle, starPoints } from './primitives';

const RAINBOW = ['#ff6b6b', '#ffa94d', '#ffd23f', '#69db7c', '#5fb8ff', '#b48cff'];

export const CHAR_W = 300;
export const CHAR_H = 460;

interface Look {
  skin: string;
  cheek: string;
  hair: string;
  hairLight: string;
  eyes: string;
}

export const CHARACTERS: Record<CharacterId, Look & { name: string }> = {
  pearl: { name: 'Pearl', skin: '#c98a5e', cheek: '#ff8fa8', hair: '#a77bff', hairLight: '#d4bcff', eyes: '#3b2257' },
  rosie: { name: 'Rosie', skin: '#f6d0b6', cheek: '#ff9fb2', hair: '#d9622b', hairLight: '#f29a5c', eyes: '#2f5d8a' },
  gigi: { name: 'Gigi', skin: '#8d5a3b', cheek: '#e07a8a', hair: '#2b1a12', hairLight: '#5a3a28', eyes: '#2b1a12' },
};

/** Starter outfits (not rewards) so every character looks complete before anything is earned. */
const STARTER: Record<CharacterId, Partial<Record<Slot, DressItem>>> = {
  pearl: {
    tail: { id: 'starter-tail', kind: 'dress', slot: 'tail', name: 'Starter tail', style: 'classic', colors: ['#22c3b8', '#a2f2ec', '#ffffff'], pattern: 'scales' },
  },
  rosie: {
    dress: { id: 'starter-rosie', kind: 'dress', slot: 'dress', name: 'Starter dress', style: 'aline', colors: ['#ffb38a', '#ffe0cf', '#ffffff'], pattern: 'none' },
    shoes: { id: 'starter-shoes-r', kind: 'dress', slot: 'shoes', name: 'Starter shoes', style: 'slipper', colors: ['#ff9fb2', '#ffffff', '#ffffff'] },
  },
  gigi: {
    dress: { id: 'starter-gigi', kind: 'dress', slot: 'dress', name: 'Starter dress', style: 'bubble', colors: ['#ffd23f', '#fff2a8', '#ffffff'], pattern: 'none' },
    shoes: { id: 'starter-shoes-g', kind: 'dress', slot: 'shoes', name: 'Starter shoes', style: 'sneaker', colors: ['#ff8cc6', '#ffffff', '#ffffff'] },
  },
};

function itemFor(character: CharacterId, outfit: Outfit, slot: Slot): DressItem | undefined {
  const id = outfit[slot];
  const item = id ? REWARD_BY_ID.get(id) : undefined;
  if (item && item.kind === 'dress') return item;
  return STARTER[character][slot];
}

// ───────────────────────────── Bodies ─────────────────────────────

function BackHair({ c }: { c: CharacterId }) {
  const { hair, hairLight } = CHARACTERS[c];
  if (c === 'pearl')
    return (
      <g>
        <path d="M92 105 Q84 40 150 38 Q216 40 208 105 Q222 160 214 210 Q224 250 206 290 Q196 300 190 286 Q200 240 186 200 L114 200 Q100 240 110 286 Q104 300 94 290 Q76 250 86 210 Q78 160 92 105Z" fill={hair} />
        <path d="M200 120 Q212 180 200 240 Q210 262 198 280" fill="none" stroke={hairLight} strokeWidth={8} strokeLinecap="round" />
        <path d="M100 120 Q88 180 100 240" fill="none" stroke={hairLight} strokeWidth={6} strokeLinecap="round" opacity={0.7} />
      </g>
    );
  if (c === 'rosie')
    return (
      <g>
        <circle cx={150} cy={44} r={28} fill={hair} />
        <path d="M94 110 Q86 52 150 48 Q214 52 206 110 Q216 150 200 176 L100 176 Q84 150 94 110Z" fill={hair} />
        <path d="M98 150 q-14 20 -2 40 q14 -6 10 -24Z M202 150 q14 20 2 40 q-14 -6 -10 -24Z" fill={hair} />
        <path d="M136 30 q14 -10 28 0" fill="none" stroke={hairLight} strokeWidth={6} strokeLinecap="round" />
      </g>
    );
  return (
    <g>
      <circle cx={96} cy={70} r={30} fill={hair} />
      <circle cx={204} cy={70} r={30} fill={hair} />
      <path d="M96 112 Q90 54 150 50 Q210 54 204 112 Q206 140 196 150 L104 150 Q94 140 96 112Z" fill={hair} />
      <circle cx={88} cy={62} r={8} fill={hairLight} opacity={0.6} />
      <circle cx={212} cy={62} r={8} fill={hairLight} opacity={0.6} />
    </g>
  );
}

function Face({ c }: { c: CharacterId }) {
  const { skin, cheek, eyes } = CHARACTERS[c];
  return (
    <g>
      <rect x={138} y={160} width={24} height={26} rx={8} fill={skin} />
      <ellipse cx={150} cy={112} rx={58} ry={60} fill={skin} />
      <ellipse cx={93} cy={118} rx={8} ry={11} fill={skin} />
      <ellipse cx={207} cy={118} rx={8} ry={11} fill={skin} />
      {[128, 172].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={118} rx={10} ry={13} fill={eyes} />
          <circle cx={x + 3} cy={113} r={4} fill="#fff" />
          <circle cx={x - 3} cy={123} r={2} fill="#fff" opacity={0.8} />
          <path d={x < 150 ? `M${x - 11} 108 l-6 -5 M${x - 7} 105 l-3 -6` : `M${x + 11} 108 l6 -5 M${x + 7} 105 l3 -6`} stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
        </g>
      ))}
      <path d="M118 96 q10 -6 20 -2 M162 94 q10 -4 20 2" stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.6} />
      <ellipse cx={112} cy={140} rx={11} ry={7} fill={cheek} opacity={0.55} />
      <ellipse cx={188} cy={140} rx={11} ry={7} fill={cheek} opacity={0.55} />
      <path d="M136 144 Q150 158 164 144" fill="#e8557a" stroke={INK} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M141 146 Q150 151 159 146" fill="#fff" opacity={0.8} />
    </g>
  );
}

function FrontHair({ c }: { c: CharacterId }) {
  const { hair, hairLight } = CHARACTERS[c];
  if (c === 'pearl')
    return (
      <g>
        <path d="M92 108 Q96 52 150 50 Q206 52 208 104 Q192 74 160 72 Q150 92 118 90 Q106 96 92 108Z" fill={hair} />
        <path d="M126 64 Q146 58 170 66" stroke={hairLight} strokeWidth={6} strokeLinecap="round" fill="none" />
        <polygon points={starPoints(196, 78, 12, 0.5)} fill="#ff9a5c" />
        <circle cx={196} cy={78} r={3} fill="#ffd6b8" />
      </g>
    );
  if (c === 'rosie')
    return (
      <g>
        <path d="M92 110 Q94 56 150 54 Q206 56 208 110 Q196 84 176 80 Q166 96 150 86 Q134 98 122 82 Q102 88 92 110Z" fill={hair} />
        <path d="M120 68 q20 -8 44 -2" stroke={hairLight} strokeWidth={5} strokeLinecap="round" fill="none" />
      </g>
    );
  return (
    <g>
      <path d="M94 104 Q100 56 150 56 Q200 56 206 104 Q190 82 170 84 Q160 70 146 80 Q130 72 120 86 Q104 86 94 104Z" fill={hair} />
      <rect x={100} y={62} width={100} height={10} rx={5} fill="#ff5ca8" transform="rotate(-4 150 67)" />
    </g>
  );
}

function Arms({ c, holding }: { c: CharacterId; holding: boolean }) {
  const { skin } = CHARACTERS[c];
  return (
    <g fill="none" stroke={skin} strokeWidth={17} strokeLinecap="round" strokeLinejoin="round">
      <path d="M118 196 Q96 236 102 282" />
      <path d={holding ? 'M182 196 Q206 228 214 262' : 'M182 196 Q204 236 198 282'} />
      <circle cx={102} cy={286} r={10} fill={skin} stroke="none" />
      <circle cx={holding ? 215 : 198} cy={holding ? 266 : 286} r={10} fill={skin} stroke="none" />
    </g>
  );
}

function Legs({ c }: { c: CharacterId }) {
  const { skin } = CHARACTERS[c];
  return (
    <g stroke={skin} strokeWidth={15} strokeLinecap="round">
      <path d="M136 330 L132 428" />
      <path d="M164 330 L168 428" />
    </g>
  );
}

// ───────────────────────────── Outfit pieces ─────────────────────────────

function patterned(u: string, item: DressItem, d: string, key?: string): ReactNode {
  const pat = item.pattern && item.pattern !== 'none' ? item.pattern : null;
  const pid = `${u}${key ?? item.slot}p`;
  return (
    <g>
      {pat && (
        <defs>
          <PatternDef id={pid} pattern={pat} color={item.colors[1]} />
        </defs>
      )}
      <path d={d} fill={item.colors[0]} />
      {pat && <path d={d} fill={`url(#${pid})`} opacity={0.75} />}
    </g>
  );
}

const SKIRTS: Record<string, string> = {
  ballgown: 'M124 246 Q96 320 60 404 Q150 426 240 404 Q204 320 176 246Z',
  tutu: 'M122 246 L92 300 L106 296 L96 324 L118 312 L120 334 L138 316 L150 338 L162 316 L180 334 L182 312 L204 324 L194 296 L208 300 L178 246Z',
  aline: 'M124 246 L92 380 Q150 394 208 380 L176 246Z',
  bubble: 'M124 246 Q78 280 92 330 Q120 352 150 344 Q180 352 208 330 Q222 280 176 246Z',
  layered: 'M124 246 Q104 300 96 330 Q150 342 204 330 Q196 300 176 246Z M98 322 Q86 360 76 380 Q150 396 224 380 Q214 360 202 322Z M80 372 Q72 392 64 410 Q150 428 236 410 Q228 392 220 372Z',
  rainbow: 'M124 246 Q96 320 60 404 Q150 426 240 404 Q204 320 176 246Z',
  unicorn: 'M124 246 L92 380 Q150 394 208 380 L176 246Z',
};

function Dress({ item, u }: { item: DressItem; u: string }) {
  const [main, accent, trim] = item.colors;
  const skirt = SKIRTS[item.style] ?? SKIRTS.aline;
  return (
    <g>
      {item.style === 'rainbow' ? (
        <g>
          <defs>
            <clipPath id={`${u}rb`}>
              <path d={skirt} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${u}rb)`}>
            {['#ff6b6b', '#ffa94d', '#ffd23f', '#69db7c', '#5fb8ff', '#b48cff'].map((col, i) => (
              <rect key={col} x={40} y={246 + i * 30} width={220} height={31} fill={col} />
            ))}
          </g>
        </g>
      ) : (
        patterned(u, item, skirt, 'sk')
      )}
      {item.style === 'unicorn' && (
        <g>
          <defs>
            <clipPath id={`${u}uh`}>
              <path d={skirt} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${u}uh)`}>
            {RAINBOW.map((col, i) => (
              <rect key={col} x={80} y={340 + i * 8} width={140} height={9} fill={col} />
            ))}
          </g>
          <polygon points={starPoints(150, 300, 16)} fill={trim} />
        </g>
      )}
      {item.style === 'layered' && <path d="M98 330 Q150 342 202 330 M78 380 Q150 396 222 380" stroke={trim} strokeWidth={5} fill="none" opacity={0.8} />}
      {item.style === 'tutu' && <path d="M106 296 L96 324 M194 296 L204 324" stroke={accent} strokeWidth={4} />}
      {/* hem trim */}
      {item.style !== 'tutu' && item.style !== 'bubble' && item.style !== 'layered' && item.style !== 'unicorn' && (
        <path d={item.style === 'aline' ? 'M92 380 Q150 394 208 380' : 'M60 404 Q150 426 240 404'} stroke={trim} strokeWidth={6} fill="none" strokeLinecap="round" />
      )}
      {/* bodice + puff sleeves */}
      <path d="M118 186 Q150 176 182 186 L180 250 Q150 258 120 250Z" fill={main} />
      <ellipse cx={116} cy={196} rx={16} ry={13} fill={accent} />
      <ellipse cx={184} cy={196} rx={16} ry={13} fill={accent} />
      <path d="M120 246 Q150 254 180 246" stroke={accent} strokeWidth={9} fill="none" strokeLinecap="round" />
      <circle cx={150} cy={250} r={7} fill={trim} />
      <path d="M134 188 Q150 200 166 188" stroke={trim} strokeWidth={4} fill="none" strokeLinecap="round" />
    </g>
  );
}

const TAIL = 'M122 244 Q108 300 126 350 Q138 384 146 404 L154 404 Q162 384 174 350 Q192 300 178 244Z';
const FIN = 'M150 396 Q118 400 92 446 Q122 436 150 420 Q178 436 208 446 Q182 400 150 396Z';

function Tail({ item, u }: { item: DressItem; u: string }) {
  const [main, accent, trim] = item.colors;
  return (
    <g>
      {item.style === 'unicorn' ? (
        <g>
          <defs>
            <linearGradient id={`${u}ug`} x1="0" y1="0" x2="0.3" y2="1">
              <stop offset="0" stopColor={main} />
              <stop offset="0.5" stopColor={accent} />
              <stop offset="1" stopColor="#bff3e6" />
            </linearGradient>
            <PatternDef id={`${u}us`} pattern="stars" color="#ffffff" />
          </defs>
          <path d={TAIL} fill={`url(#${u}ug)`} />
          <path d={TAIL} fill={`url(#${u}us)`} opacity={0.7} />
        </g>
      ) : item.style === 'rainbow' ? (
        <g>
          <defs>
            <clipPath id={`${u}rt`}>
              <path d={TAIL} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${u}rt)`}>
            {['#ff6b9e', '#ffa94d', '#ffd23f', '#69db7c', '#5fd0ff', '#b48cff'].map((col, i) => (
              <rect key={col} x={90} y={244 + i * 28} width={120} height={29} fill={col} />
            ))}
          </g>
          {item.pattern === 'scales' && (
            <>
              <defs>
                <PatternDef id={`${u}rts`} pattern="scales" color="#ffffff" />
              </defs>
              <path d={TAIL} fill={`url(#${u}rts)`} opacity={0.6} />
            </>
          )}
        </g>
      ) : (
        patterned(u, item, TAIL, 'tl')
      )}
      {item.style === 'unicorn' ? (
        <g>
          <defs>
            <clipPath id={`${u}uf`}>
              <path d={FIN} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${u}uf)`}>
            {RAINBOW.map((col, i) => (
              <rect key={col} x={88 + i * 21} y={390} width={22} height={60} fill={col} />
            ))}
          </g>
        </g>
      ) : (
        <path d={FIN} fill={accent} />
      )}
      <path d="M150 400 L118 436 M150 400 L134 440 M150 400 L166 440 M150 400 L182 436" stroke={main} strokeWidth={3} opacity={0.6} />
      {item.style === 'ruffle' && <path d="M116 248 q8 12 16 0 q8 12 18 0 q10 12 18 0 q8 12 16 0" fill={trim} stroke={accent} strokeWidth={3} />}
      {item.style === 'sparkle' && (
        <g>
          <Sparkle cx={136} cy={290} r={8} fill={trim} />
          <Sparkle cx={166} cy={330} r={7} fill={trim} />
          <Sparkle cx={146} cy={372} r={6} fill={trim} />
        </g>
      )}
      <path d="M122 248 Q150 256 178 248" stroke={trim} strokeWidth={5} fill="none" strokeLinecap="round" />
    </g>
  );
}

/** Pearl's seashell top (part of her base look). */
function ShellTop() {
  return (
    <g>
      <path d="M120 188 Q150 180 180 188 L178 250 Q150 256 122 250Z" fill="#ff9fcf" />
      <path d="M128 196 q8 -10 16 0 q8 -10 16 0 q8 -10 16 0" fill="none" stroke="#ffd1ea" strokeWidth={4} strokeLinecap="round" />
      <path d="M126 222 Q150 230 174 222" stroke="#ffd1ea" strokeWidth={4} fill="none" />
    </g>
  );
}

function Crown({ item }: { item: DressItem; u?: string }) {
  const [main, accent, trim] = item.colors;
  switch (item.style) {
    case 'unicorn':
      return (
        <g>
          <path d="M100 82 Q150 50 200 82" stroke={main} strokeWidth={9} fill="none" strokeLinecap="round" />
          <path d="M114 70 L106 46 L128 62Z M186 70 L194 46 L172 62Z" fill={main} />
          <path d="M140 64 L150 12 L160 64Z" fill={accent} />
          {[0, 1, 2, 3].map((k) => (
            <path key={k} d={`M${142 + k * 1.6} ${56 - k * 11} L${158 - k * 1.6} ${52 - k * 11}`} stroke="#e8a800" strokeWidth={2.5} strokeLinecap="round" />
          ))}
          {[118, 182].map((x) => (
            <g key={x}>
              {[0, 72, 144, 216, 288].map((a) => (
                <circle key={a} cx={x + 5 * Math.cos((a * Math.PI) / 180)} cy={74 + 5 * Math.sin((a * Math.PI) / 180)} r={4.5} fill={trim} />
              ))}
              <circle cx={x} cy={74} r={3} fill="#fff6a8" />
            </g>
          ))}
        </g>
      );
    case 'rainbow':
      return (
        <g>
          {RAINBOW.map((col, i) => (
            <path key={col} d={`M${104 + i * 4} 80 Q150 ${34 + i * 6} ${196 - i * 4} 80`} stroke={col} strokeWidth={5} fill="none" strokeLinecap="round" />
          ))}
          <path d="M98 82 q-6 -6 0 -12 q8 -2 10 6 q4 -8 10 -2 q2 8 -8 10Z M202 82 q6 -6 0 -12 q-8 -2 -10 6 q-4 -8 -10 -2 q-2 8 8 10Z" fill="#ffffff" />
          <polygon points={starPoints(150, 40, 9)} fill="#ffd23f" />
        </g>
      );
    case 'tiara':
      return (
        <g>
          <path d="M104 74 Q150 34 196 74" stroke={main} strokeWidth={7} fill="none" strokeLinecap="round" />
          {[110, 126, 150, 174, 190].map((x, i) => (
            <circle key={x} cx={x} cy={[66, 52, 40, 52, 66][i]} r={i === 2 ? 10 : 7} fill={i === 2 ? accent : trim} stroke="#e7dcff" strokeWidth={2} />
          ))}
        </g>
      );
    case 'flower':
      return (
        <g>
          <path d="M98 82 Q150 50 202 82" stroke={item.colors[2]} strokeWidth={8} fill="none" strokeLinecap="round" />
          {[104, 126, 150, 174, 196].map((x, i) => {
            const y = [76, 64, 58, 64, 76][i];
            const col = i % 2 ? accent : main;
            return (
              <g key={x}>
                {[0, 72, 144, 216, 288].map((a) => (
                  <circle key={a} cx={x + 7 * Math.cos((a * Math.PI) / 180)} cy={y + 7 * Math.sin((a * Math.PI) / 180)} r={6} fill={col} />
                ))}
                <circle cx={x} cy={y} r={4.5} fill="#fff6a8" />
              </g>
            );
          })}
        </g>
      );
    case 'star':
      return (
        <g>
          <path d="M106 76 Q150 46 194 76" stroke={main} strokeWidth={7} fill="none" strokeLinecap="round" />
          <polygon points={starPoints(150, 38, 20)} fill={main} />
          <polygon points={starPoints(150, 38, 9)} fill={accent} />
          <polygon points={starPoints(118, 58, 9)} fill={trim} />
          <polygon points={starPoints(182, 58, 9)} fill={trim} />
        </g>
      );
    case 'shell':
      return (
        <g>
          <path d="M106 76 Q150 50 194 76" stroke={trim} strokeWidth={7} fill="none" strokeLinecap="round" />
          <path d="M126 64 Q150 12 174 64 Q150 72 126 64Z" fill={main} />
          {[-14, -7, 0, 7, 14].map((dx) => (
            <path key={dx} d={`M150 66 L${150 + dx * 1.4} 30`} stroke={accent} strokeWidth={3} strokeLinecap="round" />
          ))}
          <circle cx={150} cy={66} r={6} fill="#fff" />
          <circle cx={116} cy={68} r={6} fill="#fff" />
          <circle cx={184} cy={68} r={6} fill="#fff" />
        </g>
      );
    case 'heart':
      return (
        <g>
          <path d="M104 76 Q150 44 196 76" stroke={trim} strokeWidth={7} fill="none" strokeLinecap="round" />
          <path d={heartPath(150, 46, 2)} fill={main} />
          <path d={heartPath(150, 46, 1)} fill={accent} />
          <path d={heartPath(120, 62, 0.9)} fill={main} />
          <path d={heartPath(180, 62, 0.9)} fill={main} />
        </g>
      );
    case 'moon':
      return (
        <g>
          <path d="M106 76 Q150 46 194 76" stroke={main} strokeWidth={7} fill="none" strokeLinecap="round" />
          <path d="M150 18 A24 24 0 1 0 172 52 A18 18 0 1 1 150 18Z" fill={accent} />
          <polygon points={starPoints(118, 58, 7)} fill={trim} />
          <polygon points={starPoints(184, 58, 7)} fill={trim} />
        </g>
      );
    default:
      return (
        <g>
          <path d="M112 76 L106 34 L128 54 L150 26 L172 54 L194 34 L188 76Z" fill={main} />
          <rect x={110} y={68} width={80} height={12} rx={5} fill={main} />
          <circle cx={150} cy={58} r={7} fill={accent} />
          <circle cx={126} cy={66} r={5} fill={trim} />
          <circle cx={174} cy={66} r={5} fill={trim} />
          <circle cx={106} cy={34} r={5} fill={accent} />
          <circle cx={194} cy={34} r={5} fill={accent} />
          <circle cx={150} cy={26} r={5} fill={trim} />
          <path d="M116 70 L184 70" stroke="#fff" strokeWidth={2} opacity={0.6} />
        </g>
      );
  }
}

function Necklace({ item, u }: { item: DressItem; u: string }) {
  const [main, accent, trim] = item.colors;
  void u;
  const chain = <path d="M126 184 Q150 214 174 184" stroke={item.style === 'pearls' ? 'none' : accent} strokeWidth={3} fill="none" />;
  switch (item.style) {
    case 'pearls':
    case 'rainbow': {
      const cols = item.style === 'rainbow' ? ['#ff6b6b', '#ffa94d', '#ffd23f', '#69db7c', '#5fb8ff', '#b48cff', '#ff8cc6'] : [main];
      return (
        <g>
          {Array.from({ length: 9 }, (_, i) => {
            const t = i / 8;
            const x = 126 + t * 48;
            const y = 184 + Math.sin(t * Math.PI) * 26;
            return <circle key={i} cx={x} cy={y} r={5.5} fill={cols[i % cols.length]} stroke={trim} strokeWidth={1.5} />;
          })}
        </g>
      );
    }
    case 'cloud':
      return (
        <g>
          {chain}
          {RAINBOW.slice(0, 4).map((col, i) => (
            <path key={col} d={`M${140 + i * 2} 222 Q150 ${200 + i * 3} ${160 - i * 2} 222`} stroke={col} strokeWidth={2.5} fill="none" />
          ))}
          <g fill={main}>
            <circle cx={142} cy={222} r={6} />
            <circle cx={158} cy={222} r={6} />
            <circle cx={150} cy={219} r={7} />
          </g>
        </g>
      );
    case 'heart':
      return (
        <g>
          {chain}
          <path d={heartPath(150, 214, 1.2)} fill={main} />
          <circle cx={146} cy={206} r={2.5} fill={trim} />
        </g>
      );
    case 'star':
      return (
        <g>
          {chain}
          <polygon points={starPoints(150, 214, 13)} fill={main} />
        </g>
      );
    case 'shell':
      return (
        <g>
          {chain}
          <path d="M138 220 Q150 192 162 220 Q150 226 138 220Z" fill={main} />
          <path d="M150 220 L150 202 M144 219 L146 204 M156 219 L154 204" stroke="#fff" strokeWidth={1.5} />
        </g>
      );
    default:
      return (
        <g>
          {chain}
          <path d="M150 202 L162 214 L150 230 L138 214Z" fill={main} />
          <path d="M150 202 L156 214 L150 230" fill={trim} opacity={0.6} />
        </g>
      );
  }
}

function Wand({ item }: { item: DressItem }) {
  const [main, accent, trim] = item.colors;
  const tx = 238;
  const ty = 186;
  let top: ReactNode;
  switch (item.style) {
    case 'heart':
      top = <path d={heartPath(tx, ty, 1.7)} fill={main} />;
      break;
    case 'shell':
      top = (
        <g>
          <path d={`M${tx - 18} ${ty + 10} Q${tx} ${ty - 30} ${tx + 18} ${ty + 10} Q${tx} ${ty + 16} ${tx - 18} ${ty + 10}Z`} fill={main} />
          <path d={`M${tx} ${ty + 10} L${tx} ${ty - 14} M${tx - 8} ${ty + 9} L${tx - 6} ${ty - 10} M${tx + 8} ${ty + 9} L${tx + 6} ${ty - 10}`} stroke="#fff" strokeWidth={2} />
        </g>
      );
      break;
    case 'moon':
      top = <path d={`M${tx} ${ty - 22} A22 22 0 1 0 ${tx + 20} ${ty + 10} A16 16 0 1 1 ${tx} ${ty - 22}Z`} fill={main} />;
      break;
    case 'flower':
      top = (
        <g>
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <circle key={a} cx={tx + 11 * Math.cos((a * Math.PI) / 180)} cy={ty + 11 * Math.sin((a * Math.PI) / 180)} r={9} fill={main} />
          ))}
          <circle cx={tx} cy={ty} r={7} fill={trim} />
        </g>
      );
      break;
    case 'unicorn':
      top = (
        <g>
          <path d={`M${tx - 10} ${ty + 14} L${tx} ${ty - 30} L${tx + 10} ${ty + 14}Z`} fill={main} />
          {[0, 1, 2].map((k) => (
            <path key={k} d={`M${tx - 8 + k * 2} ${ty + 6 - k * 11} L${tx + 8 - k * 2} ${ty + 2 - k * 11}`} stroke="#e8a800" strokeWidth={2.5} strokeLinecap="round" />
          ))}
          <circle cx={tx - 12} cy={ty + 14} r={5} fill={accent} />
          <circle cx={tx + 12} cy={ty + 14} r={5} fill={accent} />
        </g>
      );
      break;
    case 'rainbow':
      top = (
        <g>
          {RAINBOW.map((col, i) => (
            <path key={col} d={`M${tx - 24 + i * 3.5} ${ty + 8} A${24 - i * 3.5} ${24 - i * 3.5} 0 0 1 ${tx + 24 - i * 3.5} ${ty + 8}`} stroke={col} strokeWidth={3.6} fill="none" />
          ))}
          <circle cx={tx - 24} cy={ty + 10} r={7} fill="#fff" />
          <circle cx={tx + 24} cy={ty + 10} r={7} fill="#fff" />
        </g>
      );
      break;
    case 'gem':
      top = (
        <g>
          <path d={`M${tx - 18} ${ty - 6} L${tx - 8} ${ty - 18} H${tx + 8} L${tx + 18} ${ty - 6} L${tx} ${ty + 18}Z`} fill={main} />
          <path d={`M${tx - 18} ${ty - 6} H${tx + 18} M${tx - 8} ${ty - 18} L${tx} ${ty + 18} L${tx + 8} ${ty - 18}`} stroke={trim} strokeWidth={2} fill="none" opacity={0.8} />
        </g>
      );
      break;
    default:
      top = <polygon points={starPoints(tx, ty, 22)} fill={main} />;
  }
  return (
    <g>
      <path d={`M216 272 L${tx} ${ty + 12}`} stroke={accent} strokeWidth={7} strokeLinecap="round" />
      {top}
      <Sparkle cx={tx + 24} cy={ty - 20} r={7} fill="#fff6a8" />
      <Sparkle cx={tx - 22} cy={ty - 22} r={5} fill="#fff6a8" />
    </g>
  );
}

function Shoes({ item }: { item: DressItem }) {
  const [main, accent, trim] = item.colors;
  return (
    <g>
      {[132, 168].map((x, i) => {
        const dir = i === 0 ? -1 : 1;
        switch (item.style) {
          case 'boot':
            return (
              <g key={x}>
                <rect x={x - 10} y={400} width={20} height={30} rx={5} fill={main} />
                <path d={`M${x - 10} 424 h20 q${dir * 14} 0 ${dir * 14} 10 h${-dir * 34}Z`} fill={main} />
                <rect x={x - 11} y={400} width={22} height={7} rx={3} fill={accent} />
              </g>
            );
          case 'sandal':
            return (
              <g key={x}>
                <path d={`M${x - 12} 432 h24 q${dir * 6} 0 ${dir * 6} 5 h-34 q0 -5 4 -5Z`} fill={main} />
                <path d={`M${x - 8} 432 L${x} 422 L${x + 8} 432`} stroke={main} strokeWidth={4} fill="none" />
                <circle cx={x} cy={422} r={3} fill={trim} />
              </g>
            );
          case 'rainbow':
            return (
              <g key={x}>
                <path d={`M${x - 12} 420 q0 -6 8 -6 h10 q${dir * 14} 6 ${dir * 16} 16 h${-dir * 34}Z`} fill={main} />
                {RAINBOW.slice(0, 4).map((col, k) => (
                  <path key={col} d={`M${x - 10} ${417 + k * 3} h${18 + k * 3}`} stroke={col} strokeWidth={2.4} transform={dir < 0 ? `translate(${-6} 0)` : undefined} />
                ))}
                <rect x={x - 13} y={428} width={30} height={6} rx={3} fill={trim} transform={dir < 0 ? `translate(${-4} 0)` : undefined} />
              </g>
            );
          case 'sneaker':
            return (
              <g key={x}>
                <path d={`M${x - 12} 420 q0 -6 8 -6 h10 q${dir * 14} 6 ${dir * 16} 16 h${-dir * 34}Z`} fill={main} />
                <rect x={x - 13} y={428} width={30} height={6} rx={3} fill={accent} transform={dir < 0 ? `translate(${-4} 0)` : undefined} />
                <circle cx={x} cy={421} r={2.5} fill={trim} />
              </g>
            );
          default:
            return (
              <g key={x}>
                <path d={`M${x - 12} 424 q12 -10 24 0 q${dir * 6} 4 ${dir * 6} 8 h${-dir * 34} q0 -6 4 -8Z`} fill={main} />
                <circle cx={x} cy={420} r={4} fill={accent} />
                <path d={`M${x - 8} 424 q8 -4 16 0`} stroke={trim} strokeWidth={2} fill="none" opacity={0.8} />
              </g>
            );
        }
      })}
    </g>
  );
}

// ───────────────────────────── Character ─────────────────────────────

export function CharacterArt({ id, outfit }: { id: CharacterId; outfit: Outfit }) {
  const raw = useId();
  const u = `c${raw.replace(/[^a-zA-Z0-9]/g, '')}`;
  const tail = id === 'pearl' ? itemFor(id, outfit, 'tail') : undefined;
  const dress = id !== 'pearl' ? itemFor(id, outfit, 'dress') : undefined;
  const shoes = id !== 'pearl' ? itemFor(id, outfit, 'shoes') : undefined;
  const crown = itemFor(id, outfit, 'crown');
  const necklace = itemFor(id, outfit, 'necklace');
  const wand = itemFor(id, outfit, 'wand');
  return (
    <g>
      <BackHair c={id} />
      {id !== 'pearl' && <Legs c={id} />}
      {shoes && <Shoes item={shoes} />}
      {tail && <Tail item={tail} u={`${u}t`} />}
      {id === 'pearl' && <ShellTop />}
      {dress && <Dress item={dress} u={`${u}d`} />}
      <Arms c={id} holding={Boolean(wand)} />
      <Face c={id} />
      <FrontHair c={id} />
      {necklace && <Necklace item={necklace} u={`${u}n`} />}
      {crown && <Crown item={crown} u={`${u}c`} />}
      {wand && <Wand item={wand} />}
    </g>
  );
}

export function Character({ id, outfit = {}, className, title }: { id: CharacterId; outfit?: Outfit; className?: string; title?: string }) {
  return (
    <svg viewBox={`0 0 ${CHAR_W} ${CHAR_H}`} className={className} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <CharacterArt id={id} outfit={outfit} />
    </svg>
  );
}

/** Crop windows (in character coordinates) for showing one item on its own. */
const THUMB_BOX: Record<Slot, string> = {
  dress: '50 172 200 260',
  tail: '80 236 140 216',
  crown: '96 8 108 82',
  necklace: '112 172 76 66',
  wand: '200 156 76 126',
  shoes: '108 392 84 50',
};

export function ItemArt({ itemId, className, silhouette }: { itemId: string; className?: string; silhouette?: boolean }) {
  const raw = useId();
  const u = `i${raw.replace(/[^a-zA-Z0-9]/g, '')}`;
  const item = REWARD_BY_ID.get(itemId);
  if (!item || item.kind !== 'dress') return null;
  let art: ReactNode;
  switch (item.slot) {
    case 'dress':
      art = <Dress item={item} u={u} />;
      break;
    case 'tail':
      art = <Tail item={item} u={u} />;
      break;
    case 'crown':
      art = <Crown item={item} u={u} />;
      break;
    case 'necklace':
      art = <Necklace item={item} u={u} />;
      break;
    case 'wand':
      art = <Wand item={item} />;
      break;
    case 'shoes':
      art = <Shoes item={item} />;
      break;
  }
  return (
    <svg viewBox={THUMB_BOX[item.slot]} className={className} aria-hidden>
      {silhouette ? (
        <>
          <defs>
            <filter id={`${u}sil`}>
              <feFlood floodColor="#d9c8f5" />
              <feComposite in2="SourceAlpha" operator="in" />
            </filter>
          </defs>
          <g filter={`url(#${u}sil)`}>{art}</g>
        </>
      ) : (
        art
      )}
    </svg>
  );
}
