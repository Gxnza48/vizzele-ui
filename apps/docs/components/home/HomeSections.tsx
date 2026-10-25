'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import {
  Button,
  Counter,
  Draggable,
  ElasticSlider,
  HoloCard,
  Magnetic,
  Marquee,
  PhysicsWorld,
  Reveal,
  Ripple,
  SpotlightCard,
  StickyStack,
  Switch,
  Tabs,
  TextReveal,
  WeightWave,
  type PhysicsWorldApi,
} from '@vizzele/react';
import { LensGrid } from '@vizzele/react/gl';

const hues = ['#00e5ff', '#ff2bd6', '#ffb238', '#a8ff3e', '#7c5cff'];
const gradient = (i: number) =>
  `linear-gradient(${(i * 67) % 360}deg, ${hues[i % 5]}, ${hues[(i + 2) % 5]})`;

const throwables = [
  { t: 'Springs', d: 'Analytic. Exact at any fps.', href: '/docs/guides/springs' },
  { t: 'Inertia', d: 'Throw it at the wall.', href: '/docs/draggable' },
  { t: 'Glass', d: 'It really refracts.', href: '/docs/liquid-glass' },
  { t: 'Fluid', d: 'Stir the ink.', href: '/docs/fluid' },
];

export function HomePlayground() {
  return (
    <section id="playground" className="home-section" aria-labelledby="pg-title">
      <div className="home-section-head">
        <p className="home-eyebrow">Physics, not keyframes</p>
        <TextReveal as="h2" by="words" className="vz-display home-h2">
          Go on. Throw them.
        </TextReveal>
        <p className="home-sub">
          Every card has mass. Fling it — it glides, bounces off the walls and settles.
        </p>
      </div>
      <div className="home-arena">
        <LensGrid className="home-arena-grid" cell={34} strength={0.3} />
        {throwables.map((c, i) => (
          <Draggable
            key={c.t}
            bounds="parent"
            elastic={0.45}
            rotate={8}
            stretch={0.35}
            className="home-throw"
            style={{ left: `${8 + i * 23}%`, top: `${14 + (i % 2) * 34}%` }}
            aria-label={`${c.t} card, draggable`}
          >
            <HoloCard max={12} className="home-throw-card">
              <span className="home-throw-chip" style={{ background: gradient(i) }} />
              <strong className="vz-heading">{c.t}</strong>
              <span className="vz-muted">{c.d}</span>
              <Link href={c.href} className="home-throw-link" data-vz-no-drag>
                Explore →
              </Link>
            </HoloCard>
          </Draggable>
        ))}
      </div>
    </section>
  );
}

export function HomeBento() {
  const [on, setOn] = useState(true);
  const [stars, setStars] = useState(4820);
  return (
    <section className="home-section" aria-labelledby="bento-title">
      <div className="home-section-head">
        <p className="home-eyebrow">Live demos, not screenshots</p>
        <TextReveal as="h2" by="words" className="vz-display home-h2" id="bento-title">
          Every surface reacts to you.
        </TextReveal>
      </div>
      <Reveal stagger={80} from="blur" className="home-bento">
        <SpotlightCard className="bento bento-wide">
          <p className="bento-label">Variable type</p>
          <h3 className="bento-wave">
            <WeightWave min={250} max={800} radius={150} width>
              Hover the weight
            </WeightWave>
          </h3>
        </SpotlightCard>
        <SpotlightCard className="bento">
          <p className="bento-label">Magnetic</p>
          <div className="bento-center">
            <Magnetic strength={0.45} radius={110}>
              <button type="button" className="bento-orb" aria-label="Magnetic orb">
                <span />
              </button>
            </Magnetic>
          </div>
        </SpotlightCard>
        <SpotlightCard className="bento">
          <p className="bento-label">Elastic slider</p>
          <div className="bento-center bento-pad">
            <ElasticSlider label="Intensity" defaultValue={62} />
          </div>
        </SpotlightCard>
        <SpotlightCard className="bento">
          <p className="bento-label">Spring counter</p>
          <div className="bento-center bento-col">
            <Counter value={stars} className="vz-display bento-number" />
            <Button
              size="sm"
              variant="holo"
              onClick={() => setStars((s) => s + Math.round(200 + Math.random() * 900))}
            >
              + stars
            </Button>
          </div>
        </SpotlightCard>
        <SpotlightCard className="bento">
          <p className="bento-label">Micro-physics</p>
          <div className="bento-center bento-col">
            <Switch label="Liquid mode" checked={on} onCheckedChange={setOn} />
          </div>
        </SpotlightCard>
        <SpotlightCard className="bento bento-wide">
          <p className="bento-label">Liquid tabs</p>
          <div className="bento-center">
            <Tabs
              label="Plans"
              items={[
                { value: 'm', label: 'Monthly' },
                { value: 'y', label: 'Yearly' },
                { value: 'l', label: 'Lifetime' },
                { value: 'e', label: 'Enterprise' },
              ]}
            />
          </div>
        </SpotlightCard>
        <SpotlightCard className="bento">
          <p className="bento-label">Liquid ripple</p>
          <Ripple as="button" type="button" className="bento-ripple" opacity={0.5}>
            Tap anywhere
          </Ripple>
        </SpotlightCard>
      </Reveal>
    </section>
  );
}

const names = [
  'Magnetic',
  'Spotlight',
  'Holo tilt',
  'Fluid',
  'Liquid glass',
  'Swipe stack',
  'Reorder',
  'Bottom sheet',
  'Dock',
  'Morph text',
  'Weight wave',
  'Lens grid',
  'Liquid metal',
  'Carousel 3D',
];

export function HomeMarquee() {
  return (
    <section className="home-marquee" aria-label="Component names">
      <Marquee speed={50} label="Components">
        {names.map((n, i) => (
          <Link key={n} href="/docs" className="home-chip">
            <span className="home-chip-dot" style={{ background: gradient(i) }} />
            {n}
          </Link>
        ))}
      </Marquee>
      <Marquee speed={36} reverse label="More components">
        {[...names].reverse().map((n, i) => (
          <span key={n} className="home-chip home-chip-ghost">
            {n}
          </span>
        ))}
      </Marquee>
    </section>
  );
}

const words = [
  'spring',
  'mass',
  'damping',
  'inertia',
  'glass',
  'holo',
  'chrome',
  'light',
  'drag',
  'fling',
  'grain',
  'ink',
];

export function HomePhysics() {
  const world = useRef<PhysicsWorldApi | null>(null);
  return (
    <section className="home-section" aria-labelledby="phys-title">
      <div className="home-section-head">
        <p className="home-eyebrow">A real physics world</p>
        <TextReveal as="h2" by="words" className="vz-display home-h2" id="phys-title">
          Everything collides.
        </TextReveal>
        <p className="home-sub">Grab a word and throw it into the others.</p>
      </div>
      <div className="home-physics">
        <PhysicsWorld
          worldRef={world}
          restitution={0.5}
          className="home-physics-world"
          label="Word playground"
        >
          {words.map((w, i) => (
            <span
              key={w}
              className="home-ball"
              style={{
                width: 70 + (w.length % 4) * 18,
                height: 70 + (w.length % 4) * 18,
                background: gradient(i),
              }}
            >
              {w}
            </span>
          ))}
        </PhysicsWorld>
        <Button
          size="sm"
          className="home-physics-shake"
          onClick={() => {
            const el = document.querySelector('.home-physics-world') as HTMLElement | null;
            if (el)
              world.current?.impulse(el.clientWidth / 2, el.clientHeight, 3000, el.clientWidth);
          }}
        >
          Shake it
        </Button>
      </div>
    </section>
  );
}

const pillars = [
  {
    n: '01',
    t: 'Physics',
    d: 'Analytic springs, inertia with rubber-band walls, a 2D world. Nothing uses a linear easing or an arbitrary duration.',
  },
  {
    n: '02',
    t: 'Light',
    d: 'Iridescent materials that react to the pointer: holo foil, refracting glass, fluid ink, liquid chrome.',
  },
  {
    n: '03',
    t: 'Access',
    d: 'Keyboard paths, ARIA patterns and a dignified static version of everything under reduced motion.',
  },
];

export function HomePillars() {
  return (
    <section className="home-section" aria-label="Principles">
      <StickyStack className="home-pillars">
        {pillars.map((p, i) => (
          <article key={p.t} className="home-pillar" style={{ background: gradient(i + 1) }}>
            <span className="vz-mono home-pillar-n">{p.n}</span>
            <h3 className="vz-display">{p.t}</h3>
            <p>{p.d}</p>
          </article>
        ))}
      </StickyStack>
    </section>
  );
}

export function HomeStats({ components }: { components: number }) {
  return (
    <section className="home-section home-stats" aria-label="By the numbers">
      {[
        { v: components, s: '', l: 'components & effects' },
        { v: 0, s: '', l: 'runtime dependencies in core' },
        { v: 60, s: ' fps', l: 'target — paused when off-screen' },
        { v: 3, s: '', l: 'ways to use it: React, JS, HTML' },
      ].map((x) => (
        <div key={x.l} className="home-stat">
          <Counter value={x.v} suffix={x.s} className="vz-display home-stat-n" />
          <span className="vz-muted">{x.l}</span>
        </div>
      ))}
    </section>
  );
}
