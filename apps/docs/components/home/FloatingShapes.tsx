'use client';

import { useEffect, useRef } from 'react';
import { createSprings, onPointerMove, prefersReducedMotion } from '@vizzele/core';

const shapes = [
  { cls: 'fs-spring', x: '3%', y: '58%', depth: 38, rot: -8 },
  { cls: 'fs-orb', x: '89%', y: '12%', depth: 60, rot: 0 },
  { cls: 'fs-chip', x: '80%', y: '78%', depth: 30, rot: 6 },
  { cls: 'fs-ring', x: '8%', y: '16%', depth: 52, rot: 0 },
];

/**
 * Glass objects floating at different depths around the hero. They drift against the pointer
 * on springs — nearer ones move more — so the hero reads as layered space.
 */
export function FloatingShapes() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const groups = shapes.map((s, i) =>
      createSprings(
        { x: 0, y: 0, r: 0 },
        {
          stiffness: 90 - i * 8,
          damping: 14,
          onUpdate: ({ x, y, r }) => {
            const el = refs.current[i];
            if (el) el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${s.rot + r}deg)`;
          },
        },
      ),
    );
    const stop = onPointerMove((p) => {
      groups.forEach((g, i) => {
        const d = shapes[i]!.depth;
        g.set({ x: -p.nx * d, y: -p.ny * d, r: p.nx * d * 0.15 });
      });
    });
    return () => {
      stop();
      groups.forEach((g) => g.stop());
    };
  }, []);

  return (
    <div className="floating-shapes" aria-hidden="true">
      {shapes.map((s, i) => (
        <div key={s.cls} className="fs-anchor" style={{ left: s.x, top: s.y }}>
          <div
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={`fs ${s.cls}`}
          >
            {s.cls === 'fs-spring' && (
              <svg viewBox="0 0 120 60" fill="none">
                <path
                  d="M4 50 C 24 50, 30 6, 46 8 S 62 30, 72 22 S 86 14, 96 18 S 110 16, 116 16"
                  stroke="url(#fs-g)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient
                    id="fs-g"
                    x1="0"
                    x2="120"
                    y1="0"
                    y2="0"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#00e5ff" />
                    <stop offset=".5" stopColor="#ff2bd6" />
                    <stop offset="1" stopColor="#ffb238" />
                  </linearGradient>
                </defs>
              </svg>
            )}
            {s.cls === 'fs-chip' && (
              <>
                <span className="fs-chip-dot" />
                stiffness 210 · damping 20
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
