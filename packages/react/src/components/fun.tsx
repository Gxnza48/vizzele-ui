import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { clamp, frame, prefersReducedMotion, stepSpring } from '@vizzele/core';
import { cx, useMergedRef } from '../hooks/utils';

// ——————————————————————————— Sticker ———————————————————————————

type Pt = [number, number];

/** Keeps the part of a convex polygon on the positive side of the line through m with normal n. */
function clipHalf(poly: Pt[], m: Pt, n: Pt, sign: 1 | -1): Pt[] {
  const f = (p: Pt) => ((p[0] - m[0]) * n[0] + (p[1] - m[1]) * n[1]) * sign;
  const out: Pt[] = [];
  poly.forEach((a, i) => {
    const b = poly[(i + 1) % poly.length]!;
    const fa = f(a);
    const fb = f(b);
    if (fa >= 0) out.push(a);
    if (fa >= 0 !== fb >= 0) {
      const t = fa / (fa - fb);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  });
  return out;
}

/** The sticker you touched last sits on top of the others. */
let topZ = 1;

const poly = (pts: Pt[], dx = 0, dy = 0) =>
  pts.length < 3
    ? 'polygon(0 0, 0 0, 0 0)'
    : `polygon(${pts.map(([x, y]) => `${(x + dx).toFixed(1)}px ${(y + dy).toFixed(1)}px`).join(',')})`;

export interface StickerProps extends HTMLAttributes<HTMLDivElement> {
  /** Accessible name. */
  label: string;
  /** Rainbow foil that follows the pointer. Default true. */
  holo?: boolean;
  /** Can be peeled from a corner. Default true. */
  peelable?: boolean;
  /** Once peeled, drag it and drop it to stick it somewhere else. Default true. */
  movable?: boolean;
  onPeel?: () => void;
  onStick?: (offset: { x: number; y: number }) => void;
}

/**
 * A die-cut sticker. Grab a corner and peel it: the paper folds back along a real crease,
 * showing its white backing and casting a shadow. Pull far enough and it comes off — carry it
 * anywhere and let go to slap it down again. Tilts in 3D with holographic foil on hover.
 */
export const Sticker = /* @__PURE__ */ forwardRef<HTMLDivElement, StickerProps>(function Sticker(
  {
    label,
    holo = true,
    peelable = true,
    movable = true,
    onPeel,
    onStick,
    className,
    style,
    children,
    ...rest
  },
  ref,
) {
  const el = useRef<HTMLDivElement>(null);
  const face = useRef<HTMLDivElement>(null);
  const flap = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'stuck' | 'peeled'>('stuck');
  const [stuckAt, setStuckAt] = useState(0);
  const pos = useRef({ x: 0, y: 0 });
  const gesture = useRef<{
    kind: 'peel' | 'drag';
    corner?: Pt;
    sx: number;
    sy: number;
    ox: number;
    oy: number;
    w: number;
    h: number;
  } | null>(null);
  const tween = useRef<(() => void) | null>(null);

  const place = () => {
    const node = el.current;
    if (node) node.style.translate = `${pos.current.x}px ${pos.current.y}px`;
  };

  /** Folds the corner c of a w × h sticker to point p (local px). */
  const fold = (c: Pt, p: Pt, w: number, h: number) => {
    const f = face.current;
    const fl = flap.current;
    if (!f || !fl) return;
    const d = Math.hypot(p[0] - c[0], p[1] - c[1]);
    if (d < 0.5) {
      f.style.clipPath = '';
      fl.style.clipPath = 'polygon(0 0, 0 0, 0 0)';
      return;
    }
    const n: Pt = [(p[0] - c[0]) / d, (p[1] - c[1]) / d];
    const m: Pt = [(p[0] + c[0]) / 2, (p[1] + c[1]) / 2];
    const rect: Pt[] = [
      [0, 0],
      [w, 0],
      [w, h],
      [0, h],
    ];
    const kept = clipHalf(rect, m, n, 1);
    const lifted = clipHalf(rect, m, n, -1).map(([x, y]): Pt => {
      const k = 2 * ((x - m[0]) * n[0] + (y - m[1]) * n[1]);
      return [x - k * n[0], y - k * n[1]];
    });
    f.style.clipPath = poly(kept);
    // The flap layer is three times the sticker's size, so the fold can reach past its edges.
    fl.style.clipPath = poly(lifted, w, h);
    fl.style.setProperty('--vz-st-a', `${(Math.atan2(n[0], -n[1]) * 180) / Math.PI}deg`);
  };

  const animateFold = (
    c: Pt,
    from: Pt,
    to: Pt,
    w: number,
    h: number,
    ms: number,
    done: () => void,
  ) => {
    tween.current?.();
    let t = 0;
    tween.current = frame.add(({ delta }) => {
      t = Math.min(1, t + (delta * 1000) / ms);
      const e = 1 - (1 - t) ** 3;
      fold(c, [from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e], w, h);
      if (t < 1) return true;
      tween.current = null;
      done();
      return false;
    }, 'render');
  };

  const peelOff = (c: Pt, from: Pt, w: number, h: number) => {
    const done = () => {
      fold(c, c, w, h);
      setState('peeled');
      onPeel?.();
    };
    if (prefersReducedMotion()) return done();
    // Carry on to the opposite corner, then lift off.
    animateFold(
      c,
      from,
      [w - c[0] + (w - c[0] - c[0]) * 0.1, h - c[1] + (h - c[1] - c[1]) * 0.1],
      w,
      h,
      180,
      done,
    );
  };

  const stick = () => {
    setState('stuck');
    setStuckAt((n) => n + 1);
    onStick?.({ ...pos.current });
  };

  useEffect(() => () => tween.current?.(), []);

  const down = (e: PointerEvent<HTMLDivElement>) => {
    const node = el.current;
    if (!node || e.button > 0) return;
    const r = face.current!.getBoundingClientRect();
    const w = face.current!.offsetWidth;
    const h = face.current!.offsetHeight;
    // Pointer in the sticker's own (unscaled) space.
    const lx = ((e.clientX - r.left) / r.width) * w;
    const ly = ((e.clientY - r.top) / r.height) * h;
    const base = { sx: e.clientX, sy: e.clientY, ox: pos.current.x, oy: pos.current.y, w, h };
    if (state === 'peeled') {
      if (!movable) return;
      gesture.current = { kind: 'drag', ...base };
    } else {
      if (!peelable) return;
      const corner: Pt = [lx < w / 2 ? 0 : w, ly < h / 2 ? 0 : h];
      if (Math.hypot(lx - corner[0], ly - corner[1]) > Math.min(w, h) * 0.5) return;
      tween.current?.();
      gesture.current = { kind: 'peel', corner, ...base };
      node.dataset.peeling = '';
    }
    node.style.zIndex = String(++topZ);
    node.setPointerCapture(e.pointerId);
    e.preventDefault();
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    const node = el.current;
    if (!g || !node) {
      // Hover: tilt toward the pointer and slide the foil.
      if (!node || prefersReducedMotion()) return;
      const r = node.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      node.style.setProperty('--vz-st-x', `${(px * 100).toFixed(1)}%`);
      node.style.setProperty('--vz-st-y', `${(py * 100).toFixed(1)}%`);
      node.style.setProperty('--vz-st-rx', `${((0.5 - py) * 16).toFixed(2)}deg`);
      node.style.setProperty('--vz-st-ry', `${((px - 0.5) * 16).toFixed(2)}deg`);
      return;
    }
    if (g.kind === 'drag') {
      pos.current = { x: g.ox + e.clientX - g.sx, y: g.oy + e.clientY - g.sy };
      place();
      return;
    }
    const c = g.corner!;
    const diag = Math.hypot(g.w, g.h);
    let px = c[0] + e.clientX - g.sx;
    let py = c[1] + e.clientY - g.sy;
    const d = Math.hypot(px - c[0], py - c[1]);
    if (d > diag * 1.6) {
      px = c[0] + ((px - c[0]) / d) * diag * 1.6;
      py = c[1] + ((py - c[1]) / d) * diag * 1.6;
    }
    fold(c, [px, py], g.w, g.h);
  };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    const node = el.current;
    gesture.current = null;
    if (!g || !node) return;
    delete node.dataset.peeling;
    if (g.kind === 'drag') {
      stick();
      return;
    }
    const c = g.corner!;
    const p: Pt = [c[0] + e.clientX - g.sx, c[1] + e.clientY - g.sy];
    const far = Math.hypot(p[0] - c[0], p[1] - c[1]) > Math.min(g.w, g.h) * 0.75;
    if (far && movable) peelOff(c, p, g.w, g.h);
    else if (prefersReducedMotion()) fold(c, c, g.w, g.h);
    else animateFold(c, p, c, g.w, g.h, 260, () => fold(c, c, g.w, g.h));
  };
  const leave = () => {
    const node = el.current;
    if (!node || gesture.current) return;
    node.style.setProperty('--vz-st-rx', '0deg');
    node.style.setProperty('--vz-st-ry', '0deg');
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    rest.onKeyDown?.(e);
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (state === 'peeled') stick();
      else if (peelable) {
        if (el.current) el.current.style.zIndex = String(++topZ);
        setState('peeled');
        onPeel?.();
      }
      return;
    }
    if (state !== 'peeled') return;
    const step = e.shiftKey ? 40 : 10;
    const d = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }[e.key];
    if (!d) return;
    e.preventDefault();
    pos.current = { x: pos.current.x + d[0]!, y: pos.current.y + d[1]! };
    place();
  };

  return (
    <div
      ref={useMergedRef(ref, el)}
      className={cx('vz-sticker', className)}
      data-state={state}
      data-holo={holo ? '' : undefined}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={state === 'peeled'}
      aria-roledescription="sticker"
      style={style}
      {...rest}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onPointerLeave={leave}
      onKeyDown={key}
    >
      <div className="vz-sticker-body" key={stuckAt} data-slap={stuckAt ? '' : undefined}>
        <div ref={face} className="vz-sticker-face">
          {children}
          <span className="vz-sticker-foil" aria-hidden="true" />
        </div>
        <div className="vz-sticker-flap" aria-hidden="true">
          <div ref={flap} />
        </div>
      </div>
    </div>
  );
});

// ——————————————————————————— Status badge ———————————————————————————

export type Status =
  | 'online'
  | 'away'
  | 'busy'
  | 'offline'
  | 'live'
  | 'operational'
  | 'degraded'
  | 'outage'
  | 'maintenance';

const STATUS_TEXT: Record<Status, string> = {
  online: 'Online',
  away: 'Away',
  busy: 'Busy',
  offline: 'Offline',
  live: 'Live',
  operational: 'All systems operational',
  degraded: 'Degraded performance',
  outage: 'Major outage',
  maintenance: 'Under maintenance',
};

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: Status;
  /** Override the text. */
  children?: ReactNode;
  /** Just the dot (keeps the text for screen readers). */
  dotOnly?: boolean;
}

/** A status pill with a living dot: it pulses when live or online, blinks on an outage. */
export const StatusBadge = /* @__PURE__ */ forwardRef<HTMLSpanElement, StatusBadgeProps>(
  function StatusBadge({ status, children, dotOnly, className, ...rest }, ref) {
    return (
      <span
        ref={ref}
        className={cx('vz-status', className)}
        data-status={status}
        data-dot-only={dotOnly ? '' : undefined}
        {...rest}
      >
        <span className="vz-status-dot" aria-hidden="true" />
        <span className={dotOnly ? 'vz-sr-only' : 'vz-status-text'}>
          {children ?? STATUS_TEXT[status]}
        </span>
      </span>
    );
  },
);

// ——————————————————————————— Badge ———————————————————————————

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Default 'soft'. */
  variant?: 'soft' | 'solid' | 'outline' | 'glow' | 'shine' | 'holo';
  /** Default 'accent'. */
  color?: 'accent' | 'cyan' | 'magenta' | 'amber' | 'acid' | 'violet' | 'neutral';
  /** Default 'md'. */
  size?: 'sm' | 'md';
  icon?: ReactNode;
}

/** Small labels with personality: soft, solid, outline, a breathing glow, a sweep of light, or holographic foil. */
export const Badge = /* @__PURE__ */ forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant = 'soft', color = 'accent', size = 'md', icon, className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx('vz-badge', className)}
      data-variant={variant}
      data-color={color}
      data-size={size}
      {...rest}
    >
      {icon && (
        <span className="vz-badge-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
});

// ——————————————————————————— Compare slider ———————————————————————————

export interface CompareSliderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  before: ReactNode;
  after: ReactNode;
  /** 0–100. */
  position?: number;
  defaultPosition?: number;
  onPositionChange?: (position: number) => void;
  /** Default "Before" / "After". */
  beforeLabel?: string;
  afterLabel?: string;
  /** Follow the pointer without pressing. Default false. */
  hover?: boolean;
  /** Accessible name of the handle. Default "Comparison". */
  label?: string;
}

/**
 * Before and after, split by a handle you drag. The handle is a drop of liquid: it stretches
 * with speed and wobbles back when you stop.
 */
export const CompareSlider = /* @__PURE__ */ forwardRef<HTMLDivElement, CompareSliderProps>(
  function CompareSlider(
    {
      before,
      after,
      position: posProp,
      defaultPosition = 50,
      onPositionChange,
      beforeLabel = 'Before',
      afterLabel = 'After',
      hover = false,
      label = 'Comparison',
      className,
      style,
      ...rest
    },
    ref,
  ) {
    const el = useRef<HTMLDivElement>(null);
    const knob = useRef<HTMLSpanElement>(null);
    const [inner, setInner] = useState(defaultPosition);
    const pos = clamp(posProp ?? inner, 0, 100);
    const dragging = useRef(false);
    const squash = useRef({ x: 0, v: 0, last: pos, stop: null as null | (() => void) });

    const set = (p: number) => {
      const v = clamp(p, 0, 100);
      setInner(v);
      onPositionChange?.(v);
    };
    // Speed stretches the knob; a spring brings it back round.
    useEffect(() => {
      const s = squash.current;
      const dv = pos - s.last;
      s.last = pos;
      if (prefersReducedMotion() || !knob.current) return;
      s.v += dv * 2.2;
      s.stop ??= frame.add(({ delta }) => {
        const busy = stepSpring(s, 0, delta, 260, 9);
        const k = clamp(s.x, -0.6, 0.6);
        knob.current?.style.setProperty('--vz-cmp-sx', String(1 + Math.abs(k)));
        knob.current?.style.setProperty('--vz-cmp-sy', String(1 - Math.abs(k) * 0.4));
        if (busy) return true;
        s.stop = null;
        return false;
      }, 'render');
    }, [pos]);
    useEffect(() => () => squash.current.stop?.(), []);

    const at = (clientX: number) => {
      const r = el.current!.getBoundingClientRect();
      set(((clientX - r.left) / r.width) * 100);
    };

    return (
      <div
        ref={useMergedRef(ref, el)}
        className={cx('vz-compare', className)}
        style={{ '--vz-cmp': `${pos}%`, '--vz-cmp-n': pos, ...style } as CSSProperties}
        onPointerDown={(e) => {
          if (e.button > 0) return;
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          at(e.clientX);
          knob.current?.focus({ preventScroll: true });
        }}
        onPointerMove={(e) => {
          if (dragging.current || (hover && e.pointerType === 'mouse')) at(e.clientX);
        }}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
        {...rest}
      >
        <div className="vz-compare-before">{before}</div>
        <div className="vz-compare-after">{after}</div>
        <span className="vz-compare-tag" data-side="before" aria-hidden="true">
          {beforeLabel}
        </span>
        <span className="vz-compare-tag" data-side="after" aria-hidden="true">
          {afterLabel}
        </span>
        <span className="vz-compare-line" aria-hidden="true" />
        <span
          ref={knob}
          className="vz-compare-knob"
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          aria-valuetext={`${Math.round(pos)}% ${beforeLabel.toLowerCase()}`}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 10 : 2;
            const next =
              e.key === 'ArrowLeft' || e.key === 'ArrowDown'
                ? pos - step
                : e.key === 'ArrowRight' || e.key === 'ArrowUp'
                  ? pos + step
                  : e.key === 'Home'
                    ? 0
                    : e.key === 'End'
                      ? 100
                      : null;
            if (next === null) return;
            e.preventDefault();
            set(next);
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 7-5 5 5 5M15 7l5 5-5 5" />
          </svg>
        </span>
      </div>
    );
  },
);

// ——————————————————————————— Flip card ———————————————————————————

export interface FlipCardProps extends HTMLAttributes<HTMLDivElement> {
  front: ReactNode;
  back: ReactNode;
  flipped?: boolean;
  defaultFlipped?: boolean;
  onFlippedChange?: (flipped: boolean) => void;
  /** Flip on click (and Enter/Space), or while hovered. Default 'click'. */
  trigger?: 'click' | 'hover';
  /** Default 'horizontal'. */
  direction?: 'horizontal' | 'vertical';
  /** Accessible name when it flips on click. */
  label?: string;
}

/**
 * A card with two faces that turns over on a spring — overshooting a little and settling — and
 * leans toward the pointer with a moving glare. The hidden face is inert.
 */
export const FlipCard = /* @__PURE__ */ forwardRef<HTMLDivElement, FlipCardProps>(function FlipCard(
  {
    front,
    back,
    flipped: flippedProp,
    defaultFlipped = false,
    onFlippedChange,
    trigger = 'click',
    direction = 'horizontal',
    label,
    className,
    ...rest
  },
  ref,
) {
  const el = useRef<HTMLDivElement>(null);
  const [inner, setInner] = useState(defaultFlipped);
  const [hovered, setHovered] = useState(false);
  const flipped = flippedProp ?? (trigger === 'hover' ? hovered || inner : inner);
  const toggle = () => {
    setInner(!flipped);
    onFlippedChange?.(!flipped);
  };
  const click = trigger === 'click';
  return (
    <div
      ref={useMergedRef(ref, el)}
      className={cx('vz-flip', className)}
      data-flipped={flipped ? '' : undefined}
      data-direction={direction}
      {...(click
        ? {
            role: 'button',
            tabIndex: 0,
            'aria-pressed': flipped,
            'aria-label': label,
            onClick: toggle,
            onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
              }
            },
          }
        : {
            onPointerEnter: () => setHovered(true),
            onPointerLeave: () => setHovered(false),
            onFocus: () => setHovered(true),
            onBlur: () => setHovered(false),
          })}
      onPointerMove={(e) => {
        const node = el.current;
        if (!node || prefersReducedMotion()) return;
        const r = node.getBoundingClientRect();
        node.style.setProperty(
          '--vz-flip-x',
          `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`,
        );
        node.style.setProperty(
          '--vz-flip-y',
          `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`,
        );
        node.style.setProperty(
          '--vz-flip-rx',
          `${(((e.clientY - r.top) / r.height - 0.5) * -10).toFixed(2)}deg`,
        );
        node.style.setProperty(
          '--vz-flip-ry',
          `${(((e.clientX - r.left) / r.width - 0.5) * 10).toFixed(2)}deg`,
        );
      }}
      {...rest}
    >
      <div className="vz-flip-inner">
        <div className="vz-flip-face" aria-hidden={flipped} inert={flipped || undefined}>
          {front}
        </div>
        <div
          className="vz-flip-face vz-flip-back"
          aria-hidden={!flipped}
          inert={!flipped || undefined}
        >
          {back}
        </div>
        <span className="vz-flip-glare" aria-hidden="true" />
      </div>
    </div>
  );
});
