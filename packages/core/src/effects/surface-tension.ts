import { isBrowser } from '../env';
import { prefersReducedMotion } from '../motion';
import { onPointerMove } from '../pointer';
import { gooFilter, stepSpring } from './goo';
import { inertInstance, type EffectInstance } from './types';

export interface SurfaceTensionOptions {
  /** Which children become drops. Default: every direct child. */
  selector?: string;
  /** How close (px) the pointer must be before drops start reaching for it. Default 90. */
  reach?: number;
  /** Radius of the droplet that follows the pointer. 0 disables it. Default 16. */
  droplet?: number;
}

interface Drop {
  item: HTMLElement;
  el: HTMLElement;
  grow: { x: number; v: number };
  dx: { x: number; v: number };
  dy: { x: number; v: number };
}

interface Neck {
  el: HTMLElement;
  r: { x: number; v: number };
}

let uid = 0;

/**
 * Items behave like drops of liquid sitting on a surface. Bring the pointer close and they
 * lean toward it; between two neighbours a meniscus forms and they fuse into one shape;
 * a droplet follows your pointer and merges with whatever it touches. Press an item and it
 * swells. The shapes live in a filtered layer behind the items, so content stays crisp.
 */
export function surfaceTension(
  container: HTMLElement,
  options: SurfaceTensionOptions = {},
): EffectInstance<SurfaceTensionOptions> {
  if (!isBrowser) return inertInstance();
  let opts = options;
  const restore = { position: container.style.position, isolation: container.style.isolation };
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
  container.style.isolation = 'isolate';
  container.classList.add('vz-tension');

  const layer = document.createElement('div');
  layer.className = 'vz-tension-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.style.filter = gooFilter(`vz-goo-tension-${uid++}`, 7, 22);
  container.prepend(layer);

  const items = Array.from(
    opts.selector
      ? container.querySelectorAll<HTMLElement>(opts.selector)
      : (Array.from(container.children).filter((c) => c !== layer) as HTMLElement[]),
  );
  const drops: Drop[] = items.map((item) => {
    item.classList.add('vz-tension-item');
    const el = document.createElement('i');
    el.className = 'vz-tension-drop';
    layer.appendChild(el);
    return { item, el, grow: { x: 0, v: 0 }, dx: { x: 0, v: 0 }, dy: { x: 0, v: 0 } };
  });
  const necks: Neck[] = drops.slice(1).map(() => {
    const el = document.createElement('i');
    el.className = 'vz-tension-neck';
    layer.appendChild(el);
    return { el, r: { x: 0, v: 0 } };
  });
  const droplet = document.createElement('i');
  droplet.className = 'vz-tension-droplet';
  layer.appendChild(droplet);
  const dp = { x: { x: 0, v: 0 }, y: { x: 0, v: 0 }, r: { x: 0, v: 0 } };

  let pointer: { x: number; y: number } | null = null;
  const pressed = new Set<HTMLElement>();
  let raf = 0;
  let last = 0;

  const box = () => container.getBoundingClientRect();
  const rel = (el: HTMLElement, c: DOMRect) => {
    const r = el.getBoundingClientRect();
    return { l: r.left - c.left, t: r.top - c.top, r: r.right - c.left, b: r.bottom - c.top };
  };

  const tick = (now: number) => {
    raf = 0;
    const dt = Math.min(0.032, (now - (last || now)) / 1000) || 1 / 60;
    last = now;
    const reach = opts.reach ?? 90;
    const reduced = prefersReducedMotion();
    const c = box();
    let moving = false;
    const rects = drops.map((d) => rel(d.item, c));

    drops.forEach((d, i) => {
      const r = rects[i]!;
      let pull = 0;
      let ax = 0;
      let ay = 0;
      if (pointer && !reduced) {
        const cx = Math.max(r.l, Math.min(pointer.x, r.r));
        const cy = Math.max(r.t, Math.min(pointer.y, r.b));
        const dist = Math.hypot(pointer.x - cx, pointer.y - cy);
        pull = Math.max(0, 1 - dist / reach);
        const mx = (r.l + r.r) / 2;
        const my = (r.t + r.b) / 2;
        const len = Math.hypot(pointer.x - mx, pointer.y - my) || 1;
        ax = ((pointer.x - mx) / len) * pull * 5;
        ay = ((pointer.y - my) / len) * pull * 5;
      }
      const swell = (pressed.has(d.item) ? 7 : 0) + pull * 3;
      moving = stepSpring(d.grow, swell, dt, 260, 14) || moving;
      moving = stepSpring(d.dx, ax, dt, 200, 16) || moving;
      moving = stepSpring(d.dy, ay, dt, 200, 16) || moving;
      const g = d.grow.x;
      const radius = parseFloat(getComputedStyle(d.item).borderTopLeftRadius) || 0;
      Object.assign(d.el.style, {
        transform: `translate(${r.l - g + d.dx.x}px, ${r.t - g + d.dy.x}px)`,
        width: `${r.r - r.l + g * 2}px`,
        height: `${r.b - r.t + g * 2}px`,
        borderRadius: `${radius + g}px`,
      });
    });

    // A neck sits in the gap between neighbours; the closer the pointer, the fatter it gets,
    // until the goo filter fuses the two drops into one.
    necks.forEach((n, i) => {
      const a = rects[i]!;
      const b = rects[i + 1]!;
      const horizontal = Math.abs((a.t + a.b) / 2 - (b.t + b.b) / 2) < (a.b - a.t) / 2;
      const mx = horizontal ? (a.r + b.l) / 2 : (Math.max(a.l, b.l) + Math.min(a.r, b.r)) / 2;
      const my = horizontal ? (Math.max(a.t, b.t) + Math.min(a.b, b.b)) / 2 : (a.b + b.t) / 2;
      const gap = horizontal ? b.l - a.r : b.t - a.b;
      const thick = horizontal ? Math.min(a.b - a.t, b.b - b.t) : Math.min(a.r - a.l, b.r - b.l);
      let goal = 0;
      if (pointer && !reduced && gap < reach) {
        const near = Math.max(0, 1 - Math.hypot(pointer.x - mx, pointer.y - my) / reach);
        goal = near * Math.min(thick * 0.42, gap / 2 + thick * 0.3);
      }
      moving = stepSpring(n.r, goal, dt, 180, 13) || moving;
      const rr = Math.max(0, n.r.x);
      Object.assign(n.el.style, {
        transform: `translate(${mx - rr}px, ${my - rr}px)`,
        width: `${rr * 2}px`,
        height: `${rr * 2}px`,
      });
    });

    const size = opts.droplet ?? 16;
    const show = pointer && !reduced && size > 0;
    if (pointer) {
      moving = stepSpring(dp.x, pointer.x, dt, 320, 24) || moving;
      moving = stepSpring(dp.y, pointer.y, dt, 320, 24) || moving;
    }
    moving = stepSpring(dp.r, show ? size : 0, dt, 200, 16) || moving;
    const r = Math.max(0, dp.r.x);
    Object.assign(droplet.style, {
      transform: `translate(${dp.x.x - r}px, ${dp.y.x - r}px)`,
      width: `${r * 2}px`,
      height: `${r * 2}px`,
    });

    if (moving || pointer) raf = requestAnimationFrame(tick);
    else last = 0;
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const stopPointer = onPointerMove((p) => {
    const c = box();
    const reach = opts.reach ?? 90;
    // A finger that lifted is gone — don't leave the droplet where it last touched.
    const inside =
      p.active &&
      (p.type !== 'touch' || p.down) &&
      p.x > c.left - reach / 2 &&
      p.x < c.right + reach / 2 &&
      p.y > c.top - reach / 2 &&
      p.y < c.bottom + reach / 2;
    const was = pointer;
    pointer = inside ? { x: p.x - c.left, y: p.y - c.top } : null;
    if (pointer && !was) {
      // Enter: the droplet starts where the pointer is, not where it last was.
      dp.x.x = pointer.x;
      dp.y.x = pointer.y;
    }
    if (pointer || was) kick();
  });
  const onDown = (e: PointerEvent) => {
    const item = drops.find((d) => d.item.contains(e.target as Node))?.item;
    if (item) {
      pressed.add(item);
      kick();
    }
  };
  const onUp = () => {
    pressed.clear();
    kick();
  };
  container.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(kick) : null;
  ro?.observe(container);
  kick();

  return {
    update(next) {
      opts = { ...opts, ...next };
      kick();
    },
    destroy() {
      cancelAnimationFrame(raf);
      stopPointer();
      ro?.disconnect();
      container.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      items.forEach((i) => i.classList.remove('vz-tension-item'));
      layer.remove();
      container.classList.remove('vz-tension');
      container.style.position = restore.position;
      container.style.isolation = restore.isolation;
    },
  };
}
