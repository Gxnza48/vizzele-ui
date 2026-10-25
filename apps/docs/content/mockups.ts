import type { DocEntry, PropRow } from '@/lib/types';

const cat = 'Mockups' as const;

const shared: PropRow[] = [
  {
    name: 'children',
    type: 'ReactNode',
    description: 'Screen content: an <img>, a <video>, or a live React app — it stays clickable.',
  },
  {
    name: 'width',
    type: 'number | string',
    description: 'Rendered width; the device scales to fit.',
  },
  {
    name: 'rotate',
    type: '[x, y]',
    description: 'Resting angle in degrees (each device has a flattering default).',
  },
  {
    name: 'tilt',
    type: 'number',
    default: '8',
    description: 'How far (deg) it turns toward the pointer. 0 = still.',
  },
  {
    name: 'drag',
    type: 'boolean',
    default: 'true',
    description: 'Drag the frame to spin it; a fling spins it round and it settles on a spring.',
  },
];

const a11y = [
  'The device itself is decoration (aria-hidden); only your screen content is exposed, and it stays fully interactive — focus, clicks and scrolling work inside the screen.',
  'Dragging starts only from the frame, never from the screen, so using the app never spins the phone.',
  'With reduced motion it stays still at its resting angle: no float, no tilt, no spin; the laptop starts open.',
  'Pure CSS 3D: no WebGL, no images to download. It only animates while on screen and idles when nothing moves.',
];

const screenSize = (s: string) =>
  `The screen is ${s} CSS px, like the real thing, so your UI renders at its true size and the device scales it. Pad content with var(--vz-safe-top) / var(--vz-safe-bottom) to clear the status bar and home indicator.`;

export const mockupEntries: DocEntry[] = [
  {
    slug: 'phone-iphone',
    title: 'iPhone-style phone',
    category: cat,
    description:
      'A 3D phone with a titanium frame, Dynamic-Island cutout and a real camera plateau on the back. Put your app inside — it stays live and clickable. Turns toward the pointer, spins when you drag the frame.',
    keywords: ['mockup', 'device', 'iphone', 'phone', '3d', 'app preview', 'landing', 'frame'],
    isNew: true,
    height: 680,
    controls: [
      { type: 'select', name: 'app', options: ['wallet', 'music', 'chat'], default: 'wallet' },
      {
        type: 'select',
        name: 'finish',
        options: ['natural', 'black', 'white', 'blue'],
        default: 'natural',
      },
      { type: 'range', name: 'tilt', min: 0, max: 20, default: 8 },
      { type: 'boolean', name: 'float', default: true },
      { type: 'boolean', name: 'drag', default: true },
    ],
    code: {
      react: `import { PhoneMockup } from '@vizzele/react';

<PhoneMockup model="iphone" finish="natural" width={300}>
  <MyAppScreen />  {/* or <img src="/screenshot.png" alt="…" /> */}
</PhoneMockup>`,
      vanilla: `import { mockup } from '@vizzele/core';

// The element's children become the screen.
mockup(document.querySelector('#phone')); // <div id="phone" data-vz-device="iphone">…</div>`,
      html: `<div data-vz-mockup data-vz-device="iphone" style="width: 300px">
  <img src="/screenshot.png" alt="The app's home screen" />
</div>`,
    },
    props: [
      {
        name: 'model',
        type: "'iphone' | 'galaxy'",
        default: "'iphone'",
        description: 'Which phone.',
      },
      {
        name: 'finish',
        type: 'string',
        default: "'natural'",
        description: 'natural · black · white · blue',
      },
      ...shared,
      { name: 'float', type: 'boolean', default: 'true', description: 'Gently float and sway.' },
      {
        name: 'statusBar',
        type: 'boolean',
        default: 'true',
        description: 'Time, signal and battery.',
      },
      {
        name: 'statusBarTone',
        type: "'light' | 'dark'",
        default: "'light'",
        description: 'White text for dark apps, black for light ones.',
      },
      { name: 'time', type: 'string', default: "'9:41'", description: 'Clock in the status bar.' },
    ],
    a11y: [screenSize('394 × 836'), ...a11y],
  },
  {
    slug: 'phone-galaxy',
    title: 'Galaxy-style phone',
    category: cat,
    description:
      'A 3D Android flagship: flat armour frame, centred punch-hole camera and three separate lenses down the back. Same live screen, pointer tilt and drag-to-spin.',
    keywords: ['mockup', 'device', 'samsung', 'galaxy', 'android', 'phone', '3d', 'app preview'],
    isNew: true,
    height: 680,
    controls: [
      { type: 'select', name: 'app', options: ['music', 'wallet', 'chat'], default: 'music' },
      {
        type: 'select',
        name: 'finish',
        options: ['black', 'gray', 'violet', 'cream'],
        default: 'black',
      },
      { type: 'range', name: 'tilt', min: 0, max: 20, default: 8 },
      { type: 'boolean', name: 'float', default: true },
      { type: 'boolean', name: 'drag', default: true },
    ],
    code: {
      react: `import { PhoneMockup } from '@vizzele/react';

<PhoneMockup model="galaxy" finish="violet" width={300}>
  <MyAppScreen />
</PhoneMockup>`,
      html: `<div data-vz-mockup data-vz-device="galaxy" style="width: 300px">
  <video src="/demo.mp4" autoplay muted loop playsinline></video>
</div>`,
    },
    props: [
      { name: 'model', type: "'iphone' | 'galaxy'", description: "Use 'galaxy'." },
      {
        name: 'finish',
        type: 'string',
        default: "'black'",
        description: 'black · gray · violet · cream',
      },
      ...shared,
      { name: 'float', type: 'boolean', default: 'true', description: 'Gently float and sway.' },
      {
        name: 'statusBar / statusBarTone / time',
        type: '…',
        description: 'As on the iPhone style.',
      },
    ],
    a11y: [screenSize('396 × 848'), ...a11y],
  },
  {
    slug: 'laptop',
    title: 'Laptop',
    category: cat,
    description:
      'A 3D laptop whose lid swings open when it scrolls into view — aluminium body, full keyboard, trackpad and speaker grilles. The screen holds a live site at 1280 × 800.',
    keywords: ['mockup', 'device', 'macbook', 'notebook', 'laptop', '3d', 'website preview'],
    isNew: true,
    wide: true,
    height: 600,
    controls: [
      { type: 'select', name: 'site', options: ['dashboard', 'landing'], default: 'dashboard' },
      {
        type: 'select',
        name: 'finish',
        options: ['silver', 'space', 'midnight'],
        default: 'silver',
      },
      { type: 'range', name: 'open', label: 'lid angle', min: 0, max: 130, default: 108 },
      { type: 'range', name: 'tilt', min: 0, max: 20, default: 8 },
      { type: 'boolean', name: 'drag', default: true },
    ],
    code: {
      react: `import { LaptopMockup } from '@vizzele/react';

<LaptopMockup finish="silver">
  <MyDashboard />  {/* rendered at 1280 × 800 */}
</LaptopMockup>`,
      html: `<div data-vz-mockup data-vz-device="laptop">
  <img src="/site.png" alt="The dashboard" />
</div>`,
    },
    props: [
      {
        name: 'finish',
        type: 'string',
        default: "'silver'",
        description: 'silver · space · midnight',
      },
      {
        name: 'open',
        type: 'number',
        default: '108',
        description: 'Lid angle in degrees. It opens to this when scrolled into view; 0 = closed.',
      },
      ...shared,
      { name: 'float', type: 'boolean', default: 'false', description: 'Gently float and sway.' },
    ],
    a11y: [screenSize('1280 × 800'), ...a11y],
  },
];
