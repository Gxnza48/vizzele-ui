import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Spring,
  createSprings,
  type SpringConfig,
  type SpringGroup,
  type SpringPreset,
  type SpringValues,
} from '@vizzele/core';
import { useLatest } from './utils';

export interface UseSpringOptions {
  config?: SpringConfig | SpringPreset;
  /** Called every frame with the value — write to a ref here to animate without re-rendering. */
  onUpdate?: (value: number) => void;
  onRest?: (value: number) => void;
}

/**
 * A spring that animates toward `target` whenever it changes. Returns the stable `Spring`
 * instance; read `spring.value` or animate the DOM from `onUpdate` (no React re-renders).
 *
 *     const x = useSpring(open ? 240 : 0, { onUpdate: (v) => (ref.current!.style.translate = `${v}px`) });
 */
export function useSpring(target: number, options: UseSpringOptions = {}): Spring {
  const latest = useLatest(options);
  const spring = useMemo(
    () =>
      new Spring({
        from: target,
        ...(typeof options.config === 'object' ? options.config : {}),
        onUpdate: (v) => latest.current.onUpdate?.(v),
        onRest: (v) => latest.current.onRest?.(v),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useEffect(() => {
    if (options.config) spring.setConfig(options.config);
  }, [spring, options.config]);
  useEffect(() => {
    spring.set(target);
  }, [spring, target]);
  useEffect(() => () => void spring.stop(), [spring]);
  return spring;
}

/**
 * Like `useSpring`, but re-renders with the animated value. Convenient for small things
 * (a number, a progress label); prefer `useSpring` + `onUpdate` for anything per-frame heavy.
 */
export function useSpringValue(target: number, config?: SpringConfig | SpringPreset): number {
  const [value, setValue] = useState(target);
  useSpring(target, { ...(config ? { config } : {}), onUpdate: setValue });
  return value;
}

/** Several springs animated together, reported once per frame. */
export function useSprings<K extends string>(
  initial: SpringValues<K>,
  options: {
    config?: SpringConfig | SpringPreset;
    onUpdate?: (v: Readonly<SpringValues<K>>) => void;
  } = {},
): SpringGroup<K> {
  const latest = useLatest(options);
  const group = useRef<SpringGroup<K> | null>(null);
  if (!group.current) {
    group.current = createSprings(initial, { onUpdate: (v) => latest.current.onUpdate?.(v) });
    if (options.config) group.current.setConfig(options.config);
  }
  useEffect(() => {
    const g = group.current;
    return () => g?.stop();
  }, []);
  return group.current;
}
