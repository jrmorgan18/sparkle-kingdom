import { useMemo } from 'react';
import { useReducedMotion } from 'motion/react';

const COLORS = ['#ff5ca8', '#ffc531', '#17b3ad', '#3a8dff', '#b17aff', '#ff9fd2', '#ffffff'];

/** A short, one-shot sparkle burst. Skipped entirely when reduced motion is on. */
export function Confetti({ pieces = 26 }: { pieces?: number }) {
  const reduce = useReducedMotion();
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }).map((_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
        dur: 1.4 + Math.random() * 1,
        dx: `${(Math.random() - 0.5) * 30}vw`,
        color: COLORS[i % COLORS.length],
        w: 8 + Math.random() * 8,
        star: i % 3 === 0,
      })),
    [pieces],
  );
  if (reduce || document.documentElement.classList.contains('motion-reduced')) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {bits.map((b, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: 0,
            left: `${b.left}%`,
            width: b.w,
            height: b.w,
            background: b.color,
            borderRadius: b.star ? 2 : '50%',
            clipPath: b.star ? 'polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' : undefined,
            animation: `sk-confetti ${b.dur}s ease-in ${b.delay}s forwards`,
            ['--dx' as string]: b.dx,
            transform: 'translateY(-10vh)',
          }}
        />
      ))}
    </div>
  );
}
