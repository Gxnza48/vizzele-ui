import { isBrowser } from './env';

export type ReducedMotionSetting = 'system' | 'always' | 'never';

let setting: ReducedMotionSetting = 'system';
let mql: MediaQueryList | null = null;
const listeners = new Set<(reduced: boolean) => void>();

function query(): MediaQueryList | null {
  if (!isBrowser || typeof window.matchMedia !== 'function') return null;
  if (!mql) {
    mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const notify = () => listeners.forEach((l) => l(prefersReducedMotion()));
    mql.addEventListener?.('change', notify);
  }
  return mql;
}

/** Whether animations should be reduced, honoring both the OS setting and `setReducedMotion`. */
export function prefersReducedMotion(): boolean {
  if (setting === 'always') return true;
  if (setting === 'never') return false;
  return query()?.matches ?? false;
}

/** Overrides the OS preference globally — e.g. from a "reduce motion" toggle in your app. */
export function setReducedMotion(value: ReducedMotionSetting) {
  setting = value;
  const reduced = prefersReducedMotion();
  listeners.forEach((l) => l(reduced));
}

export function onReducedMotionChange(cb: (reduced: boolean) => void): () => void {
  query();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** True on devices whose primary pointer can't hover (phones, tablets). */
export function isCoarsePointer(): boolean {
  if (!isBrowser || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(hover: none), (pointer: coarse)').matches;
}

export type DeviceTier = 'low' | 'mid' | 'high';

/**
 * A rough guess of how much visual work the device can take.
 * Used to pick resolution and particle counts for WebGL effects.
 */
export function getDeviceTier(): DeviceTier {
  if (!isBrowser) return 'mid';
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  if (nav.connection?.saveData || prefersReducedMotion()) return 'low';
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  if (cores <= 2 || memory <= 2) return 'low';
  if (cores >= 8 && memory >= 8 && !isCoarsePointer()) return 'high';
  return 'mid';
}
