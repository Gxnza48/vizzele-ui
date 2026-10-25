# Vizzele UI — brand assets

Hand-built vector brand ("liquid light"). Every SVG is self-contained: no fonts or external references (the wordmark is outlined to paths).

## Files

| File                           | Use                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `isotipo.svg`                  | Master isotype (droplet V), viewBox `0 0 64 64`. Source of truth for `apps/docs/components/Logo.tsx`.  |
| `isotipo-512.png`              | Isotype raster, 512×512, transparent.                                                                  |
| `logo-dark.svg` / `.png`       | Horizontal lockup for **dark** backgrounds (pearl-chrome letters). PNG is 1600 px wide, transparent.   |
| `logo-light.svg` / `.png`      | Horizontal lockup for **light** backgrounds (ink `#14151d` letters). PNG is 1600 px wide, transparent. |
| `favicon.ico`                  | Multi-size favicon (16, 32, 48). The 16 px layer is the simplified mark (no highlights).               |
| `favicon-16x16.png`            | Simplified mark, transparent.                                                                          |
| `favicon-32x32.png`            | Full mark, transparent.                                                                                |
| `apple-touch-icon.png`         | 180×180, opaque: isotype on `#05070d` with soft glow (iOS rounds the corners).                         |
| `icon-192.png`, `icon-512.png` | PWA icons, opaque.                                                                                     |
| `icon-maskable-512.png`        | PWA maskable icon; mark kept inside the central 60% safe zone.                                         |
| `og.png`                       | 1200×630 social/Open Graph card.                                                                       |
| `manifest.webmanifest`         | Web app manifest (copy also lives in `apps/docs/public/`).                                             |
| `options/isotipo-A.svg`        | Option A — droplet V (**chosen final**).                                                               |
| `options/isotipo-B.svg`        | Option B — single liquid ribbon folding into a V.                                                      |
| `options/isotipo-C.svg`        | Option C — V as negative space inside an iridescent squircle (app-icon style).                         |
| `options/vector-options.png`   | Contact sheet of A/B/C at 512, 32 and 16 px on dark and light.                                         |

The `options/*.png` files named `isotipo-1..4`, `logotipo-1..3` and `contact-sheet.png` are earlier AI-generated explorations, kept for reference only.

## Palette

| Token         | Hex       |
| ------------- | --------- |
| Base dark     | `#05070d` |
| Base light    | `#f3f0ea` |
| Ink (text)    | `#14151d` |
| Electric cyan | `#00e5ff` |
| Magenta       | `#ff2bd6` |
| Amber         | `#ffb238` |
| Acid green    | `#a8ff3e` |

The iridescent fill is a linear gradient cyan → magenta (36%) → amber (68%) → green, running left-to-right with a slight downward tilt.

## Type

- **Wordmark:** Bricolage Grotesque, wght 780, opsz 96, tracking −0.022 em ("Vizzele"); "UI" at wght 500 in a muted grey (`#8a8fa6` on dark, `#6b6e7d` on light).
- **UI / body:** Geist.

## Clear space and minimum size

- Keep clear space on all sides equal to **the width of one arm of the V** (≈ ¼ of the isotype height). Nothing (text, edges, other marks) enters that zone.
- Isotype minimum: 16 px (use the simplified favicon art below 24 px). Lockup minimum: 96 px wide.
- Don't recolor the gradient, rotate, stretch, add effects/outlines, or set the wordmark in another font.
