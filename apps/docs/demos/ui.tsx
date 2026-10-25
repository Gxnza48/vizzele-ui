'use client';

import { useRef, useState, type ReactNode } from 'react';
import {
  Accordion,
  Button,
  Card,
  Carousel3D,
  Checkbox,
  Dock,
  ImageReveal,
  Input,
  LiquidGlass,
  Marquee,
  Modal,
  Navbar,
  Popover,
  RadioGroup,
  Skeleton,
  Switch,
  Tabs,
  Toaster,
  Tooltip,
  toast,
  type ButtonVariant,
  type Placement,
} from '@vizzele/react';
import type { ControlValues } from '@/lib/types';
import { artSrc } from './art';
import { Logo } from '@/components/Logo';

type P = { values: ControlValues };

const hues = ['#00e5ff', '#ff2bd6', '#ffb238', '#a8ff3e', '#7c5cff'];
const gradient = (i: number) =>
  `linear-gradient(${(i * 67) % 360}deg, ${hues[i % 5]}, ${hues[(i + 2) % 5]})`;

const Icon = ({ d }: { d: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);
const icons = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm10 17-4.5-4.5',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 20h4',
  folder: 'M3 6h6l2 2h10v11H3z',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0-6v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1M7.7 16.3l-2.1 2.1',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
};

export function ButtonDemo({ values }: P) {
  return (
    <div className="demo-center demo-col">
      <Button
        variant={values.variant as ButtonVariant}
        size={values.size as 'sm' | 'md' | 'lg'}
        magnetic={Boolean(values.magnetic)}
        ripple={Boolean(values.ripple)}
        loading={Boolean(values.loading)}
        endIcon={
          <span style={{ width: 16, height: 16, display: 'grid' }}>
            <Icon d={icons.arrow} />
          </span>
        }
      >
        {String(values.label)}
      </Button>
      <div className="demo-row">
        {(['liquid', 'holo', 'glow', 'default', 'ghost'] as const).map((v) => (
          <Button key={v} variant={v} magnetic>
            {v}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function CardDemo({ values }: P) {
  const variant = values.variant as 'glass' | 'holo' | 'spotlight' | 'default';
  return (
    <div className="demo-center card-demo-bg">
      <Card variant={variant} interactive={Boolean(values.interactive)} className="card-demo">
        <span className="card-demo-chip" style={{ background: gradient(1) }} />
        <h3 className="vz-heading">Prism Pro</h3>
        <p className="vz-muted">A {variant} surface. Move your pointer over it.</p>
        <Button variant="liquid" size="sm">
          Upgrade
        </Button>
      </Card>
    </div>
  );
}

export function LiquidGlassDemo({ values }: P) {
  return (
    <div className="glass-demo" style={{ backgroundImage: `url("${artSrc(2)}")` }}>
      <div className="glass-demo-stripes" aria-hidden="true" />
      <LiquidGlass
        refraction={Number(values.refraction)}
        bezel={Number(values.bezel)}
        dispersion={Number(values.dispersion)}
        blur={Number(values.blur)}
        className="glass-demo-panel"
      >
        <h3 className="vz-display">Liquid glass</h3>
        <p>The lines behind me bend at my edges.</p>
      </LiquidGlass>
    </div>
  );
}

export function ModalDemo({ values }: P) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <div className="demo-center demo-col">
      <Button ref={trigger} variant="liquid" size="lg" onClick={() => setOpen(true)}>
        New project
      </Button>
      <p className="demo-hint">It grows out of the button — and shrinks back into it.</p>
      <Modal
        open={open}
        onOpenChange={setOpen}
        originRef={trigger}
        width={Number(values.width)}
        dismissible={Boolean(values.dismissible)}
        title="New project"
        description="Name it and pick a material. You can change both later."
      >
        <div className="modal-demo-body">
          <Input label="Project name" defaultValue="Aurora" />
          <RadioGroup
            label="Material"
            orientation="horizontal"
            defaultValue="glass"
            options={[
              { value: 'glass', label: 'Glass' },
              { value: 'holo', label: 'Holo' },
              { value: 'chrome', label: 'Chrome' },
            ]}
          />
          <div className="demo-row" style={{ justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="liquid" onClick={() => setOpen(false)}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function TabsDemo({ values }: P) {
  const panel = (t: string, i: number) => (
    <div className="tabs-demo-panel">
      <span className="tabs-demo-swatch" style={{ background: gradient(i) }} />
      <p className="vz-muted">{t}</p>
    </div>
  );
  return (
    <div className="demo-center demo-col" style={{ width: 'min(520px, 100%)' }}>
      <Tabs
        label="Materials"
        variant={values.variant as 'pill' | 'underline'}
        items={[
          { value: 'glass', label: 'Glass', content: panel('Refracts the world behind it.', 0) },
          {
            value: 'holo',
            label: 'Holographic',
            content: panel('Shifts color with the angle.', 1),
          },
          {
            value: 'chrome',
            label: 'Chrome',
            content: panel('Liquid metal with an oil-slick film.', 2),
          },
          { value: 'light', label: 'Light', content: panel('Glows, breathes, follows you.', 3) },
        ]}
      />
    </div>
  );
}

export function DockDemo({ values }: P) {
  const [active, setActive] = useState('Home');
  const items = (Object.keys(icons) as (keyof typeof icons)[]).slice(0, 7).map((k) => {
    const label = k[0]!.toUpperCase() + k.slice(1);
    return {
      label,
      icon: <Icon d={icons[k]} />,
      active: active === label,
      onClick: () => setActive(label),
    };
  });
  return (
    <div className="demo-center" style={{ alignSelf: 'end', paddingBottom: 16 }}>
      <Dock
        items={items}
        size={Number(values.size)}
        magnification={Number(values.magnification)}
        distance={Number(values.distance)}
      />
    </div>
  );
}

export function NavbarDemo({ values }: P) {
  const [box, setBox] = useState<HTMLElement | null>(null);
  return (
    <div
      ref={setBox}
      className="scroll-box navbar-demo"
      tabIndex={0}
      aria-label="Scrollable demo page"
    >
      {box && (
        <Navbar
          container={box}
          position="sticky"
          threshold={Number(values.threshold)}
          hideOnScroll={Boolean(values.hideOnScroll)}
          brand={
            <span className="demo-row" style={{ gap: 8 }}>
              <Logo size={22} /> Aurora
            </span>
          }
          links={[
            { label: 'Product', href: '#navbar', active: true },
            { label: 'Pricing', href: '#navbar' },
            { label: 'Docs', href: '#navbar' },
          ]}
          actions={
            <Button variant="liquid" size="sm">
              Sign up
            </Button>
          }
        />
      )}
      <div className="navbar-demo-page">
        <h3 className="vz-display">Scroll this page ↓</h3>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="navbar-demo-block" style={{ background: gradient(i) }} />
        ))}
      </div>
    </div>
  );
}

export function TogglesDemo() {
  const [on, setOn] = useState(true);
  return (
    <div className="demo-center toggles-demo">
      <div className="demo-col" style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
        <Switch
          label="Liquid cursor"
          description="Follow the pointer with a spring"
          checked={on}
          onCheckedChange={setOn}
        />
        <Switch label="Reduced motion" />
        <Checkbox label="Iridescent accents" defaultChecked />
        <Checkbox label="Film grain" description="A fine animated noise layer" />
        <Checkbox label="Indeterminate" indeterminate />
      </div>
      <RadioGroup
        label="Spring"
        defaultValue="liquid"
        options={[
          { value: 'liquid', label: 'Liquid', description: 'Quick, a hint of overshoot' },
          { value: 'jelly', label: 'Jelly', description: 'Wobbly' },
          { value: 'heavy', label: 'Heavy', description: 'Slow, with momentum' },
        ]}
      />
    </div>
  );
}

export function InputDemo({ values }: P) {
  return (
    <div className="demo-center demo-col" style={{ width: 'min(400px, 100%)' }}>
      <Input
        label={String(values.label)}
        type="email"
        hint="Move your pointer near the field, then click it."
        error={values.error ? 'That doesn’t look like an email.' : undefined}
        {...(values.icon
          ? {
              startIcon: (
                <span style={{ width: 18, height: 18, display: 'grid' }}>
                  <Icon d={icons.mail} />
                </span>
              ),
            }
          : {})}
      />
      <Input label="Password" type="password" />
    </div>
  );
}

export function TooltipDemo({ values }: P) {
  const p = values.placement as Placement;
  return (
    <div className="demo-center demo-row">
      {(['home', 'search', 'heart', 'bell'] as const).map((k) => (
        <Tooltip
          key={k}
          content={k[0]!.toUpperCase() + k.slice(1)}
          placement={p}
          delay={Number(values.delay)}
        >
          <button type="button" className="icon-tile" aria-label={k}>
            <Icon d={icons[k]} />
          </button>
        </Tooltip>
      ))}
    </div>
  );
}

export function PopoverDemo({ values }: P) {
  return (
    <div className="demo-center">
      <Popover
        label="Share"
        placement={values.placement as Placement}
        content={
          <div className="popover-demo">
            <strong>Share “Aurora”</strong>
            <Input label="Invite by email" type="email" glow={false} />
            <Switch label="Anyone with the link" defaultChecked />
            <Button variant="liquid" size="sm">
              Send invite
            </Button>
          </div>
        }
      >
        {(props) => (
          <Button {...props} variant="holo">
            Share
          </Button>
        )}
      </Popover>
    </div>
  );
}

const toasts: [string, () => void][] = [
  ['Default', () => toast({ title: 'Saved', description: 'Your spring config was stored.' })],
  [
    'Success',
    () => toast.success({ title: 'Deployed', description: 'vizzele-ui is live on the edge.' }),
  ],
  [
    'Error',
    () =>
      toast.error({
        title: 'Build failed',
        description: 'Shader didn’t compile.',
        action: { label: 'Retry', onClick: () => toast('Retrying…') },
      }),
  ],
  ['Info', () => toast.info('3 new comments on your glass')],
];

export function ToastDemo({ values }: P) {
  return (
    <div className="demo-center demo-col">
      <Toaster position={values.position as 'bottom-right'} />
      <div className="demo-row">
        {toasts.map(([label, fn]) => (
          <Button key={label} variant={label === 'Default' ? 'liquid' : 'default'} onClick={fn}>
            {label}
          </Button>
        ))}
      </div>
      <p className="demo-hint">Fire a few. Hover the stack to fan it out, flick one sideways.</p>
    </div>
  );
}

export function AccordionDemo({ values }: P) {
  return (
    <div className="demo-center" style={{ width: 'min(560px, 100%)' }}>
      <Accordion
        multiple={Boolean(values.multiple)}
        defaultOpen={['what']}
        items={[
          {
            id: 'what',
            title: 'What is Vizzele UI?',
            content:
              'A UI, physics and animation library built around liquid light: springs, inertia, gestures and iridescent materials.',
          },
          { id: 'free', title: 'Is it free?', content: 'Yes — MIT licensed. Use it in anything.' },
          {
            id: 'react',
            title: 'Do I need React?',
            content:
              'No. @vizzele/core works with vanilla JS and data-vz-* attributes; @vizzele/css works with no JS at all.',
          },
          {
            id: 'motion',
            title: 'What about reduced motion?',
            content:
              'Every component honours prefers-reduced-motion with a static, dignified alternative.',
          },
        ]}
      />
    </div>
  );
}

const words = ['Springs', 'Inertia', 'Glass', 'Holo', 'Chrome', 'Gestures', 'Fluid', 'Grain'];

export function MarqueeDemo({ values }: P) {
  const chip = (w: string, i: number): ReactNode => (
    <span key={w} className="marquee-chip">
      <span className="marquee-dot" style={{ background: gradient(i) }} />
      {w}
    </span>
  );
  return (
    <div className="demo-col" style={{ width: '100%', placeSelf: 'center', gap: 18 }}>
      <Marquee
        speed={Number(values.speed)}
        reverse={Boolean(values.reverse)}
        pauseOnHover={Boolean(values.pauseOnHover)}
        label="Features"
      >
        {words.map(chip)}
      </Marquee>
      <Marquee
        speed={Number(values.speed) * 0.7}
        reverse={!values.reverse}
        pauseOnHover={Boolean(values.pauseOnHover)}
        label="Features, again"
      >
        {[...words].reverse().map((w, i) => chip(w, i + 2))}
      </Marquee>
    </div>
  );
}

export function Carousel3DDemo({ values }: P) {
  const n = Number(values.count);
  return (
    <div className="demo-center" style={{ width: '100%' }}>
      <Carousel3D
        key={n}
        spacing={Number(values.spacing)}
        autoplay={Number(values.autoplay)}
        itemWidth={200}
        itemHeight={270}
        label="Artworks"
      >
        {Array.from({ length: n }, (_, i) => (
          <figure
            key={i}
            className="carousel-card"
            style={{ backgroundImage: `url("${artSrc(i, 400, 540)}")` }}
          >
            <figcaption>No. {String(i + 1).padStart(2, '0')}</figcaption>
          </figure>
        ))}
      </Carousel3D>
    </div>
  );
}

export function ImageRevealDemo({ values }: P) {
  return (
    <div className="demo-center" style={{ width: '100%', padding: 16 }}>
      <ImageReveal
        key={String(values.mode)}
        src={artSrc(5)}
        alt="Iridescent abstract artwork"
        mode={values.mode as 'hover' | 'view'}
        radius={Number(values.radius)}
        liquidity={Number(values.liquidity)}
        height={400}
      />
    </div>
  );
}

export function SkeletonDemo() {
  return (
    <div className="demo-center" style={{ width: 'min(420px, 100%)' }}>
      <div className="vz-card skeleton-demo" aria-busy="true">
        <div className="demo-row" style={{ justifyContent: 'flex-start', gap: 12 }}>
          <Skeleton circle height={44} />
          <div style={{ flex: 1 }}>
            <Skeleton width="50%" height={14} />
            <Skeleton width="30%" height={12} style={{ marginTop: 8 }} />
          </div>
        </div>
        <Skeleton width="100%" height={160} radius={16} style={{ margin: '16px 0' }} />
        <Skeleton lines={3} />
      </div>
    </div>
  );
}
