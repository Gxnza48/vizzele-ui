'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import { clamp, onScroll } from '@vizzele/core';
import { Aurora, LavaLamp, Silk, WaveLines } from '@vizzele/react/gl';
import { inkOf, PalettePicker, usePalette } from './palette';

type Bg = ComponentType<{ className?: string; colors?: readonly string[] }>;

const lights: { name: string; tag: string; slug: string; C: Bg }[] = [
  { name: 'Aurora', tag: 'curtains of light', slug: 'aurora', C: Aurora },
  { name: 'Silk', tag: 'folds that catch the light', slug: 'silk', C: Silk },
  { name: 'Lava lamp', tag: 'blobs that melt and merge', slug: 'lava-lamp', C: LavaLamp },
  { name: 'Wave lines', tag: 'a field of glowing threads', slug: 'wave-lines', C: WaveLines },
];

/**
 * A pinned full-screen stage whose background changes as you scroll, in the page's palette.
 * One WebGL background runs at a time; the previous one stays only while it fades out.
 */
export function HomeLight() {
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const current = useRef(0);
  const { palette } = usePalette();

  useEffect(
    () =>
      onScroll(() => {
        const el = section.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const p = clamp(-r.top / Math.max(r.height - window.innerHeight, 1), 0, 0.999);
        const next = Math.floor(p * lights.length);
        if (next === current.current) return;
        setPrev(current.current);
        current.current = next;
        setActive(next);
      }),
    [],
  );
  useEffect(() => {
    if (prev === null) return;
    const id = setTimeout(() => setPrev(null), 900);
    return () => clearTimeout(id);
  }, [prev, active]);

  const colors = inkOf(palette);
  const light = lights[active]!;
  return (
    <section ref={section} className="home-light" aria-labelledby="light-title">
      <div className="light-stage">
        {lights.map(({ C, name }, i) =>
          i === active || i === prev ? (
            <div key={name} className="light-bg" data-on={i === active ? '' : undefined}>
              <C colors={colors} />
            </div>
          ) : null,
        )}
        <div className="light-veil" aria-hidden="true" />
        <div className="light-copy">
          <p className="home-eyebrow">Backgrounds · WebGL2, no three.js</p>
          <h2 id="light-title" className="vz-display light-title">
            Pick your light.
          </h2>
          <p key={light.name} className="light-name">
            <span className="vz-display">{light.name}</span>
            <span className="vz-muted"> — {light.tag}</span>
          </p>
          <code className="light-code">
            {`<${light.name.replace(' ', '')} colors={[${colors.map((c) => `'${c}'`).join(', ')}]} />`}
          </code>
          <PalettePicker className="light-picker" />
          <Link href={`/docs/${light.slug}`} className="coll-link">
            {light.name} docs →
          </Link>
        </div>
        <ol className="light-dots" aria-hidden="true">
          {lights.map((l, i) => (
            <li key={l.name} data-on={i === active ? '' : undefined} />
          ))}
        </ol>
      </div>
    </section>
  );
}
