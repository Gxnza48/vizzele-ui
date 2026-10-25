import {
  Children,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal, flushSync } from 'react-dom';
import {
  Spring,
  clamp,
  createPhysicsWorld,
  draggable,
  prefersReducedMotion,
  reorder,
  rubberband,
  wrap,
  type DragControls,
  type DragOptions,
  type PhysicsOptions,
  type PhysicsWorld as PhysicsWorldApi,
  type SpringConfig,
  type SpringPreset,
} from '@vizzele/core';
import { useDrag } from '../hooks/effects';
import { cx, useLatest, useMergedRef } from '../hooks/utils';
import { useModalFocus } from '../hooks/a11y';
import type { DivProps } from './pointer';

// ——————————————————————————— Draggable ———————————————————————————

export type DraggableProps = DivProps &
  DragOptions & {
    disabled?: boolean;
    /** Receives the drag controls (setPosition, fling…). */
    controlsRef?: React.Ref<DragControls | null>;
  };

const DRAG_KEYS = [
  'axis',
  'lockDirection',
  'bounds',
  'elastic',
  'momentum',
  'power',
  'timeConstant',
  'snap',
  'spring',
  'returnToOrigin',
  'handle',
  'threshold',
  'keyboard',
  'rotate',
  'stretch',
  'cursor',
  'apply',
  'onStart',
  'onMove',
  'onEnd',
  'onRest',
] as const;

function splitDragProps<T extends object>(props: T): [DragOptions, Omit<T, keyof DragOptions>] {
  const drag: Record<string, unknown> = {};
  const rest: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if ((DRAG_KEYS as readonly string[]).includes(k)) {
      if (v !== undefined) drag[k] = v;
    } else rest[k] = v;
  }
  return [drag as DragOptions, rest as Omit<T, keyof DragOptions>];
}

/** Makes its element draggable — throw it, snap it, bound it. */
export const Draggable = /* @__PURE__ */ forwardRef<HTMLElement, DraggableProps>(
  function Draggable(props, ref) {
    const { as: Tag = 'div', disabled, controlsRef, className, ...all } = props;
    const [dragOpts, rest] = splitDragProps(all);
    const [own, controls] = useDrag<HTMLElement>(dragOpts, !disabled);
    useImperativeHandle(controlsRef, () => controls.current as DragControls, [controls]);
    return (
      <Tag
        ref={useMergedRef(ref, own)}
        className={cx('vz-draggable', className)}
        tabIndex={dragOpts.keyboard === false ? undefined : 0}
        {...rest}
      />
    );
  },
);

// ——————————————————————————— Drag to dismiss ———————————————————————————

export interface DragDismissOptions {
  axis?: 'x' | 'y';
  /** Which way(s) dismiss. Default `'both'`. */
  direction?: 'both' | 'positive' | 'negative';
  /** Fraction of the element's size to drag before release dismisses. Default 0.4. */
  threshold?: number;
  /** Release speed (px/s) that dismisses regardless of distance. Default 700. */
  velocity?: number;
  /** Fade out while dragging away. Default true. */
  fade?: boolean;
  onDismiss?: (direction: 1 | -1) => void;
}

/** Flick an element away to dismiss it; a short drag springs back. */
export function useDragDismiss<E extends HTMLElement = HTMLElement>(
  options: DragDismissOptions = {},
) {
  const latest = useLatest(options);
  const ref = useRef<E | null>(null);
  const size = useRef(1);
  const axis = options.axis ?? 'x';
  const [own, controls] = useDrag<E>({
    axis,
    elastic: 0.5,
    rotate: axis === 'x' ? 6 : 0,
    onStart: () => {
      const el = ref.current;
      if (el) size.current = axis === 'x' ? el.offsetWidth : el.offsetHeight;
    },
    apply: (x, y) => {
      const el = ref.current;
      if (!el) return;
      const o = latest.current;
      let v = axis === 'x' ? x : y;
      // Resist the direction that doesn't dismiss.
      if ((o.direction === 'positive' && v < 0) || (o.direction === 'negative' && v > 0)) {
        v = rubberband(v, size.current, 0.25);
      }
      el.style.transform =
        axis === 'x'
          ? `translate3d(${v}px,0,0) rotate(${clamp(v / 40, -8, 8)}deg)`
          : `translate3d(0,${v}px,0)`;
      if (o.fade !== false)
        el.style.opacity = String(clamp(1 - Math.abs(v) / (size.current * 1.1), 0, 1));
    },
    onEnd: (s) => {
      const o = latest.current;
      const offset = axis === 'x' ? s.offsetX : s.offsetY;
      const vel = axis === 'x' ? s.vx : s.vy;
      const dir: 1 | -1 = (Math.abs(vel) > 200 ? vel : offset) >= 0 ? 1 : -1;
      const allowed =
        o.direction === 'positive' ? dir > 0 : o.direction === 'negative' ? dir < 0 : true;
      const far = Math.abs(offset) > size.current * (o.threshold ?? 0.4);
      const fast = Math.abs(vel) > (o.velocity ?? 700) && Math.sign(vel) === dir;
      const c = controls.current;
      if (!c) return false;
      if (allowed && (far || fast)) {
        const target = dir * (size.current * 1.6 + 80);
        c.setPosition(axis === 'x' ? { x: target } : { y: target }, {
          velocity: axis === 'x' ? { x: vel } : { y: vel },
        });
        setTimeout(() => latest.current.onDismiss?.(dir), prefersReducedMotion() ? 0 : 260);
      } else {
        c.setPosition({ x: 0, y: 0 });
      }
      return false;
    },
  });
  return useMergedRef(ref, own);
}

// ——————————————————————————— Reorder ———————————————————————————

const ReorderContext = /* @__PURE__ */ createContext<{ axis: 'x' | 'y'; handle: boolean } | null>(
  null,
);

export interface ReorderGroupProps<T> extends Omit<DivProps, 'onChange' | 'values'> {
  values: T[];
  onReorder: (values: T[]) => void;
  axis?: 'x' | 'y';
  /** Drag only from `<ReorderHandle>` elements. */
  useHandle?: boolean;
  spring?: SpringConfig | SpringPreset;
  /** Accessible name for the list. */
  label?: string;
}

/** A list you reorder by dragging (or with the keyboard). Items flow out of the way. */
export function ReorderGroup<T>({
  values,
  onReorder,
  axis = 'y',
  useHandle = false,
  spring,
  label,
  as: Tag = 'ul',
  className,
  children,
  ...rest
}: ReorderGroupProps<T>) {
  const ref = useRef<HTMLElement | null>(null);
  const latest = useLatest({ values, onReorder });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const inst = reorder(el, {
      axis,
      moveDom: false,
      items: ':scope > [data-vz-reorder-item]',
      ...(useHandle ? { handle: '[data-vz-reorder-handle]' } : {}),
      ...(spring ? { spring } : {}),
      onReorder: (from, to) => {
        const next = [...latest.current.values];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved as T);
        // Synchronous render so the DOM matches before Vizzele removes its transforms.
        flushSync(() => latest.current.onReorder(next));
      },
    });
    return () => inst.destroy();
  }, [axis, useHandle, spring, latest]);

  return (
    <ReorderContext.Provider value={{ axis, handle: useHandle }}>
      <Tag
        ref={ref}
        role="list"
        aria-label={label}
        className={cx('vz-reorder', className)}
        data-axis={axis}
        {...rest}
      >
        {children}
      </Tag>
    </ReorderContext.Provider>
  );
}

export type ReorderItemProps = DivProps;

export const ReorderItem = /* @__PURE__ */ forwardRef<HTMLElement, ReorderItemProps>(
  function ReorderItem({ as: Tag = 'li', className, style, ...rest }, ref) {
    const ctx = useContext(ReorderContext);
    return (
      <Tag
        ref={ref}
        role="listitem"
        tabIndex={0}
        aria-roledescription="draggable item"
        aria-grabbed={false}
        data-vz-reorder-item=""
        className={cx('vz-reorder-item', className)}
        style={{
          touchAction: ctx?.handle ? undefined : ctx?.axis === 'x' ? 'pan-y' : 'pan-x',
          ...style,
        }}
        {...rest}
      />
    );
  },
);

/** Drag handle for `<ReorderGroup useHandle>`. */
export function ReorderHandle({ className, ...rest }: DivProps) {
  return (
    <span
      data-vz-reorder-handle=""
      aria-hidden="true"
      className={cx('vz-reorder-handle', className)}
      style={{ touchAction: 'none', cursor: 'grab' }}
      {...rest}
    >
      {rest.children ?? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.6" />
          <circle cx="15" cy="6" r="1.6" />
          <circle cx="9" cy="12" r="1.6" />
          <circle cx="15" cy="12" r="1.6" />
          <circle cx="9" cy="18" r="1.6" />
          <circle cx="15" cy="18" r="1.6" />
        </svg>
      )}
    </span>
  );
}

// ——————————————————————————— Swipe stack ———————————————————————————

export type SwipeDirection = 'left' | 'right';

export interface SwipeStackHandle {
  swipe(direction: SwipeDirection): void;
}

export interface SwipeStackProps<T> {
  items: T[];
  renderCard: (item: T, index: number) => ReactNode;
  getKey?: (item: T, index: number) => string | number;
  onSwipe?: (item: T, direction: SwipeDirection) => void;
  /** Px of horizontal drag that counts as a swipe. Default 110. */
  threshold?: number;
  /** Cards visible behind the top one. Default 2. */
  depth?: number;
  /** Put swiped cards back at the bottom. Default false. */
  loop?: boolean;
  /** Called when the stack is empty. */
  onEmpty?: () => void;
  className?: string;
  style?: CSSProperties;
  label?: string;
}

function SwipeStackInner<T>(
  {
    items,
    renderCard,
    getKey = (_, i) => i,
    onSwipe,
    threshold = 110,
    depth = 2,
    loop = false,
    onEmpty,
    className,
    style,
    label = 'Card stack',
  }: SwipeStackProps<T>,
  ref: React.Ref<SwipeStackHandle>,
) {
  const [stack, setStack] = useState(() =>
    items.map((item, i) => ({ item, key: getKey(item, i) })),
  );
  const [message, setMessage] = useState('');
  const topControls = useRef<DragControls | null>(null);
  const nextRef = useRef<HTMLDivElement | null>(null);
  const latest = useLatest({ onSwipe, onEmpty, loop });
  const flying = useRef(false);

  useEffect(() => {
    setStack(items.map((item, i) => ({ item, key: getKey(item, i) })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const finish = useCallback(
    (dir: SwipeDirection) => {
      setStack((s) => {
        const [top, ...rest] = s;
        if (!top) return s;
        latest.current.onSwipe?.(top.item, dir);
        setMessage(`${dir === 'right' ? 'Liked' : 'Passed'}. ${rest.length} left.`);
        const next = latest.current.loop
          ? [...rest, { ...top, key: `${top.key}-${Date.now()}` }]
          : rest;
        if (!next.length) latest.current.onEmpty?.();
        return next;
      });
      flying.current = false;
    },
    [latest],
  );

  const flyOut = useCallback(
    (dir: SwipeDirection, velocity = 0) => {
      const c = topControls.current;
      if (!c || flying.current) return;
      flying.current = true;
      const sign = dir === 'right' ? 1 : -1;
      c.setPosition(
        { x: sign * (window.innerWidth * 0.7 + 200), y: -40 },
        { velocity: { x: sign * Math.max(Math.abs(velocity), 1400) } },
      );
      setTimeout(() => finish(dir), prefersReducedMotion() ? 0 : 280);
    },
    [finish],
  );

  useImperativeHandle(ref, () => ({ swipe: (d) => flyOut(d) }), [flyOut]);

  const visible = stack.slice(0, depth + 1);
  return (
    <div
      className={cx('vz-swipe-stack', className)}
      style={style}
      role="group"
      aria-roledescription="card stack"
      aria-label={label}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') flyOut('left');
        if (e.key === 'ArrowRight') flyOut('right');
      }}
    >
      {visible
        .map((entry, i) => (
          <SwipeCard
            key={entry.key}
            index={i}
            isTop={i === 0}
            threshold={threshold}
            controlsRef={i === 0 ? topControls : undefined}
            cardRef={i === 1 ? nextRef : undefined}
            nextRef={nextRef}
            onRelease={(dir, v) =>
              dir ? flyOut(dir, v) : topControls.current?.setPosition({ x: 0, y: 0 })
            }
          >
            {renderCard(entry.item, i)}
          </SwipeCard>
        ))
        .reverse()}
      <span className="vz-sr-only" aria-live="polite">
        {message}
      </span>
    </div>
  );
}

function SwipeCard({
  index,
  isTop,
  threshold,
  controlsRef,
  cardRef,
  nextRef,
  onRelease,
  children,
}: {
  index: number;
  isTop: boolean;
  threshold: number;
  controlsRef: React.RefObject<DragControls | null> | undefined;
  cardRef: React.RefObject<HTMLDivElement | null> | undefined;
  nextRef: React.RefObject<HTMLDivElement | null>;
  onRelease: (dir: SwipeDirection | null, velocity: number) => void;
  children: ReactNode;
}) {
  const [own, controls] = useDrag<HTMLDivElement>(
    {
      rotate: 14,
      elastic: 0.6,
      onMove: (s) => {
        // The next card rises as the top one leaves.
        const p = clamp(Math.abs(s.offsetX) / threshold, 0, 1);
        const n = nextRef.current;
        if (n) n.style.setProperty('--vz-rise', p.toFixed(3));
        const el = own.current;
        if (el) el.style.setProperty('--vz-swipe', clamp(s.offsetX / threshold, -1, 1).toFixed(3));
      },
      onEnd: (s) => {
        const fast = Math.abs(s.vx) > 800;
        if (Math.abs(s.offsetX) > threshold || fast)
          onRelease(s.offsetX + s.vx * 0.1 > 0 ? 'right' : 'left', s.vx);
        else {
          onRelease(null, 0);
          nextRef.current?.style.setProperty('--vz-rise', '0');
          own.current?.style.setProperty('--vz-swipe', '0');
        }
        return false;
      },
    },
    isTop,
  );
  useLayoutEffect(() => {
    if (controlsRef) (controlsRef as { current: DragControls | null }).current = controls.current;
  });
  return (
    <div
      ref={useMergedRef(own, cardRef)}
      className="vz-swipe-card"
      data-top={isTop || undefined}
      aria-hidden={!isTop}
      style={{ '--vz-depth': index } as CSSProperties}
    >
      {children}
    </div>
  );
}

/** Tinder-style stack: drag the top card left or right to swipe it away. */
export const SwipeStack = /* @__PURE__ */ forwardRef(SwipeStackInner) as <T>(
  props: SwipeStackProps<T> & { ref?: React.Ref<SwipeStackHandle> },
) => ReturnType<typeof SwipeStackInner>;

// ——————————————————————————— Elastic slider ———————————————————————————

export interface ElasticSliderProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  /** Accessible name. */
  label: string;
  /** Show the value next to the track. Default true. */
  showValue?: boolean;
  formatValue?: (v: number) => string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  className?: string;
  disabled?: boolean;
}

/** A slider that stretches like rubber when you pull past its ends, then snaps back. */
export function ElasticSlider({
  value: controlled,
  defaultValue = 50,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  showValue = true,
  formatValue = (v) => String(Math.round(v)),
  startIcon,
  endIcon,
  className,
  disabled,
}: ElasticSliderProps) {
  const [inner, setInner] = useState(defaultValue);
  const value = controlled ?? inner;
  const track = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const stretch = useRef<Spring | null>(null);
  const latest = useLatest({ onChange, controlled });

  const setValue = (v: number) => {
    const snapped = clamp(Math.round((v - min) / step) * step + min, min, max);
    if (latest.current.controlled === undefined) setInner(snapped);
    latest.current.onChange?.(snapped);
  };

  // The spring holds the signed overflow in px; it is turned into the rubber deformation here.
  const paintStretch = (v: number) => {
    const el = root.current;
    const w = track.current?.offsetWidth || 1;
    if (!el) return;
    const a = Math.abs(v);
    el.style.setProperty('--vz-sx', (1 + a / w).toFixed(4));
    el.style.setProperty('--vz-tx', `${Math.min(v, 0).toFixed(2)}px`);
    el.style.setProperty('--vz-squash', Math.max(0.45, 1 - a / 160).toFixed(3));
    el.style.setProperty('--vz-pull-l', Math.max(-v, 0).toFixed(2));
    el.style.setProperty('--vz-pull-r', Math.max(v, 0).toFixed(2));
  };
  const getStretch = () => {
    stretch.current ??= new Spring({ stiffness: 300, damping: 9, onUpdate: paintStretch });
    return stretch.current;
  };

  const fromPointer = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    const raw = (clientX - r.left) / r.width;
    const over = raw < 0 ? raw * r.width : raw > 1 ? (raw - 1) * r.width : 0;
    getStretch().jump(rubberband(over, r.width, 0.35));
    setValue(min + clamp(raw, 0, 1) * (max - min));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    root.current?.toggleAttribute('data-active', true);
    fromPointer(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!(e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) return;
    fromPointer(e.clientX);
  };
  const onPointerUp = () => {
    root.current?.toggleAttribute('data-active', false);
    getStretch().set(0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    const big = (max - min) / 10;
    const map: Record<string, number> = {
      ArrowRight: step,
      ArrowUp: step,
      ArrowLeft: -step,
      ArrowDown: -step,
      PageUp: big,
      PageDown: -big,
    };
    let next: number | null = null;
    if (e.key in map) next = value + map[e.key]!;
    if (e.key === 'Home') next = min;
    if (e.key === 'End') next = max;
    if (next === null) return;
    e.preventDefault();
    // Bumping into an end wobbles the track.
    if (next < min || next > max) getStretch().impulse(next < min ? -260 : 260);
    setValue(next);
  };

  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div
      ref={root}
      className={cx('vz-slider', className)}
      data-disabled={disabled || undefined}
      style={{ '--vz-value': pct / 100 } as CSSProperties}
    >
      {startIcon && <span className="vz-slider-icon vz-slider-icon-start">{startIcon}</span>}
      <div
        ref={track}
        className="vz-slider-track"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="vz-slider-rail">
          <div className="vz-slider-fill" />
        </div>
        <div
          className="vz-slider-thumb"
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={formatValue(value)}
          aria-disabled={disabled || undefined}
          onKeyDown={onKeyDown}
        />
      </div>
      {endIcon && <span className="vz-slider-icon vz-slider-icon-end">{endIcon}</span>}
      {showValue && (
        <output className="vz-slider-value" aria-hidden="true">
          {formatValue(value)}
        </output>
      )}
    </div>
  );
}

// ——————————————————————————— Bottom sheet ———————————————————————————

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Heights the sheet rests at, as fractions of the viewport. Default `[0.45, 0.92]`. */
  snapPoints?: number[];
  /** Index of the snap point to open at. Default 0. */
  defaultSnap?: number;
  /** Title (also the accessible name). */
  title?: ReactNode;
  children?: ReactNode;
  /** Close by dragging down past the lowest snap point or tapping the backdrop. Default true. */
  dismissible?: boolean;
  className?: string;
}

/** A sheet that slides up from the bottom, snaps to heights and can be flicked away. */
export function BottomSheet({
  open,
  onOpenChange,
  snapPoints = [0.45, 0.92],
  defaultSnap = 0,
  title,
  children,
  dismissible = true,
  className,
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(open);
  const sheet = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const controls = useRef<DragControls | null>(null);
  const titleId = useId();
  const latest = useLatest({ onOpenChange, dismissible, snapPoints });
  const closing = useRef(false);

  useEffect(() => {
    if (open) {
      closing.current = false;
      setMounted(true);
    }
  }, [open]);

  const sheetHeight = () => window.innerHeight * Math.max(...latest.current.snapPoints);
  // y = translation from the fully-open position; larger = lower.
  const snapYs = () => latest.current.snapPoints.map((p) => sheetHeight() - window.innerHeight * p);

  const close = useCallback(() => {
    const c = controls.current;
    if (!c || closing.current) return;
    closing.current = true;
    c.setPosition({ y: sheetHeight() + 20 });
    setTimeout(
      () => {
        setMounted(false);
        latest.current.onOpenChange(false);
      },
      prefersReducedMotion() ? 0 : 320,
    );
    // sheetHeight only reads window size and latest props; it needs no dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest]);

  useEffect(() => {
    if (!open && mounted) close();
  }, [open, mounted, close]);

  useLayoutEffect(() => {
    const el = sheet.current;
    if (!mounted || !el) return;
    const paint = (y: number) => {
      el.style.transform = `translate3d(0, ${y}px, 0)`;
      const lowest = Math.max(...snapYs());
      const t = clamp(1 - (y - 0) / (lowest + (sheetHeight() - lowest)), 0, 1);
      if (backdrop.current) backdrop.current.style.opacity = String(t);
    };
    const c = draggable(el, {
      axis: 'y',
      handle: '.vz-sheet-grab',
      elastic: 0.2,
      cursor: false,
      apply: (_x, y) => paint(y),
      bounds: { top: 0 },
      onEnd: (s) => {
        const ys = snapYs();
        const projected = s.y + s.vy * 0.25;
        const lowest = Math.max(...ys);
        if (latest.current.dismissible && (projected > lowest + 80 || s.vy > 1400)) {
          close();
          return false;
        }
        let best = ys[0]!;
        for (const y of ys) if (Math.abs(y - projected) < Math.abs(best - projected)) best = y;
        c.setPosition({ y: best }, { velocity: { y: s.vy } });
        return false;
      },
    });
    controls.current = c;
    c.setPosition({ y: sheetHeight() + 20 }, { animate: false });
    requestAnimationFrame(() => c.setPosition({ y: snapYs()[defaultSnap] ?? 0 }));
    return () => {
      c.destroy();
      controls.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  useModalFocus(sheet, mounted && open, () => latest.current.dismissible && close());

  const cycle = () => {
    const c = controls.current;
    if (!c) return;
    const ys = snapYs();
    const i = ys.findIndex((y) => Math.abs(y - c.y) < 4);
    c.setPosition({ y: ys[(i + 1) % ys.length]! });
  };

  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(
    <div className="vz-sheet-root">
      <div
        ref={backdrop}
        className="vz-sheet-backdrop"
        onClick={() => latest.current.dismissible && close()}
        aria-hidden="true"
      />
      <div
        ref={sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : 'Sheet'}
        tabIndex={-1}
        className={cx('vz-sheet vz-glass', className)}
        style={{ height: `${Math.max(...snapPoints) * 100}vh` }}
      >
        <div className="vz-sheet-grab">
          <button
            type="button"
            className="vz-sheet-handle"
            onClick={cycle}
            aria-label="Resize sheet"
          />
          {title && (
            <h2 id={titleId} className="vz-sheet-title">
              {title}
            </h2>
          )}
        </div>
        <div className="vz-sheet-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

// ——————————————————————————— Infinite canvas ———————————————————————————

export interface InfiniteCanvasProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  /** Cell size in px. Default 240 × 300. */
  itemWidth?: number;
  itemHeight?: number;
  gap?: number;
  /** Shift every other column vertically for a masonry feel. Default true. */
  stagger?: boolean;
  className?: string;
  style?: CSSProperties;
  label?: string;
}

/** An endless, wrap-around grid you can drag and throw in every direction. */
export function InfiniteCanvas<T>({
  items,
  renderItem,
  itemWidth = 240,
  itemHeight = 300,
  gap = 24,
  stagger = true,
  className,
  style,
  label = 'Gallery — drag or use the arrow keys to explore',
}: InfiniteCanvasProps<T>) {
  const root = useRef<HTMLDivElement>(null);
  const cells = useRef<(HTMLDivElement | null)[]>([]);
  const [grid, setGrid] = useState({ cols: 0, rows: 0 });
  const [assign, setAssign] = useState<number[]>([]);
  const assignKey = useRef('');
  const pos = useRef({ x: 0, y: 0 });
  const cw = itemWidth + gap;
  const ch = itemHeight + gap;

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => {
      setGrid({
        cols: Math.ceil(el.clientWidth / cw) + 2,
        rows: Math.ceil(el.clientHeight / ch) + 2,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cw, ch]);

  const layout = useCallback(
    (ox: number, oy: number, speed = 0) => {
      const { cols, rows } = grid;
      if (!cols || !rows || !items.length) return;
      const next: number[] = [];
      const scale = 1 - Math.min(speed / 9000, 0.08);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const px = wrap(c * cw + ox, -cw, cols * cw - cw);
          const gx = Math.round((px - ox) / cw);
          const off = stagger && ((gx % 2) + 2) % 2 ? ch / 2 : 0;
          const py = wrap(r * ch + oy + off, -ch, rows * ch - ch);
          const gy = Math.round((py - oy - off) / ch);
          const el = cells.current[i];
          if (el)
            el.style.transform = `translate3d(${px}px, ${py}px, 0) scale(${scale.toFixed(3)})`;
          next.push((((gx * 7 + gy * 3) % items.length) + items.length) % items.length);
        }
      }
      const key = next.join(',');
      if (key !== assignKey.current) {
        assignKey.current = key;
        setAssign(next);
      }
    },
    [grid, items.length, cw, ch, stagger],
  );

  useLayoutEffect(() => layout(pos.current.x, pos.current.y), [layout]);

  const [own] = useDrag<HTMLDivElement>({
    keyboard: 120,
    elastic: 0,
    timeConstant: 0.5,
    cursor: true,
    apply: (x, y, s) => {
      pos.current = { x, y };
      layout(x, y, Math.hypot(s.vx, s.vy));
    },
  });

  const total = grid.cols * grid.rows;
  return (
    <div
      ref={useMergedRef(root, own)}
      className={cx('vz-infinite', className)}
      style={style}
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      {Array.from({ length: total }, (_, i) => {
        const index = assign[i] ?? i % Math.max(items.length, 1);
        return (
          <div
            key={i}
            ref={(el) => {
              cells.current[i] = el;
            }}
            className="vz-infinite-cell"
            style={{ width: itemWidth, height: itemHeight }}
          >
            {items.length ? renderItem(items[index]!, index) : null}
          </div>
        );
      })}
    </div>
  );
}

// ——————————————————————————— Physics world ———————————————————————————

export interface PhysicsWorldProps extends PhysicsOptions {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Receives the world API (impulse, setGravity…). */
  worldRef?: React.Ref<PhysicsWorldApi | null>;
  label?: string;
}

/** Every child becomes a circular body: they fall, collide, and can be grabbed and thrown. */
export function PhysicsWorld({
  children,
  className,
  style,
  worldRef,
  label = 'Physics playground — drag the shapes',
  ...options
}: PhysicsWorldProps) {
  const root = useRef<HTMLDivElement>(null);
  const world = useRef<PhysicsWorldApi | null>(null);
  const count = Children.count(children);
  const latest = useLatest(options);
  // `count` recreates the world (see below), so the handle must be refreshed with it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useImperativeHandle(worldRef, () => world.current as PhysicsWorldApi, [count]);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const w = createPhysicsWorld(el, latest.current);
    Array.from(el.children).forEach((c) => w.add(c as HTMLElement));
    world.current = w;
    return () => {
      w.destroy();
      world.current = null;
    };
  }, [count, latest]);
  useEffect(() => {
    world.current?.update(options);
  });
  return (
    <div
      ref={root}
      className={cx('vz-physics', className)}
      style={style}
      role="group"
      aria-label={label}
    >
      {children}
    </div>
  );
}
