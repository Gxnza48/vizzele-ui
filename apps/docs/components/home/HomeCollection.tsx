'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Agent,
  AgentSteps,
  AreaChart,
  Button,
  Counter,
  Draggable,
  ElasticSlider,
  HoldButton,
  HoloCard,
  HorizontalScroll,
  LiquidGlass,
  LiquidSelection,
  Magnetic,
  PhysicsWorld,
  Select,
  SpotlightCard,
  SurfaceTension,
  Switch,
  Checkbox,
  Tabs,
  Toaster,
  WeightWave,
  toast,
  type AgentState,
  type AgentStep,
  type PhysicsWorldApi,
} from '@vizzele/react';
import { CausticCard, LensGrid, LiquidMetal, MeshGradient } from '@vizzele/react/gl';
import { makeRows } from '@/demos/data';
import { usePhone } from './usePhone';

const hues = ['#00e5ff', '#ff2bd6', '#ffb238', '#a8ff3e', '#7c5cff'];
const gradient = (i: number) =>
  `linear-gradient(${(i * 67) % 360}deg, ${hues[i % 5]}, ${hues[(i + 2) % 5]})`;

// ——————————————————————————— Throw arena ———————————————————————————

const throwables = [
  { t: 'Springs', d: 'Analytic. Exact at any fps.' },
  { t: 'Inertia', d: 'Throw it at the wall.' },
  { t: 'Glass', d: 'It really refracts.' },
  { t: 'Fluid', d: 'Stir the ink.' },
];

function Arena() {
  return (
    <div className="coll-arena">
      <LensGrid className="home-arena-grid" cell={34} strength={0.3} />
      {throwables.map((c, i) => (
        <Draggable
          key={c.t}
          bounds="parent"
          elastic={0.45}
          rotate={8}
          stretch={0.35}
          className="home-throw"
          style={{ left: `${6 + i * 23}%`, top: `${12 + (i % 2) * 40}%` }}
          aria-label={`${c.t} card, draggable`}
        >
          <HoloCard max={12} className="home-throw-card">
            <span className="home-throw-chip" style={{ background: gradient(i) }} />
            <strong className="vz-heading">{c.t}</strong>
            <span className="vz-muted">{c.d}</span>
          </HoloCard>
        </Draggable>
      ))}
    </div>
  );
}

// ——————————————————————————— Originals ———————————————————————————

const chips = ['Springs', 'Inertia', 'Glass', 'Fluid', 'Holo'];

function Originals() {
  const [chip, setChip] = useState('Glass');
  return (
    <div className="coll-grid coll-grid-2">
      <article className="orig-tile orig-caustics">
        <CausticCard cardClassName="orig-caustic-card" spread={70} scale={60}>
          <span className="orig-kicker vz-mono">caustics</span>
          <h4>Glass that casts light</h4>
          <p>Move your pointer — you hold the lamp.</p>
        </CausticCard>
      </article>
      <article className="orig-tile">
        <span className="orig-kicker vz-mono">hold to confirm</span>
        <div className="orig-center">
          <HoldButton confirmedLabel="Deleted">Hold to delete</HoldButton>
        </div>
        <p className="orig-note">It fills with liquid. Wiggle while holding — it sloshes.</p>
      </article>
      <article className="orig-tile">
        <span className="orig-kicker vz-mono">surface tension</span>
        <div className="orig-center">
          <SurfaceTension className="orig-chips" role="group" aria-label="Topics">
            {chips.map((c) => (
              <button
                key={c}
                type="button"
                className="demo-chip"
                aria-pressed={chip === c}
                onClick={() => setChip(c)}
              >
                {c}
              </button>
            ))}
          </SurfaceTension>
        </div>
      </article>
      <article className="orig-tile">
        <span className="orig-kicker vz-mono">liquid selection</span>
        <LiquidSelection className="orig-select">
          <p>
            Select this text. The highlight springs out of the caret and the lines melt into one
            drop of light.
          </p>
        </LiquidSelection>
      </article>
    </div>
  );
}

// ——————————————————————————— The kit ———————————————————————————

function Kit() {
  const [on, setOn] = useState(true);
  const [stars, setStars] = useState(4820);
  return (
    <div className="coll-grid coll-grid-kit">
      <SpotlightCard className="bento bento-wide">
        <p className="bento-label">Variable type</p>
        <h4 className="bento-wave">
          <WeightWave min={250} max={800} radius={150} width>
            Hover the weight
          </WeightWave>
        </h4>
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
            ]}
          />
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
            ]}
          />
        </div>
      </SpotlightCard>
      <SpotlightCard className="bento">
        <p className="bento-label">Toasts</p>
        <div className="bento-center">
          <Button
            variant="liquid"
            onClick={() =>
              toast.success({ title: 'Deployed', description: 'Your springs are live.' })
            }
          >
            Fire a toast
          </Button>
        </div>
      </SpotlightCard>
      <SpotlightCard className="bento">
        <p className="bento-label">Micro-physics</p>
        <div className="bento-center bento-col bento-left">
          <Switch label="Liquid mode" checked={on} onCheckedChange={setOn} />
          <Checkbox label="Iridescent" defaultChecked />
        </div>
      </SpotlightCard>
      <SpotlightCard className="bento bento-wide">
        <p className="bento-label">Elastic slider</p>
        <div className="bento-center bento-pad">
          <ElasticSlider label="Intensity" defaultValue={62} />
        </div>
      </SpotlightCard>
      <SpotlightCard className="bento bento-wide">
        <p className="bento-label">Spring counter</p>
        <div className="bento-center">
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
    </div>
  );
}

// ——————————————————————————— Materials ———————————————————————————

function Materials() {
  return (
    <div className="coll-materials">
      <MeshGradient
        className="home-materials-bg"
        speed={0.18}
        intensity={0.8}
        colors={['#00e5ff', '#7c5cff', '#ff2bd6', '#3b2bff']}
      />
      <div className="home-materials-stripes" aria-hidden="true" />
      <div className="coll-materials-grid">
        <HoloCard max={16} className="mat-holo">
          <span className="holo-chip" aria-hidden="true" />
          <span className="vz-heading mat-holo-name">Holo foil</span>
          <span className="vz-mono mat-holo-meta">TILT ME · 0001</span>
        </HoloCard>
        <LiquidGlass refraction={46} className="mat-glass">
          <span className="mat-glass-kicker vz-mono">refraction: 46px</span>
          <h4 className="vz-display">Liquid glass</h4>
          <p>The lines behind this panel bend at its rim — real refraction, not a blur.</p>
        </LiquidGlass>
        <div className="mat-metal">
          <LiquidMetal blobs={4} size={0.85} iridescence={0.7} />
          <span className="mat-metal-label vz-mono">liquid chrome</span>
        </div>
      </div>
    </div>
  );
}

// ——————————————————————————— Physics world ———————————————————————————

const words = ['spring', 'mass', 'damping', 'inertia', 'glass', 'holo', 'chrome', 'light', 'fling'];

function Physics() {
  const world = useRef<PhysicsWorldApi | null>(null);
  const box = useRef<HTMLDivElement>(null);
  return (
    <div className="coll-physics" ref={box}>
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
              width: 64 + (w.length % 4) * 16,
              height: 64 + (w.length % 4) * 16,
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
  );
}

// ——————————————————————————— Data & agents ———————————————————————————

const plan = [
  { label: 'Pull last quarter’s numbers', detail: 'warehouse · 3 tables' },
  { label: 'Find what changed', detail: 'compare · 12 months' },
  { label: 'Draft the summary', detail: 'report.md' },
];
const script: { state: AgentState; at: number; label?: string }[] = [
  { state: 'listening', at: 0, label: '“Why did signups jump in March?”' },
  { state: 'thinking', at: 0 },
  { state: 'working', at: 0 },
  { state: 'working', at: 1 },
  { state: 'working', at: 2 },
  { state: 'speaking', at: 3, label: 'Paid social doubled in March…' },
  { state: 'success', at: 3 },
  { state: 'idle', at: 3 },
];

function Data() {
  const phone = usePhone();
  const [seed, setSeed] = useState(0);
  const rows = useMemo(() => makeRows(seed), [seed]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % script.length), 2300);
    return () => clearInterval(id);
  }, []);
  const step = script[tick]!;
  const steps: AgentStep[] = plan.map((p, i) => ({
    ...p,
    status:
      step.state === 'working'
        ? i < step.at
          ? 'done'
          : i === step.at
            ? 'running'
            : 'pending'
        : step.at > i
          ? 'done'
          : 'pending',
  }));
  return (
    <div className="coll-data">
      <aside className="home-dash-agent vz-glass" aria-label="Agent demo">
        <Agent
          state={step.state}
          name="Analyst"
          size={phone ? 64 : 110}
          label={step.label}
          className="home-dash-status"
          layout={phone ? 'row' : 'stack'}
        />
        <AgentSteps steps={steps} aria-label="Agent progress" />
      </aside>
      <div className="home-dash-card">
        <div className="home-dash-card-head">
          <h4>Visitors</h4>
          <Button size="sm" onClick={() => setSeed((s) => s + 1)}>
            Shuffle data
          </Button>
        </div>
        <AreaChart
          title="Visitors per month"
          data={rows}
          index="month"
          series={[
            { key: 'web', label: 'Web' },
            { key: 'app', label: 'App' },
          ]}
          height={phone ? 200 : 260}
        />
      </div>
    </div>
  );
}

// ——————————————————————————— The collection ———————————————————————————

interface Panel {
  eyebrow: string;
  title: string;
  text: string;
  href: string;
  cta: string;
  demo: ReactNode;
}

const panels: Panel[] = [
  {
    eyebrow: 'Mass, momentum, rubber',
    title: 'Go on. Throw them.',
    text: 'Every card has weight: fling it and it glides, stretches against the walls and settles.',
    href: '/docs/draggable',
    cta: 'Drag & physics',
    demo: <Arena />,
  },
  {
    eyebrow: 'Only in Vizzele',
    title: 'Effects you won’t find anywhere else.',
    text: 'Glass that casts light, buttons that fill with liquid, chips that fuse like drops.',
    href: '/docs/liquid-focus',
    cta: 'The originals',
    demo: <Originals />,
  },
  {
    eyebrow: 'Live components, not screenshots',
    title: 'A whole kit that reacts to you.',
    text: 'Every tile is the real component — open the select, fire a toast, flip the switch.',
    href: '/docs',
    cta: 'Every component',
    demo: <Kit />,
  },
  {
    eyebrow: 'Liquid light',
    title: 'Materials you can almost touch.',
    text: 'Glass that bends what’s behind it, foil that shifts with the angle, chrome that melts.',
    href: '/docs/liquid-glass',
    cta: 'Materials',
    demo: <Materials />,
  },
  {
    eyebrow: 'A real physics world',
    title: 'Everything collides.',
    text: 'Grab a word and throw it into the others. Then turn gravity off.',
    href: '/docs/physics',
    cta: 'Physics world',
    demo: <Physics />,
  },
  {
    eyebrow: 'Charts & agents',
    title: 'Data with a pulse. Agents with a face.',
    text: 'Charts that morph between datasets on springs, and an orb that shows what your AI is doing.',
    href: '/docs/line-chart',
    cta: 'Charts & AI',
    demo: <Data />,
  },
];

/** The middle of the page: one pinned row of live panels, travelled sideways as you scroll. */
export function HomeCollection({ components }: { components: number }) {
  const phone = usePhone();
  const wrap = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(0);

  // Phones swipe the row natively (scroll-snap); the pager follows the panel in view.
  useEffect(() => {
    const viewport = wrap.current?.querySelector<HTMLElement>('.vz-hscroll-viewport');
    if (!phone || !viewport) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const left = viewport.getBoundingClientRect().left;
        let best = 0;
        let dist = Infinity;
        viewport.querySelectorAll<HTMLElement>('.coll-panel').forEach((p, i) => {
          const d = Math.abs(p.getBoundingClientRect().left - left - 16);
          if (d < dist) {
            dist = d;
            best = i;
          }
        });
        setSlide(best);
      });
    };
    viewport.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      viewport.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [phone]);

  const goTo = (i: number) => {
    const viewport = wrap.current?.querySelector<HTMLElement>('.vz-hscroll-viewport');
    const panel = viewport?.querySelectorAll<HTMLElement>('.coll-panel')[i];
    if (viewport && panel) viewport.scrollTo({ left: panel.offsetLeft - 16, behavior: 'smooth' });
  };

  const intro = (
    <>
      <p className="home-eyebrow">The collection</p>
      <h2 id="coll-title" className="vz-display home-h2">
        {components} pieces. All of them alive.
      </h2>
    </>
  );

  return (
    <div ref={wrap} className="coll-wrap">
      <Toaster position={phone ? 'bottom-center' : 'bottom-right'} />
      {phone && (
        <header className="coll-intro-phone">
          {intro}
          <p className="home-sub">
            Swipe through — every panel is the real thing. Drag it, press it, break it.
          </p>
        </header>
      )}
      <HorizontalScroll label="The collection" className="home-coll" trackClassName="coll-track">
        {!phone && (
          <article className="coll-intro" aria-labelledby="coll-title">
            {intro}
            <p className="home-sub">
              Keep scrolling — the page turns sideways. Everything on the way is the real thing:
              drag it, press it, break it.
            </p>
            <span className="coll-arrow" aria-hidden="true">
              →
            </span>
          </article>
        )}
        {panels.map((p, i) => (
          <article
            key={p.title}
            className="coll-panel"
            aria-labelledby={`coll-${i}`}
            data-panel={i}
          >
            <header className="coll-copy">
              <span className="coll-n vz-mono">
                {String(i + 1).padStart(2, '0')} / {String(panels.length).padStart(2, '0')}
              </span>
              <p className="home-eyebrow">{p.eyebrow}</p>
              <h3 id={`coll-${i}`} className="vz-display">
                {p.title}
              </h3>
              <p className="coll-text">{p.text}</p>
              <Link href={p.href} className="coll-link">
                {p.cta} →
              </Link>
            </header>
            <div className="coll-demo">{p.demo}</div>
          </article>
        ))}
      </HorizontalScroll>
      {phone && (
        <nav className="coll-pager" aria-label="Collection panels">
          {panels.map((p, i) => (
            <button
              key={p.title}
              type="button"
              aria-label={`${i + 1}: ${p.title}`}
              aria-current={i === slide ? 'true' : undefined}
              onClick={() => goTo(i)}
            />
          ))}
        </nav>
      )}
    </div>
  );
}
