# @vizzele/core

## 0.5.0

### Minor Changes

- Text portal: zoom-through text. A giant word is cut out of the page and scrolling dives into one of its letters until the scene inside fills the screen, then the page carries on. `textPortal` (core, `data-vz-portal`), `<TextPortal>` (React) and `.vz-portal` styles. One SVG mask and a sticky stage; keyboard focus jumps inside; no dive with reduced motion.

## 0.4.0

### Minor Changes

- Command palette and two new form fields:
  
  - **CommandPalette** (React): a ⌘K / Ctrl+K palette that drops in over a blurred page. The list springs to fit its results, matched letters glow, sections stay grouped and the liquid highlight slides between commands. Fuzzy label matching (`fuzzyMatch` is exported); keywords and descriptions match as plain text. Controlled or uncontrolled, `hotkey={false}` to bring your own trigger. The docs search now runs on it.
  - **OTPInput** (React): a one-time-code field where a drop of light stretches to the next cell, characters fall into place and a complete code sends an iridescent wave across. One real input underneath, so paste, SMS autofill (`autocomplete="one-time-code"`) and screen readers just work. Numeric or alphanumeric, grouping, masking, `invalid` shake.
  - **FileDropzone** (React): swells when a file is dragged over, a pool of light follows the file and a drop sends a splash ring out from where it landed. `accept`, `maxSize` and `maxFiles` validation with `onReject`, a removable file list, and a real file input (with `name`, a plain `<form>` submits every file). `acceptsFile` and `formatBytes` are exported.
  - `liquidFocus` (core): controls that draw their own focus indicator can opt out with `data-vz-focus-ring="off"`.
  - Fix: Select and DropdownMenu lost their liquid highlight after the popup was closed and opened again.
  - Size budgets: the whole React bundle is now held to 53 kB and the full CSS to 19.5 kB.

## 0.3.0

### Minor Changes

- 3D device mockups: **PhoneMockup** (`model="iphone" | "galaxy"`) and **LaptopMockup** (React), `mockup` / `data-vz-mockup` (core).
  
  - Pure CSS 3D — a rounded slab of shaded strips for the frame, real camera lenses, side buttons, keyboard and trackpad — no WebGL and nothing to download.
  - The screen is real DOM at the device's CSS resolution (394×836, 396×848, 1280×800): put a live, clickable app, an image or a video inside. `--vz-safe-top` / `--vz-safe-bottom` clear the status bar and home indicator.
  - Turns toward the pointer, spins when you drag the frame (a fling settles on a whole turn), floats; the laptop lid opens when it scrolls into view. Animates only while visible; still under reduced motion.
  - Finishes: iPhone style natural · black · white · blue; Galaxy style black · gray · violet · cream; laptop silver · space · midnight.

## 0.2.0

### Minor Changes

- New components and backgrounds:
  
  - **CopyButton** + `useClipboard` (React) and `copyToClipboard` (core): the icon folds into a self-drawing check, light washes out from the press point, droplets burst and an icon-only button releases a "Copied" bubble. Announced to screen readers.
  - **Sidebar**: navigation with a liquid current-page marker on two springs, a hover light, foldable sections, badges and an iridescent edge that follows the pointer.
  - **Footer** and **Wordmark** (React) / `wordmark` (core, `data-vz-wordmark`): giant liquid letters that rise out of a surface, reach for the pointer, wobble when pressed and are lit by a drifting spotlight.
  - Five new WebGL backgrounds: **Aurora**, **Silk**, **LavaLamp**, **WaveLines** and **Ripples** (`aurora`, `silk`, `lavaLamp`, `waveLines`, `ripples` in `@vizzele/core/gl`).

## 0.1.1

### Patch Changes

- Fix the CDN build (`vizzele.global.js`): it now auto-initializes `data-vz-*` attributes again. In 0.1.0 the auto-init import was tree-shaken away, so plain-HTML usage did nothing.

## 0.1.0

### Minor Changes

- 7398ea3: First release of Vizzele UI: spring/inertia/drag engine, 50+ React components, WebGL backgrounds, CSS tokens and themes.
- cf2be97: Five original effects: liquidFocus / LiquidFocus, liquidSelection / LiquidSelection, holdToConfirm / HoldButton, caustics / CausticCard and surfaceTension / SurfaceTension.

### Patch Changes

- fa49734: morphText: new default 'cascade' variant (letters spring in one by one, width eases between words, optional continuous gradient); liquid scrollbars in the base styles; drop -webkit-backdrop-filter duplicates that minifiers resolved to the prefixed-only form.
- d383637: surfaceTension: the pointer droplet no longer lingers after a touch ends. Tabs: the wrapper never grows wider than its container (the list scrolls instead).
