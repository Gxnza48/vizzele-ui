import type { DocEntry } from '@/lib/types';

const glA11y = [
  'The canvas is aria-hidden and never takes pointer events — content on top stays fully interactive.',
  'Pauses when off-screen or in a background tab. Renders one still frame with reduced motion.',
  'Weak devices get a lower resolution automatically; without WebGL2 a static gradient is shown.',
];
const colorsProp = {
  name: 'colors',
  type: 'string[]',
  default: 'iridescent palette',
  description: 'Four hex colors.',
};

export const backgroundEntries: DocEntry[] = [
  {
    slug: 'fluid',
    title: 'Fluid simulation',
    category: 'Backgrounds',
    description:
      'A real-time fluid you stir with the pointer, leaving iridescent ink that swirls and fades.',
    keywords: ['webgl', 'navier stokes', 'ink', 'smoke', 'liquid', 'hero background'],
    height: 520,
    wide: true,
    controls: [
      { type: 'range', name: 'curl', label: 'swirl', min: 0, max: 60, default: 18 },
      {
        type: 'range',
        name: 'dissipation',
        label: 'ink lifetime',
        min: 0.5,
        max: 0.99,
        step: 0.01,
        default: 0.92,
      },
      {
        type: 'range',
        name: 'splatRadius',
        label: 'brush',
        min: 0.05,
        max: 0.6,
        step: 0.01,
        default: 0.22,
      },
      { type: 'range', name: 'intensity', min: 0.2, max: 1.5, step: 0.05, default: 0.65 },
      { type: 'boolean', name: 'ambient', default: true },
    ],
    code: {
      react: `import { FluidBackground } from '@vizzele/react/gl';

<section style={{ position: 'relative' }}>
  <FluidBackground curl={28} dissipation={0.92} />
  <h1>Stir me</h1>
</section>`,
      vanilla: `import { fluid } from '@vizzele/core/gl';

const sim = fluid(canvas, { curl: 28 }); // null without WebGL2 float targets
sim?.splat(0.5, 0.5, 400, 0);`,
    },
    props: [
      {
        name: 'curl',
        type: 'number',
        default: '18',
        description: 'Vorticity — how much it swirls.',
      },
      {
        name: 'dissipation',
        type: 'number',
        default: '0.92',
        description: 'Ink lifetime (higher lasts longer).',
      },
      {
        name: 'velocityDissipation',
        type: 'number',
        default: '0.2',
        description: 'How fast motion calms down.',
      },
      {
        name: 'splatRadius / splatForce',
        type: 'number',
        default: '0.22 / 5200',
        description: 'Brush size and push.',
      },
      { name: 'intensity', type: 'number', default: '0.65', description: 'Ink brightness.' },
      { name: 'ambient', type: 'boolean', default: 'true', description: 'Random drops when idle.' },
      {
        name: 'simResolution / dyeResolution',
        type: 'number',
        default: '128 / 768',
        description: 'Quality (halved on low-end).',
      },
      colorsProp,
    ],
    a11y: glA11y,
  },
  {
    slug: 'mesh-gradient',
    title: 'Mesh gradient',
    category: 'Backgrounds',
    description:
      'A domain-warped, slowly flowing iridescent gradient with glints that bends around the pointer.',
    keywords: ['gradient', 'aurora', 'blob', 'webgl', 'hero'],
    height: 460,
    wide: true,
    controls: [
      { type: 'range', name: 'speed', min: 0, max: 1, step: 0.05, default: 0.25 },
      { type: 'range', name: 'warp', min: 0, max: 2.5, step: 0.05, default: 1 },
      { type: 'range', name: 'intensity', min: 0.2, max: 1.2, step: 0.05, default: 0.85 },
      { type: 'range', name: 'grain', min: 0, max: 0.2, step: 0.01, default: 0.06 },
      {
        type: 'select',
        name: 'palette',
        options: ['iridescent', 'ember', 'abyss'],
        default: 'iridescent',
      },
    ],
    code: {
      react: `import { MeshGradient } from '@vizzele/react/gl';

<MeshGradient speed={0.25} warp={1} colors={['#00e5ff', '#ff2bd6', '#ffb238', '#a8ff3e']} />`,
      vanilla: `import { meshGradient } from '@vizzele/core/gl';

meshGradient(canvas, { speed: 0.25 });`,
    },
    props: [
      { name: 'speed', type: 'number', default: '0.25', description: 'Flow speed.' },
      { name: 'warp', type: 'number', default: '1', description: 'Swirl amount.' },
      { name: 'interactive', type: 'number', default: '1', description: 'Pointer influence.' },
      { name: 'intensity', type: 'number', default: '0.85', description: 'Brightness.' },
      { name: 'grain', type: 'number', default: '0.06', description: 'Built-in film grain.' },
      colorsProp,
    ],
    a11y: glA11y,
  },
  {
    slug: 'particle-field',
    title: 'Particle field',
    category: 'Backgrounds',
    description:
      'Thousands of iridescent motes drifting in a flow field — they part around the pointer, or swirl into it.',
    keywords: ['particles', 'stars', 'dust', 'webgl', 'interactive background'],
    height: 460,
    wide: true,
    controls: [
      { type: 'select', name: 'mode', options: ['repel', 'attract'], default: 'repel' },
      { type: 'range', name: 'count', min: 300, max: 8000, step: 100, default: 2400 },
      { type: 'range', name: 'radius', min: 0.05, max: 0.6, step: 0.01, default: 0.22 },
      { type: 'range', name: 'force', min: 0.2, max: 3, step: 0.1, default: 1 },
      { type: 'range', name: 'size', min: 1, max: 6, step: 0.5, default: 2 },
    ],
    code: {
      react: `import { ParticleField } from '@vizzele/react/gl';

<ParticleField mode="repel" count={2400} />`,
      vanilla: `import { particleField } from '@vizzele/core/gl';

particleField(canvas, { mode: 'attract' });`,
    },
    props: [
      {
        name: 'mode',
        type: "'repel' | 'attract'",
        default: "'repel'",
        description: 'Part around or swirl into the pointer.',
      },
      {
        name: 'count',
        type: 'number',
        default: '2400',
        description: 'Particles (halved on low-end).',
      },
      { name: 'radius', type: 'number', default: '0.22', description: 'Pointer influence radius.' },
      { name: 'force', type: 'number', default: '1', description: 'Pointer strength.' },
      { name: 'size', type: 'number', default: '2', description: 'Point size (px).' },
      { name: 'flow', type: 'number', default: '1', description: 'Ambient drift.' },
      colorsProp,
    ],
    a11y: glA11y,
  },
  {
    slug: 'liquid-metal',
    title: 'Liquid metal',
    category: 'Backgrounds',
    description:
      'Raymarched blobs of liquid chrome with an iridescent film. They merge, split and reach for the pointer.',
    keywords: ['chrome', 'metaballs', 'raymarching', '3d', 'blob', 'webgl'],
    height: 480,
    wide: true,
    controls: [
      { type: 'range', name: 'blobs', min: 1, max: 8, default: 5 },
      { type: 'range', name: 'size', min: 0.5, max: 1.6, step: 0.05, default: 1 },
      { type: 'range', name: 'iridescence', min: 0, max: 1, step: 0.05, default: 0.55 },
      { type: 'range', name: 'speed', min: 0, max: 2, step: 0.05, default: 0.6 },
    ],
    code: {
      react: `import { LiquidMetal } from '@vizzele/react/gl';

<LiquidMetal blobs={5} iridescence={0.55} />`,
      vanilla: `import { liquidMetal } from '@vizzele/core/gl';

liquidMetal(canvas, { blobs: 5 });`,
    },
    props: [
      { name: 'blobs', type: 'number', default: '5', description: 'Number of blobs (max 8).' },
      { name: 'size', type: 'number', default: '1', description: 'Blob size.' },
      {
        name: 'iridescence',
        type: 'number',
        default: '0.55',
        description: 'Oil-slick film on the chrome.',
      },
      { name: 'speed', type: 'number', default: '0.6', description: 'Motion speed.' },
      {
        name: 'follow',
        type: 'number',
        default: '1',
        description: 'How much blobs chase the pointer.',
      },
      colorsProp,
    ],
    a11y: glA11y,
  },
  {
    slug: 'lens-grid',
    title: 'Lens grid',
    category: 'Backgrounds',
    description:
      'A precise grid of lines and dots that bulges under the pointer like glass, splitting into color at the edge.',
    keywords: ['grid', 'distortion', 'magnifier', 'chromatic aberration', 'webgl'],
    height: 460,
    wide: true,
    controls: [
      { type: 'range', name: 'cell', min: 16, max: 80, default: 36 },
      { type: 'range', name: 'strength', min: 0, max: 0.9, step: 0.05, default: 0.4 },
      { type: 'range', name: 'radius', min: 0.1, max: 0.6, step: 0.01, default: 0.28 },
      { type: 'range', name: 'aberration', min: 0, max: 3, step: 0.1, default: 1 },
    ],
    code: {
      react: `import { LensGrid } from '@vizzele/react/gl';

<LensGrid cell={36} strength={0.4} />`,
      vanilla: `import { lensGrid } from '@vizzele/core/gl';

lensGrid(canvas, { cell: 36 });`,
    },
    props: [
      { name: 'cell', type: 'number', default: '36', description: 'Cell size (CSS px).' },
      { name: 'strength', type: 'number', default: '0.35', description: 'Bulge strength.' },
      { name: 'radius', type: 'number', default: '0.28', description: 'Lens radius.' },
      {
        name: 'aberration',
        type: 'number',
        default: '1',
        description: 'Color split inside the lens.',
      },
      { name: 'lineColor', type: 'string', default: "'#5a6788'", description: 'Grid color.' },
    ],
    a11y: glA11y,
  },
  {
    slug: 'aurora',
    title: 'Aurora',
    category: 'Backgrounds',
    isNew: true,
    description:
      'Curtains of northern light rippling over a starry sky. They lean toward the pointer and glow brighter under it.',
    keywords: ['northern lights', 'borealis', 'sky', 'glow', 'webgl', 'hero'],
    height: 480,
    wide: true,
    controls: [
      { type: 'range', name: 'bands', label: 'curtains', min: 1, max: 5, default: 3 },
      { type: 'range', name: 'height', min: 0.1, max: 0.8, step: 0.01, default: 0.45 },
      { type: 'range', name: 'speed', min: 0, max: 1.5, step: 0.05, default: 0.3 },
      { type: 'range', name: 'intensity', min: 0.3, max: 2, step: 0.05, default: 1 },
    ],
    code: {
      react: `import { Aurora } from '@vizzele/react/gl';

<section style={{ position: 'relative' }}>
  <Aurora bands={3} height={0.45} />
  <h1>Night shift</h1>
</section>`,
      vanilla: `import { aurora } from '@vizzele/core/gl';

aurora(canvas, { bands: 3, speed: 0.3 });`,
    },
    props: [
      { name: 'bands', type: 'number', default: '3', description: 'Light curtains (1–5).' },
      {
        name: 'height',
        type: 'number',
        default: '0.45',
        description: 'Where the curtains hang, 0 bottom … 1 top.',
      },
      { name: 'speed', type: 'number', default: '0.3', description: 'Drift speed.' },
      { name: 'intensity', type: 'number', default: '1', description: 'Brightness.' },
      colorsProp,
    ],
    a11y: glA11y,
  },
  {
    slug: 'silk',
    title: 'Silk',
    category: 'Backgrounds',
    isNew: true,
    description:
      'Flowing iridescent satin with a soft sheen running along the folds. The pointer presses a dent into the cloth.',
    keywords: ['satin', 'fabric', 'folds', 'sheen', 'webgl', 'luxury'],
    height: 460,
    wide: true,
    controls: [
      { type: 'range', name: 'scale', label: 'folds', min: 0.4, max: 2.5, step: 0.05, default: 1 },
      { type: 'range', name: 'sheen', min: 0, max: 2, step: 0.05, default: 1 },
      { type: 'range', name: 'speed', min: 0, max: 1.2, step: 0.05, default: 0.35 },
      { type: 'range', name: 'intensity', min: 0.3, max: 1.6, step: 0.05, default: 0.9 },
    ],
    code: {
      react: `import { Silk } from '@vizzele/react/gl';

<Silk scale={1} sheen={1} />`,
      vanilla: `import { silk } from '@vizzele/core/gl';

silk(canvas, { sheen: 1.2 });`,
    },
    props: [
      {
        name: 'scale',
        type: 'number',
        default: '1',
        description: 'Fold size — higher means more, smaller folds.',
      },
      { name: 'sheen', type: 'number', default: '1', description: 'Satin highlight strength.' },
      { name: 'speed', type: 'number', default: '0.35', description: 'Flow speed.' },
      { name: 'intensity', type: 'number', default: '0.9', description: 'Brightness.' },
      colorsProp,
    ],
    a11y: glA11y,
  },
  {
    slug: 'lava-lamp',
    title: 'Lava lamp',
    category: 'Backgrounds',
    isNew: true,
    description:
      'Blobs of glossy wax rise, merge and split. Your pointer is one more blob — push it into the others and they fuse.',
    keywords: ['metaballs', 'blobs', 'goo', 'retro', 'webgl', 'liquid'],
    height: 480,
    wide: true,
    controls: [
      { type: 'range', name: 'blobs', min: 1, max: 10, default: 7 },
      { type: 'range', name: 'size', min: 0.5, max: 1.8, step: 0.05, default: 1 },
      { type: 'range', name: 'speed', min: 0, max: 2, step: 0.05, default: 0.5 },
      { type: 'range', name: 'gloss', min: 0, max: 1.5, step: 0.05, default: 0.8 },
    ],
    code: {
      react: `import { LavaLamp } from '@vizzele/react/gl';

<LavaLamp blobs={7} speed={0.5} />`,
      vanilla: `import { lavaLamp } from '@vizzele/core/gl';

lavaLamp(canvas, { blobs: 7 });`,
    },
    props: [
      { name: 'blobs', type: 'number', default: '7', description: 'Number of blobs (max 10).' },
      { name: 'size', type: 'number', default: '1', description: 'Blob size.' },
      { name: 'speed', type: 'number', default: '0.5', description: 'Rise speed.' },
      { name: 'gloss', type: 'number', default: '0.8', description: 'Glossy highlight.' },
      colorsProp,
    ],
    a11y: glA11y,
  },
  {
    slug: 'wave-lines',
    title: 'Wave lines',
    category: 'Backgrounds',
    isNew: true,
    description:
      'Dozens of fine lines rolling like an ocean of sound, iridescent along their length. The pointer lifts them and sends a ring outward.',
    keywords: ['lines', 'waves', 'sound', 'oscilloscope', 'contour', 'webgl'],
    height: 460,
    wide: true,
    controls: [
      { type: 'range', name: 'lines', min: 10, max: 90, default: 42 },
      { type: 'range', name: 'amplitude', min: 0, max: 3, step: 0.05, default: 1 },
      { type: 'range', name: 'speed', min: 0, max: 1.5, step: 0.05, default: 0.4 },
      { type: 'range', name: 'thickness', min: 0.5, max: 4, step: 0.1, default: 1.2 },
    ],
    code: {
      react: `import { WaveLines } from '@vizzele/react/gl';

<WaveLines lines={42} amplitude={1} />`,
      vanilla: `import { waveLines } from '@vizzele/core/gl';

waveLines(canvas, { lines: 42 });`,
    },
    props: [
      { name: 'lines', type: 'number', default: '42', description: 'Number of lines.' },
      { name: 'amplitude', type: 'number', default: '1', description: 'Wave height.' },
      { name: 'speed', type: 'number', default: '0.4', description: 'Wave speed.' },
      {
        name: 'thickness',
        type: 'number',
        default: '1.2',
        description: 'Line thickness (CSS px).',
      },
      colorsProp,
    ],
    a11y: glA11y,
  },
  {
    slug: 'ripples',
    title: 'Ripples',
    category: 'Backgrounds',
    isNew: true,
    description:
      'A dark liquid surface. Click or tap to drop rings that spread and bend the light below; when nobody is touching, it rains softly.',
    keywords: ['water', 'rain', 'drops', 'pond', 'click', 'webgl'],
    height: 460,
    wide: true,
    controls: [
      { type: 'boolean', name: 'rain', default: true },
      { type: 'range', name: 'speed', min: 0.3, max: 2.5, step: 0.05, default: 1 },
      { type: 'range', name: 'decay', min: 0.3, max: 3, step: 0.05, default: 1 },
      { type: 'range', name: 'intensity', min: 0.3, max: 2, step: 0.05, default: 1 },
    ],
    code: {
      react: `import { Ripples } from '@vizzele/react/gl';

<Ripples rain speed={1} />`,
      vanilla: `import { ripples } from '@vizzele/core/gl';

const pond = ripples(canvas, { rain: false });
pond?.drop(0.5, 0.5); // x, y in 0..1`,
    },
    props: [
      {
        name: 'rain',
        type: 'boolean',
        default: 'true',
        description: 'Drops fall on their own while idle.',
      },
      { name: 'speed', type: 'number', default: '1', description: 'How fast rings travel.' },
      { name: 'decay', type: 'number', default: '1', description: 'How quickly rings fade.' },
      { name: 'intensity', type: 'number', default: '1', description: 'Brightness.' },
      colorsProp,
    ],
    a11y: [
      ...glA11y,
      'Clicks pass straight through to the content on top; the surface listens on the window and only reacts inside its own box.',
    ],
  },
  {
    slug: 'grain',
    title: 'Grain',
    category: 'Backgrounds',
    description: 'Fine animated film grain over anything — as a zero-JS CSS class, or on the GPU.',
    keywords: ['noise', 'film', 'texture', 'overlay'],
    height: 380,
    wide: true,
    controls: [
      { type: 'select', name: 'mode', options: ['css', 'webgl'], default: 'css' },
      { type: 'range', name: 'opacity', min: 0, max: 0.4, step: 0.01, default: 0.12 },
      {
        type: 'range',
        name: 'size',
        label: 'grain size (gl)',
        min: 1,
        max: 4,
        step: 0.5,
        default: 1.5,
      },
    ],
    code: {
      react: `import { Grain } from '@vizzele/react/gl';

<div style={{ position: 'relative' }}>
  …
  <Grain opacity={0.1} />
</div>`,
      html: `<!-- zero JS -->
<body class="vz-body vz-grain vz-grain-fixed">
<div class="vz-grain" style="--vz-grain-opacity: .1">…</div>`,
    },
    props: [
      { name: 'opacity', type: 'number', default: '0.08', description: 'Strength.' },
      {
        name: 'size',
        type: 'number',
        default: '1.5',
        description: 'Grain size (px, GPU version).',
      },
      {
        name: 'fps',
        type: 'number',
        default: '24',
        description: 'Grain refresh rate (GPU version).',
      },
      {
        name: '--vz-grain-opacity',
        type: 'CSS number',
        default: '0.07',
        description: 'Strength (CSS version).',
      },
    ],
    a11y: ['Purely decorative. The CSS version stops animating with reduced motion.'],
  },
];
