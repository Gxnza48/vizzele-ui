import {
  forwardRef,
  type AllHTMLAttributes,
  useEffect,
  useImperativeHandle,
  useRef,
  type ElementType,
  type ReactNode,
} from 'react';
import {
  cursor,
  magnetic,
  particleTrail,
  ripple,
  spotlight,
  tilt,
  type CursorInstance,
  type CursorOptions,
  type MagneticOptions,
  type ParticleTrailOptions,
  type RippleOptions,
  type SpotlightOptions,
  type TiltOptions,
} from '@vizzele/core';
import { useVizzeleEffect } from '../hooks/effects';
import { cx, useLatest, useMergedRef } from '../hooks/utils';

/** Polymorphic props: any HTML attribute is accepted since `as` can render any element. */
export type DivProps = Omit<AllHTMLAttributes<HTMLElement>, 'as' | 'children'> & {
  children?: ReactNode;
  /** Element to render. Default `div`. */
  as?: ElementType;
};

// ——————————————————————————— Cursor ———————————————————————————

export interface CursorProps extends CursorOptions {
  /** Disable without unmounting. */
  disabled?: boolean;
}

/**
 * Replaces the native cursor with Vizzele's liquid cursor. Render it once, near the root.
 * Does nothing on touch devices or with reduced motion.
 */
export const Cursor = /* @__PURE__ */ forwardRef<CursorInstance | null, CursorProps>(
  function Cursor({ disabled, ...options }, ref) {
    const instance = useRef<CursorInstance | null>(null);
    const latest = useLatest(options);
    useImperativeHandle(ref, () => instance.current as CursorInstance, []);
    useEffect(() => {
      if (disabled) return;
      instance.current = cursor(latest.current);
      return () => {
        instance.current?.destroy();
        instance.current = null;
      };
    }, [disabled, latest, options.trail, options.hideNative]);
    useEffect(() => {
      instance.current?.update(options);
    });
    return null;
  },
);

// ——————————————————————————— Particle trail ———————————————————————————

export interface ParticleTrailProps extends ParticleTrailOptions {
  disabled?: boolean;
  /** Burst of particles on click. Default true. */
  burstOnClick?: boolean;
}

/** Iridescent particles that follow the pointer. Render once, near the root. */
export function ParticleTrail({ disabled, burstOnClick = true, ...options }: ParticleTrailProps) {
  const latest = useLatest(options);
  const inst = useRef<ReturnType<typeof particleTrail> | null>(null);
  useEffect(() => {
    if (disabled) return;
    const trail = particleTrail(latest.current);
    inst.current = trail;
    const onClick = (e: PointerEvent) => {
      if (burstOnClick) trail.burst(e.clientX, e.clientY);
    };
    window.addEventListener('pointerdown', onClick);
    return () => {
      window.removeEventListener('pointerdown', onClick);
      trail.destroy();
      inst.current = null;
    };
  }, [disabled, burstOnClick, latest]);
  useEffect(() => {
    inst.current?.update(options);
  });
  return null;
}

// ——————————————————————————— Wrappers ———————————————————————————

export type MagneticProps = DivProps & MagneticOptions & { disabled?: boolean };

/** Children are pulled toward the pointer when it gets close. */
export const Magnetic = /* @__PURE__ */ forwardRef<HTMLElement, MagneticProps>(function Magnetic(
  {
    as: Tag = 'div',
    strength,
    radius,
    scale,
    inner,
    innerStrength,
    spring,
    press,
    disabled,
    className,
    style,
    ...rest
  },
  ref,
) {
  const opts: MagneticOptions = {
    strength,
    radius,
    scale,
    inner,
    innerStrength,
    spring,
    press,
  } as MagneticOptions;
  const own = useVizzeleEffect(magnetic, strip(opts), !disabled);
  return (
    <Tag
      ref={useMergedRef(ref, own)}
      className={cx('vz-magnetic', className)}
      style={{ display: 'inline-block', ...style }}
      {...rest}
    />
  );
});

export type TiltProps = DivProps & TiltOptions & { disabled?: boolean };

/** 3D tilt toward the pointer. Exposes `--vz-px`, `--vz-py`, `--vz-angle`, `--vz-hover` to CSS. */
export const Tilt = /* @__PURE__ */ forwardRef<HTMLElement, TiltProps>(function Tilt(
  { as: Tag = 'div', max, perspective, scale, reverse, axis, spring, disabled, className, ...rest },
  ref,
) {
  const own = useVizzeleEffect(
    tilt,
    strip({ max, perspective, scale, reverse, axis, spring } as TiltOptions),
    !disabled,
  );
  return <Tag ref={useMergedRef(ref, own)} className={cx('vz-tilt', className)} {...rest} />;
});

export type HoloCardProps = TiltProps;

/** A card with holographic foil that shifts with the viewing angle. */
export const HoloCard = /* @__PURE__ */ forwardRef<HTMLElement, HoloCardProps>(function HoloCard(
  { className, max = 14, ...rest },
  ref,
) {
  return <Tilt ref={ref} max={max} className={cx('vz-card vz-holo', className)} {...rest} />;
});

export type SpotlightProps = DivProps & SpotlightOptions & { disabled?: boolean };

/** Light that follows the pointer over the element, lighting its border on approach. */
export const Spotlight = /* @__PURE__ */ forwardRef<HTMLElement, SpotlightProps>(function Spotlight(
  { as: Tag = 'div', proximity, spring, disabled, className, ...rest },
  ref,
) {
  const own = useVizzeleEffect(
    spotlight,
    strip({ proximity, spring } as SpotlightOptions),
    !disabled,
  );
  return <Tag ref={useMergedRef(ref, own)} className={cx('vz-spotlight', className)} {...rest} />;
});

/** A card lit by the pointer. */
export const SpotlightCard = /* @__PURE__ */ forwardRef<HTMLElement, SpotlightProps>(
  function SpotlightCard({ className, ...rest }, ref) {
    return <Spotlight ref={ref} className={cx('vz-card', className)} {...rest} />;
  },
);

export type RippleProps = DivProps & RippleOptions & { disabled?: boolean };

/** Adds a liquid ripple on press to its element. */
export const Ripple = /* @__PURE__ */ forwardRef<HTMLElement, RippleProps>(function Ripple(
  { as: Tag = 'div', color, opacity, spring, keyboard, disabled, ...rest },
  ref,
) {
  const own = useVizzeleEffect(
    ripple,
    strip({ color, opacity, spring, keyboard } as RippleOptions),
    !disabled,
  );
  return <Tag ref={useMergedRef(ref, own)} {...rest} />;
});

/** Drops undefined keys so they don't override effect defaults (exactOptionalPropertyTypes). */
function strip<T extends object>(o: T): T {
  const out = {} as T;
  for (const k of Object.keys(o) as (keyof T)[]) if (o[k] !== undefined) out[k] = o[k];
  return out;
}
export { strip as _strip };
