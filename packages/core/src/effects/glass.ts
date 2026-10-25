import { isBrowser } from '../env';
import { inertInstance, type EffectInstance } from './types';

export interface LiquidGlassOptions {
  /** Refraction strength in px. Default 38. */
  refraction?: number;
  /** Width of the bent rim as a fraction of the shorter side. Default 0.32. */
  bezel?: number;
  /** Background blur after refraction, px. Default 1.5. */
  blur?: number;
  /** Split the refraction per color channel at the rim (prismatic edge). Default 0.12. */
  dispersion?: number;
  /** Saturation boost. Default 1.6. */
  saturation?: number;
}

let svgRoot: SVGSVGElement | null = null;
let uid = 0;
const NS = 'http://www.w3.org/2000/svg';

/**
 * Real refraction is only possible where `backdrop-filter` accepts SVG filters (Chromium).
 * Elsewhere the material falls back to a blurred, tinted glass.
 */
export function supportsRefraction(): boolean {
  if (!isBrowser) return false;
  const nav = navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } };
  const brands = nav.userAgentData?.brands;
  // Chromium engines only; on iOS every browser is WebKit, whatever its name.
  const chromium = brands
    ? brands.some((b) => b.brand === 'Chromium')
    : /Chrome\//.test(navigator.userAgent) && !/CriOS|EdgiOS|FxiOS/.test(navigator.userAgent);
  return chromium && CSS.supports('backdrop-filter', 'url(#x)');
}

function root() {
  if (!svgRoot) {
    svgRoot = document.createElementNS(NS, 'svg');
    svgRoot.setAttribute('aria-hidden', 'true');
    svgRoot.style.cssText =
      'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    document.body.appendChild(svgRoot);
  }
  return svgRoot;
}

/**
 * Displacement map for a rounded rectangle: flat in the middle, increasingly bent toward
 * the edges like the rim of a lens. R/G encode the x/y offset around 128.
 */
function displacementMap(w: number, h: number, radius: number, bezel: number) {
  const scale = Math.min(1, 160 / Math.max(w, h));
  const cw = Math.max(2, Math.round(w * scale));
  const ch = Math.max(2, Math.round(h * scale));
  const r = radius * scale;
  const band = Math.max(2, bezel * Math.min(cw, ch));
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(cw, ch);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      // Signed distance to the rounded rect's edge (positive inside).
      const qx = Math.abs(x + 0.5 - cw / 2) - (cw / 2 - r);
      const qy = Math.abs(y + 0.5 - ch / 2) - (ch / 2 - r);
      const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
      const inside = Math.min(Math.max(qx, qy), 0);
      const d = r - (outside + inside);
      // Outward normal of the nearest edge.
      let nx = 0;
      let ny = 0;
      if (qx > 0 && qy > 0) {
        const l = Math.hypot(qx, qy) || 1;
        nx = qx / l;
        ny = qy / l;
      } else if (qx > qy) nx = 1;
      else ny = 1;
      nx *= Math.sign(x + 0.5 - cw / 2);
      ny *= Math.sign(y + 0.5 - ch / 2);
      const t = Math.max(0, 1 - d / band);
      const k = t * t * (3 - 2 * t); // smooth rim falloff
      const i = (y * cw + x) * 4;
      img.data[i] = 128 - nx * k * 127;
      img.data[i + 1] = 128 - ny * k * 127;
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}

/**
 * Liquid glass: the backdrop is refracted by a lens-shaped rim (not just blurred), with a
 * prismatic split of the colors at the edge. Pair it with the `.vz-glass` class.
 */
export function liquidGlass(
  el: HTMLElement,
  options: LiquidGlassOptions = {},
): EffectInstance<LiquidGlassOptions> {
  if (!isBrowser || !supportsRefraction()) return inertInstance();
  let opts = options;
  const id = `vz-glass-${++uid}`;
  const filter = document.createElementNS(NS, 'filter');
  filter.setAttribute('id', id);
  filter.setAttribute('color-interpolation-filters', 'sRGB');
  root().appendChild(filter);
  let size = '';

  const build = () => {
    const w = Math.round(el.offsetWidth);
    const h = Math.round(el.offsetHeight);
    if (!w || !h) return;
    const radius = Math.min(
      parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0,
      w / 2,
      h / 2,
    );
    const key = `${w}x${h}x${radius}x${opts.bezel}x${opts.refraction}x${opts.dispersion}`;
    if (key === size) return;
    size = key;
    const map = displacementMap(w, h, radius, opts.bezel ?? 0.32);
    const s = opts.refraction ?? 38;
    const disp = opts.dispersion ?? 0.12;
    filter.setAttribute('x', '0');
    filter.setAttribute('y', '0');
    filter.setAttribute('width', String(w));
    filter.setAttribute('height', String(h));
    filter.setAttribute('filterUnits', 'userSpaceOnUse');
    const channel = (c: 'R' | 'G' | 'B', scale: number) => `
      <feDisplacementMap in="SourceGraphic" in2="map" scale="${scale}" xChannelSelector="R" yChannelSelector="G" result="d${c}"/>
      <feColorMatrix in="d${c}" type="matrix" values="${
        c === 'R'
          ? '1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0'
          : c === 'G'
            ? '0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0'
            : '0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0'
      }" result="c${c}"/>`;
    filter.innerHTML = `
      <feImage href="${map}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="map"/>
      ${channel('R', s * (1 + disp))}
      ${channel('G', s)}
      ${channel('B', s * (1 - disp))}
      <feBlend in="cR" in2="cG" mode="screen" result="rg"/>
      <feBlend in="rg" in2="cB" mode="screen" result="rgb"/>
      <feGaussianBlur in="rgb" stdDeviation="${opts.blur ?? 1.5}" result="blurred"/>
      <feColorMatrix in="blurred" type="saturate" values="${opts.saturation ?? 1.6}"/>`;
  };

  build();
  const ro = new ResizeObserver(build);
  ro.observe(el);
  el.dataset.refract = '';
  el.style.setProperty('backdrop-filter', `url(#${id})`);
  el.style.setProperty('-webkit-backdrop-filter', `url(#${id})`);

  return {
    update(next) {
      opts = { ...opts, ...next };
      size = '';
      build();
    },
    destroy() {
      ro.disconnect();
      filter.remove();
      delete el.dataset.refract;
      el.style.removeProperty('backdrop-filter');
      el.style.removeProperty('-webkit-backdrop-filter');
    },
  };
}
