<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand/logo-dark.svg" />
    <img src="brand/logo-light.svg" alt="Vizzele UI" width="360" />
  </picture>
</p>

<p align="center">
  <strong>Liquid light for the web.</strong><br />
  Components, gestures and effects with weight, inertia and iridescence — springs instead of easings,
  materials that react to the pointer, and a dignified static version of everything for reduced motion.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@vizzele/react"><img alt="npm" src="https://img.shields.io/npm/v/@vizzele/react?color=00e5ff&label=npm" /></a>
  <a href="https://github.com/Gxnza48/vizzele-ui/actions"><img alt="CI" src="https://github.com/Gxnza48/vizzele-ui/actions/workflows/ci.yml/badge.svg" /></a>
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-ff2bd6" />
  <img alt="core: 0 dependencies" src="https://img.shields.io/badge/core-0%20dependencies-ffb238" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-ready-7c5cff" />
</p>

<p align="center">
  <a href="https://vizzele-ui.vercel.app"><strong>Website</strong></a> ·
  <a href="https://vizzele-ui.vercel.app/docs"><strong>Docs</strong></a> ·
  <a href="https://vizzele-ui.vercel.app/blocks"><strong>Blocks</strong></a> ·
  <a href="https://www.npmjs.com/org/vizzele"><strong>npm</strong></a>
</p>

[![Vizzele UI — fluid hero](.github/assets/hero.webp)](https://vizzele-ui.vercel.app)

---

- [Installation](#installation)
- [Quick start](#quick-start) — [Next.js](#nextjs-app-router) · [Vite / React](#vite--create-react-app) · [Vanilla JS](#vanilla-js) · [No build step (CDN)](#no-build-step-cdn)
- [Examples](#examples)
- [What's inside](#whats-inside)
- [Theming](#theming)
- [Accessibility & reduced motion](#accessibility--reduced-motion)
- [FAQ](#faq)

## Installation

Vizzele comes in three packages. Most React apps want **`@vizzele/react` + `@vizzele/css`**.

```bash
npm install @vizzele/react @vizzele/css
# or
pnpm add @vizzele/react @vizzele/css
# or
yarn add @vizzele/react @vizzele/css
```

| Package                                                          | Use it for                                                                                          |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [`@vizzele/react`](https://www.npmjs.com/package/@vizzele/react) | 70+ React components and hooks (React 18 and 19, SSR-safe). Installs `@vizzele/core` for you.       |
| [`@vizzele/css`](https://www.npmjs.com/package/@vizzele/css)     | The styles: tokens, dark/light themes and materials. **Required** for the components to look right. |
| [`@vizzele/core`](https://www.npmjs.com/package/@vizzele/core)   | The zero-dependency engine on its own — for vanilla JS, Vue, Svelte, Astro or plain HTML.           |

## Quick start

Two steps: **import the CSS once**, then **use the components**.

```tsx
import '@vizzele/css';
import { Button, toast, Toaster } from '@vizzele/react';

export default function App() {
  return (
    <>
      <Button variant="liquid" magnetic onClick={() => toast.success('It works!')}>
        Click me
      </Button>
      <Toaster />
    </>
  );
}
```

### Next.js (App Router)

Import the CSS in your root layout and set a theme on `<html>`. Components already ship with `'use client'`, so you can use them straight from server components.

```tsx
// app/layout.tsx
import '@vizzele/css';
import { LiquidFocus, Toaster } from '@vizzele/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body className="vz-body">
        {children}
        <Toaster />
        <LiquidFocus /> {/* optional: keyboard focus that travels like mercury */}
      </body>
    </html>
  );
}
```

```tsx
// app/page.tsx
import { Button, Card } from '@vizzele/react';

export default function Page() {
  return (
    <Card variant="holo" style={{ padding: 32 }}>
      <h1>Hello, liquid light</h1>
      <Button variant="liquid">Get started</Button>
    </Card>
  );
}
```

### Vite / Create React App

```tsx
// main.tsx
import '@vizzele/css';
import { createRoot } from 'react-dom/client';
import App from './App';

document.documentElement.dataset.theme = 'dark'; // or 'light' / 'auto'
document.body.classList.add('vz-body');
createRoot(document.getElementById('root')!).render(<App />);
```

### Vanilla JS

Every effect is a function that takes an element and returns `{ update, destroy }`.

```bash
npm install @vizzele/core @vizzele/css
```

```ts
import '@vizzele/css';
import { draggable, magnetic, holdToConfirm, Spring } from '@vizzele/core';

draggable(document.querySelector('.card')!, { bounds: 'parent' });
magnetic(document.querySelector('.cta')!, { strength: 0.4 });
holdToConfirm(document.querySelector('.delete')!, { onConfirm: () => alert('Deleted') });

// A raw spring — exact at any frame rate
const box = document.querySelector<HTMLElement>('.box')!;
const x = new Spring({ onUpdate: (v) => (box.style.translate = `${v}px`) });
x.set(200);
```

### No build step (CDN)

Drop two tags into any HTML page. Effects are switched on with `data-vz-*` attributes — no JavaScript to write.

```html
<link rel="stylesheet" href="https://unpkg.com/@vizzele/css@0.10/dist/vizzele.min.css" />
<script src="https://unpkg.com/@vizzele/core@0.10/dist/vizzele.global.js" defer></script>

<body class="vz-body" data-theme="dark" data-vz-liquid-focus>
  <button class="vz-button" data-variant="liquid" data-vz-magnetic="strength: 0.4">Hover me</button>
  <div class="vz-card vz-holo" data-vz-tilt="max: 14">Holographic card</div>
  <div class="vz-card" data-vz-drag="bounds: parent; rotate: 8">Throw me</div>
  <p data-vz-reveal>I fade in when scrolled into view</p>
</body>
```

The full API is also available as `window.vizzele` (e.g. `vizzele.draggable(el)`).

## Examples

Every snippet below is live (with a playground) in the [docs](https://vizzele-ui.vercel.app/docs). For whole sections — an AI chat, a dashboard, pricing, a sign-in page — copy a [Block](https://vizzele-ui.vercel.app/blocks).

**Buttons, cards and glass**

```tsx
import { Button, Card, LiquidGlass } from '@vizzele/react';

<Button variant="liquid" magnetic>Liquid</Button>
<Button variant="holo">Holographic</Button>
<Card variant="glass">Frosted glass</Card>
<LiquidGlass refraction={40}>Real refraction (Chromium), frost elsewhere</LiquidGlass>
```

**Drag & physics**

```tsx
import { Draggable, ElasticSlider } from '@vizzele/react';

<Draggable bounds="parent" rotate={8}>Throw me — I glide and bounce off the walls</Draggable>
<ElasticSlider label="Volume" value={volume} onChange={setVolume} />
```

**Select & menus**

```tsx
import { Select, DropdownMenu, Button } from '@vizzele/react';

<Select label="Theme" options={['Dark', 'Light', 'Auto']} value={theme} onValueChange={setTheme} />

<DropdownMenu items={[{ label: 'Rename', onSelect: rename }, { type: 'separator' }, { label: 'Delete', danger: true, onSelect: remove }]}>
  {(props) => <Button {...props}>Actions</Button>}
</DropdownMenu>
```

**Command palette & form fields**

```tsx
import { CommandPalette, OTPInput, FileDropzone } from '@vizzele/react';

// ⌘K / Ctrl+K opens it from anywhere
<CommandPalette items={[{ label: 'New file', group: 'File', shortcut: '⌘N', onSelect: newFile }]} />

<OTPInput length={6} groupSize={3} onComplete={verify} />

<FileDropzone accept="image/*,.pdf" maxSize={5_000_000} onFilesChange={setFiles} hint="Up to 5 MB" />
```

**Charts**

```tsx
import { AreaChart, BarChart, DonutChart, StatCard } from '@vizzele/react';

<AreaChart
  title="Visitors"
  data={[{ month: 'Jan', web: 4200 }, { month: 'Feb', web: 5100 }]}
  index="month"
  series={[{ key: 'web', label: 'Web' }]}
/>
<StatCard label="Revenue" value={48210} prefix="$" delta={12.4} trend={[31, 34, 38, 41, 48]} />
```

**AI agent**

```tsx
import { Agent, AgentSteps } from '@vizzele/react';

// state: 'idle' | 'listening' | 'thinking' | 'working' | 'speaking' | 'success' | 'error'
<Agent state="thinking" name="Assistant" />
<AgentSteps steps={[
  { label: 'Read the brief', status: 'done' },
  { label: 'Search the codebase', status: 'running' },
  { label: 'Write the answer', status: 'pending' },
]} />
```

**Originals — only in Vizzele**

```tsx
import { HoldButton, LiquidSelection, SurfaceTension } from '@vizzele/react';
import { CausticCard } from '@vizzele/react/gl';

<HoldButton onConfirm={deleteProject}>Hold to delete</HoldButton>
<LiquidSelection as="article">Selected text turns into fusing blobs of light.</LiquidSelection>
<SurfaceTension>
  <button>Springs</button>
  <button>Glass</button>
</SurfaceTension>
<CausticCard>Glass that casts pool light</CausticCard>
```

**WebGL backgrounds** (from `@vizzele/react/gl`, so they only load when you use them)

```tsx
import { Aurora, FluidBackground, LavaLamp, Ripples } from '@vizzele/react/gl';

<section style={{ position: 'relative' }}>
  <FluidBackground /> {/* fills its nearest positioned parent */}
  <h1>Stir the ink behind this text</h1>
</section>;

<Aurora bands={4} />
<LavaLamp blobs={6} />
<Ripples rain /> {/* tap to drop rings into the surface */}
```

**3D device mockups** — put your live app inside a phone or a laptop

```tsx
import { LaptopMockup, PhoneMockup } from '@vizzele/react';

<PhoneMockup model="iphone" finish="natural" width={300}>
  <MyApp /> {/* real DOM at 394 × 836 — clickable, scrollable */}
</PhoneMockup>

<PhoneMockup model="galaxy" finish="violet">
  <img src="/screenshot.png" alt="The app's home screen" />
</PhoneMockup>

<LaptopMockup finish="silver">
  <MyDashboard /> {/* 1280 × 800; the lid opens when it scrolls into view */}
</LaptopMockup>
```

Pure CSS 3D (no WebGL, nothing to download): they turn toward the pointer, spin when you drag the frame and only animate while on screen.

**Copy button, sidebar and footer**

```tsx
import Link from 'next/link';
import { CopyButton, Footer, Sidebar } from '@vizzele/react';

<CopyButton value="npm i @vizzele/react">Copy</CopyButton>

<Sidebar
  active={pathname}
  linkAs={Link}
  sections={[{ title: 'Workspace', items: [{ href: '/', label: 'Overview' }, { href: '/inbox', label: 'Inbox', badge: 3 }] }]}
/>

<Footer
  linkAs={Link}
  brand={<Logo />}
  columns={[{ title: 'Product', links: [{ href: '/pricing', label: 'Pricing' }] }]}
  legal="© 2026 Acme"
  wordmark="Acme" // giant liquid letters that reach for the pointer
/>
```

> **Using an AI assistant?** Every page in the [docs](https://vizzele-ui.vercel.app/docs) has a **Copy prompt** button: it copies the install command, the code, the props and the rules, ready to paste into ChatGPT, Claude, Cursor or v0.

**Toasts**

```tsx
import { toast, Toaster } from '@vizzele/react';

toast('Saved');
toast.success('Published!');
// render <Toaster /> once, anywhere in your app
```

**Text portal** — the home page hero: scroll and the camera dives into a letter of a giant word, then the page carries on.

```tsx
import { TextPortal } from '@vizzele/react';

<TextPortal text="VIZZELE" focus={1} cover={<p>Scroll to dive in</p>}>
  <MyHero /> {/* the scene inside the word */}
</TextPortal>;
```

## What's inside

**Originals — effects that don't exist in any other library**

- **Liquid focus** — one page-wide focus ring that travels between elements like a drop of mercury
- **Liquid selection** — text selection as springy blobs of light that fuse across lines
- **Hold to confirm** — a button that fills with liquid (real wave simulation: it splashes, sloshes and drains)
- **Caustics** — glass that casts the moving net of light you see at the bottom of a pool
- **Surface tension** — items that lean toward the pointer and fuse with their neighbours like drops

[![Five original effects](.github/assets/originals.webp)](https://vizzele-ui.vercel.app/docs/liquid-focus)

**Charts** — line & area · bar (grouped / stacked) · donut · sparkline · stat card. Values spring between datasets, a crosshair snaps to the nearest point, arrow keys read every value, and each chart carries a hidden data table. Colorblind-safe palette in both themes.

**AI** — an agent orb with seven states that reacts to a live voice level, a status line announced to screen readers, and a step-by-step progress timeline.

[![Charts and an agent](.github/assets/dashboard.webp)](https://vizzele-ui.vercel.app/docs/line-chart)

**New in 0.10** — a scratch card with a holographic foil that flakes away under your finger · `LazyMount` to mount heavy sections only when they come near the screen · **adaptive quality**: Vizzele measures real frame times and, on a device that can't keep up, makes WebGL, particles and confetti cheaper instead of dropping frames (`getQuality` / `setQuality`) · a GPU-only RGB wave on the mechanical keyboard, glow button and agent orb

**New in 0.8** — a mechanical keyboard you can play (100%, TKL, 65%, 60%; RGB wave and ripples; creamy keycaps; synthesised thock) · Kbd keycaps for shortcuts · shopping cart · add to cart that flies into the cart icon · logo marquee for sponsors · countdown · a sticker you can peel and stick again · badges · status badges · before/after compare slider · flip card

**New in 0.7** — auth panel (sign in / sign up with Google, a stretchy mode switch and a button that melts into a check) · password input whose eye watches you · liquid password-strength meter · confetti · click spark · heart button · day-to-night theme toggle with a circle reveal · split-flap board · orbit · interactive dot grid

**New in 0.6** — gooey menu (a FAB that splits into drops) · avatar stack fused like liquid · liquid stepper · liquid gauge that sloshes · liquid star rating · number scrubber with inertia · pull to refresh with a drop that snaps free · signature pad with iridescent ink · stream text for AI answers · border light that swings to meet the pointer

**Mockups (3D)** — iPhone-style phone · Galaxy-style phone · laptop, each with a live, interactive screen

**Components** — ⌘K command palette · OTP input · file dropzone · Copy button · Sidebar · Footer with a liquid wordmark · Select & Dropdown menu · Button (liquid · holo · glow) · Card (glass · holo · spotlight) · liquid glass with real refraction · Modal that morphs out of its trigger · Tabs · macOS-style Dock · Navbar · Switch / Checkbox / Radio · Input · Tooltip · Popover · Toast · Accordion · Marquee · 3D carousel · image reveal · Skeleton

**Cursor & pointer** — liquid cursor · magnetic · spotlight borders · 3D tilt with holographic foil · ripple · particle trail

**Drag & physics** — throwable cards with inertia · reorder list · swipe stack · elastic slider · drag-to-dismiss · bottom sheet · infinite canvas · 2D physics world

**Backgrounds (WebGL2, no three.js)** — fluid simulation · mesh gradient · aurora · silk · lava lamp · wave lines · ripples · particle field · liquid metal · lens grid · caustics · grain

**Text & scroll** — scramble · reveal · shimmer · variable-font weight wave · morphing words · spring counter · text portal (scroll dives into a giant word) · parallax · horizontal scroll · sticky stack · scroll progress · smooth scroll

<table>
  <tr>
    <td><img src=".github/assets/bento.webp" alt="Live components: weight wave, magnetic, elastic slider, counter, switch, tabs" /></td>
    <td><img src=".github/assets/physics.webp" alt="Physics playground with colliding words" /></td>
  </tr>
  <tr>
    <td><img src=".github/assets/glass.webp" alt="Liquid glass refracting a grid behind it" /></td>
    <td><img src=".github/assets/metal.webp" alt="Raymarched liquid metal blobs" /></td>
  </tr>
</table>

**Size** — everything is tree-shakeable, so you only pay for what you import. Sizes are checked in CI:

| Import                       | min + brotli |
| ---------------------------- | ------------ |
| `@vizzele/react` (all of it) | 47 kB        |
| `Button`                     | 4.3 kB       |
| `LineChart`                  | 4.5 kB       |
| `@vizzele/core` `Spring`     | 1.7 kB       |
| `@vizzele/css` (all of it)   | 17 kB        |

## Theming

Set `data-theme="dark"`, `"light"` or `"auto"` (follows the OS) on `<html>`. Every color, radius, spring and blur is a CSS variable, so making your own theme is a few lines:

```css
[data-theme='ember'] {
  --vz-bg: #0d0806;
  --vz-accent: #ff7a2f;
  --vz-cyan: #ffb238;
  --vz-magenta: #ff3d6e;
}
```

Importing `@vizzele/css` never recolours your page by itself: it only defines the variables. Your page picks up the Vizzele look where you opt in — `data-theme` on `<html>` (native controls and scrollbars follow it) and `class="vz-body"` for the background and type. Components always read the variables, so a theme can be as small as one accent colour, and every WebGL background takes its own `colors`:

```tsx
<FluidBackground colors={['#ff7a2f', '#ffd166', '#ef476f']} />
```

The spring presets also exist as CSS easings generated from the real physics:

```css
.card {
  transition: transform var(--vz-spring-jelly-duration) var(--vz-spring-jelly);
}
```

## Accessibility & reduced motion

- WAI-ARIA patterns throughout (tabs, dialog, listbox, menu, switch, slider), with keyboard paths for every gesture (drag, reorder, swipe, hold).
- When the user prefers reduced motion, springs jump, reveals simply show, and canvases render one still frame — nothing breaks, it just stops moving.
- Charts are readable with the keyboard and carry a hidden data table; color is never the only signal.
- The docs site passes axe (WCAG 2.1 AA) with zero violations in both themes.

## FAQ

**Does it work with Next.js / server components?** Yes. Components ship with `'use client'` and render on the server without touching `window`.

**Can I use it without React?** Yes — `@vizzele/core` works with any framework or none, and the CDN build works in plain HTML with `data-vz-*` attributes.

**Will installing it change my site's colours?** No. The CSS only defines `--vz-*` variables until you opt in with `data-theme` / `vz-body`. Use the effects and components with your own palette by overriding the variables (see [Theming](#theming)) or passing `colors` to the backgrounds.

**Can I use it with Tailwind?** Yes. Vizzele's classes are prefixed with `vz-`, so they don't clash; use Tailwind for layout and Vizzele for the components and motion.

**What if WebGL isn't available?** WebGL backgrounds fall back to a static iridescent gradient. Liquid glass refracts in Chromium and becomes frosted glass elsewhere.

**Is it free?** Yes — MIT licensed, free for personal and commercial use.

**How do I get new versions?** Updates are never pushed into your project automatically — you choose when to upgrade. Run `npm install @vizzele/react@latest @vizzele/css@latest` (or `pnpm up --latest`). Changes are listed in each package's `CHANGELOG.md`. CDN links pinned to `@0.10` pick up `0.10.x` fixes on their own.

## Development

```bash
pnpm install
pnpm dev          # docs at http://localhost:3100 + package builds
pnpm test         # vitest: physics, effects, React components, SSR
pnpm lint && pnpm typecheck && pnpm build && pnpm size
pnpm changeset    # describe a change for the next release
```

Monorepo: pnpm workspaces + Turborepo · TypeScript strict · tsup (ESM + CJS + types) · Vitest · ESLint + Prettier · Changesets · GitHub Actions.

## License

[MIT](LICENSE) © Vizzele UI
