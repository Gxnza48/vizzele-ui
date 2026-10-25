# @vizzele/core

## 0.1.0

### Minor Changes

- 7398ea3: First release of Vizzele UI: spring/inertia/drag engine, 50+ React components, WebGL backgrounds, CSS tokens and themes.
- cf2be97: Five original effects: liquidFocus / LiquidFocus, liquidSelection / LiquidSelection, holdToConfirm / HoldButton, caustics / CausticCard and surfaceTension / SurfaceTension.

### Patch Changes

- fa49734: morphText: new default 'cascade' variant (letters spring in one by one, width eases between words, optional continuous gradient); liquid scrollbars in the base styles; drop -webkit-backdrop-filter duplicates that minifiers resolved to the prefixed-only form.
- d383637: surfaceTension: the pointer droplet no longer lingers after a touch ends. Tabs: the wrapper never grows wider than its container (the list scrolls instead).
