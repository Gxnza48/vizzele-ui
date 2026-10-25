/** True when running in a browser. Every DOM access in Vizzele is guarded by this. */
export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

export const now = (): number =>
  typeof performance !== 'undefined' ? performance.now() : Date.now();

export const noop = () => {};
