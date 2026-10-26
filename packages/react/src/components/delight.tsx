import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { frame, observeVisibility, onPointerMove, prefersReducedMotion } from '@vizzele/core';
import { cx, useLatest, useMergedRef } from '../hooks/utils';

const PALETTE = ['#00e5ff', '#ff2bd6', '#ffb238', '#a8ff3e', '#7c5cff'];

// ——————————————————————————— Confetti ———————————————————————————

export interface ConfettiOptions {
  /** Pieces in the burst. Default 90. */
  count?: number;
  /** Cone width, degrees. Default 70. */
  spread?: number;
  /** Direction, degrees (−90 is straight up). Default −90. */
  angle?: number;
  /** Launch speed multiplier. Default 1. */
  power?: number;
  /** Defaults to the iridescent palette. */
  colors?: string[];
}

/**
 * Fires a burst of confetti from an element (or a point, or the middle of the screen) on a
 * throwaway canvas: paper flutters, tumbles, slows in the air and falls. Resolves when the last
 * piece has landed. Does nothing with reduced motion.
 */
export function confetti(
  origin?: Element | { x: number; y: number } | null,
  options: ConfettiOptions = {},
): Promise<void> {
  if (typeof document === 'undefined' || prefersReducedMotion()) return Promise.resolve();
  const { count = 90, spread = 70, angle = -90, power = 1, colors = PALETTE } = options;
  let x = innerWidth / 2;
  let y = innerHeight / 2;
  if (origin instanceof Element) {
    const r = origin.getBoundingClientRect();
    x = r.left + r.width / 2;
    y = r.top + r.height / 2;
  } else if (origin) ({ x, y } = origin);

  const dpr = Math.min(devicePixelRatio || 1, 2);
  const canvas = document.createElement('canvas');
  canvas.className = 'vz-confetti';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return Promise.resolve();
  }
  ctx.scale(dpr, dpr);

  const pieces = Array.from({ length: count }, (_, i) => {
    const a = ((angle + (Math.random() - 0.5) * spread) * Math.PI) / 180;
    const v = (380 + Math.random() * 620) * power;
    return {
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 4,
      round: i % 4 === 0,
      spin: Math.random() * Math.PI,
      vs: (Math.random() - 0.5) * 14,
      flip: Math.random() * Math.PI,
      vf: 6 + Math.random() * 8,
      color: colors[i % colors.length]!,
      age: 0,
      life: 1.8 + Math.random() * 1.4,
    };
  });

  return new Promise((resolve) => {
    frame.add(({ delta: dt }) => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      let alive = 0;
      for (const p of pieces) {
        p.age += dt;
        if (p.age > p.life || p.y > innerHeight + 40) continue;
        alive++;
        p.vx *= Math.exp(-dt * 2.2);
        p.vy = p.vy * Math.exp(-dt * 2.2) + 900 * dt;
        p.flip += p.vf * dt;
        p.spin += p.vs * dt;
        p.x += (p.vx + Math.sin(p.flip) * 40) * dt;
        p.y += p.vy * dt;
        ctx.save();
        ctx.globalAlpha = Math.min(1, (p.life - p.age) / 0.5);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);
        ctx.scale(1, Math.cos(p.flip));
        ctx.fillStyle = p.color;
        if (p.round) {
          ctx.beginPath();
          ctx.arc(0, 0, p.h / 1.6, 0, Math.PI * 2);
          ctx.fill();
        } else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) return true;
      canvas.remove();
      resolve();
      return false;
    }, 'render');
  });
}

// ——————————————————————————— Click spark ———————————————————————————

export interface ClickSparkProps extends HTMLAttributes<HTMLDivElement> {
  /** Sparks per click. Default 8. */
  count?: number;
  /** How far they fly, px. Default 26. */
  radius?: number;
  /** One colour, or the iridescent palette by default. */
  color?: string;
  /** Milliseconds. Default 450. */
  duration?: number;
}

/** Wrap anything: every click inside throws a ring of sparks from the exact point. */
export const ClickSpark = /* @__PURE__ */ forwardRef<HTMLDivElement, ClickSparkProps>(
  function ClickSpark(
    {
      count = 8,
      radius = 26,
      color,
      duration = 450,
      className,
      style,
      onPointerDown,
      children,
      ...rest
    },
    ref,
  ) {
    const el = useRef<HTMLDivElement>(null);
    const spark = (e: PointerEvent<HTMLDivElement>) => {
      onPointerDown?.(e);
      const node = el.current;
      if (!node || prefersReducedMotion()) return;
      const r = node.getBoundingClientRect();
      const burst = document.createElement('span');
      burst.className = 'vz-spark-burst';
      burst.setAttribute('aria-hidden', 'true');
      burst.style.cssText = `left:${e.clientX - r.left}px;top:${e.clientY - r.top}px;--vz-spark-r:${radius}px;--vz-spark-d:${duration}ms`;
      const turn = Math.random() * 360;
      for (let i = 0; i < count; i++) {
        const s = document.createElement('i');
        s.style.setProperty('--a', `${turn + (360 / count) * i}deg`);
        s.style.background = color ?? PALETTE[i % PALETTE.length]!;
        burst.appendChild(s);
      }
      node.appendChild(burst);
      setTimeout(() => burst.remove(), duration + 60);
    };
    return (
      <div
        ref={useMergedRef(ref, el)}
        className={cx('vz-click-spark', className)}
        style={style}
        onPointerDown={spark}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

// ——————————————————————————— Heart button ———————————————————————————

export interface HeartButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange'
> {
  liked?: boolean;
  defaultLiked?: boolean;
  onLikedChange?: (liked: boolean) => void;
  /** Likes from everyone else; yours is added on top. Omit to hide the number. */
  count?: number;
  /** Accessible name. Default "Like". */
  label?: string;
}

const HEART =
  'M12 20.6 4.4 13.3a4.9 4.9 0 0 1 0-7 4.9 4.9 0 0 1 7 0l.6.6.6-.6a4.9 4.9 0 0 1 7 0 4.9 4.9 0 0 1 0 7Z';

/**
 * A like button whose heart fills with a jelly pop, throws a ring and a spray of sparks, and
 * rolls the counter to its next number.
 */
export const HeartButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, HeartButtonProps>(
  function HeartButton(
    {
      liked: likedProp,
      defaultLiked = false,
      onLikedChange,
      count,
      label = 'Like',
      className,
      onClick,
      ...rest
    },
    ref,
  ) {
    const [inner, setInner] = useState(defaultLiked);
    const liked = likedProp ?? inner;
    // Animate only after a press, never on first paint.
    const [pressed, setPressed] = useState(false);
    const total = count === undefined ? undefined : count + (liked ? 1 : 0);
    return (
      <button
        ref={ref}
        type="button"
        className={cx('vz-heart', className)}
        aria-pressed={liked}
        aria-label={total === undefined ? label : `${label}, ${total.toLocaleString()}`}
        data-liked={liked ? '' : undefined}
        data-animate={pressed ? '' : undefined}
        onClick={(e) => {
          setPressed(true);
          setInner(!liked);
          onLikedChange?.(!liked);
          onClick?.(e);
        }}
        {...rest}
      >
        <span className="vz-heart-icon" aria-hidden="true">
          <span className="vz-heart-ring" />
          <span className="vz-heart-sparks">
            {PALETTE.concat(PALETTE.slice(0, 2)).map((c, i) => (
              <i key={i} style={{ '--a': `${i * 51.4}deg`, background: c } as CSSProperties} />
            ))}
          </span>
          <svg viewBox="0 0 24 24">
            <path className="vz-heart-outline" d={HEART} />
            <path className="vz-heart-fill" d={HEART} />
          </svg>
        </span>
        {total !== undefined && (
          <span className="vz-heart-count" aria-hidden="true">
            <span key={total} data-dir={liked ? 'up' : 'down'}>
              {total.toLocaleString()}
            </span>
          </span>
        )}
      </button>
    );
  },
);

// ——————————————————————————— Theme toggle ———————————————————————————

export type Theme = 'light' | 'dark';

export interface ThemeToggleProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange'
> {
  theme?: Theme;
  defaultTheme?: Theme;
  onThemeChange?: (theme: Theme) => void;
  /** Set `data-theme` on <html>. Default true. */
  apply?: boolean;
  /** Reveal the new theme in a circle growing from the toggle (View Transitions). Default true. */
  wipe?: boolean;
  /** Accessible name. Default "Dark mode". */
  label?: string;
}

type ViewTransitionDoc = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> };
};

/**
 * A day-to-night switch: the sun rolls across a sky that darkens, clouds drift off, stars come
 * out and a shadow bites the sun into a moon. The page itself changes in a circle that grows
 * from the switch, where the browser supports View Transitions.
 */
export const ThemeToggle = /* @__PURE__ */ forwardRef<HTMLButtonElement, ThemeToggleProps>(
  function ThemeToggle(
    {
      theme: themeProp,
      defaultTheme,
      onThemeChange,
      apply = true,
      wipe = true,
      label = 'Dark mode',
      className,
      onClick,
      ...rest
    },
    ref,
  ) {
    const el = useRef<HTMLButtonElement>(null);
    const [inner, setInner] = useState<Theme>(defaultTheme ?? 'dark');
    const theme = themeProp ?? inner;
    useEffect(() => {
      if (themeProp || defaultTheme) return;
      const t = document.documentElement.dataset.theme;
      setInner(
        t === 'light' || t === 'dark'
          ? t
          : matchMedia('(prefers-color-scheme: light)').matches
            ? 'light'
            : 'dark',
      );
    }, [themeProp, defaultTheme]);

    const toggle = () => {
      const next: Theme = theme === 'dark' ? 'light' : 'dark';
      const run = () => {
        if (apply) document.documentElement.dataset.theme = next;
        setInner(next);
        onThemeChange?.(next);
      };
      const doc = document as ViewTransitionDoc;
      const node = el.current;
      if (!wipe || !apply || !doc.startViewTransition || !node || prefersReducedMotion()) {
        run();
        return;
      }
      const r = node.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      const root = document.documentElement;
      root.classList.add('vz-theme-wipe');
      const t = doc.startViewTransition(run);
      t.ready
        .then(() =>
          root.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
            {
              duration: 700,
              easing: 'cubic-bezier(.2,.8,.2,1)',
              pseudoElement: '::view-transition-new(root)',
            },
          ),
        )
        .catch(() => {});
      t.finished.finally(() => root.classList.remove('vz-theme-wipe')).catch(() => {});
    };

    return (
      <button
        ref={useMergedRef(ref, el)}
        type="button"
        role="switch"
        aria-checked={theme === 'dark'}
        className={cx('vz-theme-toggle', className)}
        data-theme-state={theme}
        onClick={(e) => {
          toggle();
          onClick?.(e);
        }}
        {...rest}
      >
        <span className="vz-sr-only">{label}</span>
        <span className="vz-tt-sky" aria-hidden="true">
          <i className="vz-tt-cloud" />
          <i className="vz-tt-cloud" />
          {[0, 1, 2, 3, 4].map((i) => (
            <i key={i} className="vz-tt-star" />
          ))}
        </span>
        <span className="vz-tt-knob" aria-hidden="true">
          <span className="vz-tt-moon" />
        </span>
      </button>
    );
  },
);

// ——————————————————————————— Split flap ———————————————————————————

export interface SplitFlapProps extends HTMLAttributes<HTMLSpanElement> {
  value: string;
  /** Pad (or cut) to this many cells. Default the length of the value. */
  length?: number;
  /** The drum each cell flips through, in order. */
  chars?: string;
  /** Milliseconds per flip. Default 55. */
  speed?: number;
  /** Delay between cells starting, ms. Default 40. */
  stagger?: number;
  /** Default true. */
  uppercase?: boolean;
}

const DRUM = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.:-!?';

function Flap({
  to,
  chars,
  speed,
  delay,
}: {
  to: string;
  chars: string;
  speed: number;
  delay: number;
}) {
  const [cell, setCell] = useState({ cur: ' ', prev: ' ', n: 0 });
  useEffect(() => {
    if (cell.cur === to) return;
    if (prefersReducedMotion()) {
      setCell({ cur: to, prev: to, n: 0 });
      return;
    }
    const at = chars.indexOf(cell.cur);
    const next = at < 0 || !chars.includes(to) ? to : chars[(at + 1) % chars.length]!;
    const t = setTimeout(
      () => setCell((c) => ({ cur: next, prev: c.cur, n: c.n + 1 })),
      cell.n ? speed : delay,
    );
    return () => clearTimeout(t);
  }, [cell, to, chars, speed, delay]);
  return (
    <span className="vz-flap">
      <span className="vz-flap-top">{cell.cur}</span>
      <span className="vz-flap-bottom">{cell.prev}</span>
      {cell.n > 0 && (
        <>
          <span key={`a${cell.n}`} className="vz-flap-fold-top">
            {cell.prev}
          </span>
          <span key={`b${cell.n}`} className="vz-flap-fold-bottom">
            {cell.cur}
          </span>
        </>
      )}
    </span>
  );
}

/**
 * An airport departures board: each cell flips through its drum, letter by letter, until it
 * lands on the new text — a little clack of motion for headlines, prices and status.
 */
export const SplitFlap = /* @__PURE__ */ forwardRef<HTMLSpanElement, SplitFlapProps>(
  function SplitFlap(
    {
      value,
      length,
      chars = DRUM,
      speed = 55,
      stagger = 40,
      uppercase = true,
      className,
      style,
      ...rest
    },
    ref,
  ) {
    const text = uppercase ? value.toUpperCase() : value;
    const cells = Array.from(length ? text.padEnd(length).slice(0, length) : text);
    return (
      <span
        ref={ref}
        className={cx('vz-split-flap', className)}
        style={{ '--vz-flap-speed': `${speed}ms`, ...style } as CSSProperties}
        {...rest}
      >
        <span className="vz-sr-only">{value}</span>
        <span className="vz-flap-row" aria-hidden="true">
          {cells.map((c, i) => (
            <Flap key={i} to={c} chars={chars} speed={speed} delay={i * stagger} />
          ))}
        </span>
      </span>
    );
  },
);

// ——————————————————————————— Orbit ———————————————————————————

export interface OrbitRing {
  items: ReactNode[];
  /** px. */
  radius: number;
  /** Seconds per turn. Default radius / 5. */
  duration?: number;
  reverse?: boolean;
}

export interface OrbitProps extends HTMLAttributes<HTMLDivElement> {
  rings: OrbitRing[];
  /** Size of each orbiting item, px. Default 44. */
  itemSize?: number;
  /** Stop the orbits while hovered. Default true. */
  pauseOnHover?: boolean;
}

/**
 * Icons (or anything) circling a centre on concentric rings at their own speeds. Items stay
 * upright as they go round, grow on hover, and the orbits pause so they are easy to click.
 */
export const Orbit = /* @__PURE__ */ forwardRef<HTMLDivElement, OrbitProps>(function Orbit(
  { rings, itemSize = 44, pauseOnHover = true, className, style, children, ...rest },
  ref,
) {
  const size = Math.max(0, ...rings.map((r) => r.radius)) * 2 + itemSize;
  return (
    <div
      ref={ref}
      className={cx('vz-orbit', className)}
      data-pause={pauseOnHover ? '' : undefined}
      style={
        {
          '--vz-orbit-size': `${size}px`,
          '--vz-orbit-item': `${itemSize}px`,
          ...style,
        } as CSSProperties
      }
      {...rest}
    >
      {rings.map((ring, r) => (
        <div
          key={r}
          className="vz-orbit-ring"
          data-reverse={ring.reverse ? '' : undefined}
          style={
            {
              '--r': `${ring.radius}px`,
              '--d': `${ring.duration ?? ring.radius / 5}s`,
            } as CSSProperties
          }
        >
          {ring.items.map((item, i) => (
            <div
              key={i}
              className="vz-orbit-item"
              style={{ '--a': `${(360 / ring.items.length) * i + r * 23}deg` } as CSSProperties}
            >
              <div className="vz-orbit-body">{item}</div>
            </div>
          ))}
        </div>
      ))}
      {children && <div className="vz-orbit-center">{children}</div>}
    </div>
  );
});

// ——————————————————————————— Dot grid ———————————————————————————

export interface DotGridProps extends HTMLAttributes<HTMLDivElement> {
  /** Distance between dots, px. Default 24. */
  gap?: number;
  /** Dot radius, px. Default 1.4. */
  size?: number;
  /** Reach of the pointer, px. Default 130. */
  radius?: number;
  /** A click sends a shockwave through the grid. Default true. */
  shock?: boolean;
}

/**
 * A field of dots that behaves like a membrane: dots near the pointer swell, light up and lean
 * away on springs, and a click sends a ring-shaped shockwave rolling out across the grid.
 * Colours come from `--vz-text-dim` and `--vz-accent` (override `color` / `--vz-dot-active`).
 */
export const DotGrid = /* @__PURE__ */ forwardRef<HTMLDivElement, DotGridProps>(function DotGrid(
  { gap = 24, size = 1.4, radius = 130, shock = true, className, children, onPointerDown, ...rest },
  ref,
) {
  const el = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const opts = useLatest({ gap, size, radius, shock });
  const shockAt = useRef<(x: number, y: number) => void>(() => {});

  useEffect(() => {
    const host = el.current;
    const cv = canvas.current;
    const ctx = cv?.getContext('2d');
    if (!host || !cv || !ctx) return;
    const reduced = prefersReducedMotion();
    let w = 0;
    let h = 0;
    let dots = new Float32Array(0); // x, y, dx, dy, vx, vy, glow per dot
    let base = '#888';
    let hot = '#0ef';
    let pointer: { x: number; y: number } | null = null;
    const waves: { x: number; y: number; t: number }[] = [];
    let stop: (() => void) | null = null;
    let visible = false;

    const colours = () => {
      const cs = getComputedStyle(cv);
      base = cs.color;
      hot = cs.getPropertyValue('--vz-dot-active').trim() || cs.borderTopColor;
    };
    const layout = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = host.clientWidth;
      h = host.clientHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = opts.current.gap;
      const cols = Math.ceil(w / g) + 1;
      const rows = Math.ceil(h / g) + 1;
      const ox = (w - (cols - 1) * g) / 2;
      const oy = (h - (rows - 1) * g) / 2;
      dots = new Float32Array(cols * rows * 7);
      for (let i = 0; i < cols * rows; i++) {
        dots[i * 7] = ox + (i % cols) * g;
        dots[i * 7 + 1] = oy + Math.floor(i / cols) * g;
      }
      colours();
      draw(0);
    };

    const draw = (dt: number) => {
      const { radius: R, size: s } = opts.current;
      ctx.clearRect(0, 0, w, h);
      let busy = !!pointer || waves.length > 0;
      for (const wv of waves) wv.t += dt;
      while (waves.length && waves[0]!.t > 1.6) waves.shift();
      const k = Math.min(dt, 1 / 30);
      for (let i = 0; i < dots.length; i += 7) {
        const x = dots[i]!;
        const y = dots[i + 1]!;
        let fx = 0;
        let fy = 0;
        let lit = 0;
        if (pointer) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < R) {
            const f = 1 - d / R;
            lit = f * f;
            fx += (dx / (d || 1)) * f * 10;
            fy += (dy / (d || 1)) * f * 10;
          }
        }
        for (const wv of waves) {
          const dx = x - wv.x;
          const dy = y - wv.y;
          const d = Math.hypot(dx, dy);
          const front = wv.t * 520;
          const band = 1 - Math.abs(d - front) / 60;
          if (band > 0) {
            const fade = 1 - wv.t / 1.6;
            fx += (dx / (d || 1)) * band * 16 * fade;
            fy += (dy / (d || 1)) * band * 16 * fade;
            lit = Math.max(lit, band * fade);
          }
        }
        // Spring each dot toward its target offset; the glow eases on its own.
        if (reduced) {
          dots[i + 2] = 0;
          dots[i + 3] = 0;
          dots[i + 6] = lit;
        } else {
          let vx = dots[i + 4]!;
          let vy = dots[i + 5]!;
          vx += ((fx - dots[i + 2]!) * 180 - vx * 14) * k;
          vy += ((fy - dots[i + 3]!) * 180 - vy * 14) * k;
          dots[i + 4] = vx;
          dots[i + 5] = vy;
          dots[i + 2] = dots[i + 2]! + vx * k;
          dots[i + 3] = dots[i + 3]! + vy * k;
          dots[i + 6] = dots[i + 6]! + (lit - dots[i + 6]!) * Math.min(1, k * 12);
          if (Math.abs(vx) + Math.abs(vy) > 0.02 || dots[i + 6]! > 0.01) busy = true;
        }
        const g = dots[i + 6]!;
        ctx.globalAlpha = 0.55 + g * 0.45;
        ctx.fillStyle = g > 0.08 ? hot : base;
        ctx.beginPath();
        ctx.arc(x + dots[i + 2]!, y + dots[i + 3]!, s * (1 + g * 1.6), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      return busy;
    };

    const run = () => {
      if (stop || !visible) return;
      stop = frame.add(({ delta }) => {
        if (draw(delta)) return true;
        stop = null;
        return false;
      }, 'render');
    };
    const kick = () => (reduced ? draw(0) : run());

    const unPointer = onPointerMove((p) => {
      const r = host.getBoundingClientRect();
      const inside = p.active && p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
      if (!inside && !pointer) return;
      pointer = inside ? { x: p.x - r.left, y: p.y - r.top } : null;
      kick();
    });
    shockAt.current = (x, y) => {
      if (reduced || !opts.current.shock) return;
      waves.push({ x, y, t: 0 });
      kick();
    };
    const unVis = observeVisibility(host, (v) => {
      visible = v;
      if (!v) {
        stop?.();
        stop = null;
      } else kick();
    });
    const ro = new ResizeObserver(layout);
    ro.observe(host);
    // Follow theme switches.
    const mo = new MutationObserver(() => {
      colours();
      kick();
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });
    layout();
    return () => {
      unPointer();
      unVis();
      ro.disconnect();
      mo.disconnect();
      stop?.();
    };
  }, [opts, gap]);

  return (
    <div
      ref={useMergedRef(ref, el)}
      className={cx('vz-dot-grid', className)}
      onPointerDown={(e) => {
        onPointerDown?.(e);
        const r = e.currentTarget.getBoundingClientRect();
        shockAt.current(e.clientX - r.left, e.clientY - r.top);
      }}
      {...rest}
    >
      <canvas ref={canvas} className="vz-dot-grid-canvas" aria-hidden="true" />
      {children}
    </div>
  );
});
