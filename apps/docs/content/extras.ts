import type { DocEntry } from '@/lib/types';

/** The pieces added in 0.10: a scratch card, and lazy mounting for heavy sections. */
export const extraEntries: DocEntry[] = [
  {
    slug: 'scratch-card',
    title: 'Scratch card',
    category: 'Components',
    description:
      'A lottery-ticket foil over anything — a coupon, a prize, a spoiler. Drag to scratch: the holographic foil flakes away under your finger, catches the light as you hover, and once enough is gone the rest dissolves (with confetti, if you like).',
    keywords: ['scratch', 'lottery', 'reveal', 'coupon', 'prize', 'gift', 'foil', 'spoiler'],
    isNew: true,
    height: 460,
    controls: [
      { type: 'range', name: 'brush', min: 10, max: 44, default: 22 },
      { type: 'range', name: 'threshold', min: 0.2, max: 0.9, step: 0.05, default: 0.55 },
      { type: 'boolean', name: 'confetti', default: true },
    ],
    code: {
      react: `import { ScratchCard } from '@vizzele/react';

<ScratchCard
  label="Scratch for your code"
  confetti
  onReveal={() => track('coupon_revealed')}
  style={{ width: 340, height: 200 }}
>
  <Coupon code="VIZZELE20" />
</ScratchCard>`,
      css: `/* Your own foil */
<ScratchCard colors={['#f7d774', '#fff4c2', '#c9a227']} />`,
    },
    props: [
      { name: 'children', type: 'ReactNode', description: 'The prize under the foil.' },
      {
        name: 'label',
        type: 'string',
        default: "'Scratch to reveal'",
        description: 'Printed on the foil.',
      },
      {
        name: 'colors',
        type: 'string[]',
        default: 'holographic silver',
        description: 'The foil gradient.',
      },
      { name: 'brush', type: 'number', default: '22', description: 'Brush radius in px.' },
      {
        name: 'threshold',
        type: 'number',
        default: '0.55',
        description: 'Share of the foil (0–1) to scratch before the rest dissolves.',
      },
      {
        name: 'confetti',
        type: 'boolean',
        default: 'false',
        description: 'Throw confetti from the card when it is revealed.',
      },
      {
        name: 'revealLabel',
        type: 'string',
        default: "'Reveal'",
        description: 'The keyboard / screen-reader button.',
      },
      { name: 'onProgress', type: '(p: number) => void', description: 'Scratched share, 0–1.' },
      { name: 'onReveal', type: '() => void', description: 'Called once, when it is revealed.' },
    ],
    a11y: [
      'Keyboard and screen-reader users get a Reveal button (it appears when focused).',
      'The prize is inert — not focusable, not read out — until it is revealed.',
      'Progress is tracked on a coarse grid, never by reading pixels back, so scratching stays smooth on phones.',
      'With reduced motion there are no falling flakes and the foil disappears without a fade.',
    ],
  },
  {
    slug: 'lazy-mount',
    title: 'Lazy mount',
    category: 'Hooks',
    description:
      'Mounts its children only when they come near the screen. The WebGL background, the 3D phone, the chart three screens down cost nothing — no JavaScript, no GPU — until they are about to be seen. Pair it with React.lazy or next/dynamic and their code is not even downloaded before then.',
    keywords: ['lazy', 'defer', 'performance', 'intersection', 'code splitting', 'dynamic'],
    isNew: true,
    height: 460,
    code: {
      react: `import { lazy, Suspense } from 'react';
import { LazyMount } from '@vizzele/react';

const Fluid = lazy(() =>
  import('@vizzele/react/gl').then((m) => ({ default: m.FluidBackground })),
);

<LazyMount minHeight={600} margin="50% 0px">
  <Suspense>
    <Fluid />
  </Suspense>
</LazyMount>`,
    },
    props: [
      { name: 'children', type: 'ReactNode', description: 'What to mount once it is near.' },
      {
        name: 'margin',
        type: 'string',
        default: "'50% 0px'",
        description: 'How far outside the viewport to start (CSS margin).',
      },
      {
        name: 'minHeight',
        type: 'number | string',
        description: 'Space to hold until it mounts, so the page does not jump.',
      },
      {
        name: 'placeholder',
        type: 'ReactNode',
        description: 'Shown until then — also what the server renders.',
      },
      {
        name: 'idle',
        type: 'boolean',
        default: 'false',
        description: 'Also mount when the browser goes idle, even if never scrolled to.',
      },
      { name: 'as', type: 'ElementType', default: "'div'", description: 'Element to render.' },
    ],
    a11y: [
      'Use it for decoration and below-the-fold extras. Content people search for or link to should render on the server.',
      'Once mounted, children stay mounted; Vizzele effects inside still pause on their own while off-screen.',
    ],
  },
];
