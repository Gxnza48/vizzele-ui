# @vizzele/css

Design tokens, themes, liquid-light materials and pure-CSS motion utilities from
[Vizzele UI](https://github.com/Gxnza48/vizzele-ui). Works with no JavaScript at all.

```bash
npm i @vizzele/css
```

```css
@import '@vizzele/css'; /* or import '@vizzele/css' from JS */
```

```html
<html data-theme="dark">
  <!-- or light (pearl paper) / auto -->
  <body class="vz-body vz-grain vz-grain-fixed">
    <button class="vz-button" data-variant="liquid">Liquid</button>
    <div class="vz-card vz-glass">Glass</div>
    <h1 class="vz-text-shimmer">Shimmer</h1>
    <p class="vz-scroll-reveal">Scroll-driven reveal, no JS</p>
    <div class="vz-scroll-progress"></div>
  </body>
</html>
```

- **Tokens**: the iridescent spectrum (`--vz-cyan`, `--vz-magenta`, `--vz-amber`, `--vz-acid`) and gradients, surfaces,
  text, light (shadows / glows), radii, spacing, blur, grain, z-index, focus.
- **Springs as CSS**: `--vz-spring-<liquid|gentle|jelly|snappy|heavy|bouncy|smooth>` + `-duration`, generated as
  `linear()` easings from the real spring physics.
- **Materials**: `.vz-glass`, `.vz-holo`, `.vz-spotlight`, `.vz-chrome`, `.vz-grain`.
- **Utilities**: `.vz-enter*`, `.vz-stagger`, `.vz-scroll-reveal`, `.vz-float`, `.vz-breathe`, `.vz-press`, `.vz-lift`,
  `.vz-marquee`, `.vz-iridescent-border` — all disabled under `prefers-reduced-motion`.

Individual files: `@vizzele/css/tokens.css`, `themes.css`, `springs.css`, `base.css`, `components.css`, `ui.css`,
`utilities.css`. Minified bundle: `@vizzele/css/min`.

MIT
