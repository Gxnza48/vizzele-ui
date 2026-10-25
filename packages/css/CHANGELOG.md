# @vizzele/css

## 0.2.0

### Minor Changes

- New components and backgrounds:
  
  - **CopyButton** + `useClipboard` (React) and `copyToClipboard` (core): the icon folds into a self-drawing check, light washes out from the press point, droplets burst and an icon-only button releases a "Copied" bubble. Announced to screen readers.
  - **Sidebar**: navigation with a liquid current-page marker on two springs, a hover light, foldable sections, badges and an iridescent edge that follows the pointer.
  - **Footer** and **Wordmark** (React) / `wordmark` (core, `data-vz-wordmark`): giant liquid letters that rise out of a surface, reach for the pointer, wobble when pressed and are lit by a drifting spotlight.
  - Five new WebGL backgrounds: **Aurora**, **Silk**, **LavaLamp**, **WaveLines** and **Ripples** (`aurora`, `silk`, `lavaLamp`, `waveLines`, `ripples` in `@vizzele/core/gl`).

## 0.1.1

No changes in this release.

## 0.1.0

### Minor Changes

- 586000f: Charts (LineChart, AreaChart, BarChart, DonutChart, Sparkline, StatCard) with spring morphs, keyboard inspection and a CVD-validated palette; an AI Agent orb with seven states plus AgentSteps.
- 7398ea3: First release of Vizzele UI: spring/inertia/drag engine, 50+ React components, WebGL backgrounds, CSS tokens and themes.
- cf2be97: Five original effects: liquidFocus / LiquidFocus, liquidSelection / LiquidSelection, holdToConfirm / HoldButton, caustics / CausticCard and surfaceTension / SurfaceTension.
- 355980f: New `Select` and `DropdownMenu` components: glass panels that spring out of their trigger, staggered options and a liquid highlight that stretches between items. Full keyboard support (arrows, Home/End, typeahead, Escape) and WAI-ARIA combobox/listbox and menu-button patterns. Fixes popovers/tooltips staying invisible when reopened during their exit animation.

### Patch Changes

- fa49734: morphText: new default 'cascade' variant (letters spring in one by one, width eases between words, optional continuous gradient); liquid scrollbars in the base styles; drop -webkit-backdrop-filter duplicates that minifiers resolved to the prefixed-only form.
- d383637: surfaceTension: the pointer droplet no longer lingers after a touch ends. Tabs: the wrapper never grows wider than its container (the list scrolls instead).
