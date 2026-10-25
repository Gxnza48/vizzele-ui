# @vizzele/core

The zero-dependency engine behind [Vizzele UI](https://github.com/Gxnza48/vizzele-ui): analytic springs, inertia,
pointer drag, a 2D physics world, scroll utilities, text effects and pointer effects — usable from any framework,
plain JavaScript or HTML attributes.

```bash
npm i @vizzele/core
```

```ts
import { Spring, draggable, magnetic, tilt, reveal, createPhysicsWorld } from '@vizzele/core';

const x = new Spring({
  stiffness: 260,
  damping: 11,
  onUpdate: (v) => (el.style.translate = `${v}px`),
});
x.set(200); // exact at any frame rate

draggable(card, { bounds: 'parent', elastic: 0.35, snap: { x: [0, 240, 480] } });
magnetic(button, { strength: 0.4 });
tilt(holoCard, { max: 14 }); // exposes --vz-px, --vz-angle… for CSS
```

### WebGL backgrounds

```ts
import { fluid, meshGradient, liquidMetal, particleField, lensGrid } from '@vizzele/core/gl';

const sim = fluid(canvas) ?? meshGradient(canvas); // fluid needs float render targets
```

### Declarative

```html
<script src="https://unpkg.com/@vizzele/core/dist/vizzele.global.js" defer></script>
<button data-vz-magnetic="strength: 0.4">Hover</button>
<div data-vz-drag="bounds: parent">Throw me</div>
```

Or with a bundler: `import '@vizzele/core/auto'`.

Every effect returns `{ update(options), destroy() }`, respects `prefers-reduced-motion`, and is SSR-safe.
Full docs and live playgrounds: see the repository.

MIT
