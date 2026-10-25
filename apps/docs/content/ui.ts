import type { DocEntry } from '@/lib/types';

const cat = 'Components' as const;

export const uiEntries: DocEntry[] = [
  {
    slug: 'button',
    title: 'Button',
    category: cat,
    description:
      'Liquid, holo, glow or plain — every button can be magnetic and ripples on press. The liquid body flows toward the pointer.',
    keywords: ['cta', 'action', 'magnetic', 'ripple', 'loading'],
    controls: [
      {
        type: 'select',
        name: 'variant',
        options: ['liquid', 'holo', 'glow', 'default', 'ghost'],
        default: 'liquid',
      },
      { type: 'select', name: 'size', options: ['sm', 'md', 'lg'], default: 'lg' },
      { type: 'boolean', name: 'magnetic', default: true },
      { type: 'boolean', name: 'ripple', default: true },
      { type: 'boolean', name: 'loading', default: false },
      { type: 'text', name: 'label', default: 'Get started' },
    ],
    code: {
      react: `import { Button } from '@vizzele/react';

<Button variant="liquid" size="lg" magnetic>Get started</Button>
<Button variant="holo" endIcon={<Arrow />}>Docs</Button>
<Button variant="glow" loading>Deploying</Button>
<Button as="a" href="/pricing" variant="ghost">Pricing</Button>`,
      html: `<button class="vz-button" data-variant="liquid" data-size="lg"
        data-vz-magnetic data-vz-ripple>Get started</button>`,
    },
    props: [
      {
        name: 'variant',
        type: "'default' | 'liquid' | 'holo' | 'glow' | 'ghost'",
        default: "'default'",
        description: 'Material.',
      },
      {
        name: 'size',
        type: "'sm' | 'md' | 'lg'",
        default: "'md'",
        description: 'Height and type size.',
      },
      {
        name: 'magnetic',
        type: 'boolean | MagneticOptions',
        default: 'false',
        description: 'Pull toward the pointer.',
      },
      { name: 'ripple', type: 'boolean', default: 'true', description: 'Liquid ripple on press.' },
      {
        name: 'loading',
        type: 'boolean',
        default: 'false',
        description: 'Spinner + aria-busy, disabled while loading.',
      },
      { name: 'startIcon / endIcon', type: 'ReactNode', description: 'Icons.' },
      {
        name: 'as',
        type: 'ElementType',
        default: "'button'",
        description: 'Render as a link or router Link.',
      },
    ],
    a11y: [
      'Real <button> (type="button" by default) with a visible iridescent focus ring.',
      'Loading sets aria-busy and blocks double submits.',
      'Text on the liquid variant is dark ink over bright color for AA contrast.',
    ],
  },
  {
    slug: 'card',
    title: 'Card',
    category: cat,
    description: 'Surfaces in four materials: plain, liquid glass, holographic foil and spotlight.',
    keywords: ['surface', 'panel', 'glass', 'holographic', 'container'],
    height: 440,
    controls: [
      {
        type: 'select',
        name: 'variant',
        options: ['glass', 'holo', 'spotlight', 'default'],
        default: 'glass',
      },
      { type: 'boolean', name: 'interactive', label: 'lift on hover', default: false },
    ],
    code: {
      react: `import { Card } from '@vizzele/react';

<Card variant="glass">…</Card>
<Card variant="holo">…</Card>
<Card variant="spotlight" interactive>…</Card>`,
      html: `<div class="vz-card vz-glass">…</div>
<div class="vz-card vz-holo" data-vz-tilt>…</div>
<div class="vz-card vz-spotlight" data-vz-spotlight>…</div>`,
    },
    props: [
      {
        name: 'variant',
        type: "'default' | 'glass' | 'holo' | 'spotlight'",
        default: "'default'",
        description: 'Material.',
      },
      {
        name: 'interactive',
        type: 'boolean',
        default: 'false',
        description: 'Lift with a spring on hover.',
      },
      {
        name: 'as',
        type: 'ElementType',
        default: "'div'",
        description: 'Element (article, a, li…).',
      },
    ],
    a11y: ['A plain container — give it the semantics of what it holds (article, li, a).'],
  },
  {
    slug: 'liquid-glass',
    title: 'Liquid glass',
    category: cat,
    description:
      'Glass that actually refracts: the backdrop bends at the rim like a lens and splits into color at the edge — not just a blur.',
    keywords: ['glassmorphism', 'refraction', 'frosted', 'blur', 'lens', 'apple'],
    height: 460,
    wide: true,
    controls: [
      { type: 'range', name: 'refraction', min: 0, max: 120, default: 38 },
      {
        type: 'range',
        name: 'bezel',
        label: 'rim width',
        min: 0.05,
        max: 0.6,
        step: 0.01,
        default: 0.32,
      },
      {
        type: 'range',
        name: 'dispersion',
        label: 'prism split',
        min: 0,
        max: 0.4,
        step: 0.01,
        default: 0.12,
      },
      { type: 'range', name: 'blur', min: 0, max: 12, step: 0.5, default: 1.5 },
    ],
    code: {
      react: `import { LiquidGlass } from '@vizzele/react';

<LiquidGlass refraction={38} bezel={0.32} className="panel">
  Content floating on glass
</LiquidGlass>`,
      vanilla: `import { liquidGlass, supportsRefraction } from '@vizzele/core';

liquidGlass(panel, { refraction: 38 }); // no-op (CSS blur fallback) where unsupported`,
      html: `<div class="vz-glass vz-liquid-glass" data-vz-liquid-glass="refraction: 38">…</div>`,
    },
    props: [
      { name: 'refraction', type: 'number', default: '38', description: 'Bend strength (px).' },
      {
        name: 'bezel',
        type: 'number',
        default: '0.32',
        description: 'Width of the bent rim (fraction of the short side).',
      },
      {
        name: 'dispersion',
        type: 'number',
        default: '0.12',
        description: 'Per-channel split at the edge (prismatic fringe).',
      },
      { name: 'blur', type: 'number', default: '1.5', description: 'Blur after refraction.' },
      { name: 'saturation', type: 'number', default: '1.6', description: 'Color boost.' },
    ],
    a11y: [
      'Real refraction needs SVG filters in backdrop-filter (Chromium). Safari and Firefox get a frosted-glass fallback automatically.',
      'Keep text on glass high-contrast — the tint (--vz-glass-tint) is there for legibility.',
    ],
  },
  {
    slug: 'modal',
    title: 'Modal',
    category: cat,
    description:
      'A dialog that grows out of the button that opened it, and shrinks back into it. Drag the header down to dismiss.',
    keywords: ['dialog', 'popup', 'morph', 'shared element', 'overlay'],
    height: 380,
    controls: [
      { type: 'range', name: 'width', min: 320, max: 760, step: 10, default: 480 },
      { type: 'boolean', name: 'dismissible', default: true },
    ],
    code: {
      react: `import { Modal, Button } from '@vizzele/react';

const [open, setOpen] = useState(false);
const trigger = useRef(null);

<Button ref={trigger} onClick={() => setOpen(true)}>New project</Button>
<Modal open={open} onOpenChange={setOpen} originRef={trigger} title="New project">
  …
</Modal>`,
    },
    props: [
      {
        name: 'open / onOpenChange',
        type: 'boolean / (open) => void',
        description: 'Controlled state.',
      },
      {
        name: 'originRef',
        type: 'RefObject<HTMLElement>',
        description: 'Element to morph from (default: the focused element).',
      },
      {
        name: 'title / description',
        type: 'ReactNode',
        description: 'Accessible name and description.',
      },
      { name: 'width', type: 'number | string', default: '520', description: 'Max width.' },
      {
        name: 'dismissible',
        type: 'boolean',
        default: 'true',
        description: 'Escape, backdrop and drag-down close it.',
      },
    ],
    a11y: [
      'role="dialog" + aria-modal; focus moves inside, Tab is trapped, Escape closes, focus returns to the trigger.',
      'Page scroll is locked while open. Reduced motion: a simple fade.',
    ],
  },
  {
    slug: 'tabs',
    title: 'Tabs',
    category: cat,
    description:
      'The indicator flows like liquid: its leading edge races ahead, the trailing edge catches up, and it settles with a wobble.',
    keywords: ['tablist', 'segmented control', 'switcher', 'navigation'],
    height: 360,
    controls: [
      { type: 'select', name: 'variant', options: ['pill', 'underline'], default: 'pill' },
    ],
    code: {
      react: `import { Tabs } from '@vizzele/react';

<Tabs
  label="Billing"
  items={[
    { value: 'monthly', label: 'Monthly', content: <Monthly /> },
    { value: 'yearly', label: 'Yearly', content: <Yearly /> },
  ]}
/>`,
    },
    props: [
      { name: 'items', type: 'TabItem[]', description: '{ value, label, content?, disabled? }' },
      {
        name: 'value / defaultValue / onValueChange',
        type: 'string',
        description: 'Controlled or uncontrolled.',
      },
      {
        name: 'variant',
        type: "'pill' | 'underline'",
        default: "'pill'",
        description: 'Indicator style.',
      },
      { name: 'label', type: 'string', description: 'Accessible name for the tab list.' },
    ],
    a11y: [
      'WAI-ARIA tabs pattern: roving tabindex, ←/→, Home/End, aria-selected and aria-controls.',
    ],
  },
  {
    slug: 'dock',
    title: 'Dock',
    category: cat,
    description:
      'macOS-style magnification: icons swell as the pointer passes over, neighbours rising along a curve.',
    keywords: ['macos', 'magnify', 'toolbar', 'navigation', 'app bar'],
    height: 320,
    controls: [
      { type: 'range', name: 'size', min: 32, max: 72, default: 48 },
      { type: 'range', name: 'magnification', min: 1, max: 2.5, step: 0.05, default: 1.75 },
      { type: 'range', name: 'distance', min: 60, max: 300, step: 10, default: 150 },
    ],
    code: {
      react: `import { Dock } from '@vizzele/react';

<Dock
  items={[
    { label: 'Home', icon: <HomeIcon />, href: '/', active: true },
    { label: 'Search', icon: <SearchIcon />, onClick: openSearch },
  ]}
/>`,
    },
    props: [
      {
        name: 'items',
        type: 'DockItem[]',
        description: '{ label, icon, href? | onClick?, active? }',
      },
      { name: 'size', type: 'number', default: '48', description: 'Resting size (px).' },
      { name: 'magnification', type: 'number', default: '1.75', description: 'Peak scale.' },
      {
        name: 'distance',
        type: 'number',
        default: '150',
        description: 'How far the swell spreads (px).',
      },
    ],
    a11y: [
      'Each item is a link or button with an accessible name; keyboard focus magnifies it too.',
      'Touch: magnifies while you drag your finger along it.',
    ],
  },
  {
    slug: 'navbar',
    title: 'Navbar',
    category: cat,
    description:
      'A full-width bar that condenses into a floating glass pill as you scroll — and optionally hides on the way down.',
    keywords: ['header', 'navigation', 'sticky', 'scroll', 'menu'],
    height: 460,
    wide: true,
    controls: [
      { type: 'range', name: 'threshold', min: 0, max: 200, step: 10, default: 40 },
      { type: 'boolean', name: 'hideOnScroll', label: 'hide on scroll down', default: false },
    ],
    code: {
      react: `import { Navbar, Button } from '@vizzele/react';

<Navbar
  brand={<Logo />}
  links={[{ label: 'Docs', href: '/docs' }, { label: 'Pricing', href: '/pricing' }]}
  actions={<Button variant="liquid" size="sm">Sign up</Button>}
  hideOnScroll
/>`,
    },
    props: [
      { name: 'brand', type: 'ReactNode', description: 'Logo.' },
      {
        name: 'links',
        type: '{ label, href, active? }[]',
        description: 'Main links (collapse into a menu on mobile).',
      },
      { name: 'actions', type: 'ReactNode', description: 'Right side.' },
      {
        name: 'threshold',
        type: 'number',
        default: '40',
        description: 'Scroll px before condensing.',
      },
      {
        name: 'hideOnScroll',
        type: 'boolean',
        default: 'false',
        description: 'Slide away while scrolling down.',
      },
      {
        name: 'position',
        type: "'fixed' | 'sticky'",
        default: "'fixed'",
        description: 'Positioning.',
      },
    ],
    a11y: [
      '<header> + <nav aria-label>, aria-current on the active link.',
      'The mobile menu button exposes aria-expanded / aria-controls.',
    ],
  },
  {
    slug: 'toggles',
    title: 'Switch, checkbox & radio',
    category: cat,
    description:
      'Native inputs with physical micro-motion: the switch thumb stretches and lands with a jelly bounce, ticks draw themselves, radio drops pop in.',
    keywords: ['switch', 'toggle', 'checkbox', 'radio', 'form', 'input'],
    height: 380,
    code: {
      react: `import { Switch, Checkbox, RadioGroup } from '@vizzele/react';

<Switch label="Reduced motion" checked={on} onCheckedChange={setOn} />
<Checkbox label="Accept the terms" />
<RadioGroup
  label="Plan"
  defaultValue="pro"
  options={[{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }]}
/>`,
      html: `<label class="vz-switch">
  <input type="checkbox" role="switch" class="vz-switch-input" />
  <span class="vz-switch-track"><span class="vz-switch-thumb"></span></span>
  Reduced motion
</label>`,
    },
    props: [
      { name: 'label / description', type: 'ReactNode', description: 'Text next to the control.' },
      {
        name: 'checked / defaultChecked',
        type: 'boolean',
        description: 'Native input props pass through.',
      },
      {
        name: 'onCheckedChange',
        type: '(checked: boolean) => void',
        description: 'Switch & Checkbox.',
      },
      { name: 'indeterminate', type: 'boolean', description: 'Checkbox mixed state.' },
      {
        name: 'options / value / onValueChange',
        type: 'RadioGroup',
        description: 'Radio group data.',
      },
    ],
    a11y: [
      'They are native inputs (role="switch" for the switch), so forms, labels and keyboard work exactly as expected.',
      'All motion is CSS spring transitions — disabled automatically with reduced motion.',
    ],
  },
  {
    slug: 'input',
    title: 'Input',
    category: cat,
    description:
      'A text field with a floating label and a border of light that follows the pointer, then circles the field on focus.',
    keywords: ['text field', 'form', 'floating label', 'textbox'],
    height: 340,
    controls: [
      { type: 'text', name: 'label', default: 'Email address' },
      { type: 'boolean', name: 'error', label: 'show error', default: false },
      { type: 'boolean', name: 'icon', default: true },
    ],
    code: {
      react: `import { Input } from '@vizzele/react';

<Input label="Email address" type="email" hint="We never share it." />
<Input label="Password" type="password" error="Too short" />`,
      html: `<div class="vz-field vz-field-glow" data-vz-spotlight>
  <input id="email" class="vz-input" placeholder=" " />
  <label for="email" class="vz-field-label">Email address</label>
</div>`,
    },
    props: [
      { name: 'label', type: 'string', description: 'Floating label (required).' },
      {
        name: 'hint / error',
        type: 'ReactNode',
        description: 'Helper or error text (aria-describedby).',
      },
      { name: 'startIcon', type: 'ReactNode', description: 'Leading icon.' },
      {
        name: 'glow',
        type: 'boolean',
        default: 'true',
        description: 'Pointer-following border light.',
      },
    ],
    a11y: ['A real <label for>; errors set aria-invalid and are linked via aria-describedby.'],
  },
  {
    slug: 'tooltip',
    title: 'Tooltip',
    category: cat,
    description:
      'A small label that springs out of its anchor on hover or keyboard focus, flipping to stay on screen.',
    keywords: ['hint', 'title', 'label', 'hover'],
    height: 300,
    controls: [
      {
        type: 'select',
        name: 'placement',
        options: ['top', 'bottom', 'left', 'right'],
        default: 'top',
      },
      { type: 'range', name: 'delay', min: 0, max: 1000, step: 50, default: 300 },
    ],
    code: {
      react: `import { Tooltip } from '@vizzele/react';

<Tooltip content="Copy to clipboard">
  <button aria-label="Copy">…</button>
</Tooltip>`,
    },
    props: [
      { name: 'content', type: 'ReactNode', description: 'Tooltip text.' },
      {
        name: 'placement',
        type: "'top' | 'bottom' | 'left' | 'right'",
        default: "'top'",
        description: 'Preferred side (flips if needed).',
      },
      {
        name: 'delay',
        type: 'number',
        default: '350',
        description: 'Hover delay (ms). Focus shows instantly.',
      },
    ],
    a11y: [
      'role="tooltip" referenced by aria-describedby; shows on focus, hides on Escape and blur.',
    ],
  },
  {
    slug: 'popover',
    title: 'Popover',
    category: cat,
    description:
      'A glass panel anchored to a button: springs open on click, moves focus inside, closes on Escape or outside click.',
    keywords: ['dropdown', 'menu', 'floating', 'panel'],
    height: 360,
    controls: [
      {
        type: 'select',
        name: 'placement',
        options: ['bottom', 'top', 'left', 'right'],
        default: 'bottom',
      },
    ],
    code: {
      react: `import { Popover, Button } from '@vizzele/react';

<Popover label="Share" content={<ShareOptions />}>
  {(props) => <Button {...props}>Share</Button>}
</Popover>`,
    },
    props: [
      {
        name: 'children',
        type: '(triggerProps) => ReactNode',
        description: 'Render your trigger with the given props.',
      },
      { name: 'content', type: 'ReactNode', description: 'Panel content.' },
      { name: 'placement', type: 'Placement', default: "'bottom'", description: 'Preferred side.' },
      { name: 'open / onOpenChange', type: 'boolean', description: 'Optional control.' },
      { name: 'label', type: 'string', description: 'Accessible name of the panel.' },
    ],
    a11y: [
      'Trigger gets aria-expanded/aria-controls; focus moves into the panel and returns on Escape.',
    ],
  },
  {
    slug: 'toast',
    title: 'Toast',
    category: cat,
    description:
      'Notifications that spring up into a stack, fan out on hover and can be flicked away.',
    keywords: ['notification', 'snackbar', 'alert', 'sonner'],
    height: 300,
    controls: [
      {
        type: 'select',
        name: 'position',
        options: ['bottom-right', 'bottom-center', 'bottom-left', 'top-right', 'top-center'],
        default: 'bottom-right',
      },
    ],
    code: {
      react: `import { Toaster, toast } from '@vizzele/react';

// once, at the root
<Toaster position="bottom-right" />

toast('Saved');
toast.success({ title: 'Deployed', description: 'vizzele-ui is live' });
toast.error({ title: 'Build failed', action: { label: 'Retry', onClick: retry } });`,
    },
    props: [
      {
        name: 'toast(input)',
        type: 'string | { title, description?, variant?, duration?, action? }',
        description: 'Returns the id.',
      },
      { name: 'toast.success / error / info', type: 'function', description: 'Variants.' },
      { name: 'toast.dismiss(id?)', type: 'function', description: 'Dismiss one or all.' },
      { name: 'position', type: 'ToasterProps', default: "'bottom-right'", description: 'Corner.' },
      {
        name: 'visible',
        type: 'number',
        default: '3',
        description: 'Toasts visible in the collapsed stack.',
      },
    ],
    a11y: [
      'role="status" (polite) for normal toasts, role="alert" for errors.',
      'Timers pause while the stack is hovered or focused; every toast has a close button.',
    ],
  },
  {
    slug: 'accordion',
    title: 'Accordion',
    category: cat,
    description:
      'Sections that open with a spring on their height — content pours in, the chevron flips with a wobble.',
    keywords: ['collapse', 'faq', 'disclosure', 'expand'],
    height: 420,
    controls: [{ type: 'boolean', name: 'multiple', label: 'allow multiple', default: false }],
    code: {
      react: `import { Accordion } from '@vizzele/react';

<Accordion
  items={[
    { id: 'what', title: 'What is Vizzele?', content: '…' },
    { id: 'price', title: 'Is it free?', content: 'MIT licensed.' },
  ]}
/>`,
    },
    props: [
      { name: 'items', type: 'AccordionItem[]', description: '{ id, title, content, disabled? }' },
      { name: 'multiple', type: 'boolean', default: 'false', description: 'Several open at once.' },
      { name: 'open / defaultOpen / onOpenChange', type: 'string[]', description: 'Open ids.' },
    ],
    a11y: ['Buttons inside headings with aria-expanded/aria-controls; closed panels are inert.'],
  },
  {
    slug: 'marquee',
    title: 'Marquee',
    category: cat,
    description:
      'An endless ticker that eases to a stop on hover, and that you can grab and throw — it glides back to cruising speed.',
    keywords: ['ticker', 'logos', 'infinite scroll', 'carousel', 'banner'],
    height: 320,
    wide: true,
    controls: [
      { type: 'range', name: 'speed', min: 10, max: 300, step: 10, default: 60 },
      { type: 'boolean', name: 'reverse', default: false },
      { type: 'boolean', name: 'pauseOnHover', label: 'pause on hover', default: true },
    ],
    code: {
      react: `import { Marquee } from '@vizzele/react';

<Marquee speed={60} label="Trusted by">
  {logos.map((l) => <img key={l.name} src={l.src} alt={l.name} />)}
</Marquee>`,
      html: `<!-- CSS only -->
<div class="vz-marquee"><div class="vz-marquee-track">…items… …items again…</div></div>`,
    },
    props: [
      { name: 'speed', type: 'number', default: '60', description: 'px/s.' },
      { name: 'reverse', type: 'boolean', default: 'false', description: 'Direction.' },
      {
        name: 'pauseOnHover',
        type: 'boolean',
        default: 'true',
        description: 'Ease to a stop on hover / focus.',
      },
      { name: 'draggable', type: 'boolean', default: 'true', description: 'Grab and throw.' },
      { name: 'gap', type: 'number', default: '32', description: 'Space between items (px).' },
    ],
    a11y: [
      'Duplicated copies are aria-hidden and inert, so screen readers hear the list once.',
      'Pauses on focus. Reduced motion: becomes a normal horizontally scrollable row.',
    ],
  },
  {
    slug: 'carousel-3d',
    title: '3D carousel',
    category: cat,
    description:
      'A ring of cards in 3D. Drag to spin it with inertia — it snaps the nearest card to the front.',
    keywords: ['slider', 'gallery', 'cylinder', 'coverflow', '3d'],
    height: 520,
    wide: true,
    controls: [
      { type: 'range', name: 'count', label: 'cards', min: 3, max: 14, default: 8 },
      { type: 'range', name: 'spacing', min: 0.9, max: 2, step: 0.05, default: 1.2 },
      {
        type: 'range',
        name: 'autoplay',
        label: 'autoplay (s)',
        min: 0,
        max: 6,
        step: 0.5,
        default: 0,
      },
    ],
    code: {
      react: `import { Carousel3D } from '@vizzele/react';

<Carousel3D itemWidth={220} itemHeight={300} label="Projects">
  {projects.map((p) => <ProjectCard key={p.id} {...p} />)}
</Carousel3D>`,
    },
    props: [
      {
        name: 'itemWidth / itemHeight',
        type: 'number',
        default: '220 / 300',
        description: 'Card size.',
      },
      { name: 'spacing', type: 'number', default: '1.15', description: 'Ring spacing.' },
      {
        name: 'autoplay',
        type: 'number',
        default: '0',
        description: 'Seconds per card (pauses on hover).',
      },
      { name: 'onIndexChange', type: '(i: number) => void', description: 'Front card changes.' },
    ],
    a11y: [
      'aria-roledescription="carousel" with labelled slides; ←/→ on the focused stage, plus visible prev/next buttons.',
    ],
  },
  {
    slug: 'image-reveal',
    title: 'Image reveal',
    category: cat,
    description:
      'Images revealed through a liquid, wobbling mask — growing from the center on scroll, or as a lens that follows the pointer.',
    keywords: ['mask', 'image', 'hover', 'reveal', 'liquid'],
    height: 460,
    wide: true,
    controls: [
      { type: 'select', name: 'mode', options: ['hover', 'view'], default: 'hover' },
      {
        type: 'range',
        name: 'radius',
        label: 'lens radius',
        min: 40,
        max: 260,
        step: 5,
        default: 130,
      },
      { type: 'range', name: 'liquidity', min: 0, max: 2.5, step: 0.1, default: 1 },
    ],
    code: {
      react: `import { ImageReveal } from '@vizzele/react';

<ImageReveal src="/hero.jpg" alt="Neon city at night" mode="hover" radius={130} />`,
    },
    props: [
      { name: 'src / alt', type: 'string', description: 'Image and its description (required).' },
      {
        name: 'mode',
        type: "'view' | 'hover'",
        default: "'view'",
        description: 'Grow on scroll, or a pointer lens over a monochrome base.',
      },
      { name: 'radius', type: 'number', default: '120', description: 'Lens radius (hover).' },
      { name: 'liquidity', type: 'number', default: '1', description: 'Edge wobble.' },
    ],
    a11y: ['role="img" with your alt text. Reduced motion: the image appears without the wobble.'],
  },
  {
    slug: 'skeleton',
    title: 'Skeleton',
    category: cat,
    description: 'Loading placeholders with an iridescent sheen sweeping across.',
    keywords: ['loading', 'placeholder', 'shimmer'],
    height: 320,
    code: {
      react: `import { Skeleton } from '@vizzele/react';

<Skeleton circle height={48} />
<Skeleton lines={3} />
<Skeleton width="100%" height={180} radius={20} />`,
      html: `<span class="vz-skeleton" style="width: 200px; height: 14px"></span>`,
    },
    props: [
      { name: 'width / height / radius', type: 'number | string', description: 'Size and shape.' },
      { name: 'circle', type: 'boolean', description: 'Round (uses height).' },
      { name: 'lines', type: 'number', description: 'Render a paragraph of lines.' },
    ],
    a11y: ['aria-hidden; put aria-busy="true" on the region that is loading.'],
  },
];
