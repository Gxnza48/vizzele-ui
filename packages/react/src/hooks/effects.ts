import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  draggable,
  magnetic,
  onReducedMotionChange,
  prefersReducedMotion,
  reveal,
  spotlight,
  tilt,
  type DragControls,
  type DragOptions,
  type EffectInstance,
  type MagneticOptions,
  type RevealOptions,
  type SpotlightOptions,
  type TiltOptions,
} from '@vizzele/core';
import { useIsomorphicLayoutEffect, useLatest } from './utils';

/**
 * Binds any Vizzele effect (`(el, options) => { update, destroy }`) to a ref.
 * Options can change every render: they are forwarded with `update()` instead of
 * recreating the effect. Pass `enabled: false` to tear it down.
 */
export function useVizzeleEffect<O, E extends HTMLElement = HTMLElement>(
  factory: (el: HTMLElement, options?: O) => EffectInstance<O>,
  options?: O,
  enabled = true,
  externalRef?: RefObject<E | null>,
): RefObject<E | null> {
  const innerRef = useRef<E | null>(null);
  const ref = externalRef ?? innerRef;
  const instance = useRef<EffectInstance<O> | null>(null);
  const latest = useLatest(options);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    instance.current = factory(el, latest.current);
    return () => {
      instance.current?.destroy();
      instance.current = null;
    };
  }, [factory, enabled, ref, latest]);

  useEffect(() => {
    if (options) instance.current?.update(options);
  });

  return ref;
}

/** Pulls the element toward the pointer. */
export const useMagnetic = <E extends HTMLElement = HTMLElement>(
  options?: MagneticOptions,
  enabled = true,
) => useVizzeleEffect<MagneticOptions, E>(magnetic, options, enabled);

/** 3D tilt + holographic CSS variables (`--vz-px`, `--vz-angle`, …). */
export const useTilt = <E extends HTMLElement = HTMLElement>(
  options?: TiltOptions,
  enabled = true,
) => useVizzeleEffect<TiltOptions, E>(tilt, options, enabled);

/** Pointer-following light (`--vz-spot-x`, `--vz-spot-y`, `--vz-spot`). */
export const useSpotlight = <E extends HTMLElement = HTMLElement>(
  options?: SpotlightOptions,
  enabled = true,
) => useVizzeleEffect<SpotlightOptions, E>(spotlight, options, enabled);

/** Reveal with a spring when scrolled into view. */
export const useReveal = <E extends HTMLElement = HTMLElement>(
  options?: RevealOptions,
  enabled = true,
) => useVizzeleEffect<RevealOptions, E>(reveal, options, enabled);

/**
 * Makes an element draggable (mouse, touch, pen) with momentum, bounds, snapping…
 * Callbacks always see the latest props. Returns the ref and the drag controls.
 */
export function useDrag<E extends HTMLElement = HTMLElement>(
  options: DragOptions = {},
  enabled = true,
): [RefObject<E | null>, RefObject<DragControls | null>] {
  const ref = useRef<E | null>(null);
  const controls = useRef<DragControls | null>(null);
  const latest = useLatest(options);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const o = latest.current;
    controls.current = draggable(el, {
      ...o,
      onStart: (s) => latest.current.onStart?.(s),
      onMove: (s) => latest.current.onMove?.(s),
      onEnd: (s) => latest.current.onEnd?.(s),
      onRest: (s) => latest.current.onRest?.(s),
      ...(o.apply ? { apply: (x, y, s) => latest.current.apply?.(x, y, s) } : {}),
    });
    return () => {
      controls.current?.destroy();
      controls.current = null;
    };
  }, [enabled, latest]);

  const { onStart: _a, onMove: _b, onEnd: _c, onRest: _d, apply: _e, ...plain } = options;
  const key = JSON.stringify(plain, (_, v) => (v instanceof HTMLElement ? undefined : v));
  useEffect(() => {
    controls.current?.update(JSON.parse(key) as Partial<DragOptions>);
    // bounds as an element can't go through JSON
    if (latest.current.bounds instanceof HTMLElement)
      controls.current?.update({ bounds: latest.current.bounds });
  }, [key, latest]);

  return [ref, controls];
}

/** `true` when the user prefers reduced motion (OS setting or `setReducedMotion`). */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(prefersReducedMotion());
    return onReducedMotionChange(setReduced);
  }, []);
  return reduced;
}
