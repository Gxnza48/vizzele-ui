'use client';

import { useState, type ReactNode } from 'react';
import {
  Counter,
  HorizontalScroll,
  MorphText,
  Parallax,
  Reveal,
  ScrambleText,
  ScrollProgress,
  ShimmerText,
  SmoothScroll,
  StickyStack,
  TextReveal,
  WeightWave,
  type RevealOptions,
} from '@vizzele/react';
import type { ControlValues } from '@/lib/types';

type P = { values: ControlValues };

const hues = ['#00e5ff', '#ff2bd6', '#ffb238', '#a8ff3e', '#7c5cff'];
const gradient = (i: number) =>
  `linear-gradient(${(i * 67) % 360}deg, ${hues[i % 5]}, ${hues[(i + 2) % 5]})`;

const glyphs: Record<string, string> = {
  symbols: '!<>-_\\/[]{}—=+*^?#',
  binary: '01',
  katakana: 'アイウエオカキクケコサシスセソタチツテト',
};

export function ScrambleDemo({ values }: P) {
  const [n, setN] = useState(0);
  return (
    <div className="demo-center demo-col">
      <ScrambleText
        key={n}
        as="h2"
        className="vz-display demo-big"
        duration={Number(values.duration)}
        chars={glyphs[String(values.chars)]!}
        trigger="mount"
      >
        {String(values.text)}
      </ScrambleText>
      <button type="button" className="vz-button" onClick={() => setN((x) => x + 1)}>
        Replay
      </button>
    </div>
  );
}

export function TextRevealDemo({ values }: P) {
  const [n, setN] = useState(0);
  return (
    <div className="demo-center demo-col">
      <TextReveal
        key={`${n}-${values.by}-${values.variant}-${values.stagger}`}
        as="h2"
        className="vz-display demo-big demo-measure"
        by={values.by as 'words'}
        variant={values.variant as 'rise'}
        stagger={Number(values.stagger)}
      >
        Everything here moves with weight and light.
      </TextReveal>
      <button type="button" className="vz-button" onClick={() => setN((x) => x + 1)}>
        Replay
      </button>
    </div>
  );
}

export function ShimmerDemo({ values }: P) {
  return (
    <div className="demo-center demo-col">
      <h2 className="vz-display demo-big">
        <ShimmerText variant={values.variant as 'shimmer'} speed={Number(values.speed)}>
          {values.variant === 'shimmer' ? 'Generating your palette…' : 'Holographic'}
        </ShimmerText>
      </h2>
    </div>
  );
}

export function WeightWaveDemo({ values }: P) {
  return (
    <div className="demo-center">
      <h2 className="demo-wave">
        <WeightWave
          min={Number(values.min)}
          max={Number(values.max)}
          radius={Number(values.radius)}
          width={Boolean(values.width)}
        >
          Hover the light
        </WeightWave>
      </h2>
    </div>
  );
}

export function MorphDemo({ values }: P) {
  const words = String(values.words)
    .split(',')
    .map((w) => w.trim())
    .filter(Boolean);
  return (
    <div className="demo-center">
      <h2 className="vz-display demo-big demo-morph">
        <span className="vz-muted">Interfaces that feel</span>
        <MorphText
          words={words.length ? words : ['liquid']}
          hold={Number(values.hold)}
          morph={Number(values.morph)}
          className="vz-text-iridescent demo-morph-word"
        />
      </h2>
    </div>
  );
}

const formats: Record<string, Intl.NumberFormatOptions> = {
  plain: {},
  compact: { notation: 'compact' },
  currency: { style: 'currency', currency: 'USD' },
  percent: { style: 'percent' },
};

export function CounterDemo({ values }: P) {
  const f = String(values.format);
  const v = Number(values.value);
  const spring = { stiffness: Number(values.stiffness), damping: Number(values.damping) };
  return (
    <div className="demo-center demo-row demo-gap-lg">
      <div className="stat">
        <Counter
          value={f === 'percent' ? v / 100000 : v}
          format={formats[f]!}
          decimals={f === 'percent' ? 1 : 0}
          spring={spring}
          className="vz-display stat-num"
        />
        <span className="vz-muted">drag the value slider →</span>
      </div>
      <div className="stat">
        <Counter value={60} suffix=" fps" spring={spring} className="vz-display stat-num" />
        <span className="vz-muted">steady</span>
      </div>
    </div>
  );
}

/** Scrollable box inside the stage; scroll effects are given it as their container. */
function ScrollBox({ children }: { children: (box: HTMLElement) => ReactNode }) {
  const [box, setBox] = useState<HTMLElement | null>(null);
  return (
    <div ref={setBox} className="scroll-box" tabIndex={0} aria-label="Scrollable demo">
      {box ? children(box) : null}
    </div>
  );
}

const Spacer = ({ label = 'Scroll ↓' }: { label?: string }) => (
  <div className="scroll-spacer">
    <span className="vz-muted">{label}</span>
  </div>
);

export function ParallaxDemo({ values }: P) {
  const d = Number(values.depth);
  const zoom = Boolean(values.zoom);
  return (
    <ScrollBox>
      {(box) => (
        <>
          <Spacer />
          <div className="parallax-scene">
            <Parallax container={box} speed={d} zoom={zoom} className="px-layer px-far" />
            <Parallax container={box} speed={d * 0.55} zoom={zoom} className="px-layer px-mid" />
            <Parallax container={box} speed={d * 0.2} className="px-layer px-near" />
            <Parallax container={box} speed={-d * 0.35} className="px-title">
              <h3 className="vz-display">Depth</h3>
            </Parallax>
          </div>
          <Spacer label="" />
        </>
      )}
    </ScrollBox>
  );
}

export function HorizontalScrollDemo() {
  return (
    <ScrollBox>
      {(box) => (
        <>
          <Spacer />
          <HorizontalScroll container={box} label="Projects" className="hs-demo">
            {Array.from({ length: 7 }, (_, i) => (
              <article key={i} className="hs-card" style={{ background: gradient(i) }}>
                <span className="vz-mono">0{i + 1}</span>
                <strong className="vz-heading">
                  {['Fluid', 'Prism', 'Halo', 'Chrome', 'Spark', 'Grain', 'Orbit'][i]}
                </strong>
              </article>
            ))}
          </HorizontalScroll>
          <Spacer label="The end" />
        </>
      )}
    </ScrollBox>
  );
}

export function StickyStackDemo({ values }: P) {
  return (
    <ScrollBox>
      {(box) => (
        <div className="stack-demo">
          <Spacer />
          <StickyStack
            container={box}
            scale={Number(values.scale)}
            style={{ '--vz-stack-top': '24px' } as React.CSSProperties}
          >
            {['Springs', 'Inertia', 'Gestures', 'Light'].map((t, i) => (
              <article key={t} className="stack-card" style={{ background: gradient(i) }}>
                <span className="vz-mono">0{i + 1}</span>
                <h3 className="vz-display">{t}</h3>
              </article>
            ))}
          </StickyStack>
          <Spacer label="" />
        </div>
      )}
    </ScrollBox>
  );
}

export function ScrollProgressDemo() {
  return (
    <div className="progress-demo">
      <ScrollBox>
        {(box) => (
          <>
            <ScrollProgress container={box} className="progress-demo-bar" />
            <article className="prose progress-article">
              <h3 className="vz-heading">On liquid light</h3>
              {Array.from({ length: 9 }, (_, i) => (
                <p key={i}>
                  Light behaves like a liquid when it meets a surface that isn&apos;t quite flat: it
                  pools, it bends, it splits into the colors it was hiding. An interface can borrow
                  that — not as decoration, but as feedback. The bar above fills as you read.
                </p>
              ))}
            </article>
          </>
        )}
      </ScrollBox>
    </div>
  );
}

export function RevealDemo({ values }: P) {
  const opts = {
    from: values.from as RevealOptions['from'],
    stagger: Number(values.stagger),
    distance: Number(values.distance),
    once: Boolean(values.once),
  };
  return (
    <ScrollBox>
      {() => (
        <>
          <Spacer />
          <Reveal key={JSON.stringify(opts)} {...opts} className="reveal-grid">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="vz-card reveal-tile">
                <span className="reveal-dot" style={{ background: gradient(i) }} />
                <span>Tile {i + 1}</span>
              </div>
            ))}
          </Reveal>
          <Spacer label="Scroll back up and down" />
        </>
      )}
    </ScrollBox>
  );
}

export function SmoothScrollDemo({ values }: P) {
  return (
    <ScrollBox>
      {(box) => (
        <>
          <SmoothScroll container={box} lerp={Number(values.lerp)} disabled={!values.enabled} />
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="smooth-row" style={{ background: gradient(i) }}>
              <span className="vz-display">{String(i + 1).padStart(2, '0')}</span>
            </div>
          ))}
        </>
      )}
    </ScrollBox>
  );
}
