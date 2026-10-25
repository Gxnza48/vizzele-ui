import { isBrowser, noop, now } from './env';
import { clamp, closest, rubberbandClamp } from './math';
import { inertia, type InertiaControls } from './inertia';
import { Spring, resolveSpring, type SpringConfig, type SpringPreset } from './spring';
import { getTransform, setTransform } from './transform';
import { VelocityTracker } from './velocity';
import { prefersReducedMotion } from './motion';

export type DragAxis = 'x' | 'y' | 'both';

export interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export type SnapValue = readonly number[] | ((value: number) => number);

export interface DragState {
  x: number;
  y: number;
  /** Velocity in px/s. */
  vx: number;
  vy: number;
  /** Movement since the gesture started. */
  offsetX: number;
  offsetY: number;
  dragging: boolean;
  event: PointerEvent | KeyboardEvent | null;
}

export interface DragOptions {
  /** Restrict movement to one axis. Default `'both'`. */
  axis?: DragAxis;
  /** Lock to whichever axis the gesture starts moving along. */
  lockDirection?: boolean;
  /**
   * Limits, in px of translation. `'parent'` or an element keeps the element inside it.
   * Default: no limits.
   */
  bounds?: 'parent' | HTMLElement | Partial<Bounds> | null;
  /** Rubber-band resistance past the bounds, 0 (hard wall) to 1 (very stretchy). Default 0.35. */
  elastic?: number;
  /** Keep moving after release with inertia. Default true. */
  momentum?: boolean;
  /** Throw distance multiplier. Default 1. */
  power?: number;
  /** Glide time constant in seconds. Default 0.4. */
  timeConstant?: number;
  /** Snap points per axis, or a list of 2D points (nearest to where the throw lands wins). */
  snap?: { x?: SnapValue; y?: SnapValue; points?: readonly { x: number; y: number }[] };
  /** Spring used for snapping, bouncing and returning. Default `'liquid'`. */
  spring?: SpringConfig | SpringPreset;
  /** Spring back to the origin on release (sliders' knobs, swipe cards…). */
  returnToOrigin?: boolean;
  /** Only start dragging from this element or selector inside the target. */
  handle?: string | HTMLElement;
  /** Pixels to move before a drag starts, so clicks still work. Default 3. */
  threshold?: number;
  /** Arrow keys move the element when it has focus. Step in px, or false. Default 16. */
  keyboard?: number | false;
  /** Rotate (deg) in the direction of horizontal movement, like a card being flicked. Default 0. */
  rotate?: number;
  /** Stretch along the velocity like rubber (0..1). Default 0. */
  stretch?: number;
  /** Set grab/grabbing cursors. Default true. */
  cursor?: boolean;
  /** Replace the default rendering (a `translate3d` on the element). */
  apply?: (x: number, y: number, state: DragState) => void;
  onStart?: (state: DragState) => void;
  onMove?: (state: DragState) => void;
  /**
   * Fires on release. Return `false` to skip the built-in release animation (momentum,
   * snapping…) and drive it yourself, e.g. with `controls.setPosition()` or `fling()`.
   */
  onEnd?: (state: DragState) => void | false;
  /** Fires when the element comes to rest after a gesture (after momentum / snapping). */
  onRest?: (state: DragState) => void;
}

export interface DragControls {
  readonly x: number;
  readonly y: number;
  readonly dragging: boolean;
  /** Moves to a position, animated with the drag spring unless `animate` is false. */
  setPosition(
    pos: { x?: number; y?: number },
    options?: { animate?: boolean; velocity?: { x?: number; y?: number } },
  ): void;
  /** Throws the element as if released with this velocity. */
  fling(velocity: { x?: number; y?: number }): void;
  update(options: Partial<DragOptions>): void;
  enable(): void;
  disable(): void;
  destroy(): void;
}

const LAYER = 'drag';
const INTERACTIVE =
  'input, textarea, select, button:not([data-vz-drag-handle]), [contenteditable], [data-vz-no-drag]';

function resolveSnap(value: number, snap: SnapValue | undefined) {
  if (!snap) return value;
  return typeof snap === 'function' ? snap(value) : closest(value, snap);
}

/**
 * Makes an element draggable with mouse, touch and pen — with velocity, momentum,
 * rubber-band limits, snap points, axis locking and keyboard support.
 */
export function draggable(el: HTMLElement, options: DragOptions = {}): DragControls {
  let opts: DragOptions = options;
  if (!isBrowser) {
    return {
      x: 0,
      y: 0,
      dragging: false,
      setPosition: noop,
      fling: noop,
      update: noop,
      enable: noop,
      disable: noop,
      destroy: noop,
    };
  }

  const initial = getTransform(el, LAYER);
  let x = initial.x ?? 0;
  let y = initial.y ?? 0;
  let enabled = true;
  let dragging = false;
  let pressed = false;
  let pointerId = -1;
  let startX = 0;
  let startY = 0;
  let originX = 0;
  let originY = 0;
  let locked: 'x' | 'y' | null = null;
  let bounds: Bounds = { left: -Infinity, right: Infinity, top: -Infinity, bottom: Infinity };
  let size = { w: 1, h: 1 };
  let lastEvent: PointerEvent | KeyboardEvent | null = null;
  let animX: InertiaControls | Spring | null = null;
  let animY: InertiaControls | Spring | null = null;
  let restPending = 0;
  const tx = new VelocityTracker();
  const ty = new VelocityTracker();
  const rot = new Spring({ ...resolveSpring('jelly'), onUpdate: () => render() });
  const sx = new Spring({ ...resolveSpring('jelly'), from: 1, onUpdate: () => render() });
  const sy = new Spring({ ...resolveSpring('jelly'), from: 1, onUpdate: () => render() });

  const state = (): DragState => ({
    x,
    y,
    vx: tx.get(),
    vy: ty.get(),
    offsetX: x - originX,
    offsetY: y - originY,
    dragging,
    event: lastEvent,
  });

  const render = () => {
    if (opts.apply) opts.apply(x, y, state());
    else
      setTransform(el, LAYER, {
        x,
        y,
        rotate: rot.value,
        scaleX: sx.value,
        scaleY: sy.value,
      });
  };

  const axisAllows = (a: 'x' | 'y') => {
    const axis = opts.axis ?? 'both';
    if (axis !== 'both' && axis !== a) return false;
    return !(locked && locked !== a);
  };

  const measureBounds = () => {
    const b = opts.bounds;
    const rect = el.getBoundingClientRect();
    size = { w: rect.width || 1, h: rect.height || 1 };
    if (!b) {
      bounds = { left: -Infinity, right: Infinity, top: -Infinity, bottom: Infinity };
      return;
    }
    if (b === 'parent' || b instanceof HTMLElement) {
      const container = b === 'parent' ? el.parentElement : b;
      if (!container) return;
      const c = container.getBoundingClientRect();
      const style = getComputedStyle(container);
      const bl = parseFloat(style.borderLeftWidth) || 0;
      const bt = parseFloat(style.borderTopWidth) || 0;
      const br = parseFloat(style.borderRightWidth) || 0;
      const bb = parseFloat(style.borderBottomWidth) || 0;
      // Untransformed position of the element = current rect minus our translation.
      const baseLeft = rect.left - x;
      const baseTop = rect.top - y;
      bounds = {
        left: c.left + bl - baseLeft,
        right: c.right - br - (baseLeft + rect.width),
        top: c.top + bt - baseTop,
        bottom: c.bottom - bb - (baseTop + rect.height),
      };
      if (bounds.left > bounds.right) bounds.left = bounds.right = (bounds.left + bounds.right) / 2;
      if (bounds.top > bounds.bottom) bounds.top = bounds.bottom = (bounds.top + bounds.bottom) / 2;
      return;
    }
    bounds = {
      left: b.left ?? -Infinity,
      right: b.right ?? Infinity,
      top: b.top ?? -Infinity,
      bottom: b.bottom ?? Infinity,
    };
  };

  const stopAnimations = () => {
    animX?.stop();
    animY?.stop();
    animX = animY = null;
    restPending = 0;
  };

  const settled = () => {
    restPending--;
    if (restPending <= 0) {
      restPending = 0;
      opts.onRest?.(state());
    }
  };

  const springAxis = (axis: 'x' | 'y', target: number, velocity: number) => {
    const spring = new Spring({
      ...resolveSpring(opts.spring ?? 'liquid'),
      from: axis === 'x' ? x : y,
      velocity,
      onUpdate: (v) => {
        if (axis === 'x') x = v;
        else y = v;
        render();
        opts.onMove?.(state());
      },
      onRest: settled,
    });
    restPending++;
    spring.set(target);
    return spring;
  };

  const release = (vx: number, vy: number) => {
    stopAnimations();
    rot.set(0);
    sx.set(1);
    sy.set(1);
    const momentum = opts.momentum !== false && !prefersReducedMotion();

    if (opts.returnToOrigin) {
      if (axisAllows('x') || x !== 0) animX = springAxis('x', 0, vx);
      if (axisAllows('y') || y !== 0) animY = springAxis('y', 0, vy);
      return;
    }

    // 2D snap points: pick the one nearest to where the throw would land.
    const points = opts.snap?.points;
    if (points?.length) {
      const power = opts.power ?? 1;
      const tc = opts.timeConstant ?? 0.4;
      const px = x + (momentum ? vx * power * tc : 0);
      const py = y + (momentum ? vy * power * tc : 0);
      let best = points[0]!;
      let bestD = Infinity;
      for (const p of points) {
        const d = (p.x - px) ** 2 + (p.y - py) ** 2;
        if (d < bestD) {
          bestD = d;
          best = p;
        }
      }
      animX = springAxis('x', best.x, vx);
      animY = springAxis('y', best.y, vy);
      return;
    }

    const run = (axis: 'x' | 'y', v: number) => {
      const from = axis === 'x' ? x : y;
      const min = axis === 'x' ? bounds.left : bounds.top;
      const max = axis === 'x' ? bounds.right : bounds.bottom;
      const snap = axis === 'x' ? opts.snap?.x : opts.snap?.y;
      if (!momentum) {
        const target = clamp(resolveSnap(from, snap), min, max);
        return target === from ? null : springAxis(axis, target, 0);
      }
      restPending++;
      return inertia({
        from,
        velocity: v,
        power: opts.power ?? 1,
        timeConstant: opts.timeConstant ?? 0.4,
        min,
        max,
        bounce: opts.spring ?? { stiffness: 380, damping: 30 },
        ...(snap ? { modifyTarget: (t: number) => clamp(resolveSnap(t, snap), min, max) } : {}),
        onUpdate: (value) => {
          if (axis === 'x') x = value;
          else y = value;
          render();
          opts.onMove?.(state());
        },
        onComplete: settled,
      });
    };
    animX = axisAllows('x') ? run('x', vx) : null;
    animY = axisAllows('y') ? run('y', vy) : null;
    if (!animX && !animY) opts.onRest?.(state());
  };

  const onPointerDown = (e: PointerEvent) => {
    if (!enabled || pressed || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const target = e.target as Element | null;
    const handle = opts.handle;
    if (handle) {
      const h = typeof handle === 'string' ? el.querySelector(handle) : handle;
      if (!h || !target || !h.contains(target)) return;
    }
    if (target && target !== el && target.closest(INTERACTIVE)) return;
    pressed = true;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    locked = null;
    lastEvent = e;
    stopAnimations();
    originX = x;
    originY = y;
    tx.reset();
    ty.reset();
    tx.add(x);
    ty.add(y);
    measureBounds();
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    lastEvent = e;
    if (!dragging) {
      const threshold = opts.threshold ?? 3;
      if (Math.hypot(dx, dy) < threshold) return;
      const axis = opts.axis ?? 'both';
      // Let the page scroll if the gesture goes along the axis we don't handle.
      if (axis === 'x' && Math.abs(dy) > Math.abs(dx) && e.pointerType === 'touch')
        return endPress();
      if (axis === 'y' && Math.abs(dx) > Math.abs(dy) && e.pointerType === 'touch')
        return endPress();
      if (opts.lockDirection) locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      dragging = true;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* element may have been detached */
      }
      el.dataset.vzDragging = '';
      if (opts.cursor !== false) document.documentElement.style.cursor = 'grabbing';
      document.documentElement.style.userSelect = 'none';
      opts.onStart?.(state());
    }
    e.preventDefault();
    const elastic = opts.elastic ?? 0.35;
    if (axisAllows('x'))
      x = rubberbandClamp(originX + dx, bounds.left, bounds.right, size.w, elastic);
    if (axisAllows('y'))
      y = rubberbandClamp(originY + dy, bounds.top, bounds.bottom, size.h, elastic);
    const t = now();
    tx.add(x, t);
    ty.add(y, t);
    if (opts.rotate) rot.set(clamp(tx.get(t) / 60, -opts.rotate, opts.rotate));
    if (opts.stretch) {
      const k = opts.stretch / 6000;
      const ax = Math.min(Math.abs(tx.get(t)) * k, 0.25);
      const ay = Math.min(Math.abs(ty.get(t)) * k, 0.25);
      sx.set(1 + ax - ay * 0.5);
      sy.set(1 + ay - ax * 0.5);
    }
    render();
    opts.onMove?.(state());
  };

  const endPress = () => {
    pressed = false;
    pointerId = -1;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
  };

  const onPointerUp = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    const wasDragging = dragging;
    endPress();
    if (!wasDragging) return;
    lastEvent = e;
    dragging = false;
    delete el.dataset.vzDragging;
    document.documentElement.style.cursor = '';
    document.documentElement.style.userSelect = '';
    // Swallow the click that follows a drag.
    const swallow = (ev: Event) => {
      ev.stopPropagation();
      ev.preventDefault();
    };
    el.addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => el.removeEventListener('click', swallow, { capture: true }), 0);
    const vx = axisAllows('x') ? tx.get() : 0;
    const vy = axisAllows('y') ? ty.get() : 0;
    const s = state();
    s.vx = vx;
    s.vy = vy;
    if (opts.onEnd?.(s) === false) return;
    release(vx, vy);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const step = opts.keyboard ?? 16;
    if (step === false || !enabled || e.target !== el) return;
    const mult = e.shiftKey ? 4 : 1;
    let dx = 0;
    let dy = 0;
    if (e.key === 'ArrowLeft') dx = -1;
    else if (e.key === 'ArrowRight') dx = 1;
    else if (e.key === 'ArrowUp') dy = -1;
    else if (e.key === 'ArrowDown') dy = 1;
    else return;
    if ((dx && !axisAllows('x')) || (dy && !axisAllows('y'))) return;
    e.preventDefault();
    lastEvent = e;
    measureBounds();
    const next = (axis: 'x' | 'y', cur: number, dir: number) => {
      const snap = axis === 'x' ? opts.snap?.x : opts.snap?.y;
      const min = axis === 'x' ? bounds.left : bounds.top;
      const max = axis === 'x' ? bounds.right : bounds.bottom;
      if (Array.isArray(snap) && snap.length) {
        const sorted = [...(snap as number[])].sort((a, b) => a - b);
        const n =
          dir > 0
            ? sorted.find((p) => p > cur + 0.5)
            : [...sorted].reverse().find((p) => p < cur - 0.5);
        return clamp(n ?? cur, min, max);
      }
      return clamp(cur + dir * step * mult, min, max);
    };
    controls.setPosition({
      ...(dx ? { x: next('x', x, dx) } : {}),
      ...(dy ? { y: next('y', y, dy) } : {}),
    });
  };

  const applyStyles = () => {
    const axis = opts.axis ?? 'both';
    el.style.touchAction = axis === 'x' ? 'pan-y' : axis === 'y' ? 'pan-x' : 'none';
    if (opts.cursor !== false && !opts.handle) el.style.cursor = enabled ? 'grab' : '';
  };

  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('keydown', onKeyDown);
  // Prevent native image / link dragging from hijacking the gesture.
  const onDragStart = (e: Event) => e.preventDefault();
  el.addEventListener('dragstart', onDragStart);
  applyStyles();

  const controls: DragControls = {
    get x() {
      return x;
    },
    get y() {
      return y;
    },
    get dragging() {
      return dragging;
    },
    setPosition(pos, { animate = true, velocity } = {}) {
      stopAnimations();
      if (!animate || prefersReducedMotion()) {
        if (pos.x !== undefined) x = pos.x;
        if (pos.y !== undefined) y = pos.y;
        render();
        return;
      }
      if (pos.x !== undefined) animX = springAxis('x', pos.x, velocity?.x ?? 0);
      if (pos.y !== undefined) animY = springAxis('y', pos.y, velocity?.y ?? 0);
    },
    fling(velocity) {
      measureBounds();
      release(velocity.x ?? 0, velocity.y ?? 0);
    },
    update(next) {
      opts = { ...opts, ...next };
      applyStyles();
    },
    enable() {
      enabled = true;
      applyStyles();
    },
    disable() {
      enabled = false;
      endPress();
      applyStyles();
    },
    destroy() {
      endPress();
      stopAnimations();
      rot.stop();
      sx.stop();
      sy.stop();
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('keydown', onKeyDown);
      el.removeEventListener('dragstart', onDragStart);
      el.style.touchAction = '';
      el.style.cursor = '';
      if (dragging) {
        document.documentElement.style.cursor = '';
        document.documentElement.style.userSelect = '';
      }
    },
  };
  return controls;
}
