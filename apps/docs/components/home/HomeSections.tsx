'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import {
  Button,
  Checkbox,
  Counter,
  Draggable,
  DropdownMenu,
  ElasticSlider,
  HoloCard,
  Input,
  LiquidGlass,
  Magnetic,
  Marquee,
  Modal,
  PhysicsWorld,
  Reveal,
  ScrambleText,
  Select,
  SpotlightCard,
  StickyStack,
  Switch,
  Tabs,
  TextReveal,
  Toaster,
  WeightWave,
  toast,
  type PhysicsWorldApi,
} from '@vizzele/react';
import { LensGrid, LiquidMetal, MeshGradient } from '@vizzele/react/gl';

const hues = ['#00e5ff', '#ff2bd6', '#ffb238', '#a8ff3e', '#7c5cff'];
// Backgrounds avoid amber↔acid blends, which mix into olive.
const deepPalette = ['#00e5ff', '#7c5cff', '#ff2bd6', '#3b2bff'];
const warmPalette = ['#ff2bd6', '#7c5cff', '#00e5ff', '#b04dff'];
const gradient = (i: number) =>
  `linear-gradient(${(i * 67) % 360}deg, ${hues[i % 5]}, ${hues[(i + 2) % 5]})`;

// ——————————————————————————— Throw arena ———————————————————————————

const throwables = [
  { t: 'Springs', d: 'Analytic. Exact at any fps.', href: '/docs/guides/springs' },
  { t: 'Inertia', d: 'Throw it at the wall.', href: '/docs/draggable' },
  { t: 'Glass', d: 'It really refracts.', href: '/docs/liquid-glass' },
  { t: 'Fluid', d: 'Stir the ink.', href: '/docs/fluid' },
];

export function HomePlayground() {
  const [elastic, setElastic] = useState(45);
  const [power, setPower] = useState(10);
  return (
    <section id="playground" className="home-section" aria-labelledby="pg-title">
      <div className="home-section-head">
        <p className="home-eyebrow">Mass, momentum, rubber</p>
        <TextReveal as="h2" by="words" className="vz-display home-h2" id="pg-title">
          Go on. Throw them.
        </TextReveal>
        <p className="home-sub">
          Every card has weight. Fling it — it glides, stretches against the walls and settles. Then
          tune the physics and do it again.
        </p>
      </div>
      <div className="home-arena">
        <LensGrid className="home-arena-grid" cell={34} strength={0.3} />
        {throwables.map((c, i) => (
          <Draggable
            key={c.t}
            bounds="parent"
            elastic={elastic / 100}
            power={power / 10}
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
      <div className="home-arena-tuner vz-glass">
        <div className="home-tuner-field">
          <span>Wall elasticity</span>
          <ElasticSlider
            label="Wall elasticity"
            value={elastic}
            onChange={setElastic}
            formatValue={(v) => `${Math.round(v)}%`}
          />
        </div>
        <div className="home-tuner-field">
          <span>Throw power</span>
          <ElasticSlider
            label="Throw power"
            min={2}
            max={25}
            value={power}
            onChange={setPower}
            formatValue={(v) => `${(v / 10).toFixed(1)}×`}
          />
        </div>
      </div>
    </section>
  );
}

// ——————————————————————————— The kit ———————————————————————————

export function HomeKit() {
  const [on, setOn] = useState(true);
  const [stars, setStars] = useState(4820);
  const [open, setOpen] = useState(false);
  const modalBtn = useRef<HTMLButtonElement>(null);
  return (
    <section className="home-section" aria-labelledby="kit-title">
      <Toaster position="bottom-right" />
      <div className="home-section-head">
        <p className="home-eyebrow">Live components, not screenshots</p>
        <TextReveal as="h2" by="words" className="vz-display home-h2" id="kit-title">
          A whole kit that reacts to you.
        </TextReveal>
        <p className="home-sub">Every tile below is the real component. Use them.</p>
      </div>
      <Reveal stagger={70} from="blur" className="home-bento">
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
          <p className="bento-label">Select</p>
          <div className="bento-center bento-pad">
            <Select
              label="Material"
              defaultValue="glass"
              options={[
                { value: 'glass', label: 'Liquid glass', description: 'Refracts the world' },
                { value: 'holo', label: 'Holographic', description: 'Shifts with the angle' },
                { value: 'chrome', label: 'Liquid chrome', description: 'Iridescent film' },
                { value: 'light', label: 'Pure light', description: 'Glows and breathes' },
              ]}
            />
          </div>
        </SpotlightCard>
        <SpotlightCard className="bento">
          <p className="bento-label">Dropdown menu</p>
          <div className="bento-center">
            <DropdownMenu
              items={[
                { type: 'label', label: 'Project' },
                { label: 'Duplicate', shortcut: '⌘D', onSelect: () => toast('Duplicated') },
                { label: 'Share link', shortcut: '⌘S', onSelect: () => toast.info('Link copied') },
                { type: 'separator' },
                {
                  label: 'Delete',
                  danger: true,
                  onSelect: () => toast.error('Deleted (not really)'),
                },
              ]}
            >
              {(p) => (
                <Button {...p} variant="holo">
                  Actions ▾
                </Button>
              )}
            </DropdownMenu>
          </div>
        </SpotlightCard>
        <SpotlightCard className="bento">
          <p className="bento-label">Toasts</p>
          <div className="bento-center bento-col">
            <Button
              variant="liquid"
              onClick={() =>
                toast.success({
                  title: 'Deployed',
                  description: 'Your springs are live on the edge.',
                })
              }
            >
              Fire a toast
            </Button>
            <span className="vz-muted bento-hint">then flick it away</span>
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
          <p className="bento-label">Micro-physics</p>
          <div className="bento-center bento-col bento-left">
            <Switch label="Liquid mode" checked={on} onCheckedChange={setOn} />
            <Checkbox label="Iridescent accents" defaultChecked />
          </div>
        </SpotlightCard>

        <SpotlightCard className="bento">
          <p className="bento-label">Morphing modal</p>
          <div className="bento-center">
            <Button ref={modalBtn} onClick={() => setOpen(true)}>
              Open the modal
            </Button>
            <Modal
              open={open}
              onOpenChange={setOpen}
              originRef={modalBtn}
              title="It grew out of the button"
              description="Close it and watch it shrink back. You can also drag the header down."
            >
              <div className="bento-modal-body">
                <Input label="Project name" defaultValue="Aurora" />
                <Button variant="liquid" onClick={() => setOpen(false)}>
                  Done
                </Button>
              </div>
            </Modal>
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
      </Reveal>
      <div className="home-ctas home-ctas-center">
        <Button as={Link} href="/docs" variant="ghost">
          See every component →
        </Button>
      </div>
    </section>
  );
}

// ——————————————————————————— Materials ———————————————————————————

export function HomeMaterials() {
  return (
    <section className="home-section" aria-labelledby="mat-title">
      <div className="home-section-head">
        <p className="home-eyebrow">Liquid light</p>
        <TextReveal as="h2" by="words" className="vz-display home-h2" id="mat-title">
          Materials you can almost touch.
        </TextReveal>
        <p className="home-sub">
          Glass that bends what&apos;s behind it, foil that shifts with the angle, chrome that melts
          and reaches for your pointer.
        </p>
      </div>
      <div className="home-materials">
        <MeshGradient
          className="home-materials-bg"
          speed={0.18}
          intensity={0.8}
          colors={deepPalette}
        />
        <div className="home-materials-stripes" aria-hidden="true" />
        <div className="home-materials-grid">
          <HoloCard max={16} className="mat-holo">
            <span className="holo-chip" aria-hidden="true" />
            <span className="vz-heading mat-holo-name">Holo foil</span>
            <span className="vz-mono mat-holo-meta">TILT ME · 0001</span>
          </HoloCard>
          <LiquidGlass refraction={46} className="mat-glass">
            <span className="mat-glass-kicker vz-mono">refraction: 46px</span>
            <h3 className="vz-display">Liquid glass</h3>
            <p>The lines behind this panel bend at its rim — real refraction, not a blur.</p>
            <Link href="/docs/liquid-glass" className="mat-link">
              How it works →
            </Link>
          </LiquidGlass>
          <div className="mat-metal">
            <LiquidMetal blobs={4} size={0.85} iridescence={0.7} />
            <span className="mat-metal-label vz-mono">liquid chrome</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ——————————————————————————— Marquee ———————————————————————————

const names = [
  'Magnetic',
  'Spotlight',
  'Holo tilt',
  'Fluid',
  'Liquid glass',
  'Select',
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
        {[...names].reverse().map((n) => (
          <span key={n} className="home-chip home-chip-ghost">
            {n}
          </span>
        ))}
      </Marquee>
    </section>
  );
}

// ——————————————————————————— Physics world ———————————————————————————

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
  const box = useRef<HTMLDivElement>(null);
  return (
    <section className="home-section" aria-labelledby="phys-title">
      <div className="home-section-head">
        <p className="home-eyebrow">A real physics world</p>
        <TextReveal as="h2" by="words" className="vz-display home-h2" id="phys-title">
          Everything collides.
        </TextReveal>
        <p className="home-sub">Grab a word and throw it into the others. Then turn gravity off.</p>
      </div>
      <div className="home-physics" ref={box}>
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
        <div className="home-physics-actions">
          <Button
            size="sm"
            onClick={() => {
              const el = box.current;
              if (el)
                world.current?.impulse(el.clientWidth / 2, el.clientHeight, 3000, el.clientWidth);
            }}
          >
            Shake it
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => world.current?.setGravity({ x: 0, y: -600 })}
          >
            Zero-g
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => world.current?.setGravity({ x: 0, y: 2000 })}
          >
            Gravity
          </Button>
        </div>
      </div>
    </section>
  );
}

// ——————————————————————————— Principles ———————————————————————————

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
    d: 'Keyboard paths, ARIA patterns and a dignified static version of everything under reduced motion. Zero axe violations.',
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

// ——————————————————————————— Final call to action ———————————————————————————

export function HomeFinalCta() {
  const [copied, setCopied] = useState(false);
  const cmd = 'pnpm add @vizzele/react @vizzele/css';
  return (
    <section className="home-section" aria-labelledby="cta-title">
      <div className="home-cta">
        <MeshGradient
          className="home-cta-bg"
          speed={0.3}
          warp={1.4}
          intensity={0.95}
          colors={warmPalette}
        />
        <div className="home-cta-veil" aria-hidden="true" />
        <div className="home-cta-inner">
          <TextReveal
            as="h2"
            by="words"
            variant="blur"
            className="vz-display home-cta-title"
            id="cta-title"
          >
            Make your interface feel alive.
          </TextReveal>
          <p className="home-cta-lead">
            Free, open source, and ready for React, vanilla JS or plain HTML.
          </p>
          <div className="home-ctas">
            <Button as={Link} href="/docs/guides/installation" variant="liquid" size="lg" magnetic>
              Install Vizzele
            </Button>
            <Button as={Link} href="/docs" variant="holo" size="lg" magnetic>
              Read the docs
            </Button>
          </div>
          <button
            type="button"
            className="home-install home-install-cta"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(cmd);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {
                /* clipboard blocked */
              }
            }}
            aria-label={`Copy install command: ${cmd}`}
          >
            <span className="home-install-prompt" aria-hidden="true">
              $
            </span>
            <ScrambleText key={String(copied)} trigger={copied ? 'mount' : 'view'} duration={600}>
              {copied ? 'copied to clipboard ✓' : cmd}
            </ScrambleText>
          </button>
        </div>
      </div>
    </section>
  );
}
