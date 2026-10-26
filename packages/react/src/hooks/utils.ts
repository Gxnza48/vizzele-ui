import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  version,
  type Ref,
  type RefCallback,
} from 'react';

/** useLayoutEffect on the client, useEffect on the server (no SSR warning). */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Keeps a ref pointing at the latest value, so callbacks never go stale. */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  useIsomorphicLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}

export function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

/** Combines several refs into one callback ref. */
export function useMergedRef<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((value: T | null) => refs.forEach((r) => setRef(r, value)), refs);
}

export const cx = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');

/**
 * Props that make an element inert. React 19 takes `inert` as a boolean; React 18 does not know
 * the attribute, drops `true` with a warning, and needs the empty string instead.
 */
const inertOn = (parseInt(version, 10) >= 19 ? true : '') as unknown as boolean;
export const inertProps = (on: boolean): { inert?: boolean } => (on ? { inert: inertOn } : {});
