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
  /** Index of the letter to dive into; the dive aims at the centre of its ink. Default: the middle letter. */
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
 * Finds where to dive into letter `i` by drawing the word on a canvas: the centre of the
 * letter's ink (or, if that is a hole, its thickest stroke) and how thick the stroke is there.
 * Glyph extents include side bearings and letter-spacing — a few px off, and a few px at 80×
 * zoom is a gap across the screen.
 */
function inkSpot(word: SVGTextContentElement, i: number, w: number) {
  const r = word.getExtentOfChar(i);
  const spot = { x: r.x + r.width / 2, y: r.y + r.height / 2, thick: 0 };
  const cs = getComputedStyle(word);
  const text = word.textContent ?? '';
  const cw = Math.ceil(w);
  const ch = Math.ceil(parseFloat(cs.fontSize) * 1.6) || 1;
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (!ctx || !cw) return spot;
  ctx.canvas.width = cw;
  ctx.canvas.height = ch;
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  (ctx as { letterSpacing?: string }).letterSpacing = cs.letterSpacing;
  const m = ctx.measureText(text);
  const left = cw / 2 - m.width / 2;
  const base = Math.round(ch * 0.72);
  ctx.fillText(text, left, base);
  const data = ctx.getImageData(0, 0, cw, ch).data;
  const ink = (x: number, y: number) => data[(y * cw + x) * 4 + 3]! > 127;
  // The letter's advance on the canvas, and the shift that lines it up with the SVG glyph
  // (the extent's left edge and em-box top are the same points in both).
  const start = left + ctx.measureText(text.slice(0, i)).width;
  const x0 = clamp(Math.floor(start), 0, cw - 1);
  const x1 = clamp(Math.ceil(left + ctx.measureText(text.slice(0, i + 1)).width), x0, cw - 1);
  const dx = r.x - start;
  const dy = r.y + (m.fontBoundingBoxAscent || r.height * 0.8) - base;
  // Stroke thickness across a point, from its horizontal and vertical chords.
  const across = (x: number, y: number) => {
    let a = x;
    let b = x;
    let t = y;
    let d = y;
    while (a > 0 && ink(a - 1, y)) a--;
    while (b < cw - 1 && ink(b + 1, y)) b++;
    while (t > 0 && ink(x, t - 1)) t--;
    while (d < ch - 1 && ink(x, d + 1)) d++;
    const hr = b - a + 1;
    const vr = d - t + 1;
    return { mid: (a + b) >> 1, thick: (hr * vr) / Math.hypot(hr, vr) };
  };
  const at = (x: number, y: number, thick: number) => ({ x: x + dx, y: y + dy, thick });
  let top = ch;
  let bottom = -1;
  let l = cw;
  let rr = -1;
  for (let y = 0; y < ch; y++)
    for (let x = x0; x <= x1; x++)
      if (ink(x, y)) {
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
        l = Math.min(l, x);
        rr = Math.max(rr, x);
      }
  if (bottom < 0) return spot;
  const mx = (l + rr) >> 1;
  const my = (top + bottom) >> 1;
  if (ink(mx, my)) return at(mx, my, across(mx, my).thick);
  // The centre is a hole (O, U…): take the thickest stroke on a row through the middle.
  let best = spot;
  for (const f of [0.5, 0.4, 0.6, 0.3, 0.7]) {
    const y = Math.round(top + (bottom - top) * f);
    for (let x = x0; x <= x1; x++) {
      if (!ink(x, y)) continue;
      const c = across(x, y);
      const s = across(c.mid, y);
      if (s.thick > best.thick) best = at(c.mid, y, s.thick);
      while (x < x1 && ink(x + 1, y)) x++;
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

  // The dive's scroll distance, cached so scrolling only reads one rect.
  let dist = 1;
  const measure = () => {
    if (!inWindow) el.style.setProperty('--vz-portal-h', `${viewport()}px`);
    dist = Math.max(el.offsetHeight - stage.offsetHeight, 1);
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
      const spot = inkSpot(word, i, w);
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
    const by = top + dist;
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
  ro.observe(el);
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
