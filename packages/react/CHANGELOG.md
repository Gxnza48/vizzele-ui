# @vizzele/react

## 0.9.0

### Minor Changes

- Fixes and options found by dressing a real shop (Next 14, React 18) in Vizzele. **React 18:** Marquee, Accordion and FlipCard now make hidden parts inert on React 18 too (it used to drop the attribute with a warning). **ShoppingCart:** `labels` to translate every word, `formatPrice` to format prices yourself (e.g. without cents), and a per-item `max` for stock. **CartButton:** `countLabel` to say the count in your language. **Modal:** a `dismissible={false}` dialog no longer shows a × that closes it; `closeLabel` names the button. **Button:** accepts link attributes (`target`, `rel`, `download`) for `as="a"`.

### Patch Changes

- @vizzele/core@0.9.0

## 0.8.0

### Minor Changes

- Eleven new pieces. **MechanicalKeyboard** — a keyboard you can play, in full, TKL, 65% (68) or 60% layouts: creamy keycaps that sink and spring back, RGB underglow (wave, reactive, breathe, static) that ripples out from every press, four keycap sets, an optional synthesised thock, and a text field above it that drives it. **Kbd** — a keycap for shortcuts that presses when you hit the key. **ShoppingCart**, **AddToCartButton** (throws the product into the cart in an arc), **CartButton** and `flyToCart()`. **LogoMarquee** for sponsors, **Countdown** with rolling digits, **Sticker** (peel it from a corner along a real fold, carry it and stick it again, with holographic foil), **Badge**, **StatusBadge**, **CompareSlider** and **FlipCard**.

### Patch Changes

- @vizzele/core@0.8.0

## 0.7.0

### Minor Changes

- Ten new pieces. **AuthPanel** — a liquid-glass sign-in / sign-up card with Continue with Google (and GitHub or your own providers), a mode switch that stretches like a drop, a name field that pours in for sign-up, validation with focus on the first error, and a submit button that melts into a spinner, then a check, with confetti. **PasswordInput** — the show/hide button is an eye that follows the pointer and shuts when hidden; warns about Caps Lock. **PasswordStrength** and `scorePassword()` — a liquid tube that fills and changes colour, with rules that tick themselves off. Plus `confetti()`, **ClickSpark**, **HeartButton**, **ThemeToggle** (day to night, with a View Transitions circle reveal), **SplitFlap**, **Orbit** and **DotGrid**.

### Patch Changes

- @vizzele/core@0.7.0

## 0.6.1

### Patch Changes

- @vizzele/core@0.6.1

## 0.6.0

### Minor Changes

- Ten new components: GooeyMenu, AvatarStack, LiquidStepper, LiquidGauge, LiquidRating, NumberScrubber, PullToRefresh, SignaturePad, StreamText and BorderLight. Core exports `stepSpring`.

### Patch Changes

- Updated dependencies
  - @vizzele/core@0.6.0

## 0.5.2

### Patch Changes

- - css: importing the stylesheet no longer turns a plain page dark — `color-scheme` now follows `data-theme` only (the variables are still always defined).
  - Text portal runs lighter: the scene and the mask sit on their own layers while diving (no repaint of the scene per frame), the stage is contained, and scrolling reads one rect instead of three heights.
- Updated dependencies
  - @vizzele/core@0.5.2

## 0.5.1

### Patch Changes

- Text portal: the dive now aims at the exact centre of the focus letter's ink (lined up with the SVG glyph, so diagonals like Z work too), and the zoom depth uses the true stroke thickness, so the letter covers the screen cleanly with no sweeping gap.
- Updated dependencies
  - @vizzele/core@0.5.1

## 0.5.0

### Minor Changes

- Text portal: zoom-through text. A giant word is cut out of the page and scrolling dives into one of its letters until the scene inside fills the screen, then the page carries on. `textPortal` (core, `data-vz-portal`), `<TextPortal>` (React) and `.vz-portal` styles. One SVG mask and a sticky stage; keyboard focus jumps inside; no dive with reduced motion.

### Patch Changes

- Updated dependencies
  - @vizzele/core@0.5.0

## 0.4.0

### Minor Changes

- Command palette and two new form fields:
  
  - **CommandPalette** (React): a ⌘K / Ctrl+K palette that drops in over a blurred page. The list springs to fit its results, matched letters glow, sections stay grouped and the liquid highlight slides between commands. Fuzzy label matching (`fuzzyMatch` is exported); keywords and descriptions match as plain text. Controlled or uncontrolled, `hotkey={false}` to bring your own trigger. The docs search now runs on it.
  - **OTPInput** (React): a one-time-code field where a drop of light stretches to the next cell, characters fall into place and a complete code sends an iridescent wave across. One real input underneath, so paste, SMS autofill (`autocomplete="one-time-code"`) and screen readers just work. Numeric or alphanumeric, grouping, masking, `invalid` shake.
  - **FileDropzone** (React): swells when a file is dragged over, a pool of light follows the file and a drop sends a splash ring out from where it landed. `accept`, `maxSize` and `maxFiles` validation with `onReject`, a removable file list, and a real file input (with `name`, a plain `<form>` submits every file). `acceptsFile` and `formatBytes` are exported.
  - `liquidFocus` (core): controls that draw their own focus indicator can opt out with `data-vz-focus-ring="off"`.
  - Fix: Select and DropdownMenu lost their liquid highlight after the popup was closed and opened again.
  - Size budgets: the whole React bundle is now held to 53 kB and the full CSS to 19.5 kB.

### Patch Changes

- Updated dependencies
  - @vizzele/core@0.4.0

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
