# @vizzele/react

React components and hooks for [Vizzele UI](https://github.com/Gxnza48/vizzele-ui) — liquid light, springs,
inertia and iridescent materials.

```bash
npm i @vizzele/react @vizzele/css
```

```tsx
import '@vizzele/css';
import { Button, Tabs, Modal, Toaster, toast, useSpring, useDrag } from '@vizzele/react';
import { FluidBackground, MeshGradient } from '@vizzele/react/gl';

<Button variant="liquid" magnetic>
  Get started
</Button>;
```

- **Originals** (only in Vizzele): `LiquidFocus`, `LiquidSelection`, `HoldButton`, `SurfaceTension`, `CausticCard` (`/gl`)
- **Charts**: `LineChart`, `AreaChart`, `BarChart`, `DonutChart`, `Sparkline`, `StatCard`
- **AI**: `Agent`, `AgentOrb`, `AgentSteps`
- **Pointer**: `Cursor`, `Magnetic`, `Spotlight(Card)`, `Tilt`, `HoloCard`, `Ripple`, `ParticleTrail`
- **Drag & physics**: `Draggable`, `ReorderGroup`, `SwipeStack`, `ElasticSlider`, `BottomSheet`, `useDragDismiss`, `InfiniteCanvas`, `PhysicsWorld`
- **Text & scroll**: `ScrambleText`, `TextReveal`, `ShimmerText`, `WeightWave`, `MorphText`, `Counter`, `Reveal`, `Parallax`, `ScrollProgress`, `HorizontalScroll`, `StickyStack`, `SmoothScroll`
- **UI**: `Select`, `DropdownMenu`, `Button`, `Card`, `LiquidGlass`, `Modal`, `Tabs`, `Dock`, `Navbar`, `Switch`, `Checkbox`, `RadioGroup`, `Input`, `Tooltip`, `Popover`, `Toaster` + `toast()`, `Accordion`, `Marquee`, `Carousel3D`, `ImageReveal`, `Skeleton`
- **Backgrounds** (`/gl`): `FluidBackground`, `MeshGradient`, `ParticleField`, `LiquidMetal`, `LensGrid`, `Grain`, `CausticCard`
- **Hooks**: `useSpring`, `useSpringValue`, `useSprings`, `useDrag`, `useMagnetic`, `useTilt`, `useSpotlight`, `useReveal`, `useReducedMotion`, `useVizzeleEffect`

React 18 and 19. Components ship with `'use client'` and render on the server without touching the DOM.

MIT
