import { isBrowser } from './env';
import { clamp } from './math';
import { prefersReducedMotion } from './motion';
import { frame } from './scheduler';
import { VelocityTracker } from './velocity';

export interface PhysicsOptions {
  /** Gravity in px/s². Default `{ x: 0, y: 2000 }`. */
  gravity?: { x: number; y: number };
  /** Bounciness 0..1. Default 0.5. */
  restitution?: number;
  /** Air drag per second, 0..1. Default 0.08. */
  drag?: number;
  /** Rolling friction against walls, 0..1. Default 0.3. */
  friction?: number;
  /** Max throw speed in px/s. Default 4000. */
  maxSpeed?: number;
  /** Let the user grab and throw bodies. Default true. */
  interactive?: boolean;
  onSleep?: () => void;
}

export interface BodyOptions {
  /** Radius in px. Default: half of the element's width. */
  radius?: number;
  /** Mass. Default: proportional to area. */
  mass?: number;
  /** Starting position (center, px inside the container). Default: random in the top half. */
  x?: number;
  y?: number;
  /** Bodies can spin as they roll. Default true. */
  rotate?: boolean;
}

interface Body {
  el: HTMLElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  invMass: number;
  angle: number;
  rotate: boolean;
  dragging: boolean;
  grabX: number;
  grabY: number;
}

export interface PhysicsWorld {
  /** Adds an element as a circular body. It is positioned absolutely inside the container. */
  add(el: HTMLElement, options?: BodyOptions): void;
  remove(el: HTMLElement): void;
  /** Pushes every body away from (or toward, with negative strength) a point. */
  impulse(x: number, y: number, strength?: number, radius?: number): void;
  setGravity(gravity: { x: number; y: number }): void;
  /** Wakes the simulation (e.g. after resizing the container). */
  wake(): void;
  update(options: Partial<PhysicsOptions>): void;
  destroy(): void;
  readonly bodies: readonly { el: HTMLElement; x: number; y: number; vx: number; vy: number }[];
}

const STEP = 1 / 120;

/**
 * A small rigid-body world for DOM elements: circles with gravity, collisions, walls,
 * and grab-and-throw. The container is the box; bodies push each other around.
 * With reduced motion the world settles instantly and renders a still layout.
 */
export function createPhysicsWorld(
  container: HTMLElement,
  options: PhysicsOptions = {},
): PhysicsWorld {
  let opts = options;
  const bodies: Body[] = [];
  let width = 0;
  let height = 0;
  let running: (() => void) | null = null;
  let quiet = 0;
  let acc = 0;
  let grabbed: Body | null = null;
  const tx = new VelocityTracker(80);
  const ty = new VelocityTracker(80);

  const measure = () => {
    width = container.clientWidth;
    height = container.clientHeight;
  };
  if (isBrowser) {
    measure();
    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
  }

  const render = () => {
    for (const b of bodies) {
      b.el.style.transform = `translate3d(${(b.x - b.r).toFixed(2)}px, ${(b.y - b.r).toFixed(2)}px, 0) rotate(${b.angle.toFixed(2)}rad)`;
    }
  };

  const step = (dt: number) => {
    const g = opts.gravity ?? { x: 0, y: 2000 };
    const e = opts.restitution ?? 0.5;
    const airDrag = Math.pow(1 - (opts.drag ?? 0.08), dt);
    const friction = opts.friction ?? 0.3;
    for (const b of bodies) {
      if (b.dragging) continue;
      b.vx = (b.vx + g.x * dt) * airDrag;
      b.vy = (b.vy + g.y * dt) * airDrag;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      // Walls
      if (b.x - b.r < 0) {
        b.x = b.r;
        b.vx = Math.abs(b.vx) * e;
        b.vy *= 1 - friction * 0.2;
      } else if (b.x + b.r > width) {
        b.x = width - b.r;
        b.vx = -Math.abs(b.vx) * e;
        b.vy *= 1 - friction * 0.2;
      }
      if (b.y - b.r < 0) {
        b.y = b.r;
        b.vy = Math.abs(b.vy) * e;
      } else if (b.y + b.r > height) {
        b.y = height - b.r;
        b.vy = -Math.abs(b.vy) * e;
        if (Math.abs(b.vy) < 30) b.vy = 0;
        b.vx *= Math.pow(1 - friction, dt * 4);
      }
      if (b.rotate) b.angle += (b.vx / b.r) * dt;
    }
    // Collisions (n² — fine for the few dozen bodies a page shows)
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i]!;
      for (let j = i + 1; j < bodies.length; j++) {
        const b = bodies[j]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const min = a.r + b.r;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min || d2 === 0) continue;
        const d = Math.sqrt(d2);
        const nx = dx / d;
        const ny = dy / d;
        const ia = a.dragging ? 0 : a.invMass;
        const ib = b.dragging ? 0 : b.invMass;
        const sum = ia + ib;
        if (sum === 0) continue;
        const overlap = min - d;
        a.x -= nx * overlap * (ia / sum);
        a.y -= ny * overlap * (ia / sum);
        b.x += nx * overlap * (ib / sum);
        b.y += ny * overlap * (ib / sum);
        const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (rv > 0) continue;
        const j2 = (-(1 + e) * rv) / sum;
        a.vx -= j2 * ia * nx;
        a.vy -= j2 * ia * ny;
        b.vx += j2 * ib * nx;
        b.vy += j2 * ib * ny;
      }
    }
  };

  const energy = () => bodies.reduce((m, b) => Math.max(m, Math.abs(b.vx) + Math.abs(b.vy)), 0);

  const tick = ({ delta }: { delta: number }) => {
    acc += delta;
    while (acc >= STEP) {
      step(STEP);
      acc -= STEP;
    }
    render();
    if (!grabbed && energy() < 8) {
      quiet += delta;
      if (quiet > 0.6) {
        running = null;
        opts.onSleep?.();
        return false;
      }
    } else quiet = 0;
    return true;
  };

  const wake = () => {
    quiet = 0;
    if (prefersReducedMotion()) {
      // Settle instantly, render once.
      for (let i = 0; i < 600; i++) step(STEP);
      render();
      return;
    }
    if (!running) running = frame.add(tick, 'update');
  };

  // ——— Grab & throw ———
  const local = (e: PointerEvent) => {
    const r = container.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onDown = (e: PointerEvent) => {
    if (opts.interactive === false || e.button !== 0) return;
    const b = bodies.find((x) => x.el.contains(e.target as Node));
    if (!b) return;
    e.preventDefault();
    const p = local(e);
    grabbed = b;
    b.dragging = true;
    b.grabX = p.x - b.x;
    b.grabY = p.y - b.y;
    b.vx = b.vy = 0;
    tx.reset();
    ty.reset();
    tx.add(b.x);
    ty.add(b.y);
    b.el.toggleAttribute('data-vz-dragging', true);
    try {
      b.el.setPointerCapture(e.pointerId);
    } catch {
      /* detached */
    }
    wake();
  };
  const onMove = (e: PointerEvent) => {
    if (!grabbed) return;
    const p = local(e);
    const b = grabbed;
    b.x = clamp(p.x - b.grabX, b.r, width - b.r);
    b.y = clamp(p.y - b.grabY, b.r, height - b.r);
    tx.add(b.x);
    ty.add(b.y);
    // Velocity of the held body makes it push others realistically.
    b.vx = tx.get();
    b.vy = ty.get();
    wake();
  };
  const onUp = () => {
    if (!grabbed) return;
    const b = grabbed;
    const max = opts.maxSpeed ?? 4000;
    b.vx = clamp(tx.get(), -max, max);
    b.vy = clamp(ty.get(), -max, max);
    b.dragging = false;
    b.el.toggleAttribute('data-vz-dragging', false);
    grabbed = null;
    wake();
  };

  let ro: ResizeObserver | null = null;
  if (isBrowser) {
    container.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        measure();
        wake();
      });
      ro.observe(container);
    }
  }

  return {
    add(el, o = {}) {
      const r = o.radius ?? (el.offsetWidth || 40) / 2;
      el.style.position = 'absolute';
      el.style.left = '0';
      el.style.top = '0';
      el.style.touchAction = 'none';
      el.style.willChange = 'transform';
      bodies.push({
        el,
        r,
        x: o.x ?? r + Math.random() * Math.max(1, width - 2 * r),
        y: o.y ?? r + Math.random() * Math.max(1, height * 0.5 - 2 * r),
        vx: (Math.random() - 0.5) * 200,
        vy: 0,
        invMass: 1 / (o.mass ?? (r * r) / 400),
        angle: 0,
        rotate: o.rotate !== false,
        dragging: false,
        grabX: 0,
        grabY: 0,
      });
      render();
      wake();
    },
    remove(el) {
      const i = bodies.findIndex((b) => b.el === el);
      if (i >= 0) bodies.splice(i, 1);
    },
    impulse(x, y, strength = 1600, radius = 260) {
      for (const b of bodies) {
        const dx = b.x - x;
        const dy = b.y - y;
        const d = Math.hypot(dx, dy) || 1;
        if (d > radius) continue;
        const f = (1 - d / radius) * strength;
        b.vx += (dx / d) * f;
        b.vy += (dy / d) * f;
      }
      wake();
    },
    setGravity(g) {
      opts = { ...opts, gravity: g };
      wake();
    },
    wake,
    update(next) {
      opts = { ...opts, ...next };
      wake();
    },
    destroy() {
      running?.();
      running = null;
      ro?.disconnect();
      container.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    },
    get bodies() {
      return bodies;
    },
  };
}
