import { isBrowser, noop } from '../env';
import { clamp } from '../math';
import { prefersReducedMotion } from '../motion';
import { observeVisibility } from '../observe';
import { frame } from '../scheduler';
import { onScroll, type ScrollContainer } from '../scroll';
import type { EffectInstance } from './types';

export interface TextPortalOptions {
  /** The word you dive into. Vanilla only: defaults to `data-vz-text`. */
  text?: string;
  /** Index of the letter to dive into — pick one whose centre is ink (I, H, M, N…). Default: the middle letter. */
  focus?: number;
  /** Scroll distance of the dive, in viewport heights. Default 1.5. */
  length?: number;
  /** Ease the zoom toward the scroll position instead of jumping with each wheel step. Default true. */
  smooth?: boolean;
  /** Scroll root. Default window. */
  container?: ScrollContainer;
  /** Called with the dive progress, 0 (outside the word) to 1 (inside). */
  onProgress?: (p: number) => void;
}

const SVG = 'http://www.w3.org/2000/svg';
let uid = 0;

const svg = (tag: string, attrs: Record<string, string>) => {
  const n = document.createElementNS(SVG, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]!);
  return n;
};

/**
 * Finds the thickest stroke of letter `i` near its middle by drawing the word on a canvas:
 * glyph extents include side bearings and letter-spacing, which is a few px off — and a few px
 * at 80× zoom is a gap across the screen.
 */
function inkSpot(word: SVGTextContentElement, i: number, w: number, h: number) {
  const r = word.getExtentOfChar(i);
  const spot = { x: r.x + r.width / 2, y: r.y + r.height / 2, thick: 0 };
  const cs = getComputedStyle(word);
  const cw = Math.ceil(w);
  const ch = Math.ceil(parseFloat(cs.fontSize) * 1.6) || 1;
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (!ctx || !cw) return spot;
  ctx.canvas.width = cw;
  ctx.canvas.height = ch;
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  (ctx as { letterSpacing?: string }).letterSpacing = cs.letterSpacing;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(word.textContent ?? '', cw / 2, ch / 2);
  const data = ctx.getImageData(0, 0, cw, ch).data;
  const ink = (x: number, y: number) => data[(y * cw + x) * 4 + 3]! > 127;
  const x0 = Math.max(Math.floor(r.x - r.width * 0.25), 0);
  const x1 = Math.min(Math.ceil(r.x + r.width * 1.25), cw - 1);
  for (const f of [0.5, 0.4, 0.6, 0.3, 0.7]) {
    const y = Math.round(ch * f);
    let best = spot;
    for (let x = x0; x <= x1; x++) {
      if (!ink(x, y)) continue;
      let e = x;
      while (e < cw - 1 && ink(e + 1, y)) e++;
      const mx = (x + e) >> 1;
      let t = y;
      let b = y;
      while (t > 0 && ink(mx, t - 1)) t--;
      while (b < ch - 1 && ink(mx, b + 1)) b++;
      const thick = Math.min(e - x + 1, b - t + 1);
      if (thick > best.thick) best = { x: mx, y: y + h / 2 - ch / 2, thick };
      x = e;
    }
    if (best.thick) return best;
  }
  return spot;
}

/** The overlay: a page-coloured sheet with the word cut out of it (an SVG mask). */
function build(el: HTMLElement, text: string) {
  const id = `vz-portal-${++uid}`;
  const stage = document.createElement('div');
  stage.className = 'vz-portal-stage';
  const scene = document.createElement('div');
  scene.className = 'vz-portal-scene';
  const cover = document.createElement('div');
  cover.className = 'vz-portal-cover';
  for (const c of Array.from(el.childNodes))
    ((c as HTMLElement).hasAttribute?.('data-vz-portal-cover') ? cover : scene).appendChild(c);
  const word = () => {
    const t = svg('text', {
      class: 'vz-portal-word',
      x: '50%',
      y: '50%',
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
    });
    t.textContent = text;
    const g = svg('g', { class: 'vz-portal-zoom' });
    g.appendChild(t);
    return g;
  };
  const overlay = svg('svg', { class: 'vz-portal-overlay', 'aria-hidden': 'true' });
  const mask = svg('mask', {
    id,
    maskUnits: 'userSpaceOnUse',
    x: '0',
    y: '0',
    width: '100%',
    height: '100%',
  });
  mask.append(svg('rect', { width: '100%', height: '100%', fill: '#fff' }), word());
  const defs = svg('defs', {});
  defs.appendChild(mask);
  overlay.append(
    defs,
    svg('rect', { class: 'vz-portal-fill', width: '100%', height: '100%', mask: `url(#${id})` }),
  );
  stage.append(scene, overlay);
  if (cover.childNodes.length) stage.appendChild(cover);
  el.appendChild(stage);
  return () => {
    for (const c of Array.from(scene.childNodes).concat(Array.from(cover.childNodes)))
      el.appendChild(c);
    stage.remove();
  };
}

/**
 * Zoom-through text: a giant word is cut out of the page, and scrolling dives the camera into
 * one of its letters until the scene behind it fills the screen — then the page carries on.
 * Pins with `position: sticky`; drives `--vz-portal-p` (0..1) and `data-state`
 * (`closed` · `diving` · `open`) on the element. Markup: `.vz-portal > .vz-portal-stage >
 * [.vz-portal-scene, svg.vz-portal-overlay, .vz-portal-cover]` — built for you if missing.
 */
export function textPortal(
  el: HTMLElement,
  options: TextPortalOptions = {},
): EffectInstance<TextPortalOptions> {
  if (!isBrowser) return { update: noop, destroy: noop };
  let opts = options;
  el.classList.add('vz-portal');
  const restore = el.querySelector('.vz-portal-stage')
    ? noop
    : build(el, opts.text ?? el.dataset.vzText ?? '');
  const stage = el.querySelector<HTMLElement>('.vz-portal-stage')!;
  const word = el.querySelector<SVGTextContentElement>('.vz-portal-word');
  const zooms = Array.from(el.querySelectorAll<SVGGElement>('.vz-portal-zoom'));
  const container = opts.container ?? window;
  const inWindow = container === window;

  let fx = 0;
  let fy = 0;
  let cx = 0;
  let cy = 0;
  let maxScale = 60;
  let target = 0;
  let shown = -1;
  let state = '';
  let visible = true;
  let running: (() => void) | null = null;

  const setLength = () => el.style.setProperty('--vz-portal-length', String(opts.length ?? 1.5));
  setLength();

  const viewport = () => (inWindow ? window.innerHeight : (container as HTMLElement).clientHeight);

  const measure = () => {
    if (!inWindow) el.style.setProperty('--vz-portal-h', `${viewport()}px`);
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!word || !w || !h) return;
    // Fit the word to ~90% of the width (and at most half the height).
    word.style.fontSize = '100px';
    const len = word.getComputedTextLength?.() || 0;
    const size = len ? Math.min((w * 0.9 * 100) / len, h * 0.5) : h * 0.3;
    word.style.fontSize = `${size}px`;
    el.style.setProperty('--vz-portal-size', `${size.toFixed(1)}px`);
    cx = w / 2;
    cy = h / 2;
    const chars = word.getNumberOfChars?.() || 0;
    const i = clamp(opts.focus ?? Math.floor(chars / 2), 0, Math.max(chars - 1, 0));
    let thick = size * 0.12;
    try {
      const spot = inkSpot(word, i, w, h);
      fx = spot.x;
      fy = spot.y;
      if (spot.thick) thick = spot.thick;
    } catch {
      fx = cx;
      fy = cy;
    }
    // Deep enough that the stroke covers the whole stage by 80% of the dive.
    maxScale = clamp(((Math.hypot(w, h) * 1.15) / thick) ** 1.25, 12, 3000);
    paint(true);
  };

  const paint = (force = false) => {
    if (!force && shown === target) return;
    const p = shown < 0 ? target : shown;
    const s = Math.exp(Math.log(maxScale) * p);
    // The focus letter drifts to the centre as you dive, so its stroke fills the whole stage.
    const k = Math.min(p * 2.5, 1) * (2 - Math.min(p * 2.5, 1));
    const ax = fx + (cx - fx) * k;
    const ay = fy + (cy - fy) * k;
    const t = `translate(${ax.toFixed(2)} ${ay.toFixed(2)}) scale(${s.toFixed(4)}) translate(${(-fx).toFixed(2)} ${(-fy).toFixed(2)})`;
    zooms.forEach((g) => g.setAttribute('transform', t));
    el.style.setProperty('--vz-portal-p', p.toFixed(4));
    const next = p > 0.995 ? 'open' : p < 0.005 ? 'closed' : 'diving';
    if (next !== state) el.dataset.state = state = next;
    opts.onProgress?.(p);
  };

  const tick = ({ delta }: { delta: number }) => {
    shown += (target - shown) * (1 - Math.exp(-delta * 10));
    if (Math.abs(target - shown) < 0.0005) shown = target;
    paint(true);
    if (shown === target) {
      running = null;
      return false;
    }
    return true;
  };

  const read = () => {
    if (!visible) return;
    const top =
      el.getBoundingClientRect().top -
      (inWindow ? 0 : (container as HTMLElement).getBoundingClientRect().top);
    const dist = Math.max(el.offsetHeight - stage.offsetHeight, 1);
    target = clamp(-top / dist, 0, 1);
    if (shown < 0 || opts.smooth === false) {
      shown = target;
      paint(true);
    } else running ??= frame.add(tick, 'render');
  };

  // Keyboard users tabbing into the scene jump straight inside the word.
  const onFocus = (e: FocusEvent) => {
    if (target > 0.99 || !(e.target as Element).closest('.vz-portal-scene')) return;
    const top =
      el.getBoundingClientRect().top -
      (inWindow ? 0 : (container as HTMLElement).getBoundingClientRect().top);
    const by = top + el.offsetHeight - stage.offsetHeight;
    container.scrollBy({ top: by, behavior: 'instant' as ScrollBehavior });
  };

  if (prefersReducedMotion()) {
    el.dataset.state = 'static';
    el.style.setProperty('--vz-portal-p', '1');
    opts.onProgress?.(1);
    return {
      update(next) {
        opts = { ...opts, ...next };
      },
      destroy() {
        restore();
        delete el.dataset.state;
      },
    };
  }

  const ro = new ResizeObserver(measure);
  ro.observe(stage);
  measure();
  void document.fonts?.ready.then(measure);
  const stopVis = observeVisibility(
    el,
    (v) => {
      visible = v;
      if (v) read();
    },
    { margin: '10% 0px' },
  );
  const stopScroll = onScroll(read, container);
  el.addEventListener('focusin', onFocus);

  return {
    update(next) {
      const layout = next.focus !== opts.focus || next.length !== opts.length;
      opts = { ...opts, ...next };
      if (!layout) return;
      setLength();
      measure();
      read();
    },
    destroy() {
      running?.();
      ro.disconnect();
      stopVis();
      stopScroll();
      el.removeEventListener('focusin', onFocus);
      zooms.forEach((g) => g.removeAttribute('transform'));
      el.style.removeProperty('--vz-portal-p');
      delete el.dataset.state;
      restore();
    },
  };
}
