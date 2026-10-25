import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react';
import {
  counter,
  horizontalScroll,
  morphText,
  parallax,
  reveal,
  scramble,
  scrollProgress,
  smoothScroll,
  stickyStack,
  textReveal,
  weightWave,
  type CounterOptions,
  type ParallaxOptions,
  type RevealOptions,
  type ScrambleOptions,
  type ScrollContainer,
  type SmoothScrollOptions,
  type TextRevealOptions,
  type WeightWaveOptions,
} from '@vizzele/core';
import { useVizzeleEffect } from '../hooks/effects';
import { cx, useLatest, useMergedRef } from '../hooks/utils';
import type { DivProps } from './pointer';

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

interface TextBase {
  /** The text. Plain string: the effect rewrites the element's content. */
  children: string;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

/**
 * Renders text the effect is free to rewrite: React treats the content as opaque HTML,
 * so it never fights the effect's DOM changes, and the text is still server-rendered.
 * The element remounts when the text changes.
 */
function useOpaqueText(text: string) {
  return { key: text, dangerouslySetInnerHTML: { __html: escape(text) } };
}

// ——————————————————————————— Scramble ———————————————————————————

export type ScrambleTextProps = TextBase & Omit<ScrambleOptions, 'text'>;

export interface ScrambleTextHandle {
  play(): void;
}

/** Text that decodes from random glyphs. */
export const ScrambleText = forwardRef<ScrambleTextHandle, ScrambleTextProps>(function ScrambleText(
  { children, as: Tag = 'span', className, duration, chars, trigger, ...rest },
  ref,
) {
  const el = useRef<HTMLElement>(null);
  const inst = useRef<ReturnType<typeof scramble> | null>(null);
  useImperativeHandle(ref, () => ({ play: () => inst.current?.play() }), []);
  useEffect(() => {
    if (!el.current) return;
    inst.current = scramble(el.current, {
      text: children,
      ...(duration !== undefined ? { duration } : {}),
      ...(chars !== undefined ? { chars } : {}),
      ...(trigger !== undefined ? { trigger } : {}),
    });
    return () => inst.current?.destroy();
  }, [children, duration, chars, trigger]);
  return (
    <Tag ref={el} className={cx('vz-scramble', className)} {...useOpaqueText(children)} {...rest} />
  );
});

// ——————————————————————————— Reveal by unit ———————————————————————————

export type TextRevealProps = TextBase & TextRevealOptions;

/** Reveals text by chars, words or lines as it scrolls into view. */
export function TextReveal({
  children,
  as: Tag = 'p',
  className,
  by,
  stagger,
  variant,
  once,
  amount,
  ...rest
}: TextRevealProps) {
  const el = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!el.current) return;
    const inst = textReveal(el.current, {
      ...(by ? { by } : {}),
      ...(stagger !== undefined ? { stagger } : {}),
      ...(variant ? { variant } : {}),
      ...(once !== undefined ? { once } : {}),
      ...(amount !== undefined ? { amount } : {}),
    });
    return () => inst.destroy();
  }, [children, by, stagger, variant, once, amount]);
  return <Tag ref={el} className={className} {...useOpaqueText(children)} {...rest} />;
}

// ——————————————————————————— Shimmer ———————————————————————————

export interface ShimmerTextProps extends Omit<DivProps, 'children'> {
  children: ReactNode;
  /** `'shimmer'` sweeps light across the text; `'iridescent'` paints it with the spectrum. */
  variant?: 'shimmer' | 'iridescent';
  /** Seconds per sweep. Default 3.2. */
  speed?: number;
}

/** Iridescent light sweeping across text. Pure CSS. */
export function ShimmerText({
  as: Tag = 'span',
  variant = 'shimmer',
  speed,
  className,
  style,
  ...rest
}: ShimmerTextProps) {
  return (
    <Tag
      className={cx(variant === 'shimmer' ? 'vz-text-shimmer' : 'vz-text-iridescent', className)}
      data-animate={variant === 'iridescent' ? '' : undefined}
      style={{ ...(speed ? { animationDuration: `${speed}s` } : {}), ...style }}
      {...rest}
    />
  );
}

// ——————————————————————————— Weight wave ———————————————————————————

export type WeightWaveProps = TextBase & WeightWaveOptions;

/** Letters swell in weight near the pointer (variable font). */
export function WeightWave({
  children,
  as: Tag = 'span',
  className,
  min,
  max,
  radius,
  width,
  ease,
  ...rest
}: WeightWaveProps) {
  const el = useRef<HTMLElement>(null);
  const opts = { min, max, radius, width, ease } as WeightWaveOptions;
  const latest = useLatest(opts);
  const inst = useRef<ReturnType<typeof weightWave> | null>(null);
  useEffect(() => {
    if (!el.current) return;
    inst.current = weightWave(el.current, strip(latest.current));
    return () => inst.current?.destroy();
  }, [children, latest]);
  useEffect(() => {
    inst.current?.update(strip(opts));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max, radius, width, ease]);
  return (
    <Tag
      ref={el}
      className={cx('vz-weight-wave', className)}
      {...useOpaqueText(children)}
      {...rest}
    />
  );
}

// ——————————————————————————— Morph ———————————————————————————

export interface MorphTextProps {
  words: string[];
  hold?: number;
  morph?: number;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}

/** Words that melt into each other. */
export function MorphText({
  words,
  hold,
  morph,
  as: Tag = 'span',
  className,
  style,
}: MorphTextProps) {
  const el = useRef<HTMLElement>(null);
  const key = words.join('|');
  useEffect(() => {
    if (!el.current) return;
    const inst = morphText(el.current, {
      words,
      ...(hold !== undefined ? { hold } : {}),
      ...(morph !== undefined ? { morph } : {}),
    });
    return () => inst.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, hold, morph]);
  return (
    <Tag
      ref={el}
      key={key}
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: escape(words[0] ?? '') }}
    />
  );
}

// ——————————————————————————— Counter ———————————————————————————

export interface CounterProps extends Omit<CounterOptions, 'to'> {
  value: number;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}

/** A number that springs to its value — on scroll into view, and whenever it changes. */
export function Counter({ value, as: Tag = 'span', className, style, ...options }: CounterProps) {
  const el = useRef<HTMLElement>(null);
  const inst = useRef<ReturnType<typeof counter> | null>(null);
  const latest = useLatest(options);
  useEffect(() => {
    if (!el.current) return;
    inst.current = counter(el.current, { ...latest.current, to: value });
    return () => inst.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest]);
  useEffect(() => {
    inst.current?.set(value);
  }, [value]);
  return (
    <Tag ref={el} className={cx('vz-counter', className)} style={style} suppressHydrationWarning>
      {options.prefix ?? ''}
      {options.from ?? 0}
      {options.suffix ?? ''}
    </Tag>
  );
}

// ——————————————————————————— Scroll ———————————————————————————

export type RevealProps = DivProps &
  Omit<RevealOptions, 'children'> & {
    /** Selector for the children to stagger (default: direct children). */
    childSelector?: string;
    disabled?: boolean;
  };

/** Fades/slides its content in on scroll. Set `stagger` to reveal children one by one. */
export const Reveal = forwardRef<HTMLElement, RevealProps>(function Reveal(
  {
    as: Tag = 'div',
    from,
    distance,
    delay,
    stagger,
    childSelector,
    children: kids,
    once,
    amount,
    spring,
    onReveal,
    disabled,
    ...rest
  },
  ref,
) {
  const own = useVizzeleEffect(
    reveal,
    strip({
      from,
      distance,
      delay,
      stagger,
      children: childSelector,
      once,
      amount,
      spring,
      onReveal,
    } as RevealOptions),
    !disabled,
  );
  return (
    <Tag ref={useMergedRef(ref, own)} {...rest}>
      {kids}
    </Tag>
  );
});

export type ParallaxProps = DivProps & ParallaxOptions & { disabled?: boolean };

/** Moves at a different speed than the page for depth. */
export const Parallax = forwardRef<HTMLElement, ParallaxProps>(function Parallax(
  { as: Tag = 'div', speed, axis, zoom, container, disabled, ...rest },
  ref,
) {
  const own = useVizzeleEffect(
    (el, o?: ParallaxOptions) => parallax(el, o),
    strip({ speed, axis, zoom, container } as ParallaxOptions),
    !disabled,
  );
  return <Tag ref={useMergedRef(ref, own)} {...rest} />;
});

export interface ScrollProgressProps {
  /** Track an element's read-through instead of the page. */
  target?: React.RefObject<HTMLElement | null>;
  container?: ScrollContainer;
  className?: string;
  style?: CSSProperties;
  label?: string;
}

/** An iridescent reading-progress bar pinned to the top. */
export function ScrollProgress({
  target,
  container,
  className,
  style,
  label,
}: ScrollProgressProps) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!el.current) return;
    const inst = scrollProgress(el.current, {
      ...(target?.current ? { target: target.current } : {}),
      ...(container ? { container } : {}),
    });
    return () => inst.destroy();
  }, [target, container]);
  return (
    <div
      ref={el}
      className={cx('vz-progress-bar', className)}
      style={style}
      aria-label={label ?? 'Reading progress'}
    />
  );
}

export interface HorizontalScrollProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  trackClassName?: string;
  container?: ScrollContainer;
  /** Accessible name of the region. */
  label?: string;
}

/** A section that pins and scrolls its content sideways as you scroll down. */
export function HorizontalScroll({
  children,
  className,
  style,
  trackClassName,
  container,
  label,
}: HorizontalScrollProps) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!section.current || !track.current) return;
    const inst = horizontalScroll(section.current, {
      track: track.current,
      ...(container ? { container } : {}),
    });
    return () => inst.destroy();
  }, [container]);
  return (
    <section ref={section} className={cx('vz-hscroll', className)} style={style} aria-label={label}>
      <div className="vz-hscroll-viewport">
        <div ref={track} className={cx('vz-hscroll-track', trackClassName)}>
          {children}
        </div>
      </div>
    </section>
  );
}

export interface StickyStackProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  container?: ScrollContainer;
  /** How much covered cards shrink, per level. Default 0.06. */
  scale?: number;
}

/** Cards pin one after another and pile up as you scroll. */
export function StickyStack({ children, className, style, container, scale }: StickyStackProps) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    Array.from(node.children).forEach((c, i) =>
      (c as HTMLElement).style.setProperty('--vz-i', String(i)),
    );
    const inst = stickyStack(node, {
      ...(container ? { container } : {}),
      ...(scale !== undefined ? { scale } : {}),
    });
    return () => inst.destroy();
  }, [container, scale, children]);
  return (
    <div ref={el} className={cx('vz-sticky-stack', className)} style={style}>
      {children}
    </div>
  );
}

/** Opt-in inertial wheel scrolling for the page (or a container). Renders nothing. */
export function SmoothScroll(props: SmoothScrollOptions & { disabled?: boolean }) {
  const { disabled, container, lerp, wheelMultiplier } = props;
  useEffect(() => {
    if (disabled) return;
    const inst = smoothScroll({
      ...(container ? { container } : {}),
      ...(lerp !== undefined ? { lerp } : {}),
      ...(wheelMultiplier !== undefined ? { wheelMultiplier } : {}),
    });
    return () => inst.destroy();
  }, [disabled, container, lerp, wheelMultiplier]);
  return null;
}

function strip<T extends object>(o: T): T {
  const out = {} as T;
  for (const k of Object.keys(o) as (keyof T)[]) if (o[k] !== undefined) out[k] = o[k];
  return out;
}
