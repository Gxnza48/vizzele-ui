import type { DocEntry } from '@/lib/types';

export const originalEntries: DocEntry[] = [
  {
    slug: 'liquid-focus',
    title: 'Liquid focus',
    category: 'Originals',
    isNew: true,
    description:
      'One focus ring for the whole page that travels between elements like a drop of mercury: the leading edge races ahead, the trailing edge catches up, and it settles around whatever you landed on. Press Tab — this whole site uses it.',
    keywords: ['focus', 'keyboard', 'a11y', 'focus ring', 'tab', 'outline', 'mercury', 'original'],
    height: 380,
    code: {
      react: `import { LiquidFocus } from '@vizzele/react';

// Once, in your root layout:
<LiquidFocus />`,
      vanilla: `import { liquidFocus } from '@vizzele/core';

const ring = liquidFocus({ offset: 4 });
// ring.destroy() to remove it`,
      html: `<body data-vz-liquid-focus>`,
    },
    props: [
      {
        name: 'offset',
        type: 'number',
        default: '4',
        description: 'Gap between element and ring (px).',
      },
      {
        name: 'keyboardOnly',
        type: 'boolean',
        default: 'true',
        description: 'Only follow :focus-visible (hidden for mouse clicks).',
      },
    ],
    a11y: [
      'Makes focus easier to follow, not harder: the ring is 2px, high contrast and glows.',
      'Native outlines are made transparent only while the ring is mounted.',
      'Windows High Contrast (forced colors): the ring hides and the system outline returns.',
      'Reduced motion: the ring jumps instead of flowing.',
    ],
  },
  {
    slug: 'liquid-selection',
    title: 'Liquid selection',
    category: 'Originals',
    isNew: true,
    description:
      'Select some text below. Instead of hard blue boxes, a blob of light springs out of the caret, stretches as you drag, and the lines fuse into one continuous drop where they touch.',
    keywords: ['selection', 'highlight', 'text', 'select', 'goo', 'original'],
    height: 420,
    code: {
      react: `import { LiquidSelection } from '@vizzele/react';

<LiquidSelection as="article">
  <p>Selections in here are liquid.</p>
</LiquidSelection>`,
      vanilla: `import { liquidSelection } from '@vizzele/core';

liquidSelection({ root: document.querySelector('article') });`,
      html: `<article data-vz-liquid-select>…</article>`,
    },
    props: [
      { name: 'as', type: 'ElementType', default: "'div'", description: 'Element to render.' },
      {
        name: 'root (vanilla)',
        type: 'HTMLElement',
        default: 'document',
        description: 'Only selections inside it turn liquid.',
      },
    ],
    a11y: [
      'Purely visual: the real selection is untouched, so copy, find and screen readers work as usual.',
      'Inputs, textareas and [data-vz-native-select] keep the native highlight.',
      'Forced colors: the system highlight returns.',
    ],
  },
  {
    slug: 'hold-button',
    title: 'Hold to confirm',
    category: 'Originals',
    isNew: true,
    description:
      'For actions you can’t undo: the button fills with liquid while you hold it. Pressing splashes where your finger is, moving the pointer makes it slosh, letting go early drains it. At the top it overflows and confirms.',
    keywords: [
      'hold',
      'long press',
      'confirm',
      'delete',
      'destructive',
      'danger',
      'liquid',
      'original',
    ],
    height: 340,
    controls: [
      { type: 'select', name: 'tone', options: ['danger', 'liquid'], default: 'danger' },
      { type: 'range', name: 'duration', min: 600, max: 3000, step: 100, default: 1400 },
    ],
    code: {
      react: `import { HoldButton } from '@vizzele/react';

<HoldButton onConfirm={deleteProject} duration={1400}>
  Hold to delete project
</HoldButton>`,
      vanilla: `import { holdToConfirm } from '@vizzele/core';

holdToConfirm(button, { duration: 1400, onConfirm: deleteProject });`,
      html: `<button class="vz-button vz-hold-btn" data-tone="danger" data-vz-hold="duration: 1400">
  Hold to delete
</button>
<script>button.addEventListener('vz-confirm', deleteProject)</script>`,
    },
    props: [
      { name: 'onConfirm', type: '() => void', description: 'Runs once the button is full.' },
      { name: 'duration', type: 'number', default: '1400', description: 'Hold time in ms.' },
      {
        name: 'tone',
        type: "'danger' | 'liquid'",
        default: "'danger'",
        description: 'Red or iridescent liquid.',
      },
      {
        name: 'resetAfter',
        type: 'number',
        default: '1600',
        description: 'Drains and re-arms after confirming (0 = stays full).',
      },
      {
        name: 'confirmedLabel',
        type: 'ReactNode',
        default: "'Confirmed'",
        description: 'Shown and announced when done.',
      },
      {
        name: 'onProgress',
        type: '(p: number) => void',
        description: '0–1 while filling or draining.',
      },
    ],
    a11y: [
      'Hold Space or Enter to fill it from the keyboard.',
      'An aria-describedby hint says “Press and hold to confirm”; confirmation is announced politely.',
      'A tap never confirms by accident. Reduced motion: no waves, a steady fill.',
    ],
  },
  {
    slug: 'caustics',
    title: 'Caustics',
    category: 'Originals',
    isNew: true,
    description:
      'A glass card casts caustics — the moving net of light at the bottom of a pool — onto the page behind it, split into colors like a prism. Move the pointer: you are holding the lamp.',
    keywords: ['caustics', 'light', 'glass', 'water', 'pool', 'webgl', 'shader', 'original'],
    height: 460,
    controls: [
      { type: 'range', name: 'scale', min: 30, max: 140, default: 70 },
      { type: 'range', name: 'speed', min: 0, max: 2, step: 0.1, default: 0.6 },
      { type: 'range', name: 'intensity', min: 0.2, max: 2, step: 0.1, default: 1 },
    ],
    code: {
      react: `import { CausticCard } from '@vizzele/react/gl';

<CausticCard spread={90} scale={70}>
  <h3>Liquid light</h3>
  <p>The light underneath moves with your pointer.</p>
</CausticCard>`,
      vanilla: `import { caustics } from '@vizzele/core/gl';

// A canvas behind (and larger than) the card
caustics(canvas, { target: card, scale: 70 });`,
    },
    props: [
      {
        name: 'spread',
        type: 'number',
        default: '90',
        description: 'How far the light spills around the card (px).',
      },
      {
        name: 'scale',
        type: 'number',
        default: '70',
        description: 'Size of the light cells (px).',
      },
      { name: 'speed', type: 'number', default: '0.6', description: 'Animation speed.' },
      { name: 'intensity', type: 'number', default: '1', description: 'Brightness.' },
      {
        name: 'radius',
        type: 'number',
        description: 'Corner radius of the projection (defaults to the card’s).',
      },
      { name: 'cardClassName', type: 'string', description: 'Class for the glass card.' },
    ],
    a11y: [
      'Decorative canvas (aria-hidden); the card content is plain HTML.',
      'Pauses offscreen and renders one still frame under reduced motion. No WebGL: a soft glow instead.',
    ],
  },
  {
    slug: 'surface-tension',
    title: 'Surface tension',
    category: 'Originals',
    isNew: true,
    description:
      'Items behave like drops sitting on a surface. Bring the pointer close and they lean toward it; between two neighbours a meniscus forms and they fuse into one shape; a droplet follows your pointer and merges with whatever it touches.',
    keywords: ['goo', 'gooey', 'metaball', 'chips', 'tags', 'segmented', 'liquid', 'original'],
    height: 380,
    controls: [
      { type: 'range', name: 'reach', min: 40, max: 160, default: 90 },
      { type: 'range', name: 'droplet', min: 0, max: 30, default: 16 },
    ],
    code: {
      react: `import { SurfaceTension } from '@vizzele/react';

<SurfaceTension className="chips" reach={90}>
  <button>Springs</button>
  <button>Inertia</button>
  <button>Glass</button>
</SurfaceTension>`,
      vanilla: `import { surfaceTension } from '@vizzele/core';

surfaceTension(document.querySelector('.chips'), { reach: 90 });`,
      html: `<div class="chips" data-vz-surface-tension>…</div>`,
    },
    props: [
      {
        name: 'reach',
        type: 'number',
        default: '90',
        description: 'Distance (px) at which drops start reaching.',
      },
      {
        name: 'droplet',
        type: 'number',
        default: '16',
        description: 'Radius of the pointer droplet (0 = off).',
      },
      {
        name: 'itemSelector',
        type: 'string',
        description: 'Which descendants are drops (default: children).',
      },
    ],
    a11y: [
      'The liquid layer is decorative and sits behind the items; the items keep their roles and focus.',
      'Reduced motion: drops stay still, no droplet or necks.',
    ],
  },
];
