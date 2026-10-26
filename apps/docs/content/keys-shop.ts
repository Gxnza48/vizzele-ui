import type { DocEntry } from '@/lib/types';

/** The pieces added in 0.8: a keyboard to play, a shop, stickers and badges. */
export const keysShopEntries: DocEntry[] = [
  {
    slug: 'mechanical-keyboard',
    title: 'Mechanical keyboard',
    category: 'Components',
    description:
      'A mechanical keyboard you can play. Creamy keycaps sink and spring back, RGB underglow runs in a wave and ripples out from every press, and an optional synthesised thock plays with each key. Type in the field above — or click the keys. Full, TKL, 65% or 60%.',
    keywords: ['keyboard', 'keycaps', 'rgb', 'typing', 'mechanical', 'thock', 'tkl', '60%', '65%'],
    isNew: true,
    wide: true,
    height: 620,
    controls: [
      { type: 'select', name: 'layout', options: ['tkl', 'full', '68', '60'], default: 'tkl' },
      {
        type: 'select',
        name: 'rgb',
        options: ['wave', 'reactive', 'breathe', 'static', 'off'],
        default: 'wave',
      },
      {
        type: 'select',
        name: 'keycaps',
        options: ['graphite', 'milk', 'lavender', 'retro'],
        default: 'graphite',
      },
      { type: 'boolean', name: 'sound', label: 'Thock sound', default: false },
      { type: 'boolean', name: 'tilt', default: true },
    ],
    code: {
      react: `import { MechanicalKeyboard } from '@vizzele/react';

<MechanicalKeyboard
  layout="tkl"        // 'full' | 'tkl' | '68' | '60'
  rgb="wave"          // 'wave' | 'reactive' | 'breathe' | 'static' | 'off'
  keycaps="graphite"  // 'graphite' | 'milk' | 'lavender' | 'retro'
  sound
  placeholder="Say something nice…"
/>`,
    },
    props: [
      {
        name: 'layout',
        type: "'full' | 'tkl' | '68' | '60'",
        default: "'tkl'",
        description: '100%, tenkeyless, 65% (68 keys) or 60%.',
      },
      {
        name: 'rgb',
        type: "'wave' | 'reactive' | 'breathe' | 'static' | 'off'",
        default: "'wave'",
        description: 'Underglow. Every mode except off also ripples from each press.',
      },
      {
        name: 'keycaps',
        type: "'graphite' | 'milk' | 'lavender' | 'retro'",
        default: "'graphite'",
        description: 'Keycap set.',
      },
      {
        name: 'sound',
        type: 'boolean',
        default: 'false',
        description: 'A synthesised thock (Web Audio, no files).',
      },
      { name: 'volume', type: 'number', default: '0.6', description: '0–1.' },
      {
        name: 'input',
        type: 'boolean',
        default: 'true',
        description: 'The text field above the board.',
      },
      {
        name: 'value / defaultValue / onValueChange',
        type: 'string',
        description: 'The field, controlled or not.',
      },
      {
        name: 'listen',
        type: "'input' | 'window'",
        default: "'input'",
        description: 'React to keys typed in the field, or anywhere on the page.',
      },
      {
        name: 'onKeyHit',
        type: '(code) => void',
        description: 'Every press, with its KeyboardEvent.code.',
      },
      {
        name: 'tilt',
        type: 'boolean',
        default: 'true',
        description: 'Lean the board back a little.',
      },
    ],
    a11y: [
      'The text field is the accessible part: a labelled input that works like any other.',
      'The board is a picture of your typing, hidden from screen readers; clicking keys is an extra for the mouse.',
      'Keys are matched by KeyboardEvent.code, so they light up the same on any keyboard language.',
      'With reduced motion the colours stand still and the keys move without the spring.',
      'Sound is off by default and only starts after a key is pressed.',
    ],
  },
  {
    slug: 'kbd',
    title: 'Kbd',
    category: 'Components',
    description:
      'A tiny mechanical keycap for keyboard shortcuts in your text. Give it a key to listen for and it presses down — and lights up — when you hit it.',
    keywords: ['shortcut', 'hotkey', 'keycap', 'key'],
    isNew: true,
    height: 280,
    code: {
      react: `import { Kbd } from '@vizzele/react';

<p>
  Press <Kbd listen="Meta">⌘</Kbd> <Kbd listen="k">K</Kbd> to search
</p>`,
    },
    props: [
      {
        name: 'listen',
        type: 'string',
        description:
          'Press while this key is held — a KeyboardEvent.key ("k", "Shift") or .code ("KeyK").',
      },
      { name: 'children', type: 'ReactNode', description: 'The legend.' },
    ],
    a11y: ['A real <kbd> element, so the shortcut reads as keyboard input.'],
  },
  {
    slug: 'shopping-cart',
    title: 'Shopping cart',
    category: 'Components',
    description:
      'The inside of a cart drawer: lines slide in and collapse away, quantity numbers roll, a liquid bar fills toward free shipping and the totals count to their new value.',
    keywords: ['ecommerce', 'cart', 'checkout', 'store', 'basket', 'shop'],
    isNew: true,
    height: 680,
    controls: [
      {
        type: 'range',
        name: 'freeAt',
        label: 'Free shipping at',
        min: 50,
        max: 300,
        step: 10,
        default: 150,
      },
    ],
    code: {
      react: `import { ShoppingCart } from '@vizzele/react';

<ShoppingCart
  items={items}           // { id, name, price, quantity, image?, meta? }[]
  onQuantityChange={(id, q) => setQuantity(id, q)}
  onRemove={(id) => remove(id)}
  currency="USD"
  freeShippingAt={150}
  shipping={9}
  onCheckout={() => router.push('/checkout')}
/>`,
    },
    props: [
      {
        name: 'items',
        type: 'CartItem[]',
        description: '{ id, name, price, quantity, image?, meta? } — price per unit.',
      },
      { name: 'onQuantityChange', type: '(id, quantity) => void', description: 'Steppers.' },
      {
        name: 'onRemove',
        type: '(id) => void',
        description: 'Called after the line has collapsed away.',
      },
      {
        name: 'onCheckout',
        type: '() => void | Promise',
        description: 'Return a promise to show it is busy.',
      },
      {
        name: 'currency / locale',
        type: 'string',
        default: "'USD'",
        description: 'Formatting through Intl.NumberFormat.',
      },
      { name: 'freeShippingAt', type: 'number', description: 'Show the bar toward free shipping.' },
      { name: 'shipping', type: 'number', default: '0', description: 'Cost below the threshold.' },
      { name: 'title / checkoutLabel / empty', type: 'ReactNode', description: 'Your words.' },
    ],
    a11y: [
      'A list of items; each stepper is a named group ("Quantity of Linen shirt") with Decrease and Increase buttons.',
      'At quantity 1 the minus becomes "Remove …", so nobody deletes a line by surprise.',
      'The item count and quantities are announced politely as they change.',
      'Totals are a description list, so they read as label and value.',
    ],
  },
  {
    slug: 'add-to-cart',
    title: 'Add to cart',
    category: 'Components',
    description:
      'An add-to-cart button that throws the product in an arc into your cart icon, which bumps when it lands — then the button turns into a check. CartButton and flyToCart() come with it.',
    keywords: ['ecommerce', 'fly to cart', 'buy', 'cart icon', 'badge'],
    isNew: true,
    height: 360,
    code: {
      react: `import { AddToCartButton, CartButton } from '@vizzele/react';

const cart = useRef(null);

<CartButton ref={cart} count={count} />

<AddToCartButton
  target={cart}             // a ref or a CSS selector
  image={product.thumbnail} // what flies (optional)
  onAdd={() => addToCart(product)}
/>`,
    },
    props: [
      { name: 'target', type: 'RefObject | string', description: 'The cart to throw into.' },
      {
        name: 'onAdd',
        type: '() => void | Promise',
        description: 'Return a promise to wait before throwing.',
      },
      {
        name: 'image',
        type: 'string',
        description: 'Thumbnail URL that flies; a coloured drop by default.',
      },
      {
        name: 'addedLabel',
        type: 'ReactNode',
        default: "'Added'",
        description: 'Shown with the check.',
      },
      {
        name: 'CartButton count / label',
        type: 'number / string',
        description: 'The badge pops whenever the count goes up.',
      },
      {
        name: 'flyToCart(from, to, { image })',
        type: 'Promise',
        description: 'The throw on its own, for your own buttons.',
      },
    ],
    a11y: [
      'The cart button is named with its count ("Cart, 3 items").',
      'The flying thumbnail is decorative and ignores the pointer.',
      'With reduced motion nothing flies; the cart just bumps.',
    ],
  },
  {
    slug: 'logo-marquee',
    title: 'Logo marquee',
    category: 'Components',
    description:
      'A sponsors strip: logos glide past, ease to a stop under the pointer, wake to full colour on hover and can be grabbed and thrown. Two rows run against each other.',
    keywords: ['sponsors', 'partners', 'clients', 'logos', 'trusted by', 'carousel'],
    isNew: true,
    wide: true,
    height: 320,
    controls: [
      { type: 'select', name: 'rows', options: ['1', '2'], default: '2' },
      { type: 'range', name: 'speed', min: 10, max: 120, default: 40 },
      { type: 'boolean', name: 'grayscale', default: true },
    ],
    code: {
      react: `import { LogoMarquee } from '@vizzele/react';

<LogoMarquee
  rows={2}
  logos={[
    { name: 'Acme', logo: <AcmeLogo />, href: 'https://acme.com' },
    { name: 'Globex', logo: <img src="/globex.svg" alt="" /> },
    // …
  ]}
/>`,
    },
    props: [
      {
        name: 'logos',
        type: '{ name, logo, href? }[]',
        description: 'Each logo; name is its accessible name.',
      },
      {
        name: 'rows',
        type: '1 | 2',
        default: '1',
        description: 'Two rows run in opposite directions.',
      },
      { name: 'speed', type: 'number', default: '40', description: 'px per second.' },
      { name: 'grayscale', type: 'boolean', default: 'true', description: 'Grey until hovered.' },
      { name: 'gap', type: 'number', default: '56', description: 'Space between logos (px).' },
    ],
    a11y: [
      'Each logo is named; the copies that make the loop are hidden from screen readers and the tab order.',
      'It slows to a stop on hover and on keyboard focus.',
      'With reduced motion it becomes a row you can scroll.',
    ],
  },
  {
    slug: 'countdown',
    title: 'Countdown',
    category: 'Components',
    description:
      'A countdown whose digits roll over like an odometer — for launches, drops and sales. It ticks exactly on the second and calls you when it reaches zero.',
    keywords: ['timer', 'launch', 'sale', 'clock', 'odometer'],
    isNew: true,
    height: 280,
    controls: [{ type: 'boolean', name: 'seconds', default: true }],
    code: {
      react: `import { Countdown } from '@vizzele/react';

<Countdown to="2026-12-24T00:00:00" onComplete={() => setLive(true)} />`,
    },
    props: [
      { name: 'to', type: 'Date | string | number', description: 'The moment it reaches zero.' },
      {
        name: 'units',
        type: "('days' | 'hours' | 'minutes' | 'seconds')[]",
        description: 'Which to show. Default all four.',
      },
      {
        name: 'labels',
        type: 'Partial<Record<unit, string>>',
        description: 'Translate the labels.',
      },
      { name: 'onComplete', type: '() => void', description: 'Called once at zero.' },
    ],
    a11y: [
      'A role="timer" (not announced every second) with the time left written out for screen readers, updated each minute.',
      'Renders "--" on the server and fills in after load, so there is no hydration mismatch.',
    ],
  },
  {
    slug: 'sticker',
    title: 'Sticker',
    category: 'Components',
    description:
      'A die-cut sticker you can peel. Grab a corner: the paper folds back along a real crease, showing its white backing and casting a shadow. Pull far enough and it comes off — carry it anywhere and let go to slap it down. Tilts in 3D with holographic foil.',
    keywords: ['sticker', 'peel', 'decal', '3d', 'holographic', 'drag'],
    isNew: true,
    wide: true,
    height: 440,
    controls: [{ type: 'boolean', name: 'holo', label: 'Holo foil', default: true }],
    code: {
      react: `import { Sticker } from '@vizzele/react';

<Sticker label="Vizzele sticker" holo>
  <img src="/sticker.png" alt="" width={140} />
</Sticker>`,
    },
    props: [
      { name: 'label', type: 'string', description: 'Accessible name.' },
      { name: 'children', type: 'ReactNode', description: 'The art — an image, an emoji, text.' },
      {
        name: 'holo',
        type: 'boolean',
        default: 'true',
        description: 'Rainbow foil that follows the pointer.',
      },
      {
        name: 'peelable',
        type: 'boolean',
        default: 'true',
        description: 'Can be peeled from a corner.',
      },
      {
        name: 'movable',
        type: 'boolean',
        default: 'true',
        description: 'Once peeled, drag it and drop it to stick it again.',
      },
      {
        name: 'onPeel / onStick',
        type: '() => void / ({ x, y }) => void',
        description: 'Stuck again with its offset.',
      },
    ],
    a11y: [
      'Focusable, with a "sticker" role description: Enter or Space peels it and sticks it again, the arrow keys move it while peeled (Shift for bigger steps).',
      'aria-pressed tells whether it is peeled off.',
      'With reduced motion it comes off and sticks without the fold animation or the tilt.',
    ],
  },
  {
    slug: 'badge',
    title: 'Badge',
    category: 'Components',
    description:
      'Small labels with personality: soft, solid and outline, plus a breathing glow, a sweep of light and holographic foil. Six colours, two sizes, an optional icon.',
    keywords: ['tag', 'label', 'chip', 'pill', 'new', 'pro'],
    isNew: true,
    height: 320,
    code: {
      react: `import { Badge } from '@vizzele/react';

<Badge>Beta</Badge>
<Badge variant="shine" color="amber">Pro</Badge>
<Badge variant="holo">Limited</Badge>
<Badge variant="glow" color="acid" icon={<Spark />}>New</Badge>`,
    },
    props: [
      {
        name: 'variant',
        type: "'soft' | 'solid' | 'outline' | 'glow' | 'shine' | 'holo'",
        default: "'soft'",
        description: 'Style.',
      },
      {
        name: 'color',
        type: "'accent' | 'cyan' | 'magenta' | 'amber' | 'acid' | 'violet' | 'neutral'",
        default: "'accent'",
        description: 'Colour.',
      },
      { name: 'size', type: "'sm' | 'md'", default: "'md'", description: 'Size.' },
      { name: 'icon', type: 'ReactNode', description: 'Before the text.' },
    ],
    a11y: [
      'Text colours are mixed with the theme text colour so every badge keeps readable contrast in both themes.',
      'The glow, shine and foil stop with reduced motion.',
    ],
  },
  {
    slug: 'status-badge',
    title: 'Status badge',
    category: 'Components',
    description:
      'A status pill with a living dot: it pulses when online or live, blinks on an outage, spins for maintenance. For presence, streams and status pages.',
    keywords: ['presence', 'online', 'live', 'status page', 'uptime', 'indicator'],
    isNew: true,
    height: 320,
    code: {
      react: `import { StatusBadge } from '@vizzele/react';

<StatusBadge status="operational" />
<StatusBadge status="live" />
<StatusBadge status="online">Ada is online</StatusBadge>
<StatusBadge status="busy" dotOnly />`,
    },
    props: [
      {
        name: 'status',
        type: "'online' | 'away' | 'busy' | 'offline' | 'live' | 'operational' | 'degraded' | 'outage' | 'maintenance'",
        description: 'Sets the colour, the motion and the default text.',
      },
      { name: 'children', type: 'ReactNode', description: 'Your own text.' },
      {
        name: 'dotOnly',
        type: 'boolean',
        description: 'Just the dot; the text stays for screen readers.',
      },
    ],
    a11y: [
      'The state is always written in words, never shown by colour alone — even dotOnly keeps the text for screen readers.',
      'Pulses and blinks stop with reduced motion.',
    ],
  },
  {
    slug: 'compare-slider',
    title: 'Compare slider',
    category: 'Components',
    description:
      'Before and after, split by a handle you drag. The handle is a drop of liquid: it stretches with speed and wobbles back when you stop. Works with images, video or any markup.',
    keywords: ['before after', 'image comparison', 'diff', 'slider', 'split'],
    isNew: true,
    wide: true,
    height: 480,
    controls: [{ type: 'boolean', name: 'hover', label: 'Follow the pointer', default: false }],
    code: {
      react: `import { CompareSlider } from '@vizzele/react';

<CompareSlider
  before={<img src="/raw.jpg" alt="Photo before editing" />}
  after={<img src="/graded.jpg" alt="Photo after colour grading" />}
/>`,
    },
    props: [
      { name: 'before / after', type: 'ReactNode', description: 'The two layers, the same size.' },
      {
        name: 'position / defaultPosition / onPositionChange',
        type: 'number',
        default: '50',
        description: '0–100.',
      },
      {
        name: 'beforeLabel / afterLabel',
        type: 'string',
        default: "'Before' / 'After'",
        description: 'Corner tags.',
      },
      {
        name: 'hover',
        type: 'boolean',
        default: 'false',
        description: 'Follow the mouse without pressing.',
      },
      {
        name: 'label',
        type: 'string',
        default: "'Comparison'",
        description: 'Name of the handle.',
      },
    ],
    a11y: [
      'The handle is a role="slider": arrow keys move it (Shift for 10%), Home and End go to the edges.',
      'Pressing anywhere on the image moves the handle there and focuses it.',
      'Vertical scrolling still works on touch screens.',
    ],
  },
  {
    slug: 'flip-card',
    title: 'Flip card',
    category: 'Components',
    description:
      'A card with two faces that turns over on a spring — overshooting a little and settling — and leans toward the pointer with a moving glare. Flip on click or on hover.',
    keywords: ['flip', 'card', '3d', 'reveal', 'back side'],
    isNew: true,
    height: 440,
    controls: [
      { type: 'select', name: 'trigger', options: ['click', 'hover'], default: 'click' },
      {
        type: 'select',
        name: 'direction',
        options: ['horizontal', 'vertical'],
        default: 'horizontal',
      },
    ],
    code: {
      react: `import { FlipCard } from '@vizzele/react';

<FlipCard
  label="Pro plan"
  front={<PlanFront />}
  back={<PlanDetails />}
/>`,
    },
    props: [
      { name: 'front / back', type: 'ReactNode', description: 'The two faces.' },
      {
        name: 'trigger',
        type: "'click' | 'hover'",
        default: "'click'",
        description: 'What turns it.',
      },
      {
        name: 'direction',
        type: "'horizontal' | 'vertical'",
        default: "'horizontal'",
        description: 'Axis.',
      },
      {
        name: 'flipped / defaultFlipped / onFlippedChange',
        type: 'boolean',
        description: 'Controlled or not.',
      },
      { name: 'label', type: 'string', description: 'Accessible name in click mode.' },
    ],
    a11y: [
      'In click mode it is a toggle button (Enter or Space) with aria-pressed.',
      'The hidden face is inert and aria-hidden, so focus and screen readers only reach the side you see.',
      'In click mode keep the faces free of other buttons and links — or control flipped yourself.',
    ],
  },
];
