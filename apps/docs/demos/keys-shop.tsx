'use client';

import { useRef, useState } from 'react';
import {
  AddToCartButton,
  Badge,
  CartButton,
  CompareSlider,
  Countdown,
  FlipCard,
  Kbd,
  LogoMarquee,
  MechanicalKeyboard,
  ShoppingCart,
  StatusBadge,
  Sticker,
  toast,
  Toaster,
  type CartItem,
  type KeyboardLayout,
} from '@vizzele/react';
import type { ControlValues } from '@/lib/types';
import { artSrc } from './art';

type P = { values: ControlValues };

export function MechanicalKeyboardDemo({ values }: P) {
  return (
    <div className="ks-stage">
      <MechanicalKeyboard
        className="ks-kb"
        layout={values.layout as KeyboardLayout}
        rgb={values.rgb as 'wave'}
        keycaps={values.keycaps as 'graphite'}
        sound={Boolean(values.sound)}
        tilt={Boolean(values.tilt)}
        placeholder="Click here and type — or press the keys…"
      />
    </div>
  );
}

export function KbdDemo() {
  return (
    <div className="lk-stage lk-col">
      <p className="ks-kbd-line">
        Press <Kbd listen="Meta">⌘</Kbd> <Kbd listen="Control">Ctrl</Kbd> <Kbd listen="k">K</Kbd> or{' '}
        <Kbd listen="Shift">Shift</Kbd> <Kbd listen="Enter">↵</Kbd>
      </p>
      <p className="vz-muted lk-hint">Try the keys on your keyboard.</p>
    </div>
  );
}

const swatch = (a: string, b: string, glyph: string) => (
  <span className="ks-thumb" style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
    {glyph}
  </span>
);

const startItems: CartItem[] = [
  {
    id: 'shirt',
    name: 'Linen shirt',
    meta: 'Sand · M',
    price: 48,
    quantity: 1,
    image: swatch('#ffb238', '#ff2bd6', '👕'),
  },
  {
    id: 'cap',
    name: 'Iridescent cap',
    meta: 'One size',
    price: 24,
    quantity: 2,
    image: swatch('#00e5ff', '#7c5cff', '🧢'),
  },
  {
    id: 'kicks',
    name: 'Cloud runners',
    meta: 'White · 42',
    price: 89,
    quantity: 1,
    image: swatch('#a8ff3e', '#00e5ff', '👟'),
  },
];

export function ShoppingCartDemo({ values }: P) {
  const [items, setItems] = useState(startItems);
  return (
    <div className="lk-stage lk-col">
      <Toaster position="bottom-right" />
      <ShoppingCart
        items={items}
        locale="en-US"
        freeShippingAt={Number(values.freeAt)}
        shipping={9}
        onQuantityChange={(id, q) =>
          setItems((l) => l.map((i) => (i.id === id ? { ...i, quantity: q } : i)))
        }
        onRemove={(id) => setItems((l) => l.filter((i) => i.id !== id))}
        onCheckout={() =>
          new Promise((r) => setTimeout(r, 900)).then(() => toast('Off to checkout →'))
        }
      />
      {items.length < startItems.length && (
        <button type="button" className="ks-link" onClick={() => setItems(startItems)}>
          Refill the cart
        </button>
      )}
    </div>
  );
}

const products = [
  { id: 'a', name: 'Aurora hoodie', price: 64, from: '#7c5cff', to: '#ff2bd6' },
  { id: 'b', name: 'Prism mug', price: 18, from: '#00e5ff', to: '#a8ff3e' },
];

export function AddToCartDemo() {
  const cart = useRef<HTMLButtonElement>(null);
  const [count, setCount] = useState(1);
  return (
    <div className="ks-shop">
      <div className="ks-shop-bar">
        <span className="ks-shop-brand">Vizzele store</span>
        <CartButton ref={cart} count={count} />
      </div>
      <div className="ks-products">
        {products.map((p) => (
          <div key={p.id} className="ks-product">
            <span
              className="ks-product-art"
              style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
            />
            <p className="ks-product-name">{p.name}</p>
            <p className="vz-muted">${p.price}</p>
            <AddToCartButton target={cart} onAdd={() => setCount((c) => c + 1)} />
          </div>
        ))}
      </div>
    </div>
  );
}

const Wordmark = ({ name, shape }: { name: string; shape: string }) => (
  <>
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={shape} />
    </svg>
    {name}
  </>
);

const brands = [
  ['Lumen', 'M12 2 3 21h18z'],
  ['Orbital', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z'],
  ['Northwind', 'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z'],
  ['Prisma', 'M12 2 22 8v8l-10 6L2 16V8z'],
  ['Halcyon', 'M2 12c4-8 16-8 20 0-4 8-16 8-20 0Z'],
  ['Vertex', 'M2 20 12 4l10 16z M8 20l4-7 4 7'],
  ['Mosaic', 'M4 4h6v6H4zM14 4h6v6h-6zM9 14h6v6H9z'],
  ['Quanta', 'M12 2a10 10 0 1 0 10 10h-10z'],
] as const;

export function LogoMarqueeDemo({ values }: P) {
  return (
    <div className="ks-logos">
      <p className="home-eyebrow">Trusted by teams who ship</p>
      <LogoMarquee
        key={String(values.rows)}
        rows={Number(values.rows) as 1 | 2}
        speed={Number(values.speed)}
        grayscale={Boolean(values.grayscale)}
        logos={brands.map(([name, shape]) => ({
          name,
          logo: <Wordmark name={name} shape={shape} />,
        }))}
      />
    </div>
  );
}

// A launch 3 days, 4 hours and a bit from the moment the page opens.
const launch = Date.now() + ((3 * 24 + 4) * 3600 + 17 * 60 + 9) * 1000;

export function CountdownDemo({ values }: P) {
  return (
    <div className="lk-stage lk-col">
      <p className="home-eyebrow">Drop 07 goes live in</p>
      <Countdown
        to={launch}
        units={
          values.seconds ? ['days', 'hours', 'minutes', 'seconds'] : ['days', 'hours', 'minutes']
        }
      />
    </div>
  );
}

export function StickerDemo({ values }: P) {
  const holo = Boolean(values.holo);
  return (
    <div className="ks-stickers">
      <Sticker label="Vizzele drop sticker" holo={holo}>
        <span className="ks-sticker ks-sticker-drop">
          <svg viewBox="0 0 40 40" aria-hidden="true">
            <path d="M20 3c6 8 12 14 12 21a12 12 0 0 1-24 0C8 17 14 11 20 3Z" />
          </svg>
        </span>
      </Sticker>
      <Sticker label="Ship it sticker" holo={holo} style={{ rotate: '6deg' }}>
        <span className="ks-sticker ks-sticker-text">SHIP IT</span>
      </Sticker>
      <Sticker label="Star sticker" holo={holo} style={{ rotate: '-8deg' }}>
        <span className="ks-sticker ks-sticker-emoji">🌈</span>
      </Sticker>
      <p className="vz-muted lk-hint ks-sticker-hint">
        Grab a corner and peel. Pull it off, drop it anywhere.
      </p>
    </div>
  );
}

const spark = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="m12 2 2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" />
  </svg>
);

export function BadgeDemo() {
  return (
    <div className="lk-stage lk-col">
      <div className="lk-row">
        <Badge>Beta</Badge>
        <Badge color="magenta">Design</Badge>
        <Badge color="amber" variant="outline">
          Draft
        </Badge>
        <Badge color="acid" variant="solid">
          Paid
        </Badge>
        <Badge color="neutral" variant="solid">
          v0.8
        </Badge>
      </div>
      <div className="lk-row">
        <Badge variant="glow" color="acid" icon={spark}>
          New
        </Badge>
        <Badge variant="shine" color="amber">
          Pro
        </Badge>
        <Badge variant="holo">Limited edition</Badge>
        <Badge variant="glow" color="violet" size="sm">
          AI
        </Badge>
      </div>
    </div>
  );
}

export function StatusBadgeDemo() {
  return (
    <div className="lk-stage lk-col">
      <div className="lk-row">
        <StatusBadge status="operational" />
        <StatusBadge status="degraded" />
        <StatusBadge status="outage" />
        <StatusBadge status="maintenance" />
      </div>
      <div className="lk-row">
        <StatusBadge status="live" />
        <StatusBadge status="online">Ada is online</StatusBadge>
        <StatusBadge status="away" />
        <StatusBadge status="busy" />
        <StatusBadge status="offline" />
      </div>
    </div>
  );
}

export function CompareSliderDemo({ values }: P) {
  const src = artSrc(3, 1400, 800);
  return (
    <div className="ks-compare">
      <CompareSlider
        hover={Boolean(values.hover)}
        beforeLabel="Raw"
        afterLabel="Graded"
        before={
          <img src={src} alt="Artwork before colour grading, flat and grey" className="ks-raw" />
        }
        after={<img src={src} alt="Artwork after colour grading, vivid" />}
      />
    </div>
  );
}

export function FlipCardDemo({ values }: P) {
  return (
    <div className="lk-stage">
      <FlipCard
        key={String(values.trigger) + String(values.direction)}
        className="ks-flip"
        label="Pro plan — flip for details"
        trigger={values.trigger as 'click'}
        direction={values.direction as 'horizontal'}
        front={
          <div className="ks-face ks-face-front">
            <Badge variant="holo">Pro</Badge>
            <p className="ks-face-price">
              $24<span>/mo</span>
            </p>
            <p>Everything in Free, plus the good stuff.</p>
            <span className="ks-face-hint">
              {values.trigger === 'hover' ? 'Hover' : 'Click'} to flip ↻
            </span>
          </div>
        }
        back={
          <div className="ks-face ks-face-back">
            <p className="home-eyebrow">What you get</p>
            <ul>
              <li>Unlimited projects</li>
              <li>Liquid glass themes</li>
              <li>Priority support</li>
              <li>Early access to new pieces</li>
            </ul>
          </div>
        }
      />
    </div>
  );
}
