import type { DocEntry } from '@/lib/types';

export const textEntries: DocEntry[] = [
  {
    slug: 'scramble',
    title: 'Scramble text',
    category: 'Text',
    description: 'Text that decodes itself from random glyphs, settling letter by letter.',
    keywords: ['decode', 'hacker', 'glitch', 'cipher', 'typewriter'],
    height: 320,
    controls: [
      { type: 'text', name: 'text', default: 'Liquid light, decoded.' },
      { type: 'range', name: 'duration', min: 200, max: 3000, step: 50, default: 1100 },
      {
        type: 'select',
        name: 'chars',
        label: 'glyphs',
        options: ['symbols', 'binary', 'katakana'],
        default: 'symbols',
      },
    ],
    code: {
      react: `import { ScrambleText } from '@vizzele/react';

<ScrambleText as="h2" duration={1100} trigger="view">
  Liquid light, decoded.
</ScrambleText>`,
      vanilla: `import { scramble } from '@vizzele/core';

const s = scramble(el, { trigger: 'manual', duration: 900 });
button.onclick = () => s.play();`,
      html: `<h2 data-vz-scramble="trigger: hover">Liquid light, decoded.</h2>`,
    },
    props: [
      { name: 'children', type: 'string', description: 'Final text.' },
      { name: 'duration', type: 'number', default: '900', description: 'Total time (ms).' },
      { name: 'chars', type: 'string', description: 'Glyphs used while decoding.' },
      {
        name: 'trigger',
        type: "'view' | 'hover' | 'mount' | 'manual'",
        default: "'view'",
        description: 'When it plays. Hover also plays on focus.',
      },
      { name: 'ref.play()', type: 'ScrambleTextHandle', description: 'Replay programmatically.' },
    ],
    a11y: [
      'The element carries the final text as aria-label, so screen readers never hear the noise.',
      'Reduced motion: the text appears directly.',
    ],
  },
  {
    slug: 'text-reveal',
    title: 'Text reveal',
    category: 'Text',
    description:
      'Reveal by letters, words or lines as text scrolls into view — rising, blurring or sliding out of a mask.',
    keywords: ['split text', 'stagger', 'scroll', 'headline', 'letters', 'words', 'lines'],
    height: 380,
    controls: [
      { type: 'select', name: 'by', options: ['words', 'chars', 'lines'], default: 'words' },
      {
        type: 'select',
        name: 'variant',
        options: ['rise', 'blur', 'mask', 'scale'],
        default: 'rise',
      },
      { type: 'range', name: 'stagger', min: 5, max: 160, step: 5, default: 45 },
    ],
    code: {
      react: `import { TextReveal } from '@vizzele/react';

<TextReveal as="h2" by="words" variant="blur">
  Everything here moves with weight and light.
</TextReveal>`,
      vanilla: `import { textReveal } from '@vizzele/core';

textReveal(heading, { by: 'lines', variant: 'mask' });`,
      html: `<h2 data-vz-text-reveal="by: chars; variant: rise">Everything here moves.</h2>`,
    },
    props: [
      { name: 'by', type: "'chars' | 'words' | 'lines'", default: "'words'", description: 'Unit.' },
      {
        name: 'variant',
        type: "'rise' | 'blur' | 'mask' | 'scale'",
        default: "'rise'",
        description: 'Entrance look. Lines default to mask.',
      },
      {
        name: 'stagger',
        type: 'number',
        default: '18 / 45 / 90',
        description: 'ms between units.',
      },
      {
        name: 'once',
        type: 'boolean',
        default: 'true',
        description: 'Replay each time it enters.',
      },
      {
        name: 'amount',
        type: 'number',
        default: '0.3',
        description: 'Visible fraction to trigger.',
      },
    ],
    a11y: [
      'The sentence stays readable to screen readers via aria-label; the pieces are aria-hidden.',
      'Built on CSS transitions with spring easings — hundreds of letters stay at 60 fps.',
      'Reduced motion: text is shown immediately.',
    ],
  },
  {
    slug: 'shimmer',
    title: 'Shimmer text',
    category: 'Text',
    description:
      'An iridescent band of light sweeping across type, or type painted with the moving spectrum. Pure CSS.',
    keywords: ['gradient text', 'shine', 'iridescent', 'loading text'],
    height: 300,
    controls: [
      { type: 'select', name: 'variant', options: ['shimmer', 'iridescent'], default: 'shimmer' },
      {
        type: 'range',
        name: 'speed',
        label: 'seconds per sweep',
        min: 1,
        max: 10,
        step: 0.5,
        default: 3.2,
      },
    ],
    code: {
      react: `import { ShimmerText } from '@vizzele/react';

<h2><ShimmerText>Generating your palette…</ShimmerText></h2>
<h2><ShimmerText variant="iridescent">Holographic</ShimmerText></h2>`,
      html: `<span class="vz-text-shimmer">Generating your palette…</span>
<span class="vz-text-iridescent" data-animate>Holographic</span>`,
    },
    props: [
      {
        name: 'variant',
        type: "'shimmer' | 'iridescent'",
        default: "'shimmer'",
        description: 'Sweep or spectrum fill.',
      },
      { name: 'speed', type: 'number', default: '3.2', description: 'Seconds per cycle.' },
      {
        name: '--vz-shimmer-base',
        type: 'CSS color',
        default: 'var(--vz-text)',
        description: 'Color between sweeps.',
      },
    ],
    a11y: [
      'Text stays real text. The animation stops with reduced motion, leaving a static gradient with sufficient contrast.',
    ],
  },
  {
    slug: 'weight-wave',
    title: 'Weight wave',
    category: 'Text',
    description:
      'A variable-font wave: letters swell near the pointer as if light were pooling under it.',
    keywords: ['variable font', 'font weight', 'hover', 'typography', 'kinetic'],
    height: 360,
    controls: [
      {
        type: 'range',
        name: 'min',
        label: 'rest weight',
        min: 200,
        max: 600,
        step: 10,
        default: 280,
      },
      {
        type: 'range',
        name: 'max',
        label: 'peak weight',
        min: 400,
        max: 800,
        step: 10,
        default: 800,
      },
      { type: 'range', name: 'radius', min: 40, max: 400, step: 10, default: 170 },
      { type: 'boolean', name: 'width', label: 'widen glyphs', default: true },
    ],
    code: {
      react: `import { WeightWave } from '@vizzele/react';

<h1 className="vz-display">
  <WeightWave min={280} max={800} radius={170}>Hover the light</WeightWave>
</h1>`,
      vanilla: `import { weightWave } from '@vizzele/core';

weightWave(title, { min: 280, max: 800, width: true });`,
      html: `<h1 data-vz-weight-wave="min: 280; max: 800">Hover the light</h1>`,
    },
    props: [
      { name: 'min / max', type: 'number', default: '300 / 800', description: 'Weight range.' },
      { name: 'radius', type: 'number', default: '160', description: 'Influence radius (px).' },
      {
        name: 'width',
        type: 'boolean',
        default: 'false',
        description: 'Also animate the wdth axis.',
      },
      { name: 'ease', type: 'number', default: '0.18', description: 'Smoothing (0–1).' },
    ],
    a11y: [
      'Needs a variable font with a wght axis (Bricolage Grotesque is bundled in the docs).',
      'Touch: follows your finger while pressing. Off with reduced motion.',
    ],
  },
  {
    slug: 'morph-text',
    title: 'Morph text',
    category: 'Text',
    description:
      'Words that melt into one another — a blur crossfade sharpened by an SVG threshold into liquid.',
    keywords: ['rotating words', 'gooey', 'liquid', 'headline', 'carousel'],
    height: 320,
    controls: [
      { type: 'text', name: 'words', default: 'liquid, holographic, elastic, alive' },
      { type: 'select', name: 'variant', options: ['cascade', 'goo'], default: 'cascade' },
      {
        type: 'range',
        name: 'stagger',
        label: 'letter stagger (cascade)',
        min: 0,
        max: 120,
        step: 5,
        default: 35,
      },
      { type: 'range', name: 'hold', min: 400, max: 4000, step: 100, default: 1600 },
      { type: 'range', name: 'morph', min: 200, max: 2500, step: 50, default: 900 },
    ],
    code: {
      react: `import { MorphText } from '@vizzele/react';

<h2>Interfaces that feel <MorphText gradient words={['liquid', 'holographic', 'elastic', 'alive']} /></h2>`,
      html: `<span data-vz-morph="hold: 1600">liquid | holographic | elastic | alive</span>`,
    },
    props: [
      { name: 'words', type: 'string[]', description: 'Words to cycle.' },
      { name: 'hold', type: 'number', default: '1800', description: 'Time each word stays (ms).' },
      {
        name: 'variant',
        type: "'cascade' | 'goo'",
        default: "'cascade'",
        description: 'Letter cascade or liquid blend.',
      },
      {
        name: 'stagger',
        type: 'number',
        default: '35',
        description: 'ms between letters (cascade).',
      },
      {
        name: 'gradient',
        type: 'boolean',
        default: 'false',
        description: 'Iridescent gradient, continuous across the word.',
      },
      { name: 'morph', type: 'number', default: '900', description: 'Blend duration (goo).' },
    ],
    a11y: [
      'A hidden live copy holds the current word for assistive tech.',
      'Reduced motion: words swap without morphing.',
    ],
  },
  {
    slug: 'counter',
    title: 'Counter',
    category: 'Text',
    description:
      'Numbers that spring to their value with a whisper of overshoot — on scroll and whenever they change.',
    keywords: ['number', 'stats', 'count up', 'odometer', 'metrics'],
    height: 320,
    controls: [
      { type: 'range', name: 'value', min: 0, max: 100000, step: 500, default: 48200 },
      {
        type: 'select',
        name: 'format',
        options: ['plain', 'compact', 'currency', 'percent'],
        default: 'plain',
      },
      { type: 'range', name: 'stiffness', min: 20, max: 300, step: 5, default: 60 },
      { type: 'range', name: 'damping', min: 4, max: 40, default: 16 },
    ],
    code: {
      react: `import { Counter } from '@vizzele/react';

<Counter value={48200} suffix=" stars" />
<Counter value={revenue} format={{ style: 'currency', currency: 'USD' }} />`,
      vanilla: `import { counter } from '@vizzele/core';

const c = counter(el, { to: 48200 });
c.set(51000); // springs to the new value`,
      html: `<span data-vz-counter="suffix: %">98</span>`,
    },
    props: [
      { name: 'value', type: 'number', description: 'Target; changes animate.' },
      { name: 'from', type: 'number', default: '0', description: 'Start value.' },
      { name: 'decimals', type: 'number', default: '0', description: 'Fraction digits.' },
      {
        name: 'format',
        type: 'Intl.NumberFormatOptions',
        description: 'Currency, compact, percent…',
      },
      { name: 'prefix / suffix', type: 'string', description: 'Text around the number.' },
      {
        name: 'spring',
        type: 'SpringConfig | SpringPreset',
        default: '{ stiffness: 60, damping: 16 }',
        description: 'Feel.',
      },
      {
        name: 'inView',
        type: 'boolean',
        default: 'true',
        description: 'Wait until visible to start.',
      },
    ],
    a11y: ['aria-label always holds the final value. Tabular figures keep the width steady.'],
  },
];

export const scrollEntries: DocEntry[] = [
  {
    slug: 'parallax',
    title: 'Parallax',
    category: 'Scroll',
    description: 'Layers that travel at different speeds as you scroll, for real depth.',
    keywords: ['depth', 'layers', 'scroll', 'speed'],
    height: 460,
    wide: true,
    controls: [
      { type: 'range', name: 'depth', label: 'depth', min: 0, max: 1.2, step: 0.05, default: 0.6 },
      { type: 'boolean', name: 'zoom', default: false },
    ],
    code: {
      react: `import { Parallax } from '@vizzele/react';

<Parallax speed={0.6} className="far-layer" />
<Parallax speed={0.2}>Mid layer</Parallax>
<Parallax speed={-0.25}>Closer than the page</Parallax>`,
      vanilla: `import { parallax } from '@vizzele/core';

parallax(el, { speed: 0.5 });`,
      html: `<img src="mountains.png" data-vz-parallax="speed: 0.5" alt="" />`,
    },
    props: [
      {
        name: 'speed',
        type: 'number',
        default: '0.3',
        description: '0 = page speed, positive = farther, negative = closer.',
      },
      { name: 'axis', type: "'x' | 'y'", default: "'y'", description: 'Direction.' },
      { name: 'zoom', type: 'boolean', default: 'false', description: 'Scale up with depth.' },
      {
        name: 'container',
        type: 'HTMLElement | Window',
        default: 'window',
        description: 'Scroll root.',
      },
    ],
    a11y: ['Only animates while on screen. Off with reduced motion — the layout stays intact.'],
  },
  {
    slug: 'horizontal-scroll',
    title: 'Horizontal scroll',
    category: 'Scroll',
    description:
      'A section that pins in place and turns your vertical scroll into sideways travel.',
    keywords: ['pin', 'sticky', 'sideways', 'gallery', 'timeline'],
    height: 460,
    wide: true,
    code: {
      react: `import { HorizontalScroll } from '@vizzele/react';

<HorizontalScroll label="Case studies">
  {projects.map((p) => <ProjectCard key={p.id} {...p} />)}
</HorizontalScroll>`,
      vanilla: `import { horizontalScroll } from '@vizzele/core';

horizontalScroll(section, { track: section.querySelector('.track') });`,
      html: `<section data-vz-horizontal-scroll>
  <div class="vz-hscroll-viewport"><div class="vz-hscroll-track">…</div></div>
</section>`,
    },
    props: [
      { name: 'children', type: 'ReactNode', description: 'Track items.' },
      { name: 'label', type: 'string', description: 'Region name.' },
      {
        name: 'container',
        type: 'HTMLElement | Window',
        default: 'window',
        description: 'Scroll root.',
      },
      { name: '--vz-hscroll-gap / -pad', type: 'CSS length', description: 'Spacing.' },
    ],
    a11y: [
      'Content stays in DOM order, so keyboard and screen readers read it normally.',
      'Exposes --vz-progress for progress indicators.',
    ],
  },
  {
    slug: 'sticky-stack',
    title: 'Sticky stack',
    category: 'Scroll',
    description:
      'Cards pin one after another and pile up; covered cards shrink and dim beneath the next.',
    keywords: ['stacking cards', 'sticky', 'features', 'scroll story'],
    height: 460,
    wide: true,
    controls: [
      {
        type: 'range',
        name: 'scale',
        label: 'shrink per level',
        min: 0,
        max: 0.15,
        step: 0.01,
        default: 0.06,
      },
    ],
    code: {
      react: `import { StickyStack } from '@vizzele/react';

<StickyStack>
  {features.map((f) => <article key={f.id} className="vz-card">…</article>)}
</StickyStack>`,
      html: `<div class="vz-sticky-stack" data-vz-sticky-stack>
  <article class="vz-card">…</article>
  <article class="vz-card">…</article>
</div>`,
    },
    props: [
      { name: 'scale', type: 'number', default: '0.06', description: 'Shrink per covered level.' },
      {
        name: '--vz-stack-top / -step / -gap',
        type: 'CSS length',
        description: 'Pin offset, per-card step, spacing.',
      },
      {
        name: 'container',
        type: 'HTMLElement | Window',
        default: 'window',
        description: 'Scroll root.',
      },
    ],
    a11y: ['Pure position: sticky underneath — no scroll hijacking.'],
  },
  {
    slug: 'scroll-progress',
    title: 'Scroll progress',
    category: 'Scroll',
    description: 'An iridescent reading-progress bar for the page or for a single article.',
    keywords: ['reading', 'indicator', 'bar', 'article'],
    height: 460,
    wide: true,
    code: {
      react: `import { ScrollProgress } from '@vizzele/react';

<ScrollProgress />                       {/* whole page */}
<ScrollProgress target={articleRef} />   {/* one article */}`,
      html: `<div class="vz-progress-bar" data-vz-scroll-progress></div>
<!-- or, zero JS where supported: -->
<div class="vz-scroll-progress"></div>`,
    },
    props: [
      {
        name: 'target',
        type: 'RefObject<HTMLElement>',
        description: 'Track an element instead of the page.',
      },
      {
        name: 'container',
        type: 'HTMLElement | Window',
        default: 'window',
        description: 'Scroll root.',
      },
    ],
    a11y: ['role="progressbar" with aria-valuenow in percent.'],
  },
  {
    slug: 'reveal',
    title: 'Reveal & stagger',
    category: 'Scroll',
    description: 'Content that springs in as it enters — alone, or its children one after another.',
    keywords: ['fade in', 'scroll animation', 'stagger', 'aos', 'entrance'],
    height: 460,
    wide: true,
    controls: [
      {
        type: 'select',
        name: 'from',
        options: ['up', 'down', 'left', 'right', 'scale', 'blur', 'fade'],
        default: 'up',
      },
      { type: 'range', name: 'stagger', min: 0, max: 200, step: 10, default: 70 },
      { type: 'range', name: 'distance', min: 0, max: 120, step: 4, default: 40 },
      { type: 'boolean', name: 'once', default: false },
    ],
    code: {
      react: `import { Reveal } from '@vizzele/react';

<Reveal from="up" stagger={70} className="grid">
  {items.map((i) => <Card key={i.id} {...i} />)}
</Reveal>`,
      vanilla: `import { reveal } from '@vizzele/core';

reveal(grid, { stagger: 70, from: 'blur' });`,
      html: `<div data-vz-reveal="stagger: 70; from: blur">…</div>
<!-- CSS only: -->
<div class="vz-stagger">…</div>
<p class="vz-scroll-reveal">Scroll-driven, no JS</p>`,
    },
    props: [
      {
        name: 'from',
        type: "'up' | 'down' | 'left' | 'right' | 'scale' | 'blur' | 'fade'",
        default: "'up'",
        description: 'Entrance.',
      },
      { name: 'distance', type: 'number', default: '32', description: 'Travel (px).' },
      {
        name: 'stagger',
        type: 'number',
        default: '0',
        description: 'ms between children; 0 animates the element itself.',
      },
      { name: 'delay', type: 'number', default: '0', description: 'ms before starting.' },
      { name: 'once', type: 'boolean', default: 'true', description: 'Reveal only once.' },
      {
        name: 'spring',
        type: 'SpringConfig | SpringPreset',
        default: "'gentle'",
        description: 'Feel.',
      },
    ],
    a11y: ['Never leaves content hidden: with reduced motion everything shows immediately.'],
  },
  {
    slug: 'smooth-scroll',
    title: 'Smooth scroll',
    category: 'Scroll',
    description:
      'Optional inertial wheel scrolling that glides to a stop. Native scrolling everywhere else.',
    keywords: ['lenis', 'inertia', 'wheel', 'momentum'],
    height: 460,
    wide: true,
    controls: [
      { type: 'boolean', name: 'enabled', default: true },
      {
        type: 'range',
        name: 'lerp',
        label: 'smoothing',
        min: 0.03,
        max: 0.4,
        step: 0.01,
        default: 0.09,
      },
    ],
    code: {
      react: `import { SmoothScroll } from '@vizzele/react';

// once, at the root
<SmoothScroll lerp={0.1} />`,
      vanilla: `import { smoothScroll } from '@vizzele/core';

const s = smoothScroll({ lerp: 0.1 });
s.scrollTo(1200);`,
    },
    props: [
      { name: 'lerp', type: 'number', default: '0.1', description: 'Smoothing (lower = silkier).' },
      { name: 'wheelMultiplier', type: 'number', default: '1', description: 'Wheel speed.' },
      {
        name: 'container',
        type: 'HTMLElement | Window',
        default: 'window',
        description: 'Scroll root.',
      },
    ],
    a11y: [
      'Only the mouse wheel is smoothed. Keyboard, scrollbar, touch and nested scroll areas stay native.',
      'Pinch-zoom (ctrl+wheel) is never captured. Disabled entirely with reduced motion.',
    ],
  },
];
