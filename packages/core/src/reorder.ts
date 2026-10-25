import { isBrowser, noop } from './env';
import { rubberband } from './math';
import { prefersReducedMotion } from './motion';
import { Spring, resolveSpring, type SpringConfig, type SpringPreset } from './spring';
import { clearTransform, setTransform } from './transform';
import { VelocityTracker } from './velocity';

export interface ReorderOptions {
  /** Layout direction of the list. Default `'y'`. */
  axis?: 'x' | 'y';
  /** Selector for the items. Default: the container's direct children. */
  items?: string;
  /** Only start dragging from this selector inside an item. */
  handle?: string;
  /**
   * Move the DOM nodes on drop (vanilla usage). Set false when a framework renders the list
   * and you reorder your state in `onReorder`. Default true.
   */
  moveDom?: boolean;
  spring?: SpringConfig | SpringPreset;
  /** Scale of the lifted item. Default 1.03. */
  lift?: number;
  /** Called after an item moved. Update your data here. */
  onReorder?: (from: number, to: number) => void;
  onDragStart?: (index: number) => void;
  onDragEnd?: (from: number, to: number) => void;
  /** Screen-reader announcements. */
  announce?: {
    grab?: (index: number, total: number) => string;
    move?: (index: number, total: number) => string;
    drop?: (from: number, to: number, total: number) => string;
    cancel?: () => string;
  };
}

export interface ReorderInstance {
  update(options: Partial<ReorderOptions>): void;
  destroy(): void;
}

const INTERACTIVE = 'input, textarea, select, button, a, [contenteditable], [data-vz-no-drag]';

let liveRegion: HTMLElement | null = null;
function say(message: string) {
  if (!message) return;
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'assertive');
    liveRegion.className = 'vz-sr-only';
    Object.assign(liveRegion.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
      clip: 'rect(0 0 0 0)',
      whiteSpace: 'nowrap',
    });
    document.body.appendChild(liveRegion);
  }
  liveRegion.textContent = '';
  setTimeout(() => liveRegion && (liveRegion.textContent = message), 30);
}

/**
 * Drag to reorder a list. The other items flow out of the way with springs while you drag;
 * keyboard users press Space/Enter to grab, arrows to move, Space/Enter to drop, Escape to cancel.
 */
export function reorder(container: HTMLElement, options: ReorderOptions = {}): ReorderInstance {
  if (!isBrowser) return { update: noop, destroy: noop };
  let opts = options;
  const axis = () => opts.axis ?? 'y';
  const getItems = () =>
    (opts.items
      ? Array.from(container.querySelectorAll<HTMLElement>(opts.items))
      : (Array.from(container.children) as HTMLElement[])
    ).filter((el) => !el.hidden);

  // Gesture state
  let items: HTMLElement[] = [];
  let starts: number[] = [];
  let sizes: number[] = [];
  let gaps: number[] = [];
  let from = -1;
  let to = -1;
  let order: number[] = [];
  let dragged: HTMLElement | null = null;
  let pointerId = -1;
  let startPos = 0;
  let startCross = 0;
  let active = false;
  let committing = false;
  const springs = new Map<HTMLElement, Spring>();
  const tracker = new VelocityTracker();
  let keyboardGrab = -1;

  const springFor = (el: HTMLElement) => {
    let s = springs.get(el);
    if (!s) {
      s = new Spring({
        ...resolveSpring(opts.spring ?? 'liquid'),
        onUpdate: (v) => setTransform(el, 'reorder', axis() === 'y' ? { y: v } : { x: v }),
      });
      springs.set(el, s);
    }
    return s;
  };

  const measure = () => {
    items = getItems();
    const rects = items.map((el) => el.getBoundingClientRect());
    const y = axis() === 'y';
    // Remove any in-flight transform from the measurement.
    starts = rects.map((r, i) => (y ? r.top : r.left) - (springs.get(items[i]!)?.value ?? 0));
    sizes = rects.map((r) => (y ? r.height : r.width));
    gaps = starts.slice(0, -1).map((s, i) => starts[i + 1]! - (s + sizes[i]!));
  };

  /** Offset each item needs, for a given new order, to sit in its slot. */
  const offsetsFor = (newOrder: number[]) => {
    const offsets = new Array<number>(items.length).fill(0);
    let pos = starts[0] ?? 0;
    newOrder.forEach((orig, slot) => {
      offsets[orig] = pos - starts[orig]!;
      pos += sizes[orig]! + (gaps[slot] ?? gaps[gaps.length - 1] ?? 0);
    });
    return offsets;
  };

  const orderFor = (fromIdx: number, toIdx: number) => {
    const o = items.map((_, i) => i);
    o.splice(fromIdx, 1);
    o.splice(toIdx, 0, fromIdx);
    return o;
  };

  const layoutOthers = () => {
    const offsets = offsetsFor(order);
    items.forEach((el, i) => {
      if (i !== from) springFor(el).set(offsets[i]!);
    });
  };

  const clearAll = () => {
    for (const [el, s] of springs) {
      s.stop();
      s.jump(0);
      clearTransform(el, 'reorder');
      clearTransform(el, 'reorder-lift');
    }
    springs.clear();
  };

  /** Applies the new order to the DOM / the app, then removes every transform in the same tick. */
  const commit = (f: number, t: number) => {
    committing = true;
    if (f !== t) {
      if (opts.moveDom !== false) {
        const el = items[f]!;
        const ref = t > f ? items[t]!.nextSibling : items[t]!;
        el.parentNode?.insertBefore(el, ref);
      }
      opts.onReorder?.(f, t);
    }
    clearAll();
    committing = false;
  };

  const lift = (el: HTMLElement, on: boolean) => {
    el.toggleAttribute('data-vz-dragging', on);
    el.style.zIndex = on ? '10' : '';
    el.style.position ||= 'relative';
    setTransform(el, 'reorder-lift', { scale: on ? (opts.lift ?? 1.03) : 1 });
  };

  // ——— Pointer ———
  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0 || active || keyboardGrab >= 0) return;
    const target = e.target as Element;
    const list = getItems();
    const item = list.find((el) => el.contains(target));
    if (!item) return;
    if (opts.handle && !target.closest(opts.handle)) return;
    if (!opts.handle && target.closest(INTERACTIVE) && target !== item) return;
    measure();
    from = items.indexOf(item);
    to = from;
    order = items.map((_, i) => i);
    dragged = item;
    pointerId = e.pointerId;
    startPos = axis() === 'y' ? e.clientY : e.clientX;
    startCross = axis() === 'y' ? e.clientX : e.clientY;
    tracker.reset();
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerId !== pointerId || !dragged) return;
    const pos = axis() === 'y' ? e.clientY : e.clientX;
    const cross = axis() === 'y' ? e.clientX : e.clientY;
    const delta = pos - startPos;
    if (!active) {
      if (Math.abs(delta) < 4 && Math.abs(cross - startCross) < 4) return;
      // On touch, a mostly-sideways gesture is a scroll attempt — let it go.
      if (e.pointerType === 'touch' && Math.abs(cross - startCross) > Math.abs(delta))
        return cleanupPointer();
      active = true;
      try {
        dragged.setPointerCapture(e.pointerId);
      } catch {
        /* detached */
      }
      lift(dragged, true);
      document.documentElement.style.userSelect = 'none';
      opts.onDragStart?.(from);
    }
    e.preventDefault();
    tracker.add(delta);
    // Keep the item within the list, with rubber-band resistance past its ends.
    const min = starts[0]! - starts[from]!;
    const last = items.length - 1;
    const max = starts[last]! + sizes[last]! - sizes[from]! - starts[from]!;
    let d = delta;
    if (d < min) d = min + rubberband(d - min, sizes[from]!, 0.4);
    if (d > max) d = max + rubberband(d - max, sizes[from]!, 0.4);
    const crossOffset = rubberband(cross - startCross, 200, 0.12);
    springFor(dragged).jump(d);
    setTransform(
      dragged,
      'reorder',
      axis() === 'y' ? { y: d, x: crossOffset } : { x: d, y: crossOffset },
    );

    // New index: how many other items' centers the dragged center has passed.
    const center = starts[from]! + d + sizes[from]! / 2;
    let next = 0;
    items.forEach((_, i) => {
      if (i !== from && starts[i]! + sizes[i]! / 2 < center) next++;
    });
    if (next !== to) {
      to = next;
      order = orderFor(from, to);
      layoutOthers();
    }
  };

  const cleanupPointer = () => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    pointerId = -1;
    if (!active) dragged = null;
  };

  const onPointerUp = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    cleanupPointer();
    if (!active || !dragged) return;
    active = false;
    document.documentElement.style.userSelect = '';
    const el = dragged;
    const f = from;
    const t = to;
    setTransform(el, 'reorder', axis() === 'y' ? { x: 0 } : { y: 0 });
    lift(el, false);
    const target = offsetsFor(order)[f]!;
    const s = springFor(el);
    const done = () => {
      dragged = null;
      opts.onDragEnd?.(f, t);
      commit(f, t);
    };
    if (prefersReducedMotion()) return done();
    s.set(target, { velocity: tracker.get() });
    // Commit once the item has visually landed.
    const wait = () => {
      if (!s.isAnimating || Math.abs(s.value - target) < 0.5) done();
      else requestAnimationFrame(wait);
    };
    requestAnimationFrame(wait);
  };

  // ——— Keyboard ———
  const flipMove = (f: number, t: number) => {
    measure();
    const before = items.map((el) => el.getBoundingClientRect());
    commit(f, t);
    const after = getItems();
    const y = axis() === 'y';
    after.forEach((el) => {
      const i = items.indexOf(el);
      if (i < 0) return;
      const now = el.getBoundingClientRect();
      const delta = y ? before[i]!.top - now.top : before[i]!.left - now.left;
      if (!delta || prefersReducedMotion()) return;
      const s = springFor(el);
      s.jump(delta);
      s.set(0);
    });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const list = getItems();
    const item = list.find((el) => el === e.target);
    if (!item) return;
    const idx = list.indexOf(item);
    const total = list.length;
    const a = opts.announce ?? {};
    const prev = axis() === 'y' ? 'ArrowUp' : 'ArrowLeft';
    const next = axis() === 'y' ? 'ArrowDown' : 'ArrowRight';
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (keyboardGrab < 0) {
        keyboardGrab = idx;
        item.setAttribute('aria-grabbed', 'true');
        lift(item, true);
        say(
          a.grab?.(idx, total) ??
            `Grabbed item ${idx + 1} of ${total}. Use the arrow keys to move, Space to drop.`,
        );
      } else {
        item.setAttribute('aria-grabbed', 'false');
        lift(item, false);
        say(a.drop?.(keyboardGrab, idx, total) ?? `Dropped at position ${idx + 1} of ${total}.`);
        opts.onDragEnd?.(keyboardGrab, idx);
        keyboardGrab = -1;
      }
      return;
    }
    if (keyboardGrab < 0) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      item.setAttribute('aria-grabbed', 'false');
      lift(item, false);
      if (idx !== keyboardGrab) flipMove(idx, keyboardGrab);
      keyboardGrab = -1;
      say(a.cancel?.() ?? 'Reorder cancelled.');
      return;
    }
    if (e.key !== prev && e.key !== next) return;
    e.preventDefault();
    const target = e.key === prev ? idx - 1 : idx + 1;
    if (target < 0 || target >= total) return;
    flipMove(idx, target);
    const moved = getItems()[target];
    if (moved) {
      if (document.activeElement !== moved) moved.focus();
      lift(moved, true);
    }
    say(a.move?.(target, total) ?? `Position ${target + 1} of ${total}.`);
  };

  container.addEventListener('pointerdown', onPointerDown);
  container.addEventListener('keydown', onKeyDown);
  const onDragStartNative = (e: Event) => e.preventDefault();
  container.addEventListener('dragstart', onDragStartNative);

  return {
    update(next) {
      opts = { ...opts, ...next };
    },
    destroy() {
      cleanupPointer();
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('keydown', onKeyDown);
      container.removeEventListener('dragstart', onDragStartNative);
      if (!committing) clearAll();
    },
  };
}
