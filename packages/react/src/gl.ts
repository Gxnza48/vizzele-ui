import {
  createElement,
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from 'react';
import {
  caustics,
  fluid,
  grain,
  lensGrid,
  liquidMetal,
  meshGradient,
  particleField,
  type CausticsOptions,
  type FluidOptions,
  type GrainOptions,
  type LensGridOptions,
  type LiquidMetalOptions,
  type MeshGradientOptions,
  type ParticleFieldOptions,
} from '@vizzele/core/gl';
import { cx, useLatest, useMergedRef } from './hooks/utils';

interface GLInstance<O> {
  update(o: Partial<O>): void;
  destroy(): void;
}

export interface GLCanvasProps {
  className?: string;
  style?: CSSProperties;
  /** Absolutely fill the nearest positioned parent. Default true. */
  fill?: boolean;
  /** Pause rendering without unmounting. */
  paused?: boolean;
}

/**
 * Runs a Vizzele WebGL effect on a canvas. When WebGL2 is unavailable the canvas gets the
 * `vz-gl-fallback` class (a static iridescent gradient) — or `fallback` runs instead.
 */
export function useGLEffect<O>(
  factory: (canvas: HTMLCanvasElement, o: O) => GLInstance<O> | null,
  options: O,
  {
    paused = false,
    fallback,
  }: {
    paused?: boolean;
    fallback?: (canvas: HTMLCanvasElement, o: O) => GLInstance<O> | null;
  } = {},
) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const inst = useRef<GLInstance<O> | null>(null);
  const latest = useLatest(options);
  const [unsupported, setUnsupported] = useState(false);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || paused) return;
    let i: GLInstance<O> | null = null;
    try {
      i = factory(canvas, latest.current) ?? fallback?.(canvas, latest.current) ?? null;
    } catch (err) {
      console.warn('[vizzele] WebGL effect failed, using fallback', err);
    }
    setUnsupported(!i);
    inst.current = i;
    return () => {
      i?.destroy();
      inst.current = null;
    };
  }, [factory, fallback, paused, latest]);
  useEffect(() => {
    inst.current?.update(options);
  });
  return { ref, unsupported };
}

function makeGL<O extends object>(
  name: string,
  factory: (canvas: HTMLCanvasElement, o: O) => GLInstance<O> | null,
  fallback?: (canvas: HTMLCanvasElement, o: O) => GLInstance<O> | null,
) {
  const Component = /* @__PURE__ */ forwardRef<HTMLCanvasElement, O & GLCanvasProps>(
    function GLComponent(props, ref) {
      const { className, style, fill = true, paused, ...options } = props;
      const { ref: own, unsupported } = useGLEffect(factory, options as unknown as O, {
        paused: !!paused,
        ...(fallback ? { fallback } : {}),
      });
      return createElement('canvas', {
        ref: useMergedRef(ref, own),
        'aria-hidden': true,
        className: cx('vz-gl', fill && 'vz-gl-fill', unsupported && 'vz-gl-fallback', className),
        style,
      });
    },
  );
  Component.displayName = name;
  return Component;
}

/** Interactive fluid simulation stirred by the pointer. Falls back to a mesh gradient. */
export const FluidBackground = /* @__PURE__ */ makeGL<FluidOptions>(
  'FluidBackground',
  fluid as (c: HTMLCanvasElement, o: FluidOptions) => GLInstance<FluidOptions> | null,
  meshGradient as unknown as (
    c: HTMLCanvasElement,
    o: FluidOptions,
  ) => GLInstance<FluidOptions> | null,
);
/** Animated iridescent mesh gradient that bends around the pointer. */
export const MeshGradient = /* @__PURE__ */ makeGL<MeshGradientOptions>(
  'MeshGradient',
  meshGradient,
);
/** Particles that part around (or swirl into) the pointer. */
export const ParticleField = /* @__PURE__ */ makeGL<ParticleFieldOptions>(
  'ParticleField',
  particleField,
);
/** Raymarched liquid chrome blobs with an iridescent film. */
export const LiquidMetal = /* @__PURE__ */ makeGL<LiquidMetalOptions>('LiquidMetal', liquidMetal);
/** A grid that bulges like a lens under the pointer. */
export const LensGrid = /* @__PURE__ */ makeGL<LensGridOptions>('LensGrid', lensGrid);
/** GPU film grain. For a zero-JS alternative use the `vz-grain` class. */
export const Grain = /* @__PURE__ */ makeGL<GrainOptions>('Grain', grain);

export interface CausticCardProps
  extends Omit<CausticsOptions, 'target'>, Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /** How far (px) the light may spill around the card. Default 90. */
  spread?: number;
  /** Class for the glass card itself. */
  cardClassName?: string;
  paused?: boolean;
}

/**
 * A glass card that casts caustics — the moving net of light at the bottom of a pool — onto
 * whatever is behind it. Move the pointer and the light source moves with it.
 */
export const CausticCard = /* @__PURE__ */ forwardRef<HTMLDivElement, CausticCardProps>(
  function CausticCard(
    {
      spread = 90,
      radius,
      speed,
      intensity,
      scale,
      colors,
      resolution,
      paused,
      className,
      cardClassName,
      children,
      style,
      ...rest
    },
    ref,
  ) {
    const card = useRef<HTMLDivElement | null>(null);
    const options = Object.fromEntries(
      Object.entries({ radius, speed, intensity, scale, colors, resolution }).filter(
        ([, v]) => v !== undefined,
      ),
    ) as CausticsOptions;
    options.target = () => card.current;
    const { ref: canvas, unsupported } = useGLEffect(caustics, options, { paused: !!paused });
    const own = useMergedRef(ref, card);
    return createElement(
      'div',
      {
        className: cx('vz-caustics', className),
        style: { '--vz-caustics-spread': `${spread}px`, ...style } as CSSProperties,
      },
      createElement('canvas', {
        ref: canvas,
        'aria-hidden': true,
        className: cx('vz-gl vz-caustics-light', unsupported && 'vz-caustics-fallback'),
      }),
      createElement(
        'div',
        { ref: own, className: cx('vz-caustics-card', cardClassName), ...rest },
        children,
      ),
    );
  },
);

export type {
  CausticsOptions,
  FluidOptions,
  GrainOptions,
  LensGridOptions,
  LiquidMetalOptions,
  MeshGradientOptions,
  ParticleFieldOptions,
};
