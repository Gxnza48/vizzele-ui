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
