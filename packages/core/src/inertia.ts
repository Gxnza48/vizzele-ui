import { frame } from './scheduler';
import { prefersReducedMotion } from './motion';
import { resolveSpring, solveSpring, type SpringConfig, type SpringPreset } from './spring';

export interface InertiaOptions {
  from: number;
  /** Initial velocity, units/s. */
  velocity: number;
  /** How far a throw travels relative to its speed. Default 1. */
  power?: number;
  /** Decay time constant in seconds. Higher = glides longer. Default 0.4. */
  timeConstant?: number;
  /** Lower / upper limits. Crossing one hands the motion to a bouncing spring. */
  min?: number;
  max?: number;
  /** Spring used to bounce off a limit (or settle on a snapped target). */
  bounce?: SpringConfig | SpringPreset;
  /** Lets you change where the throw lands — e.g. snap to the nearest card. */
  modifyTarget?: (target: number) => number;
  onUpdate?: (value: number, velocity: number) => void;
  onComplete?: (value: number) => void;
}

export interface InertiaControls {
  stop(): void;
  readonly target: number;
  readonly isAnimating: boolean;
}

/** Where a throw would come to rest with no limits. */
export const projectInertia = (from: number, velocity: number, power = 1, timeConstant = 0.4) =>
  from + power * velocity * timeConstant;

/**
 * Exponential decay ("momentum scrolling") that hands over to a spring when it hits a limit.
 * This is what makes thrown cards glide and bounce off walls.
 */
export function inertia(options: InertiaOptions): InertiaControls {
  const {
    from,
    velocity,
    power = 1,
    timeConstant = 0.4,
    min = -Infinity,
    max = Infinity,
    bounce = { stiffness: 380, damping: 28 },
    modifyTarget,
    onUpdate,
    onComplete,
  } = options;
  const springCfg = resolveSpring(bounce);

  let target = projectInertia(from, velocity, power, timeConstant);
  if (modifyTarget) target = modifyTarget(target);

  const out = (v: number) => v < min || v > max;
  const nearestLimit = (v: number) => (v < min ? min : v > max ? max : v);

  let value = from;
  let vel = velocity;
  let done = false;

  if (prefersReducedMotion()) {
    const final = out(target) ? nearestLimit(target) : target;
    onUpdate?.(final, 0);
    onComplete?.(final);
    return { stop() {}, target: final, isAnimating: false };
  }

  // Phase 1: decay toward `target`. Phase 2: spring toward `springTarget`.
  let mode: 'decay' | 'spring' = 'decay';
  let springTarget = target;
  let t = 0;
  const amplitude = target - from;

  // Out of bounds already, or a snapped target: go straight to a spring, which feels
  // better than a decay that has to land exactly on a point.
  if (out(from)) {
    mode = 'spring';
    springTarget = nearestLimit(from);
  } else if (modifyTarget) {
    mode = 'spring';
    springTarget = out(target) ? nearestLimit(target) : target;
  }

  const tick = ({ delta }: { delta: number }) => {
    if (done) return false;
    if (mode === 'decay') {
      t += delta;
      const e = Math.exp(-t / timeConstant);
      value = target - amplitude * e;
      vel = (amplitude / timeConstant) * e;
      if (out(value)) {
        mode = 'spring';
        springTarget = nearestLimit(value);
      } else if (Math.abs(target - value) < 0.5) {
        value = target;
        onUpdate?.(value, 0);
        finish();
        return false;
      }
    } else {
      const [x, v] = solveSpring(value - springTarget, vel, delta, springCfg);
      value = springTarget + x;
      vel = v;
      if (Math.abs(x) < 0.05 && Math.abs(v) < 2) {
        value = springTarget;
        onUpdate?.(value, 0);
        finish();
        return false;
      }
    }
    onUpdate?.(value, vel);
    return true;
  };

  const finish = () => {
    done = true;
    onComplete?.(value);
  };

  const unsubscribe = frame.add(tick, 'update');
  return {
    stop() {
      done = true;
      unsubscribe();
    },
    get target() {
      return mode === 'spring' ? springTarget : target;
    },
    get isAnimating() {
      return !done;
    },
  };
}
