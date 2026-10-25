import type { DocEntry } from '@/lib/types';

export const pointerEntries: DocEntry[] = [
  {
    slug: 'cursor',
    title: 'Cursor',
    category: 'Cursor & pointer',
    description:
      'A liquid cursor: a dot, a ring that lags on a spring and stretches with speed, and a trail of blobs. Grows over links, becomes a beam over text, squeezes while dragging.',
    keywords: ['custom cursor', 'trail', 'pointer', 'follower'],
    controls: [
      { type: 'boolean', name: 'enabled', label: 'Enable in this demo', default: true },
      { type: 'range', name: 'trail', label: 'Trail blobs', min: 0, max: 8, default: 4 },
      { type: 'range', name: 'size', label: 'Ring size', min: 20, max: 64, default: 36 },
      { type: 'range', name: 'stiffness', min: 80, max: 800, step: 10, default: 380 },
      { type: 'range', name: 'damping', min: 8, max: 60, default: 30 },
      { type: 'boolean', name: 'stretch', default: true },
    ],
    code: {
      react: `import { Cursor } from '@vizzele/react';

export function App() {
  return (
    <>
      <Cursor trail={4} />
      <a href="/work" data-vz-cursor-label="Open">Our work</a>
    </>
  );
}`,
      vanilla: `import { cursor } from '@vizzele/core';

const c = cursor({ trail: 4, spring: { stiffness: 380, damping: 30 } });
c.setLabel('Drag');   // show a label
c.setState('hover');  // force a state
c.destroy();`,
      html: `<script src="https://unpkg.com/@vizzele/core/dist/vizzele.global.js"></script>
<body data-vz-custom-cursor="trail: 4">
  <a href="/work" data-vz-cursor-label="Open">Our work</a>
</body>`,
    },
    props: [
      { name: 'trail', type: 'number', default: '4', description: 'Number of trailing blobs.' },
      { name: 'size', type: 'number', default: '36', description: 'Ring diameter in px.' },
      {
        name: 'hideNative',
        type: 'boolean',
        default: 'true',
        description: 'Hide the system cursor while active.',
      },
      {
        name: 'stretch',
        type: 'boolean',
        default: 'true',
        description: 'Stretch the ring along its velocity.',
      },
      {
        name: 'spring',
        type: 'SpringConfig | SpringPreset',
        default: '{ stiffness: 380, damping: 30 }',
        description: 'How the ring follows.',
      },
      {
        name: 'hoverSelector',
        type: 'string',
        description: 'Elements that trigger the hover state.',
      },
      {
        name: 'textSelector',
        type: 'string',
        description: 'Elements that trigger the text state.',
      },
      { name: 'disabled', type: 'boolean', description: 'Turn off without unmounting.' },
    ],
    a11y: [
      'The cursor is purely decorative (`aria-hidden`) and never intercepts pointer events.',
      'Disabled on touch / coarse pointers and when the user prefers reduced motion — the native cursor stays.',
      'Offer a way to turn it off (like the toggle in this site’s header).',
    ],
  },
  {
    slug: 'magnetic',
    title: 'Magnetic',
    category: 'Cursor & pointer',
    description:
      'Elements that get pulled toward the pointer as it approaches, then snap back on a spring.',
    keywords: ['magnet', 'attract', 'hover', 'button'],
    controls: [
      { type: 'range', name: 'strength', min: 0.05, max: 1, step: 0.05, default: 0.4 },
      { type: 'range', name: 'radius', min: 0, max: 240, step: 10, default: 90 },
      { type: 'range', name: 'scale', min: 1, max: 1.3, step: 0.01, default: 1.06 },
      {
        type: 'range',
        name: 'innerStrength',
        label: 'inner parallax',
        min: 0,
        max: 0.8,
        step: 0.05,
        default: 0.3,
      },
      {
        type: 'select',
        name: 'spring',
        options: ['liquid', 'jelly', 'bouncy', 'snappy', 'gentle', 'heavy'],
        default: 'liquid',
      },
    ],
    code: {
      react: `import { Magnetic, useMagnetic } from '@vizzele/react';

<Magnetic strength={0.4} radius={90} inner=".label">
  <button className="vz-button" data-variant="holo">
    <span className="label">Hover me</span>
  </button>
</Magnetic>

// or as a hook
const ref = useMagnetic<HTMLButtonElement>({ strength: 0.4 });
<button ref={ref}>Magnetic</button>`,
      vanilla: `import { magnetic } from '@vizzele/core';

const m = magnetic(document.querySelector('button'), { strength: 0.4, radius: 90 });
m.update({ strength: 0.6 });
m.destroy();`,
      html: `<button class="vz-button" data-vz-magnetic="strength: 0.4; radius: 90">
  Hover me
</button>`,
    },
    props: [
      {
        name: 'strength',
        type: 'number',
        default: '0.35',
        description: 'How much it follows the pointer (0–1).',
      },
      {
        name: 'radius',
        type: 'number',
        default: '80',
        description: 'Extra px around the element where the pull starts.',
      },
      { name: 'scale', type: 'number', default: '1.04', description: 'Scale while attracted.' },
      {
        name: 'inner',
        type: 'string | HTMLElement',
        description: 'A child that moves further (layered parallax).',
      },
      {
        name: 'innerStrength',
        type: 'number',
        default: '0.2',
        description: 'Extra movement of the inner element.',
      },
      {
        name: 'press',
        type: 'boolean',
        default: 'true',
        description: 'Squish on press — the touch alternative to hover.',
      },
      {
        name: 'spring',
        type: 'SpringConfig | SpringPreset',
        default: "'liquid'",
        description: 'Spring used to follow and return.',
      },
    ],
    a11y: [
      'Purely visual: the element keeps its role, focus and click target.',
      'On touch devices there is no hover, so it gives press feedback (squish) instead.',
      'With reduced motion the element stays in place.',
    ],
  },
  {
    slug: 'spotlight',
    title: 'Spotlight',
    category: 'Cursor & pointer',
    description:
      'Light that follows the pointer across a surface — the border starts glowing before the pointer even arrives.',
    keywords: ['glow', 'border', 'light', 'hover', 'card'],
    controls: [
      { type: 'range', name: 'proximity', min: 0, max: 400, step: 10, default: 160 },
      {
        type: 'range',
        name: 'size',
        label: 'light size',
        min: 120,
        max: 600,
        step: 10,
        default: 320,
      },
      { type: 'color', name: 'color', label: 'accent', default: '#00e5ff' },
    ],
    code: {
      react: `import { SpotlightCard } from '@vizzele/react';

<div className="grid">
  {features.map((f) => (
    <SpotlightCard key={f.title} proximity={160}>
      <h3>{f.title}</h3>
      <p>{f.text}</p>
    </SpotlightCard>
  ))}
</div>`,
      vanilla: `import { spotlight } from '@vizzele/core';

document.querySelectorAll('.card').forEach((el) => spotlight(el, { proximity: 160 }));`,
      html: `<div class="vz-card vz-spotlight" data-vz-spotlight="proximity: 160">…</div>`,
      css: `/* The effect only writes variables — style it however you like */
.my-card {
  background: radial-gradient(300px circle at var(--vz-spot-x) var(--vz-spot-y),
    rgb(0 229 255 / calc(var(--vz-spot) * 0.2)), transparent 70%);
}`,
    },
    props: [
      {
        name: 'proximity',
        type: 'number',
        default: '160',
        description: 'Distance (px) outside the element where the light starts appearing.',
      },
      {
        name: 'spring',
        type: 'SpringConfig | SpringPreset',
        default: "'snappy'",
        description: 'How the light follows.',
      },
      {
        name: '--vz-spot-size',
        type: 'CSS length',
        default: '320px',
        description: 'Size of the light (CSS variable).',
      },
    ],
    a11y: [
      'Decorative only; content contrast never depends on the light.',
      'Works with touch (lights where you tap); static under reduced motion is fine since nothing moves.',
    ],
  },
  {
    slug: 'tilt',
    title: 'Tilt & Holo',
    category: 'Cursor & pointer',
    description:
      '3D tilt that follows the pointer, plus holographic foil whose colors shift with the viewing angle.',
    keywords: ['3d', 'holographic', 'card', 'parallax', 'foil', 'glare'],
    controls: [
      { type: 'range', name: 'max', label: 'max angle', min: 0, max: 30, default: 14 },
      { type: 'range', name: 'perspective', min: 300, max: 2000, step: 50, default: 1000 },
      { type: 'range', name: 'scale', min: 1, max: 1.15, step: 0.01, default: 1.04 },
      { type: 'boolean', name: 'reverse', default: false },
      { type: 'select', name: 'variant', options: ['holo', 'glass', 'plain'], default: 'holo' },
    ],
    code: {
      react: `import { HoloCard, Tilt } from '@vizzele/react';

<HoloCard max={14}>
  <h3>Prismatic</h3>
</HoloCard>

<Tilt max={10} scale={1.02} className="my-card">…</Tilt>`,
      vanilla: `import { tilt } from '@vizzele/core';

tilt(document.querySelector('.card'), { max: 14, perspective: 1000 });`,
      html: `<div class="vz-card vz-holo" data-vz-tilt="max: 14">…</div>`,
      css: `/* Variables exposed by tilt: --vz-px --vz-py (0..1) --vz-tx --vz-ty (-1..1) --vz-angle --vz-hover */
.card::after {
  background: linear-gradient(var(--vz-angle), transparent, rgb(255 255 255 / calc(var(--vz-hover) * .3)));
}`,
    },
    props: [
      { name: 'max', type: 'number', default: '12', description: 'Maximum rotation in degrees.' },
      {
        name: 'perspective',
        type: 'number',
        default: '1000',
        description: 'CSS perspective in px.',
      },
      { name: 'scale', type: 'number', default: '1.03', description: 'Scale while hovered.' },
      {
        name: 'reverse',
        type: 'boolean',
        default: 'false',
        description: 'Tilt away from the pointer.',
      },
      {
        name: 'axis',
        type: "'x' | 'y' | 'both'",
        default: "'both'",
        description: 'Restrict rotation.',
      },
      {
        name: 'spring',
        type: 'SpringConfig | SpringPreset',
        default: "'liquid'",
        description: 'Follow spring.',
      },
    ],
    a11y: [
      'Touch: tilts toward where you press, relaxes on release.',
      'Reduced motion: no rotation; the foil stays as a static sheen.',
    ],
  },
  {
    slug: 'ripple',
    title: 'Ripple',
    category: 'Cursor & pointer',
    description:
      'A liquid ripple that wells up from the press point, overshooting like a drop hitting water.',
    keywords: ['click', 'press', 'material', 'water', 'feedback'],
    controls: [
      { type: 'range', name: 'opacity', min: 0.1, max: 0.9, step: 0.05, default: 0.4 },
      { type: 'range', name: 'stiffness', min: 40, max: 400, step: 10, default: 140 },
      { type: 'range', name: 'damping', min: 4, max: 40, default: 13 },
    ],
    code: {
      react: `import { Ripple } from '@vizzele/react';

<Ripple as="button" className="vz-button">Press me</Ripple>`,
      vanilla: `import { ripple } from '@vizzele/core';

ripple(document.querySelector('button'), { opacity: 0.4 });`,
      html: `<button class="vz-button" data-vz-ripple>Press me</button>`,
    },
    props: [
      {
        name: 'color',
        type: 'string',
        default: 'iridescent',
        description: 'Any CSS background (color or gradient).',
      },
      { name: 'opacity', type: 'number', default: '0.35', description: 'Peak opacity.' },
      {
        name: 'spring',
        type: 'SpringConfig | SpringPreset',
        default: '{ stiffness: 140, damping: 13 }',
        description: 'Growth spring.',
      },
      {
        name: 'keyboard',
        type: 'boolean',
        default: 'true',
        description: 'Ripple from the center on Enter / Space.',
      },
    ],
    a11y: [
      'Keyboard presses ripple from the center.',
      'Reduced motion: a brief static tint instead of the wave.',
    ],
  },
  {
    slug: 'particle-trail',
    title: 'Particle trail',
    category: 'Cursor & pointer',
    description:
      'Iridescent sparks shed by the pointer with velocity, drag and drift — and a burst on click.',
    keywords: ['particles', 'sparkle', 'trail', 'canvas', 'confetti'],
    controls: [
      { type: 'range', name: 'density', min: 1, max: 20, default: 6 },
      { type: 'range', name: 'life', min: 0.3, max: 3, step: 0.1, default: 1.1 },
      { type: 'range', name: 'gravity', min: -300, max: 300, step: 10, default: -40 },
      { type: 'select', name: 'shape', options: ['spark', 'square', 'ring'], default: 'spark' },
    ],
    code: {
      react: `import { ParticleTrail } from '@vizzele/react';

<ParticleTrail density={6} shape="spark" />`,
      vanilla: `import { particleTrail } from '@vizzele/core';

const trail = particleTrail({ density: 6 });
window.addEventListener('click', (e) => trail.burst(e.clientX, e.clientY));`,
      html: `<body data-vz-particle-trail="density: 6">`,
    },
    props: [
      {
        name: 'density',
        type: 'number',
        default: '6',
        description: 'Particles per 100px travelled.',
      },
      {
        name: 'max',
        type: 'number',
        default: '220',
        description: 'Max particles alive (halved on low-end devices).',
      },
      {
        name: 'size',
        type: '[number, number]',
        default: '[2, 6]',
        description: 'Size range in px.',
      },
      {
        name: 'gravity',
        type: 'number',
        default: '-40',
        description: 'Vertical drift in px/s² (negative floats up).',
      },
      { name: 'life', type: 'number', default: '1.1', description: 'Lifetime in seconds.' },
      {
        name: 'shape',
        type: "'spark' | 'square' | 'ring'",
        default: "'spark'",
        description: 'Particle shape.',
      },
      {
        name: 'colors',
        type: 'string[]',
        default: 'iridescent palette',
        description: 'Colors to pick from.',
      },
      {
        name: 'burstOnClick',
        type: 'boolean',
        default: 'true',
        description: 'React only: burst on press.',
      },
    ],
    a11y: [
      'One overlay canvas, `aria-hidden`, never blocks clicks; it sleeps when no particle is alive.',
      'Off with reduced motion. On touch it only emits while your finger moves.',
    ],
  },
];
