import type { DocEntry } from '@/lib/types';

const springProp = {
  name: 'spring',
  type: 'SpringConfig | SpringPreset',
  default: "'liquid'",
  description: 'Spring for snapping, bouncing and returning.',
};

export const dragEntries: DocEntry[] = [
  {
    slug: 'draggable',
    title: 'Draggable',
    category: 'Drag & physics',
    description:
      'Grab it, throw it. Momentum carries it, the walls bounce it back with rubber-band resistance, snap points catch it.',
    keywords: ['drag', 'throw', 'inertia', 'momentum', 'bounds', 'snap', 'fling'],
    height: 460,
    controls: [
      { type: 'select', name: 'axis', options: ['both', 'x', 'y'], default: 'both' },
      { type: 'boolean', name: 'momentum', default: true },
      { type: 'range', name: 'elastic', min: 0, max: 1, step: 0.05, default: 0.35 },
      {
        type: 'range',
        name: 'power',
        label: 'throw power',
        min: 0.2,
        max: 2,
        step: 0.1,
        default: 1,
      },
      { type: 'range', name: 'rotate', label: 'rotate on drag', min: 0, max: 20, default: 6 },
      {
        type: 'range',
        name: 'stretch',
        label: 'rubber stretch',
        min: 0,
        max: 1,
        step: 0.05,
        default: 0.4,
      },
      { type: 'boolean', name: 'snapGrid', label: 'snap to corners', default: false },
    ],
    code: {
      react: `import { Draggable } from '@vizzele/react';

<div className="arena">
  <Draggable bounds="parent" elastic={0.35} rotate={6} stretch={0.4} className="card">
    Throw me
  </Draggable>
</div>`,
      vanilla: `import { draggable } from '@vizzele/core';

const drag = draggable(card, {
  bounds: 'parent',
  snap: { points: [{ x: 0, y: 0 }, { x: 300, y: 0 }] },
  onRest: ({ x, y }) => console.log('landed at', x, y),
});
drag.fling({ x: 2400 });   // throw it programmatically
drag.setPosition({ x: 0 }); // spring back`,
      html: `<div class="arena">
  <div class="card" data-vz-drag="bounds: parent; elastic: 0.35; rotate: 6">Throw me</div>
</div>`,
    },
    props: [
      {
        name: 'axis',
        type: "'x' | 'y' | 'both'",
        default: "'both'",
        description: 'Restrict movement to one axis.',
      },
      {
        name: 'lockDirection',
        type: 'boolean',
        default: 'false',
        description: 'Lock to the axis the gesture starts on.',
      },
      {
        name: 'bounds',
        type: "'parent' | HTMLElement | Partial<Bounds>",
        description: 'Keep it inside an element or px limits.',
      },
      {
        name: 'elastic',
        type: 'number',
        default: '0.35',
        description: 'Rubber-band resistance past bounds (0 = hard wall).',
      },
      {
        name: 'momentum',
        type: 'boolean',
        default: 'true',
        description: 'Keep gliding after release.',
      },
      { name: 'power', type: 'number', default: '1', description: 'Throw distance multiplier.' },
      { name: 'timeConstant', type: 'number', default: '0.4', description: 'Glide duration (s).' },
      {
        name: 'snap',
        type: '{ x?, y?, points? }',
        description: 'Snap values per axis or 2D points.',
      },
      {
        name: 'returnToOrigin',
        type: 'boolean',
        default: 'false',
        description: 'Spring back on release.',
      },
      { name: 'handle', type: 'string | HTMLElement', description: 'Only drag from this child.' },
      {
        name: 'rotate',
        type: 'number',
        default: '0',
        description: 'Tilt (deg) with horizontal speed.',
      },
      {
        name: 'stretch',
        type: 'number',
        default: '0',
        description: 'Rubber stretch along the velocity (0–1).',
      },
      {
        name: 'keyboard',
        type: 'number | false',
        default: '16',
        description: 'Arrow-key step in px.',
      },
      springProp,
      {
        name: 'onStart / onMove / onEnd / onRest',
        type: '(state: DragState) => void',
        description: 'Lifecycle. Return false from onEnd to drive the release yourself.',
      },
    ],
    a11y: [
      'Focusable; arrow keys move it (Shift for bigger steps), snapping to the next point when snap points exist.',
      'Mouse, touch and pen through Pointer Events. Single-axis drags let the page scroll on the other axis.',
      'Reduced motion: no throwing — it stays where you drop it (clamped to bounds).',
    ],
  },
  {
    slug: 'reorder',
    title: 'Reorder list',
    category: 'Drag & physics',
    description:
      'Drag items to reorder; the others flow out of the way with springs. Works with the keyboard too.',
    keywords: ['sortable', 'sort', 'list', 'dnd', 'drag and drop', 'kanban'],
    height: 480,
    controls: [
      { type: 'select', name: 'axis', options: ['y', 'x'], default: 'y' },
      { type: 'boolean', name: 'handle', label: 'drag handle only', default: false },
      {
        type: 'select',
        name: 'spring',
        options: ['liquid', 'jelly', 'snappy', 'gentle'],
        default: 'liquid',
      },
    ],
    code: {
      react: `import { ReorderGroup, ReorderItem } from '@vizzele/react';

const [items, setItems] = useState(['Springs', 'Inertia', 'Gestures']);

<ReorderGroup values={items} onReorder={setItems} label="Priorities">
  {items.map((item) => (
    <ReorderItem key={item}>{item}</ReorderItem>
  ))}
</ReorderGroup>`,
      vanilla: `import { reorder } from '@vizzele/core';

reorder(document.querySelector('ul'), {
  onReorder: (from, to) => console.log(from, '→', to),
});`,
      html: `<ul data-vz-reorder="axis: y">
  <li tabindex="0">Springs</li>
  <li tabindex="0">Inertia</li>
  <li tabindex="0">Gestures</li>
</ul>`,
    },
    props: [
      { name: 'values', type: 'T[]', description: 'The ordered data.' },
      { name: 'onReorder', type: '(values: T[]) => void', description: 'Receives the new order.' },
      { name: 'axis', type: "'x' | 'y'", default: "'y'", description: 'List direction.' },
      {
        name: 'useHandle',
        type: 'boolean',
        default: 'false',
        description: 'Only drag from <ReorderHandle>.',
      },
      springProp,
      { name: 'label', type: 'string', description: 'Accessible name of the list.' },
    ],
    a11y: [
      'Each item is focusable. Space/Enter grabs, arrow keys move, Space/Enter drops, Escape cancels.',
      'Every step is announced through a live region (“Position 3 of 6”).',
      'Items of different sizes are supported — slots are computed from real layout.',
    ],
  },
  {
    slug: 'swipe-stack',
    title: 'Swipe stack',
    category: 'Drag & physics',
    description:
      'A stack of cards you flick left or right. The next card rises as the top one leaves.',
    keywords: ['tinder', 'cards', 'swipe', 'deck', 'carousel'],
    height: 520,
    controls: [
      { type: 'range', name: 'threshold', min: 40, max: 220, step: 10, default: 110 },
      { type: 'range', name: 'depth', label: 'visible depth', min: 1, max: 4, default: 2 },
      { type: 'boolean', name: 'loop', default: true },
    ],
    code: {
      react: `import { SwipeStack, type SwipeStackHandle } from '@vizzele/react';

const stack = useRef<SwipeStackHandle>(null);

<SwipeStack
  ref={stack}
  items={people}
  renderCard={(p) => <ProfileCard person={p} />}
  onSwipe={(p, dir) => save(p, dir === 'right')}
/>
<button onClick={() => stack.current?.swipe('left')}>Nope</button>
<button onClick={() => stack.current?.swipe('right')}>Like</button>`,
    },
    props: [
      { name: 'items', type: 'T[]', description: 'Cards, top first.' },
      {
        name: 'renderCard',
        type: '(item: T, i: number) => ReactNode',
        description: 'Card content.',
      },
      {
        name: 'onSwipe',
        type: "(item: T, dir: 'left' | 'right') => void",
        description: 'Called when a card leaves.',
      },
      {
        name: 'threshold',
        type: 'number',
        default: '110',
        description: 'Drag distance (px) that counts as a swipe; a fast flick also counts.',
      },
      {
        name: 'depth',
        type: 'number',
        default: '2',
        description: 'Cards visible behind the top one.',
      },
      {
        name: 'loop',
        type: 'boolean',
        default: 'false',
        description: 'Recycle swiped cards to the bottom.',
      },
      {
        name: 'ref.swipe(dir)',
        type: 'SwipeStackHandle',
        description: 'Swipe programmatically (for buttons).',
      },
    ],
    a11y: [
      'The stack is focusable: ← and → swipe the top card. Results are announced politely.',
      'Always pair swiping with visible buttons — gestures alone are not discoverable.',
      'Cards behind the top one are hidden from assistive tech.',
    ],
  },
  {
    slug: 'elastic-slider',
    title: 'Elastic slider',
    category: 'Drag & physics',
    description:
      'Pull past either end and the track stretches like rubber, then wobbles back into shape.',
    keywords: ['range', 'input', 'volume', 'rubber band'],
    height: 300,
    controls: [
      { type: 'range', name: 'step', min: 1, max: 25, default: 1 },
      { type: 'boolean', name: 'icons', default: true },
      { type: 'boolean', name: 'disabled', default: false },
    ],
    code: {
      react: `import { ElasticSlider } from '@vizzele/react';

const [volume, setVolume] = useState(40);

<ElasticSlider
  label="Volume"
  value={volume}
  onChange={setVolume}
  startIcon={<SpeakerLow />}
  endIcon={<SpeakerHigh />}
/>`,
    },
    props: [
      { name: 'label', type: 'string', description: 'Accessible name (required).' },
      {
        name: 'value / defaultValue',
        type: 'number',
        default: '50',
        description: 'Controlled or uncontrolled value.',
      },
      { name: 'min / max / step', type: 'number', default: '0 / 100 / 1', description: 'Range.' },
      { name: 'onChange', type: '(v: number) => void', description: 'Value changes.' },
      {
        name: 'formatValue',
        type: '(v: number) => string',
        description: 'Display + aria-valuetext.',
      },
      {
        name: 'startIcon / endIcon',
        type: 'ReactNode',
        description: 'Icons that get pushed by the stretch.',
      },
      { name: 'showValue', type: 'boolean', default: 'true', description: 'Show the value.' },
    ],
    a11y: [
      'role="slider" with aria-valuemin/max/now/text on the thumb.',
      'Arrows, PageUp/PageDown, Home/End. Bumping an end with the keyboard wobbles the track.',
    ],
  },
  {
    slug: 'drag-to-dismiss',
    title: 'Drag to dismiss',
    category: 'Drag & physics',
    description:
      'Flick notifications, cards or sheets away. A short drag springs back; a fling sends it flying.',
    keywords: ['swipe to dismiss', 'notification', 'toast', 'close', 'gesture'],
    height: 440,
    controls: [
      { type: 'select', name: 'axis', options: ['x', 'y'], default: 'x' },
      {
        type: 'select',
        name: 'direction',
        options: ['both', 'positive', 'negative'],
        default: 'both',
      },
      { type: 'range', name: 'threshold', min: 0.1, max: 0.9, step: 0.05, default: 0.4 },
    ],
    code: {
      react: `import { useDragDismiss } from '@vizzele/react';

function Notification({ onClose, children }) {
  const ref = useDragDismiss<HTMLDivElement>({ axis: 'x', onDismiss: onClose });
  return <div ref={ref} className="vz-card">{children}</div>;
}`,
    },
    props: [
      { name: 'axis', type: "'x' | 'y'", default: "'x'", description: 'Drag axis.' },
      {
        name: 'direction',
        type: "'both' | 'positive' | 'negative'",
        default: "'both'",
        description: 'Which way dismisses; the other resists.',
      },
      {
        name: 'threshold',
        type: 'number',
        default: '0.4',
        description: 'Fraction of size to drag before release dismisses.',
      },
      {
        name: 'velocity',
        type: 'number',
        default: '700',
        description: 'Flick speed (px/s) that dismisses.',
      },
      { name: 'fade', type: 'boolean', default: 'true', description: 'Fade while dragging away.' },
      { name: 'onDismiss', type: '(dir: 1 | -1) => void', description: 'Remove the element here.' },
    ],
    a11y: ['Always offer a visible close button too — dragging is never the only way to dismiss.'],
  },
  {
    slug: 'bottom-sheet',
    title: 'Bottom sheet',
    category: 'Drag & physics',
    description:
      'A sheet that springs up from the bottom, rests at snap points and can be flicked away.',
    keywords: ['drawer', 'modal', 'sheet', 'snap points', 'mobile'],
    height: 360,
    controls: [
      {
        type: 'select',
        name: 'snaps',
        label: 'snap points',
        options: ['0.45, 0.92', '0.3, 0.6, 0.9', '0.7'],
        default: '0.45, 0.92',
      },
      { type: 'boolean', name: 'dismissible', default: true },
    ],
    code: {
      react: `import { BottomSheet } from '@vizzele/react';

const [open, setOpen] = useState(false);

<button onClick={() => setOpen(true)}>Open</button>
<BottomSheet open={open} onOpenChange={setOpen} snapPoints={[0.45, 0.92]} title="Filters">
  …
</BottomSheet>`,
    },
    props: [
      {
        name: 'open / onOpenChange',
        type: 'boolean / (open) => void',
        description: 'Controlled state.',
      },
      {
        name: 'snapPoints',
        type: 'number[]',
        default: '[0.45, 0.92]',
        description: 'Rest heights as fractions of the viewport.',
      },
      { name: 'defaultSnap', type: 'number', default: '0', description: 'Snap index to open at.' },
      { name: 'title', type: 'ReactNode', description: 'Heading and accessible name.' },
      {
        name: 'dismissible',
        type: 'boolean',
        default: 'true',
        description: 'Close by flicking down, Escape or the backdrop.',
      },
    ],
    a11y: [
      'role="dialog" + aria-modal; focus moves in, Tab is trapped, Escape closes and focus returns to the opener.',
      'The grab handle is a button: Enter cycles through the snap points.',
      'Only the header drags, so the content scrolls normally.',
    ],
  },
  {
    slug: 'infinite-canvas',
    title: 'Infinite canvas',
    category: 'Drag & physics',
    description:
      'An endless gallery you drag and throw in every direction. Cells recycle, so it stays light.',
    keywords: ['gallery', 'pan', 'grid', 'endless', 'portfolio', 'moodboard'],
    height: 520,
    wide: true,
    controls: [
      {
        type: 'range',
        name: 'itemWidth',
        label: 'cell width',
        min: 140,
        max: 360,
        step: 10,
        default: 220,
      },
      { type: 'range', name: 'gap', min: 8, max: 64, step: 2, default: 22 },
      { type: 'boolean', name: 'stagger', default: true },
    ],
    code: {
      react: `import { InfiniteCanvas } from '@vizzele/react';

<InfiniteCanvas
  items={photos}
  itemWidth={220}
  itemHeight={280}
  renderItem={(photo) => <img src={photo.src} alt={photo.alt} draggable={false} />}
  style={{ height: '80vh' }}
/>`,
    },
    props: [
      { name: 'items', type: 'T[]', description: 'Content; it repeats to fill the plane.' },
      {
        name: 'renderItem',
        type: '(item: T, i: number) => ReactNode',
        description: 'Cell content.',
      },
      {
        name: 'itemWidth / itemHeight',
        type: 'number',
        default: '240 / 300',
        description: 'Cell size.',
      },
      { name: 'gap', type: 'number', default: '24', description: 'Space between cells.' },
      {
        name: 'stagger',
        type: 'boolean',
        default: 'true',
        description: 'Offset alternate columns (masonry feel).',
      },
    ],
    a11y: [
      'Focusable region; arrow keys pan.',
      'Cells shrink a touch at high speed — a “lens” that keeps fast throws readable.',
    ],
  },
  {
    slug: 'physics',
    title: 'Physics playground',
    category: 'Drag & physics',
    description:
      'Every child becomes a body: they fall, collide, push each other and can be grabbed and thrown.',
    keywords: ['gravity', 'balls', 'collision', 'matter', 'playground', 'toy'],
    height: 520,
    wide: true,
    controls: [
      { type: 'range', name: 'gravity', min: -2000, max: 4000, step: 100, default: 2000 },
      {
        type: 'range',
        name: 'restitution',
        label: 'bounciness',
        min: 0,
        max: 0.95,
        step: 0.05,
        default: 0.55,
      },
      { type: 'range', name: 'count', label: 'bodies', min: 4, max: 40, default: 18 },
    ],
    code: {
      react: `import { PhysicsWorld } from '@vizzele/react';

<PhysicsWorld gravity={{ x: 0, y: 2000 }} restitution={0.55} style={{ height: 480 }}>
  {tags.map((t) => <span key={t} className="ball">{t}</span>)}
</PhysicsWorld>`,
      vanilla: `import { createPhysicsWorld } from '@vizzele/core';

const world = createPhysicsWorld(box, { restitution: 0.5 });
box.querySelectorAll('.ball').forEach((el) => world.add(el));
box.addEventListener('dblclick', (e) => world.impulse(e.offsetX, e.offsetY));`,
      html: `<div class="box" data-vz-physics="restitution: 0.55">
  <span class="ball">A</span><span class="ball">B</span>
</div>`,
    },
    props: [
      {
        name: 'gravity',
        type: '{ x: number; y: number }',
        default: '{ x: 0, y: 2000 }',
        description: 'px/s².',
      },
      { name: 'restitution', type: 'number', default: '0.5', description: 'Bounciness 0–1.' },
      { name: 'drag', type: 'number', default: '0.08', description: 'Air drag per second.' },
      {
        name: 'friction',
        type: 'number',
        default: '0.3',
        description: 'Rolling friction on walls.',
      },
      {
        name: 'interactive',
        type: 'boolean',
        default: 'true',
        description: 'Grab and throw bodies.',
      },
      {
        name: 'worldRef',
        type: 'Ref<PhysicsWorld>',
        description: 'impulse(x, y), setGravity(), wake()…',
      },
    ],
    a11y: [
      'Decorative toy: keep important content out of it, or mirror it elsewhere.',
      'Reduced motion: the world settles instantly into a still pile.',
      'Sleeps (zero CPU) once everything is at rest.',
    ],
  },
];
