import type { DocEntry } from '@/lib/types';

/** The ten pieces added in 0.6. */
export const liquidKitEntries: DocEntry[] = [
  {
    slug: 'gooey-menu',
    title: 'Gooey menu',
    category: 'Components',
    description:
      'A floating action button that splits into drops of liquid: each action buds off the trigger, the necks between them stretch and snap, and they flow back in when it closes.',
    keywords: ['fab', 'speed dial', 'floating action button', 'goo', 'metaball', 'menu'],
    isNew: true,
    height: 420,
    controls: [
      {
        type: 'select',
        name: 'direction',
        options: ['up', 'arc', 'left', 'right', 'down'],
        default: 'up',
      },
      { type: 'range', name: 'gap', min: 48, max: 90, default: 64 },
    ],
    code: {
      react: `import { GooeyMenu } from '@vizzele/react';

<GooeyMenu
  label="Create"
  direction="up"
  items={[
    { label: 'New note', icon: <NoteIcon />, onSelect: newNote },
    { label: 'Upload', icon: <UploadIcon />, onSelect: upload },
    { label: 'Share', icon: <ShareIcon />, onSelect: share },
  ]}
/>`,
    },
    props: [
      { name: 'items', type: '{ label, icon, onSelect }[]', description: 'The actions.' },
      {
        name: 'direction',
        type: "'up' | 'down' | 'left' | 'right' | 'arc'",
        default: "'up'",
        description: 'Where the drops travel.',
      },
      { name: 'gap', type: 'number', default: '64', description: 'Distance between drops (px).' },
      {
        name: 'label',
        type: 'string',
        default: "'Actions'",
        description: 'Name of the trigger and the menu.',
      },
      { name: 'open / defaultOpen / onOpenChange', type: '…', description: 'Controlled or not.' },
    ],
    a11y: [
      'A real menu button: aria-expanded, aria-haspopup and a role="menu" of menuitems.',
      'Opening focuses the first action; arrows, Home and End move; Escape closes and returns focus to the trigger.',
      'Each icon-only action is named by its label, which also shows as a tooltip on hover and focus.',
      'With reduced motion the drops appear in place — no flow.',
    ],
  },
  {
    slug: 'avatar-stack',
    title: 'Avatar stack',
    category: 'Components',
    description:
      'Overlapping avatars fused into one drop of liquid. Hover or focus the group and they part — the necks thin and snap — and each face lifts with its name.',
    keywords: ['avatars', 'people', 'team', 'members', 'facepile', 'goo'],
    isNew: true,
    height: 300,
    controls: [
      { type: 'range', name: 'size', min: 32, max: 64, default: 48 },
      { type: 'range', name: 'max', min: 3, max: 7, default: 5 },
    ],
    code: {
      react: `import { AvatarStack } from '@vizzele/react';

<AvatarStack
  max={5}
  people={[
    { name: 'Ada Lovelace', src: '/ada.jpg' },
    { name: 'Alan Turing' },          // initials on a gradient
    { name: 'Grace Hopper' },
  ]}
/>`,
    },
    props: [
      {
        name: 'people',
        type: '{ name, src? }[]',
        description: 'Without src, initials on a gradient.',
      },
      { name: 'max', type: 'number', default: '5', description: 'Shown before "+N".' },
      { name: 'size', type: 'number', default: '44', description: 'Diameter (px).' },
    ],
    a11y: [
      'One focusable group named with the count and every name ("7 people: Ada, Alan…"), so the list is read once, not face by face.',
      'Focus parts the stack just like hover.',
    ],
  },
  {
    slug: 'liquid-stepper',
    title: 'Liquid stepper',
    category: 'Components',
    description:
      'Progress through steps as liquid: the finished part is one stream that flows into the next dot when you advance — it bulges, fuses and settles on a jelly spring.',
    keywords: ['steps', 'wizard', 'progress', 'checkout', 'onboarding', 'timeline'],
    isNew: true,
    height: 300,
    wide: true,
    code: {
      react: `import { LiquidStepper } from '@vizzele/react';

<LiquidStepper
  current={step}
  steps={['Account', 'Profile', { label: 'Plan', description: 'Pick one' }, 'Done']}
  onStepClick={setStep}   // finished steps become buttons
/>`,
    },
    props: [
      { name: 'steps', type: '(string | { label, description? })[]', description: 'The steps.' },
      { name: 'current', type: 'number', description: 'Index of the current step.' },
      {
        name: 'onStepClick',
        type: '(index) => void',
        description: 'Makes finished steps clickable.',
      },
    ],
    a11y: [
      'An ordered list; the current step has aria-current="step" and finished ones say "(completed)".',
      'The liquid layer is decorative and hidden from assistive tech.',
    ],
  },
  {
    slug: 'liquid-gauge',
    title: 'Liquid gauge',
    category: 'Charts',
    description:
      'A round vessel of liquid light. The surface rolls gently; change the value and the level overshoots and sloshes before it settles. The number inverts where the liquid covers it.',
    keywords: ['gauge', 'meter', 'progress', 'water', 'level', 'battery', 'storage'],
    isNew: true,
    height: 340,
    controls: [
      { type: 'range', name: 'value', min: 0, max: 100, default: 62 },
      { type: 'range', name: 'size', min: 100, max: 220, default: 170 },
    ],
    code: {
      react: `import { LiquidGauge } from '@vizzele/react';

<LiquidGauge label="Storage used" value={62} />
<LiquidGauge label="Battery" value={0.8} max={1} format={(v) => \`\${v * 100}%\`} />`,
    },
    props: [
      { name: 'value', type: 'number', description: 'Current value.' },
      { name: 'max', type: 'number', default: '100', description: 'Full vessel.' },
      { name: 'label', type: 'string', description: 'What it measures (accessible name).' },
      { name: 'size', type: 'number', default: '160', description: 'Diameter (px).' },
      { name: 'format', type: '(value, max) => string', description: 'Text in the middle.' },
    ],
    a11y: [
      'role="meter" with min, max, value and the same text you see as aria-valuetext.',
      'Animates only while on screen; with reduced motion the surface is still and the level simply moves.',
    ],
  },
  {
    slug: 'liquid-rating',
    title: 'Liquid rating',
    category: 'Components',
    description:
      'Stars that fill with liquid. Light pours from one star into the next with a wobbling front, overshoots a touch and settles; hovering previews the level.',
    keywords: ['stars', 'rating', 'review', 'score', 'feedback'],
    isNew: true,
    height: 260,
    controls: [
      { type: 'select', name: 'step', options: ['1', '0.5'], default: '1' },
      { type: 'range', name: 'size', min: 24, max: 56, default: 40 },
      { type: 'boolean', name: 'readOnly', default: false },
    ],
    code: {
      react: `import { LiquidRating } from '@vizzele/react';

<LiquidRating value={rating} onChange={setRating} />
<LiquidRating value={4.5} step={0.5} readOnly label="Average" />`,
    },
    props: [
      {
        name: 'value / defaultValue / onChange',
        type: 'number',
        description: 'Controlled or not.',
      },
      { name: 'max', type: 'number', default: '5', description: 'Stars.' },
      { name: 'step', type: 'number', default: '1', description: '1 or 0.5.' },
      {
        name: 'readOnly',
        type: 'boolean',
        description: 'Display only (an image with a text name).',
      },
      { name: 'size', type: 'number', default: '32', description: 'Star size (px).' },
    ],
    a11y: [
      'A slider: arrows change it, Home/End jump, and it reads "3 of 5 stars".',
      'Read-only ratings are an image named "Rating: 4.5 of 5 stars".',
    ],
  },
  {
    slug: 'number-scrubber',
    title: 'Number scrubber',
    category: 'Drag & physics',
    description:
      'A number you drag. Pull it sideways and the value runs under a sliding ruler; flick and it coasts on inertia, stretches like rubber at its limits and springs back. Double-click to type.',
    keywords: ['scrub', 'drag number', 'figma', 'input', 'spinbutton', 'slider'],
    isNew: true,
    height: 300,
    code: {
      react: `import { NumberScrubber } from '@vizzele/react';

<NumberScrubber label="Opacity" value={opacity} onChange={setOpacity}
  min={0} max={100} suffix="%" />
<NumberScrubber label="Radius" defaultValue={12} step={0.5} min={0} suffix="px" />`,
    },
    props: [
      { name: 'label', type: 'string', description: 'Visible label and accessible name.' },
      {
        name: 'value / defaultValue / onChange',
        type: 'number',
        description: 'Controlled or not.',
      },
      {
        name: 'min / max / step',
        type: 'number',
        default: '-∞ / ∞ / 1',
        description: 'Range; decimals follow the step.',
      },
      { name: 'prefix / suffix', type: 'ReactNode', description: 'Units around the number.' },
      { name: 'pixelsPerStep', type: 'number', default: '4', description: 'Drag sensitivity.' },
    ],
    a11y: [
      'role="spinbutton": arrows step (Shift ×10), Page Up/Down, Home/End at the limits.',
      'Enter or double-click opens a text field; Enter saves, Escape cancels.',
      'Shift while dragging = ×10, Alt = fine. Inertia is off with reduced motion.',
    ],
  },
  {
    slug: 'pull-to-refresh',
    title: 'Pull to refresh',
    category: 'Drag & physics',
    description:
      'Pull the top of a list and a drop of liquid stretches out of the edge, its neck thinning until it snaps free at the threshold — release and it spins while you refresh.',
    keywords: ['refresh', 'reload', 'feed', 'mobile', 'list', 'overscroll'],
    isNew: true,
    height: 460,
    code: {
      react: `import { PullToRefresh } from '@vizzele/react';

<PullToRefresh onRefresh={() => fetchLatest()} style={{ height: 420 }}>
  {items.map((item) => <Row key={item.id} {...item} />)}
</PullToRefresh>`,
    },
    props: [
      {
        name: 'onRefresh',
        type: '() => Promise | void',
        description: 'The drop spins until it settles.',
      },
      {
        name: 'threshold',
        type: 'number',
        default: '72',
        description: 'Pull distance that triggers (px).',
      },
      {
        name: 'label',
        type: 'string',
        default: "'Refresh'",
        description: 'Keyboard button and announcements.',
      },
    ],
    a11y: [
      'Works with touch and mouse; it only takes over the gesture at the very top of the list.',
      'Keyboard users get a Refresh button that appears on focus.',
      'Refreshing / Updated is announced in a status region, and the list is aria-busy meanwhile.',
    ],
  },
  {
    slug: 'signature-pad',
    title: 'Signature pad',
    category: 'Components',
    description:
      'Sign with liquid ink: strokes swell when you slow down and thin out when you flick, and iridescent ink shifts hue along the line. Export PNG or SVG.',
    keywords: ['signature', 'sign', 'draw', 'canvas', 'ink', 'contract', 'handwriting'],
    isNew: true,
    height: 380,
    wide: true,
    controls: [
      {
        type: 'select',
        name: 'ink',
        options: ['iridescent', 'white', '#7c5cff'],
        default: 'iridescent',
      },
    ],
    code: {
      react: `import { SignaturePad, type SignaturePadHandle } from '@vizzele/react';

const pad = useRef<SignaturePadHandle>(null);

<SignaturePad ref={pad} onChange={(empty) => setCanSubmit(!empty)} />
<button onClick={() => upload(pad.current!.toSVG())}>Send</button>`,
    },
    props: [
      {
        name: 'ink',
        type: "'iridescent' | CSS colour",
        default: "'iridescent'",
        description: 'Ink.',
      },
      {
        name: 'minWidth / maxWidth',
        type: 'number',
        default: '1.4 / 4.4',
        description: 'Stroke width range (px).',
      },
      { name: 'height', type: 'number', default: '200', description: 'Pad height (px).' },
      { name: 'onChange', type: '(empty) => void', description: 'After every stroke or clear.' },
      {
        name: 'ref',
        type: 'SignaturePadHandle',
        description: 'clear(), isEmpty(), toDataURL(), toSVG().',
      },
    ],
    a11y: [
      '“Type instead” lets keyboard and screen-reader users type their name; it is set in a script face on the baseline.',
      'The canvas is an image named "Signature: empty" or "signed".',
      'Strokes are kept as data, so resizing redraws them crisply and SVG export is exact.',
    ],
  },
  {
    slug: 'stream-text',
    title: 'Stream text',
    category: 'AI',
    description:
      'Text that arrives the way an AI answer does: each new word condenses out of a blur behind a glowing liquid caret. Feed it tokens as they stream, or a whole string at a reading speed.',
    keywords: ['ai', 'llm', 'chat', 'streaming', 'typewriter', 'tokens', 'answer'],
    isNew: true,
    height: 320,
    controls: [{ type: 'range', name: 'speed', min: 20, max: 200, default: 70 }],
    code: {
      react: `import { StreamText } from '@vizzele/react';

// Tokens from your LLM stream, appended as they arrive
<StreamText text={answer} streaming={!done} />

// Or a whole string, revealed at a reading speed
<StreamText text="Here is what I found…" speed={60} />`,
    },
    props: [
      { name: 'text', type: 'string', description: 'The text so far.' },
      {
        name: 'streaming',
        type: 'boolean',
        description: 'Still receiving: keeps the caret alive.',
      },
      {
        name: 'speed',
        type: 'number',
        default: '0',
        description: 'Characters per second for a whole string (0 = as it arrives).',
      },
      { name: 'caret', type: 'boolean', default: 'true', description: 'The liquid caret.' },
      { name: 'as', type: 'ElementType', default: "'p'", description: 'Element.' },
      { name: 'onDone', type: '() => void', description: 'When everything is shown.' },
    ],
    a11y: [
      'Screen readers hear the finished answer once, in a polite live region — not a word at a time.',
      'With reduced motion words appear without the blur and a full string shows at once.',
    ],
  },
  {
    slug: 'border-light',
    title: 'Border light',
    category: 'Cursor & pointer',
    description:
      'A comet of light that orbits a card’s border. Bring the pointer close and it swings round to meet it on a spring, brightening as you approach; move away and it resumes its orbit.',
    keywords: ['border beam', 'glow', 'card', 'highlight', 'orbit', 'pricing'],
    isNew: true,
    height: 380,
    controls: [
      { type: 'range', name: 'speed', min: 0, max: 200, default: 70 },
      { type: 'range', name: 'width', min: 1, max: 4, step: 0.5, default: 1.5 },
    ],
    code: {
      react: `import { BorderLight } from '@vizzele/react';

<BorderLight className="pricing-card" speed={70}>
  <h3>Pro</h3>
  …
</BorderLight>`,
    },
    props: [
      { name: 'speed', type: 'number', default: '70', description: 'Orbit speed (deg/s).' },
      { name: 'width', type: 'number', default: '1.5', description: 'Ring width (px).' },
      {
        name: 'proximity',
        type: 'number',
        default: '200',
        description: 'How near the pointer must be (px).',
      },
      { name: 'as', type: 'ElementType', default: "'div'", description: 'Element.' },
    ],
    a11y: [
      'Pure decoration on your own element: no roles added, nothing focusable.',
      'Runs only while on screen; with reduced motion the light holds still and only brightens near the pointer.',
    ],
  },
];
