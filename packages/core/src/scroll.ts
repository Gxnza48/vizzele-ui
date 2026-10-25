import { isBrowser, noop } from './env';
import { clamp } from './math';
import { prefersReducedMotion } from './motion';
import { observeVisibility } from './observe';
import { frame } from './scheduler';
import { clearTransform, setTransform } from './transform';
import { VelocityTracker } from './velocity';

/** A scroll root: the window, or any scrollable element. */
export type ScrollContainer = Window | HTMLElement;

export interface ScrollState {
  y: number;
  x: number;
  /** px/s */
  velocity: number;
  /** 0..1 over the full scrollable height. */
  progress: number;
}

interface Tracker {
  state: ScrollState;
  listeners: Set<(s: Readonly<ScrollState>) => void>;
  detach: () => void;
}

const trackers = new Map<ScrollContainer, Tracker>();

const read = (c: ScrollContainer) =>
  c instanceof Window
    ? {
        y: c.scrollY,
        x: c.scrollX,
        max: document.documentElement.scrollHeight - c.innerHeight,
      }
    : { y: c.scrollTop, x: c.scrollLeft, max: c.scrollHeight - c.clientHeight };

/**
 * Subscribes to scroll on a container with one shared, rAF-batched listener per container.
 * Callbacks run in the `read` phase with position, velocity and progress.
 */
export function onScroll(
  cb: (s: Readonly<ScrollState>) => void,
  container: ScrollContainer = isBrowser ? window : (undefined as unknown as Window),
): () => void {
  if (!isBrowser) return noop;
  let t = trackers.get(container);
  if (!t) {
    const vt = new VelocityTracker(100);
    const state: ScrollState = { y: 0, x: 0, velocity: 0, progress: 0 };
    const listeners = new Set<(s: Readonly<ScrollState>) => void>();
    const update = () => {
      const r = read(container);
      state.y = r.y;
      state.x = r.x;
      vt.add(r.y);
      state.velocity = vt.get();
      state.progress = r.max > 0 ? clamp(r.y / r.max, 0, 1) : 0;
      listeners.forEach((l) => l(state));
    };
    const onEvt = () => frame.once(update, 'read');
    container.addEventListener('scroll', onEvt, { passive: true });
    window.addEventListener('resize', onEvt);
    t = {
      state,
      listeners,
      detach: () => {
        container.removeEventListener('scroll', onEvt);
        window.removeEventListener('resize', onEvt);
      },
    };
    trackers.set(container, t);
    frame.once(update, 'read');
  }
  t.listeners.add(cb);
  cb(t.state);
  return () => {
    const tr = trackers.get(container);
    if (!tr) return;
    tr.listeners.delete(cb);
    if (!tr.listeners.size) {
      tr.detach();
      trackers.delete(container);
    }
  };
}

const viewportHeight = (c: ScrollContainer) =>
  c instanceof Window ? c.innerHeight : c.clientHeight;
const viewportTop = (c: ScrollContainer) =>
  c instanceof Window ? 0 : c.getBoundingClientRect().top;

/**
 * How far an element has travelled through the viewport:
 * 0 when its top meets the bottom of the viewport, 1 when its bottom leaves the top.
 */
export function elementProgress(el: Element, container: ScrollContainer = window): number {
  const r = el.getBoundingClientRect();
  const vh = viewportHeight(container);
  const top = r.top - viewportTop(container);
  return clamp((vh - top) / (vh + r.height), 0, 1);
}

// ——————————————————————————— Parallax ———————————————————————————

export interface ParallaxOptions {
  /** Movement relative to scroll. 0 = normal, 0.5 = half speed (far away), -0.3 = closer. Default 0.3. */
  speed?: number;
  axis?: 'x' | 'y';
  /** Also scale slightly with depth. Default false. */
  zoom?: boolean;
  container?: ScrollContainer;
}

/** Moves an element at a different speed than the scroll, for depth. */
export function parallax(el: HTMLElement, options: ParallaxOptions = {}) {
  if (!isBrowser) return { update: noop, destroy: noop };
  let opts = options;
  let visible = false;
  const container = opts.container ?? window;
  const stopVis = observeVisibility(el, (v) => (visible = v), { margin: '20% 0px' });
  const apply = () => {
    if (!visible || prefersReducedMotion()) return;
    const p = elementProgress(el, container) - 0.5;
    const dist = p * viewportHeight(container) * (opts.speed ?? 0.3);
    setTransform(el, 'parallax', {
      [opts.axis === 'x' ? 'x' : 'y']: dist,
      ...(opts.zoom ? { scale: 1 + Math.abs(opts.speed ?? 0.3) * 0.15 } : {}),
    });
  };
  const stop = onScroll(apply, container);
  return {
    update(next: Partial<ParallaxOptions>) {
      opts = { ...opts, ...next };
      apply();
    },
    destroy() {
      stop();
      stopVis();
      clearTransform(el, 'parallax');
    },
  };
}

// ——————————————————————————— Scroll progress ———————————————————————————

export interface ScrollProgressOptions {
  /** Track an element's own read-through instead of the whole page. */
  target?: HTMLElement;
  container?: ScrollContainer;
  /** Smooth the bar with a spring. Default true. */
  smooth?: boolean;
}

/** Drives `--vz-progress` (0..1) and a scaleX on the element from the scroll position. */
export function scrollProgress(el: HTMLElement, options: ScrollProgressOptions = {}) {
  if (!isBrowser) return { update: noop, destroy: noop };
  const container = options.container ?? window;
  let shown = 0;
  let target = 0;
  let running: (() => void) | null = null;
  const paint = () => {
    el.style.transform = `scaleX(${shown.toFixed(4)})`;
    el.style.setProperty('--vz-progress', shown.toFixed(4));
    el.setAttribute('aria-valuenow', String(Math.round(shown * 100)));
  };
  el.style.transformOrigin = '0 50%';
  el.setAttribute('role', 'progressbar');
  el.setAttribute('aria-valuemin', '0');
  el.setAttribute('aria-valuemax', '100');
  el.setAttribute('aria-label', el.getAttribute('aria-label') ?? 'Reading progress');
  const tick = ({ delta }: { delta: number }) => {
    shown += (target - shown) * (1 - Math.exp(-delta * 14));
    if (Math.abs(target - shown) < 0.0005) {
      shown = target;
      paint();
      running = null;
      return false;
    }
    paint();
    return true;
  };
  const stop = onScroll((s) => {
    if (options.target) {
      const r = options.target.getBoundingClientRect();
      const vh = viewportHeight(container);
      const top = r.top - viewportTop(container);
      target = clamp(-top / Math.max(r.height - vh, 1), 0, 1);
    } else target = s.progress;
    if (options.smooth === false || prefersReducedMotion()) {
      shown = target;
      paint();
    } else running ??= frame.add(tick, 'render');
  }, container);
  return { update: noop, destroy: stop };
}

// ——————————————————————————— Horizontal scroll ———————————————————————————

/**
 * Pins a section and turns vertical scroll into horizontal travel of its track.
 * Markup: section > [sticky viewport] > track. The section's height is set automatically.
 */
export function horizontalScroll(
  section: HTMLElement,
  { track, container = window }: { track?: HTMLElement; container?: ScrollContainer } = {},
) {
  if (!isBrowser) return { update: noop, destroy: noop };
  const trackEl =
    track ??
    section.querySelector<HTMLElement>('[data-vz-track]') ??
    (section.firstElementChild?.firstElementChild as HTMLElement);
  if (!trackEl) return { update: noop, destroy: noop };
  let distance = 0;
  const measure = () => {
    distance = Math.max(trackEl.scrollWidth - (trackEl.parentElement?.clientWidth ?? 0), 0);
    section.style.height = `${distance + viewportHeight(container)}px`;
  };
  measure();
  const ro = new ResizeObserver(measure);
  ro.observe(trackEl);
  const stop = onScroll(() => {
    const top = section.getBoundingClientRect().top - viewportTop(container);
    const p = clamp(-top / Math.max(distance, 1), 0, 1);
    setTransform(trackEl, 'hscroll', { x: -p * distance });
    section.style.setProperty('--vz-progress', p.toFixed(4));
  }, container);
  return {
    update: measure,
    destroy() {
      stop();
      ro.disconnect();
      clearTransform(trackEl, 'hscroll');
      section.style.height = '';
    },
  };
}

// ——————————————————————————— Sticky stack ———————————————————————————

/**
 * Cards that pin one after another and pile up: each card shrinks and dims as the next
 * one slides over it. Cards need `position: sticky` (see `.vz-sticky-stack`).
 */
export function stickyStack(
  el: HTMLElement,
  {
    container = window,
    scale = 0.06,
    selector,
  }: { container?: ScrollContainer; scale?: number; selector?: string } = {},
) {
  if (!isBrowser) return { update: noop, destroy: noop };
  const cards = () =>
    selector
      ? Array.from(el.querySelectorAll<HTMLElement>(selector))
      : (Array.from(el.children) as HTMLElement[]);
  const stop = onScroll(() => {
    const list = cards();
    list.forEach((card, i) => {
      const next = list[i + 1];
      if (!next) return;
      const r = card.getBoundingClientRect();
      const n = next.getBoundingClientRect();
      // How much of this card the next one covers.
      const covered = clamp((r.bottom - n.top) / r.height, 0, 1);
      const depth = list.length - 1 - i;
      setTransform(card, 'stack', { scale: 1 - covered * scale * Math.min(depth, 3) });
      card.style.setProperty('--vz-covered', covered.toFixed(3));
    });
  }, container);
  return {
    update: noop,
    destroy() {
      stop();
      cards().forEach((c) => clearTransform(c, 'stack'));
    },
  };
}

// ——————————————————————————— Smooth scroll ———————————————————————————

export interface SmoothScrollOptions {
  /** Scroll root. Default window. */
  container?: ScrollContainer;
  /** Smoothing 0..1 (lower = silkier). Default 0.1. */
  lerp?: number;
  /** Wheel multiplier. Default 1. */
  wheelMultiplier?: number;
}

/**
 * Optional inertial wheel scrolling (desktop only). Touch, keyboard, scrollbars and
 * nested scrollable areas keep native behaviour; disabled with reduced motion.
 */
export function smoothScroll(options: SmoothScrollOptions = {}) {
  if (!isBrowser || prefersReducedMotion()) return { scrollTo: (_y: number) => {}, destroy: noop };
  const c = options.container ?? window;
  const el = c instanceof Window ? (document.scrollingElement ?? document.documentElement) : c;
  let target = el.scrollTop;
  let current = el.scrollTop;
  let running: (() => void) | null = null;
  const max = () => el.scrollHeight - el.clientHeight;

  const tick = () => {
    const k = options.lerp ?? 0.1;
    current += (target - current) * k;
    if (Math.abs(target - current) < 0.5) current = target;
    el.scrollTop = current;
    if (current === target) {
      running = null;
      return false;
    }
    return true;
  };

  const scrollableInside = (node: EventTarget | null, dy: number) => {
    let n = node as HTMLElement | null;
    while (n && n !== el && n !== document.body) {
      const s = getComputedStyle(n);
      if (/(auto|scroll)/.test(s.overflowY) && n.scrollHeight > n.clientHeight) {
        if (
          (dy > 0 && n.scrollTop < n.scrollHeight - n.clientHeight) ||
          (dy < 0 && n.scrollTop > 0)
        )
          return true;
      }
      n = n.parentElement;
    }
    return false;
  };

  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if (scrollableInside(e.target, e.deltaY)) return;
    e.preventDefault();
    if (!running) target = current = el.scrollTop;
    const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? el.clientHeight : 1;
    target = clamp(target + e.deltaY * unit * (options.wheelMultiplier ?? 1), 0, max());
    running ??= frame.add(tick, 'update');
  };
  // Any native scroll (keyboard, scrollbar, anchor) re-syncs the target.
  const onNative = () => {
    if (!running) target = current = el.scrollTop;
  };
  c.addEventListener('wheel', onWheel as EventListener, { passive: false });
  c.addEventListener('scroll', onNative, { passive: true });
  return {
    scrollTo(y: number) {
      target = clamp(y, 0, max());
      current = el.scrollTop;
      running ??= frame.add(tick, 'update');
    },
    destroy() {
      running?.();
      c.removeEventListener('wheel', onWheel as EventListener);
      c.removeEventListener('scroll', onNative);
    },
  };
}
