import { frame } from './scheduler';
import { prefersReducedMotion } from './motion';

export interface SpringConfig {
  /** How strongly the spring pulls toward its target. Higher = faster. Default 170. */
  stiffness?: number;
  /** Friction. Lower = more bounce. Default 26. */
  damping?: number;
  /** Weight of the animated object. Higher = more sluggish and more overshoot. Default 1. */
  mass?: number;
  /** Distance to the target under which the spring may rest. Default 0.01. */
  restDelta?: number;
  /** Speed (units/s) under which the spring may rest. Default 0.01. */
  restSpeed?: number;
}

export type ResolvedSpringConfig = Required<SpringConfig>;

export const defaultSpring: ResolvedSpringConfig = {
  stiffness: 170,
  damping: 26,
  mass: 1,
  restDelta: 0.01,
  restSpeed: 0.01,
};

/** Hand-tuned springs that define how Vizzele moves. */
export const springs = {
  /** The signature Vizzele feel. Quick, with a hint of overshoot. */
  liquid: { stiffness: 210, damping: 20, mass: 1 },
  /** Soft and slow, for large surfaces. */
  gentle: { stiffness: 120, damping: 22, mass: 1 },
  /** Wobbly like gelatine. */
  jelly: { stiffness: 260, damping: 11, mass: 1 },
  /** Tight and responsive, for small controls. */
  snappy: { stiffness: 520, damping: 34, mass: 1 },
  /** Heavy object with momentum. */
  heavy: { stiffness: 140, damping: 24, mass: 2.4 },
  /** Playful bounce. */
  bouncy: { stiffness: 320, damping: 14, mass: 1 },
  /** No visible overshoot. */
  smooth: { stiffness: 170, damping: 28, mass: 1 },
} as const satisfies Record<string, SpringConfig>;

export type SpringPreset = keyof typeof springs;

export const resolveSpring = (config?: SpringConfig | SpringPreset): ResolvedSpringConfig => {
  const c: SpringConfig | undefined = typeof config === 'string' ? springs[config] : config;
  const out = { ...defaultSpring };
  if (c) {
    for (const key of Object.keys(c) as (keyof SpringConfig)[]) {
      const v = c[key];
      if (typeof v === 'number' && Number.isFinite(v)) out[key] = v;
    }
  }
  return out;
};

/**
 * Closed-form solution of a damped harmonic oscillator.
 * Given the displacement from the target and velocity, returns both after `t` seconds.
 * Being analytic, it is exact for any frame length — no integration drift.
 */
export function solveSpring(
  displacement: number,
  velocity: number,
  t: number,
  config: ResolvedSpringConfig,
): [position: number, velocity: number] {
  const k = Math.max(config.stiffness, 1e-6);
  const m = Math.max(config.mass, 1e-6);
  const c = Math.max(config.damping, 0);
  const w0 = Math.sqrt(k / m);
  const zeta = c / (2 * Math.sqrt(k * m));
  const x0 = displacement;
  const v0 = velocity;

  if (Math.abs(zeta - 1) < 1e-6) {
    const B = v0 + w0 * x0;
    const e = Math.exp(-w0 * t);
    return [e * (x0 + B * t), e * (B - w0 * (x0 + B * t))];
  }
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    const a = zeta * w0;
    const B = (v0 + a * x0) / wd;
    const e = Math.exp(-a * t);
    const cos = Math.cos(wd * t);
    const sin = Math.sin(wd * t);
    return [e * (x0 * cos + B * sin), e * ((-a * x0 + B * wd) * cos + (-a * B - x0 * wd) * sin)];
  }
  const s = Math.sqrt(zeta * zeta - 1);
  const r1 = -w0 * (zeta - s);
  const r2 = -w0 * (zeta + s);
  const C2 = (v0 - r1 * x0) / (r2 - r1);
  const C1 = x0 - C2;
  const e1 = Math.exp(r1 * t);
  const e2 = Math.exp(r2 * t);
  return [C1 * e1 + C2 * e2, r1 * C1 * e1 + r2 * C2 * e2];
}

/** Estimated time (seconds) for a spring released from rest at distance 1 to settle. */
export function springDuration(config?: SpringConfig | SpringPreset, maxSeconds = 10): number {
  const c = resolveSpring(config);
  const step = 1 / 240;
  let settledAt = -1;
  for (let t = 0; t < maxSeconds; t += step) {
    const [x, v] = solveSpring(1, 0, t, c);
    if (Math.abs(x) < 0.001 && Math.abs(v) < 0.01) {
      if (settledAt < 0) settledAt = t;
      if (t - settledAt > 0.05) return settledAt;
    } else settledAt = -1;
  }
  return maxSeconds;
}

/**
 * Converts a spring into a CSS `linear()` easing + duration, so the same physics can
 * be used from plain CSS transitions.
 */
export function springToCss(
  config?: SpringConfig | SpringPreset,
  samples = 40,
): { easing: string; duration: number } {
  const c = resolveSpring(config);
  const duration = springDuration(c);
  const points: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * duration;
    const [x] = solveSpring(-1, 0, t, c);
    points.push(String(Math.round((1 + x) * 1000) / 1000));
  }
  return { easing: `linear(${points.join(', ')})`, duration: Math.round(duration * 1000) };
}

export interface SpringOptions extends SpringConfig {
  /** Initial value. Default 0. */
  from?: number;
  /** Initial velocity in units per second. */
  velocity?: number;
  /** Jump instead of animating when the user prefers reduced motion. Default true. */
  respectReducedMotion?: boolean;
  onUpdate?: (value: number, spring: Spring) => void;
  onRest?: (value: number, spring: Spring) => void;
}

export interface SpringSetOptions {
  velocity?: number;
  config?: SpringConfig | SpringPreset;
}

/**
 * An animatable number driven by a physical spring.
 *
 *     const x = new Spring({ from: 0, onUpdate: (v) => (el.style.translate = `${v}px`) });
 *     x.set(200);                     // animate to 200
 *     x.set(0, { velocity: -2000 });  // throw it back
 */
export class Spring {
  value: number;
  velocity: number;
  target: number;
  config: ResolvedSpringConfig;
  private opts: SpringOptions;
  private unsubscribe: (() => void) | null = null;

  constructor(options: SpringOptions = {}) {
    this.opts = options;
    this.value = options.from ?? 0;
    this.target = this.value;
    this.velocity = options.velocity ?? 0;
    this.config = resolveSpring(options);
  }

  get isAnimating(): boolean {
    return this.unsubscribe !== null;
  }

  /** Animates toward `target`. */
  set(target: number, options: SpringSetOptions = {}): this {
    this.target = target;
    if (options.velocity !== undefined) this.velocity = options.velocity;
    if (options.config) this.config = resolveSpring(options.config);
    if (this.opts.respectReducedMotion !== false && prefersReducedMotion()) {
      return this.jump(target);
    }
    this.start();
    return this;
  }

  /** Moves immediately to `value` with no animation, and stops. */
  jump(value: number): this {
    const wasAnimating = this.isAnimating;
    this.stop();
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.opts.onUpdate?.(value, this);
    if (wasAnimating) this.opts.onRest?.(value, this);
    return this;
  }

  /** Adds velocity (units/s) — a "kick" that the spring absorbs. */
  impulse(velocity: number): this {
    if (this.opts.respectReducedMotion !== false && prefersReducedMotion()) return this;
    this.velocity += velocity;
    this.start();
    return this;
  }

  setConfig(config: SpringConfig | SpringPreset): this {
    const next = typeof config === 'string' ? config : config;
    this.config = { ...this.config, ...resolveSpring(next) };
    return this;
  }

  stop(): this {
    this.unsubscribe?.();
    this.unsubscribe = null;
    return this;
  }

  /** Advances the simulation by `dt` seconds. Returns false once at rest. */
  step(dt: number): boolean {
    const [x, v] = solveSpring(this.value - this.target, this.velocity, dt, this.config);
    this.value = this.target + x;
    this.velocity = v;
    const resting = Math.abs(x) < this.config.restDelta && Math.abs(v) < this.config.restSpeed;
    if (resting) {
      this.value = this.target;
      this.velocity = 0;
    }
    this.opts.onUpdate?.(this.value, this);
    return !resting;
  }

  private start() {
    if (this.unsubscribe) return;
    const tick = ({ delta }: { delta: number }) => {
      const alive = this.step(delta);
      if (!alive) {
        this.unsubscribe = null;
        this.opts.onRest?.(this.value, this);
      }
      return alive;
    };
    this.unsubscribe = frame.add(tick, 'update');
  }
}

export type SpringValues<K extends string> = Record<K, number>;

export interface SpringGroupOptions<K extends string> extends SpringConfig {
  respectReducedMotion?: boolean;
  /** Called at most once per frame (in the render phase) with all values. */
  onUpdate?: (values: Readonly<SpringValues<K>>) => void;
  onRest?: (values: Readonly<SpringValues<K>>) => void;
}

export interface SpringGroup<K extends string> {
  springs: Record<K, Spring>;
  readonly values: Readonly<SpringValues<K>>;
  readonly isAnimating: boolean;
  set(
    targets: Partial<SpringValues<K>>,
    options?: { velocity?: Partial<SpringValues<K>>; config?: SpringConfig | SpringPreset },
  ): void;
  jump(targets: Partial<SpringValues<K>>): void;
  impulse(velocity: Partial<SpringValues<K>>): void;
  setConfig(config: SpringConfig | SpringPreset): void;
  stop(): void;
}

/**
 * Several springs that animate together and report once per frame.
 *
 *     const pos = createSprings({ x: 0, y: 0 }, { onUpdate: ({ x, y }) => … });
 *     pos.set({ x: 100, y: 40 });
 */
export function createSprings<K extends string>(
  initial: SpringValues<K>,
  options: SpringGroupOptions<K> = {},
): SpringGroup<K> {
  const keys = Object.keys(initial) as K[];
  const values = { ...initial };
  const flush = () => options.onUpdate?.(values);
  const map = {} as Record<K, Spring>;
  for (const key of keys) {
    map[key] = new Spring({
      ...options,
      from: initial[key],
      onUpdate: (v) => {
        values[key] = v;
        frame.once(flush, 'render');
      },
      onRest: () => {
        if (keys.every((k) => !map[k].isAnimating)) options.onRest?.(values);
      },
    });
  }

  return {
    springs: map,
    get values() {
      return values;
    },
    get isAnimating() {
      return keys.some((k) => map[k].isAnimating);
    },
    set(targets, opts = {}) {
      for (const key of Object.keys(targets) as K[]) {
        const t = targets[key];
        if (t === undefined) continue;
        const v = opts.velocity?.[key];
        map[key].set(t, {
          ...(v !== undefined ? { velocity: v } : {}),
          ...(opts.config ? { config: opts.config } : {}),
        });
      }
    },
    jump(targets) {
      for (const key of Object.keys(targets) as K[]) {
        const t = targets[key];
        if (t !== undefined) map[key].jump(t);
      }
      flush();
    },
    impulse(velocity) {
      for (const key of Object.keys(velocity) as K[]) {
        const v = velocity[key];
        if (v !== undefined) map[key].impulse(v);
      }
    },
    setConfig(config) {
      for (const key of keys) map[key].setConfig(config);
    },
    stop() {
      for (const key of keys) map[key].stop();
    },
  };
}
