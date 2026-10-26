import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
} from 'react';
import { clamp, frame, observeVisibility, prefersReducedMotion, stepSpring } from '@vizzele/core';
import { cx, useLatest, useMergedRef } from '../hooks/utils';

const svgId = (id: string) => id.replace(/[^\w-]/g, '');

/**
 * Runs `draw(dt)` every frame while the element is on screen, or once (dt = 0) with reduced
 * motion. `draw` returns whether it still needs frames when nothing else asks for them.
 */
function useLiquidLoop(
  el: RefObject<Element | null>,
  draw: (dt: number) => boolean,
  idle: boolean,
) {
  const latest = useLatest(draw);
  const kick = useRef<() => void>(() => {});
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    let stop: (() => void) | null = null;
    let visible = false;
    const run = () => {
      if (stop || !visible) return;
      stop = frame.add(({ delta }) => {
        const busy = latest.current(delta);
        if (!busy && !idle) {
          stop = null;
          return false;
        }
        return true;
      }, 'render');
    };
    kick.current = () => {
      if (prefersReducedMotion()) latest.current(0);
      else run();
    };
    const unobserve = observeVisibility(node, (v) => {
      visible = v;
      if (!v) {
        stop?.();
        stop = null;
      } else kick.current();
    });
    latest.current(0);
    return () => {
      unobserve();
      stop?.();
    };
  }, [el, latest, idle]);
  return kick;
}

// ——————————————————————————— Liquid gauge ———————————————————————————

export interface LiquidGaugeProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  /** Default 100. */
  max?: number;
  /** What it measures — the accessible name. */
  label: string;
  /** Diameter, px. Default 160. */
  size?: number;
  /** Text in the middle. Default the percentage. */
  format?: (value: number, max: number) => string;
}

/**
 * A round vessel of liquid light. The surface rolls gently, and when the value changes the
 * level overshoots and sloshes before it settles; the number inverts where the liquid covers it.
 */
export const LiquidGauge = /* @__PURE__ */ forwardRef<HTMLDivElement, LiquidGaugeProps>(
  function LiquidGauge(
    { value, max = 100, label, size = 160, format, className, style, ...rest },
    ref,
  ) {
    const id = svgId(useId());
    const box = useRef<HTMLDivElement>(null);
    const front = useRef<SVGPathElement>(null);
    const back = useRef<SVGPathElement>(null);
    const clipPath = useRef<SVGPathElement>(null);
    const pct = clamp(max > 0 ? value / max : 0, 0, 1);
    // Level in viewBox units: 96 = empty, 4 = full.
    const target = 96 - pct * 92;
    const s = useRef({ x: target, v: 0, phase: 0, amp: 2 });
    const text = format ? format(value, max) : `${Math.round(pct * 100)}%`;

    const kick = useLiquidLoop(
      box,
      (dt) => {
        const st = s.current;
        const moving = dt > 0 ? stepSpring(st, target, dt, 90, 7) : ((st.x = target), false);
        st.phase += dt * 2.2;
        // Fast changes slosh; the slosh decays back to a gentle roll.
        const want = 1.6 + Math.min(Math.abs(st.v) * 0.18, 7);
        st.amp += (want - st.amp) * Math.min(dt * (want > st.amp ? 10 : 1.6), 1);
        const surface = (amp: number, ph: number) => {
          let d = '';
          for (let x = -4; x <= 104; x += 6) {
            const y =
              st.x + Math.sin(x * 0.075 + ph) * amp + Math.sin(x * 0.04 - ph * 1.4) * amp * 0.45;
            d += `${d ? 'L' : 'M'}${x},${y.toFixed(2)}`;
          }
          return `${d}L104,104L-4,104Z`;
        };
        const f = surface(dt ? st.amp : 0, st.phase);
        front.current?.setAttribute('d', f);
        clipPath.current?.setAttribute('d', f);
        back.current?.setAttribute('d', surface(dt ? st.amp * 0.8 : 0, st.phase + 2.1));
        return moving || st.amp > 1.7;
      },
      true,
    );
    useEffect(() => kick.current(), [target, kick]);

    return (
      <div
        ref={useMergedRef(ref, box)}
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={text}
        className={cx('vz-gauge', className)}
        style={{ width: size, height: size, ...style }}
        {...rest}
      >
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <clipPath id={`${id}-v`}>
              <circle cx="50" cy="50" r="46" />
            </clipPath>
            <clipPath id={`${id}-l`}>
              <path ref={clipPath} />
            </clipPath>
            <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" className="vz-gauge-stop-a" />
              <stop offset="0.55" className="vz-gauge-stop-b" />
              <stop offset="1" className="vz-gauge-stop-c" />
            </linearGradient>
          </defs>
          <circle className="vz-gauge-glass" cx="50" cy="50" r="48" />
          <g clipPath={`url(#${id}-v)`}>
            <path ref={back} className="vz-gauge-back" fill={`url(#${id}-g)`} />
            <path ref={front} className="vz-gauge-front" fill={`url(#${id}-g)`} />
            <text x="50" y="50" className="vz-gauge-text">
              {text}
            </text>
            <g clipPath={`url(#${id}-l)`}>
              <text x="50" y="50" className="vz-gauge-text vz-gauge-text-in">
                {text}
              </text>
            </g>
          </g>
          <ellipse className="vz-gauge-shine" cx="36" cy="24" rx="16" ry="7" />
        </svg>
      </div>
    );
  },
);

// ——————————————————————————— Liquid rating ———————————————————————————

export interface LiquidRatingProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** Number of stars. Default 5. */
  max?: number;
  /** 1 or 0.5. Default 1. */
  step?: number;
  readOnly?: boolean;
  /** Accessible name. Default "Rating". */
  label?: string;
  /** Star size, px. Default 32. */
  size?: number;
}

const STAR = 24;
const GAP = 7;
const starPath = (cx: number) => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 4.9 : 11.4;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * r).toFixed(2)},${(12.6 + Math.sin(a) * r).toFixed(2)}`;
  }
  return `${d}Z`;
};

/**
 * Stars that fill with liquid. Light pours from one star into the next with a wobbling front,
 * overshoots a touch and settles; hovering previews the level. A slider for keyboards and
 * screen readers ("3 of 5 stars").
 */
export const LiquidRating = /* @__PURE__ */ forwardRef<HTMLDivElement, LiquidRatingProps>(
  function LiquidRating(
    {
      value: valueProp,
      defaultValue = 0,
      onChange,
      max = 5,
      step = 1,
      readOnly,
      label = 'Rating',
      size = 32,
      className,
      style,
      ...rest
    },
    ref,
  ) {
    const id = svgId(useId());
    const box = useRef<HTMLDivElement>(null);
    const liquid = useRef<SVGPathElement>(null);
    const [inner, setInner] = useState(defaultValue);
    const [hover, setHover] = useState<number | null>(null);
    const value = valueProp ?? inner;
    const shown = hover ?? value;
    const width = max * STAR + (max - 1) * GAP;
    const toX = (v: number) => {
      const i = Math.floor(v);
      return Math.min(i * (STAR + GAP) + (v - i) * STAR + (v >= max ? GAP : 0), width + GAP);
    };
    const target = toX(shown);
    const s = useRef({ x: target, v: 0, phase: 0 });

    const kick = useLiquidLoop(
      box,
      (dt) => {
        const st = s.current;
        const moving = dt > 0 ? stepSpring(st, target, dt, 130, 11) : ((st.x = target), false);
        st.phase += dt * 6;
        const amp = dt ? Math.min(Math.abs(st.v) * 0.035, 3.5) : 0;
        let d = `M-2,-2L${st.x.toFixed(2)},-2`;
        for (let y = 0; y <= 26; y += 2)
          d += `L${(st.x + Math.sin(y * 0.45 + st.phase) * amp).toFixed(2)},${y}`;
        liquid.current?.setAttribute('d', `${d}L${st.x.toFixed(2)},28L-2,28Z`);
        return moving;
      },
      false,
    );
    useEffect(() => kick.current(), [target, kick]);

    const set = (v: number) => {
      const next = clamp(Math.round(v / step) * step, 0, max);
      if (valueProp === undefined) setInner(next);
      onChange?.(next);
    };
    const fromPointer = (e: MouseEvent<HTMLDivElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * width;
      const i = Math.floor(x / (STAR + GAP));
      const within = clamp((x - i * (STAR + GAP)) / STAR, 0, 1);
      return clamp(i + (step < 1 ? (within > 0.5 ? 1 : 0.5) : 1), step, max);
    };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      const next =
        k === 'ArrowRight' || k === 'ArrowUp'
          ? value + step
          : k === 'ArrowLeft' || k === 'ArrowDown'
            ? value - step
            : k === 'Home'
              ? 0
              : k === 'End'
                ? max
                : null;
      if (next === null) return;
      e.preventDefault();
      set(next);
    };

    const stars = Array.from({ length: max }, (_, i) => starPath(i * (STAR + GAP) + STAR / 2));
    const interactive = !readOnly;
    return (
      <div
        ref={useMergedRef(ref, box)}
        className={cx('vz-rating', className)}
        style={{ height: size, width: (size * width) / 26, ...style }}
        {...(interactive
          ? {
              role: 'slider',
              tabIndex: 0,
              'aria-valuemin': 0,
              'aria-valuemax': max,
              'aria-valuenow': value,
              'aria-valuetext': `${value} of ${max} stars`,
              onKeyDown: onKey,
              onPointerMove: (e: MouseEvent<HTMLDivElement>) => setHover(fromPointer(e)),
              onPointerLeave: () => setHover(null),
              onClick: (e: MouseEvent<HTMLDivElement>) => set(fromPointer(e)),
            }
          : { role: 'img' })}
        aria-label={interactive ? label : `${label}: ${value} of ${max} stars`}
        data-readonly={readOnly ? '' : undefined}
        {...rest}
      >
        <svg viewBox={`0 0 ${width} 26`} aria-hidden="true" preserveAspectRatio="xMinYMid meet">
          <defs>
            <mask id={`${id}-m`}>
              {stars.map((d, i) => (
                <path key={i} d={d} fill="#fff" />
              ))}
            </mask>
            <linearGradient id={`${id}-g`} x1="0" x2="1">
              <stop offset="0" className="vz-gauge-stop-a" />
              <stop offset="0.5" className="vz-gauge-stop-b" />
              <stop offset="1" className="vz-gauge-stop-c" />
            </linearGradient>
          </defs>
          {stars.map((d, i) => (
            <path key={i} d={d} className="vz-rating-empty" />
          ))}
          <g mask={`url(#${id}-m)`}>
            <path ref={liquid} fill={`url(#${id}-g)`} className="vz-rating-liquid" />
          </g>
          {stars.map((d, i) => (
            <path key={i} d={d} className="vz-rating-rim" />
          ))}
        </svg>
      </div>
    );
  },
);
