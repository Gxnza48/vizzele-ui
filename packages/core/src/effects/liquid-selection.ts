import { isBrowser } from '../env';
import { prefersReducedMotion } from '../motion';
import { gooFilter, stepSpring } from './goo';
import { inertInstance, type EffectInstance } from './types';

export interface LiquidSelectionOptions {
  /** Only selections inside this element turn liquid. Default: the whole document. */
  root?: HTMLElement;
}

interface Line {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Blob {
  el: HTMLElement;
  s: Record<keyof Line, { x: number; v: number }>;
  target: Line;
  dying: boolean;
}

/** Merges a range's client rects into one rect per visual line. */
function linesOf(rects: DOMRect[]): Line[] {
  const sorted = rects.filter((r) => r.width > 0.5 && r.height > 0.5).sort((a, b) => a.top - b.top);
  const lines: { l: number; t: number; r: number; b: number }[] = [];
  for (const r of sorted) {
    const line = lines.find((l) => Math.abs(l.t - r.top) < r.height * 0.5);
    if (line) {
      line.l = Math.min(line.l, r.left);
      line.r = Math.max(line.r, r.right);
      line.t = Math.min(line.t, r.top);
      line.b = Math.max(line.b, r.bottom);
    } else lines.push({ l: r.left, t: r.top, r: r.right, b: r.bottom });
  }
  return lines.map((l) => ({ x: l.l - 3, y: l.t - 2, w: l.r - l.l + 6, h: l.b - l.t + 4 }));
}

/**
 * Text selection as liquid light: instead of hard blue boxes, a blob springs out from the
 * caret, stretches as you drag, and the lines fuse into one continuous drop where they touch.
 * Inputs and textareas keep the native selection.
 */
export function liquidSelection(
  options: LiquidSelectionOptions = {},
): EffectInstance<LiquidSelectionOptions> {
  if (!isBrowser) return inertInstance();
  let opts = options;
  const scope = opts.root ?? document.documentElement;
  scope.setAttribute('data-vz-liquid-select', '');
  const layer = document.createElement('div');
  layer.className = 'vz-selection-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.style.filter = gooFilter('vz-goo-selection', 4, 18);
  document.body.appendChild(layer);
  const blobs: Blob[] = [];
  let raf = 0;
  let last = 0;

  const paint = (b: Blob) => {
    const { x, y, w, h } = b.s;
    b.el.style.transform = `translate(${x.x}px, ${y.x}px)`;
    b.el.style.width = `${Math.max(0, w.x)}px`;
    b.el.style.height = `${Math.max(0, h.x)}px`;
  };

  const spawn = (from: Line, to: Line) => {
    const el = document.createElement('span');
    el.className = 'vz-selection-blob';
    layer.appendChild(el);
    const s = {
      x: { x: from.x, v: 0 },
      y: { x: from.y, v: 0 },
      w: { x: from.w, v: 0 },
      h: { x: from.h, v: 0 },
    };
    const b: Blob = { el, s, target: to, dying: false };
    blobs.push(b);
    paint(b);
    return b;
  };

  const tick = (now: number) => {
    raf = 0;
    const dt = Math.min(0.032, (now - (last || now)) / 1000) || 1 / 60;
    last = now;
    let moving = false;
    for (let i = blobs.length - 1; i >= 0; i--) {
      const b = blobs[i]!;
      for (const k of ['x', 'y', 'w', 'h'] as const) {
        // Width is the "stretch" — it lags a touch so dragging feels viscous.
        if (stepSpring(b.s[k], b.target[k], dt, k === 'w' ? 240 : 320, k === 'w' ? 21 : 28))
          moving = true;
      }
      paint(b);
      if (b.dying && b.s.w.x < 1) {
        b.el.remove();
        blobs.splice(i, 1);
      }
    }
    if (moving) raf = requestAnimationFrame(tick);
    else last = 0;
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const sync = (animate: boolean) => {
    const sel = document.getSelection();
    let lines: Line[] = [];
    if (sel && sel.rangeCount && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      const node = range.commonAncestorContainer;
      const host = node instanceof Element ? node : node.parentElement;
      const native = host?.closest('input, textarea, [data-vz-native-select]');
      if (host && scope.contains(host) && !native)
        lines = linesOf(Array.from(range.getClientRects()));
    }
    lines.forEach((line, i) => {
      const live = blobs.filter((b) => !b.dying);
      const b = live[i];
      if (b) b.target = line;
      else {
        // New lines grow out of the previous line's tip (or the selection's start).
        const prev = live[i - 1]?.target ?? line;
        spawn({ x: prev.x + prev.w, y: line.y, w: 0, h: line.h }, line);
      }
    });
    blobs
      .filter((b) => !b.dying)
      .slice(lines.length)
      .forEach((b) => {
        b.dying = true;
        b.target = { ...b.target, x: b.target.x + b.target.w / 2, w: 0 };
      });
    if (!animate || prefersReducedMotion()) {
      for (let i = blobs.length - 1; i >= 0; i--) {
        const b = blobs[i]!;
        for (const k of ['x', 'y', 'w', 'h'] as const) b.s[k] = { x: b.target[k], v: 0 };
        paint(b);
        if (b.dying) {
          b.el.remove();
          blobs.splice(i, 1);
        }
      }
      return;
    }
    kick();
  };

  const onSelection = () => sync(true);
  const onScroll = () => sync(false);
  document.addEventListener('selectionchange', onSelection);
  window.addEventListener('scroll', onScroll, { capture: true, passive: true });
  window.addEventListener('resize', onScroll);

  return {
    update(next) {
      opts = { ...opts, ...next };
    },
    destroy() {
      document.removeEventListener('selectionchange', onSelection);
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
      layer.remove();
      scope.removeAttribute('data-vz-liquid-select');
    },
  };
}
