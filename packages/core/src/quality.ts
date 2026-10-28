import { isBrowser } from './env';

/**
 * Adaptive quality: Vizzele watches how long real frames take and, when the device can't keep
 * up, asks the heavy effects (WebGL backgrounds, particles) to render less — fewer pixels, fewer
 * solver steps — instead of dropping frames. Every effect stays on; it just gets cheaper.
 *
 * Quality is a number in [MIN_QUALITY, 1]. It only steps down after sustained slow frames and
 * climbs back slowly, so it never flickers between levels.
 */
export const MIN_QUALITY = 0.4;
const STEPS = [1, 0.75, 0.55, MIN_QUALITY];
/** A window is "slow" above this average frame time (≈ under 45 fps). */
const SLOW_MS = 22;
/** …and "fast" below this one (≈ a steady 60 fps or better). */
const FAST_MS = 17.5;
const WINDOW_MS = 1000;

let step = 0;
let locked: number | null = null;
let windowTime = 0;
let windowFrames = 0;
let slowWindows = 0;
let fastWindows = 0;
let downgrades = 0;
const listeners = new Set<(quality: number) => void>();

const current = () => locked ?? STEPS[step]!;

function apply(next: number) {
  if (next === step) return;
  step = next;
  if (isBrowser) document.documentElement.dataset.vzQuality = step >= 2 ? 'low' : 'high';
  listeners.forEach((l) => l(current()));
}

/** Current render quality, 1 = full. Effects multiply their resolution / workload by it. */
export function getQuality(): number {
  return current();
}

/** Subscribes to quality changes. Returns an unsubscribe function. */
export function onQualityChange(cb: (quality: number) => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/**
 * Pins the quality (`0.4`–`1`) or hands it back to the automatic governor with `'auto'`.
 * Handy for a "battery saver" toggle, or to keep full quality on a kiosk.
 */
export function setQuality(value: number | 'auto') {
  const before = current();
  locked = value === 'auto' ? null : Math.min(1, Math.max(MIN_QUALITY, value));
  slowWindows = fastWindows = 0;
  if (current() !== before) listeners.forEach((l) => l(current()));
}

/**
 * Fed by the shared frame loop with the real time between two consecutive frames.
 * @internal
 */
export function sampleFrame(ms: number) {
  if (locked !== null || ms <= 0 || ms > 250) return;
  windowTime += ms;
  windowFrames++;
  if (windowTime < WINDOW_MS) return;
  const avg = windowTime / windowFrames;
  windowTime = windowFrames = 0;
  if (avg > SLOW_MS) {
    fastWindows = 0;
    // Two slow seconds in a row before giving anything up.
    if (++slowWindows >= 2 && step < STEPS.length - 1) {
      slowWindows = 0;
      downgrades++;
      apply(step + 1);
    }
  } else if (avg < FAST_MS) {
    slowWindows = 0;
    // Climbing back is slower each time it had to step down, so it settles instead of bouncing.
    if (++fastWindows >= 4 + downgrades * 4 && step > 0) {
      fastWindows = 0;
      apply(step - 1);
    }
  } else {
    slowWindows = fastWindows = 0;
  }
}

/** Forgets the measured history (the loop calls it when it wakes up after sleeping). @internal */
export function resetFrameSamples() {
  windowTime = windowFrames = 0;
}
