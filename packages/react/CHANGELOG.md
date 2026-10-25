# @vizzele/react

## 0.3.0

### Minor Changes

- 3D device mockups: **PhoneMockup** (`model="iphone" | "galaxy"`) and **LaptopMockup** (React), `mockup` / `data-vz-mockup` (core).
  
  - Pure CSS 3D — a rounded slab of shaded strips for the frame, real camera lenses, side buttons, keyboard and trackpad — no WebGL and nothing to download.
  - The screen is real DOM at the device's CSS resolution (394×836, 396×848, 1280×800): put a live, clickable app, an image or a video inside. `--vz-safe-top` / `--vz-safe-bottom` clear the status bar and home indicator.
  - Turns toward the pointer, spins when you drag the frame (a fling settles on a whole turn), floats; the laptop lid opens when it scrolls into view. Animates only while visible; still under reduced motion.
  - Finishes: iPhone style natural · black · white · blue; Galaxy style black · gray · violet · cream; laptop silver · space · midnight.

### Patch Changes

- Updated dependencies
  - @vizzele/core@0.3.0

## 0.2.0

### Minor Changes

- New components and backgrounds:
  
  - **CopyButton** + `useClipboard` (React) and `copyToClipboard` (core): the icon folds into a self-drawing check, light washes out from the press point, droplets burst and an icon-only button releases a "Copied" bubble. Announced to screen readers.
  - **Sidebar**: navigation with a liquid current-page marker on two springs, a hover light, foldable sections, badges and an iridescent edge that follows the pointer.
  - **Footer** and **Wordmark** (React) / `wordmark` (core, `data-vz-wordmark`): giant liquid letters that rise out of a surface, reach for the pointer, wobble when pressed and are lit by a drifting spotlight.
  - Five new WebGL backgrounds: **Aurora**, **Silk**, **LavaLamp**, **WaveLines** and **Ripples** (`aurora`, `silk`, `lavaLamp`, `waveLines`, `ripples` in `@vizzele/core/gl`).

### Patch Changes

- Updated dependencies
  - @vizzele/core@0.2.0

## 0.1.1

### Patch Changes

- Updated dependencies
  - @vizzele/core@0.1.1

## 0.1.0

### Minor Changes

- 586000f: Charts (LineChart, AreaChart, BarChart, DonutChart, Sparkline, StatCard) with spring morphs, keyboard inspection and a CVD-validated palette; an AI Agent orb with seven states plus AgentSteps.
- 7398ea3: First release of Vizzele UI: spring/inertia/drag engine, 50+ React components, WebGL backgrounds, CSS tokens and themes.
- cf2be97: Five original effects: liquidFocus / LiquidFocus, liquidSelection / LiquidSelection, holdToConfirm / HoldButton, caustics / CausticCard and surfaceTension / SurfaceTension.
- 355980f: New `Select` and `DropdownMenu` components: glass panels that spring out of their trigger, staggered options and a liquid highlight that stretches between items. Full keyboard support (arrows, Home/End, typeahead, Escape) and WAI-ARIA combobox/listbox and menu-button patterns. Fixes popovers/tooltips staying invisible when reopened during their exit animation.

### Patch Changes

- fa49734: morphText: new default 'cascade' variant (letters spring in one by one, width eases between words, optional continuous gradient); liquid scrollbars in the base styles; drop -webkit-backdrop-filter duplicates that minifiers resolved to the prefixed-only form.
- 4d862d0: Toaster no longer renders a portal during hydration (fixes a React hydration mismatch when it is server-rendered).
- Updated dependencies [fa49734]
- Updated dependencies [7398ea3]
- Updated dependencies [d383637]
- Updated dependencies [cf2be97]
  - @vizzele/core@0.1.0
