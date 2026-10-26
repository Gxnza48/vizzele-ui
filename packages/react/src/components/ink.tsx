import {
  createElement,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import {
  clamp,
  frame,
  observeVisibility,
  onPointerMove,
  prefersReducedMotion,
  stepSpring,
} from '@vizzele/core';
import { cx, useLatest, useMergedRef } from '../hooks/utils';

// ——————————————————————————— Signature pad ———————————————————————————

interface InkPoint {
  x: number;
  y: number;
  w: number;
  hue: number;
}

export interface SignaturePadHandle {
  clear(): void;
  isEmpty(): boolean;
  /** PNG (or JPEG/WebP) of the signature at device resolution. */
  toDataURL(type?: string): string;
  /** The strokes as an SVG string — crisp at any size. */
  toSVG(): string;
}

export interface SignaturePadProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Accessible name. Default "Signature". */
  label?: string;
  /** Height, px. Default 200. */
  height?: number;
  /** 'iridescent' shifts hue along the stroke; any CSS colour draws in that ink. */
  ink?: string;
  /** Stroke width range, px: fast strokes thin out to min. Default [1.4, 4.4]. */
  minWidth?: number;
  maxWidth?: number;
  /** Called after every change with whether the pad is empty. */
  onChange?: (empty: boolean) => void;
  /** Placeholder on the baseline. Default "Sign here". */
  placeholder?: string;
}

/**
 * A pad to sign with liquid ink: strokes swell when you slow down and thin out when you flick,
 * and iridescent ink shifts hue along the line. Export as PNG or SVG. Keyboard users can type
 * their name instead — it is set in a script face on the same baseline.
 */
export const SignaturePad = /* @__PURE__ */ forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad(
    {
      label = 'Signature',
      height = 200,
      ink = 'iridescent',
      minWidth = 1.4,
      maxWidth = 4.4,
      onChange,
      placeholder = 'Sign here',
      className,
      style,
      ...rest
    },
    ref,
  ) {
    const canvas = useRef<HTMLCanvasElement>(null);
    const strokes = useRef<InkPoint[][]>([]);
    const current = useRef<InkPoint[] | null>(null);
    const last = useRef({ t: 0, w: (minWidth + maxWidth) / 2, hue: 190 });
    const [typed, setTyped] = useState('');
    const [typing, setTyping] = useState(false);
    const [empty, setEmpty] = useState(true);
    const latest = useLatest({ onChange, typed, ink });

    const color = (hue: number) =>
      latest.current.ink === 'iridescent' ? `hsl(${hue % 360} 95% 62%)` : latest.current.ink;

    const segment = (ctx: CanvasRenderingContext2D, a: InkPoint, b: InkPoint, c: InkPoint) => {
      // Midpoint-to-midpoint quadratic curves: smooth, with the width eased per segment.
      ctx.beginPath();
      ctx.moveTo((a.x + b.x) / 2, (a.y + b.y) / 2);
      ctx.quadraticCurveTo(b.x, b.y, (b.x + c.x) / 2, (b.y + c.y) / 2);
      ctx.lineWidth = b.w;
      ctx.strokeStyle = color(b.hue);
      ctx.shadowColor = color(b.hue);
      ctx.stroke();
    };

    const redraw = () => {
      const c = canvas.current;
      const ctx = c?.getContext('2d');
      if (!c || !ctx) return;
      const dpr = c.width / Math.max(c.clientWidth, 1);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, c.clientWidth, c.clientHeight);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 6;
      for (const s of strokes.current) {
        if (s.length === 1) {
          ctx.beginPath();
          ctx.fillStyle = color(s[0]!.hue);
          ctx.arc(s[0]!.x, s[0]!.y, s[0]!.w / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        for (let i = 1; i < s.length; i++) segment(ctx, s[Math.max(i - 2, 0)]!, s[i - 1]!, s[i]!);
      }
      const t = latest.current.typed.trim();
      if (t) {
        ctx.shadowBlur = 4;
        ctx.fillStyle = color(200);
        ctx.shadowColor = color(200);
        ctx.font = `italic 600 ${Math.min(c.clientHeight * 0.36, 64)}px "Segoe Script", "Brush Script MT", "Snell Roundhand", cursive`;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(t, 24, c.clientHeight * 0.7, c.clientWidth - 48);
      }
    };

    const changed = () => {
      const isEmpty = !strokes.current.length && !latest.current.typed.trim();
      setEmpty(isEmpty);
      latest.current.onChange?.(isEmpty);
    };

    useEffect(() => {
      const c = canvas.current;
      if (!c) return;
      const fit = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        c.width = Math.round(c.clientWidth * dpr);
        c.height = Math.round(c.clientHeight * dpr);
        redraw();
      };
      const ro = new ResizeObserver(fit);
      ro.observe(c);
      fit();
      return () => ro.disconnect();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
      redraw();
      changed();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [typed, ink]);

    useImperativeHandle(ref, () => ({
      clear() {
        strokes.current = [];
        setTyped('');
        latest.current.typed = '';
        redraw();
        changed();
      },
      isEmpty: () => !strokes.current.length && !latest.current.typed.trim(),
      toDataURL: (type = 'image/png') => canvas.current?.toDataURL(type) ?? '',
      toSVG() {
        const c = canvas.current;
        const w = c?.clientWidth ?? 0;
        const h = c?.clientHeight ?? 0;
        const paths = strokes.current
          .flatMap((s) =>
            s.slice(1).map((b, i) => {
              const a = s[Math.max(i - 1, 0)]!;
              const p = s[i]!;
              return `<path d="M${((a.x + p.x) / 2).toFixed(1)} ${((a.y + p.y) / 2).toFixed(1)}Q${p.x.toFixed(1)} ${p.y.toFixed(1)} ${((p.x + b.x) / 2).toFixed(1)} ${((p.y + b.y) / 2).toFixed(1)}" stroke="${color(p.hue)}" stroke-width="${p.w.toFixed(2)}"/>`;
            }),
          )
          .join('');
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
      },
    }));

    const point = (clientX: number, clientY: number, t: number, r: DOMRect): InkPoint => {
      const x = clientX - r.left;
      const y = clientY - r.top;
      const prev = current.current?.at(-1);
      const L = last.current;
      if (prev) {
        const dist = Math.hypot(x - prev.x, y - prev.y);
        const speed = dist / Math.max(t - L.t, 1); // px per ms
        const want = clamp(maxWidth - speed * 1.6, minWidth, maxWidth);
        L.w += (want - L.w) * 0.35;
        L.hue += dist * 0.6;
      }
      L.t = t;
      return { x, y, w: L.w, hue: L.hue };
    };

    return (
      <div
        className={cx('vz-signature', className)}
        style={{ height, ...style }}
        data-empty={empty ? '' : undefined}
        {...rest}
      >
        <canvas
          ref={canvas}
          role="img"
          aria-label={empty ? `${label}: empty` : `${label}: signed`}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            last.current.t = e.timeStamp;
            last.current.w = (minWidth + maxWidth) / 2;
            current.current = [];
            strokes.current.push(current.current);
            current.current.push(
              point(e.clientX, e.clientY, e.timeStamp, e.currentTarget.getBoundingClientRect()),
            );
            redraw();
          }}
          onPointerMove={(e) => {
            const s = current.current;
            if (!s || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
            const r = e.currentTarget.getBoundingClientRect();
            for (const ev of e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent])
              s.push(point(ev.clientX, ev.clientY, ev.timeStamp, r));
            const ctx = canvas.current?.getContext('2d');
            if (ctx && s.length > 2) {
              for (let i = Math.max(s.length - 3, 1); i < s.length; i++)
                segment(ctx, s[Math.max(i - 2, 0)]!, s[i - 1]!, s[i]!);
            }
          }}
          onPointerUp={() => {
            if (!current.current) return;
            current.current = null;
            redraw();
            changed();
          }}
        />
        <span className="vz-signature-line" aria-hidden="true">
          {empty && placeholder}
        </span>
        <div className="vz-signature-tools">
          {typing ? (
            <input
              className="vz-signature-type"
              aria-label={`Type your ${label.toLowerCase()}`}
              placeholder="Your name"
              autoFocus
              value={typed}
              onChange={(e) => {
                latest.current.typed = e.target.value;
                setTyped(e.target.value);
              }}
            />
          ) : (
            <button type="button" onClick={() => setTyping(true)}>
              Type instead
            </button>
          )}
          <button
            type="button"
            disabled={empty}
            onClick={() => {
              strokes.current = [];
              latest.current.typed = '';
              setTyped('');
              redraw();
              changed();
            }}
          >
            Clear
          </button>
        </div>
      </div>
    );
  },
);

// ——————————————————————————— Stream text ———————————————————————————

export interface StreamTextProps extends HTMLAttributes<HTMLElement> {
  /** The text so far. Append to it as tokens arrive, or pass it whole with `speed`. */
  text: string;
  /** Reveal a full `text` at this many characters per second (0 = show as it arrives). Default 0. */
  speed?: number;
  /** Still receiving: keeps the caret alive. */
  streaming?: boolean;
  as?: ElementType;
  /** Show the liquid caret. Default true. */
  caret?: boolean;
  onDone?: () => void;
}

/**
 * Text that arrives the way an AI answer does: each new word condenses out of a blur and rises
 * into place behind a glowing liquid caret. Feed it tokens as they stream, or a whole string at
 * a reading speed. Screen readers get the finished answer once, not a word at a time.
 */
export const StreamText = /* @__PURE__ */ forwardRef<HTMLElement, StreamTextProps>(
  function StreamText(
    { text, speed = 0, streaming, as = 'p', caret = true, onDone, className, ...rest },
    ref,
  ) {
    const [shown, setShown] = useState(speed > 0 ? 0 : text.length);
    const pos = useRef(shown);
    const latest = useLatest(onDone);
    useEffect(() => {
      if (speed <= 0 || prefersReducedMotion()) {
        pos.current = text.length;
        setShown(text.length);
        return;
      }
      pos.current = Math.min(pos.current, text.length);
      return frame.add(({ delta }) => {
        pos.current = Math.min(pos.current + speed * delta, text.length);
        // Reveal whole words only, like tokens.
        const at = Math.floor(pos.current);
        const next = text.slice(at).search(/\s/);
        setShown(next < 0 || at >= text.length ? text.length : at + next);
        return pos.current < text.length;
      });
    }, [text, speed]);
    const busy = !!streaming || shown < text.length;
    useEffect(() => {
      if (!busy) latest.current?.();
    }, [busy, latest]);

    const tokens = text.slice(0, shown).match(/\s*\S+\s*/g) ?? [];
    return createElement(
      as,
      { ref, className: cx('vz-stream', className), 'data-busy': busy ? '' : undefined, ...rest },
      <span aria-hidden="true">
        {tokens.map((t, i) => (
          <span key={i} className="vz-stream-token">
            {t}
          </span>
        ))}
        {caret && busy && <span className="vz-stream-caret" />}
      </span>,
      <span className="vz-sr-only" aria-live="polite">
        {busy ? '' : text}
      </span>,
    );
  },
);

// ——————————————————————————— Border light ———————————————————————————

export interface BorderLightProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children?: ReactNode;
  /** Degrees per second the light orbits while the pointer is away. Default 70. */
  speed?: number;
  /** Ring width, px. Default 1.5. */
  width?: number;
  /** Distance at which the light turns toward the pointer, px. Default 200. */
  proximity?: number;
}

/**
 * A comet of light that runs around the border. Bring the pointer close and it swings round to
 * meet it on a spring, brightening as you approach; move away and it resumes its orbit.
 */
export const BorderLight = /* @__PURE__ */ forwardRef<HTMLElement, BorderLightProps>(
  function BorderLight(
    { as = 'div', children, speed = 70, width = 1.5, proximity = 200, className, style, ...rest },
    ref,
  ) {
    const el = useRef<HTMLElement>(null);
    const opts = useLatest({ speed, proximity });
    useEffect(() => {
      const node = el.current;
      if (!node) return;
      const a = { x: 0, v: 0 };
      const glow = { x: 0, v: 0 };
      let near = 0;
      let aim = 0;
      let stop: (() => void) | null = null;
      const paint = () => {
        node.style.setProperty('--vz-bl-angle', `${a.x.toFixed(1)}deg`);
        node.style.setProperty('--vz-bl-glow', glow.x.toFixed(3));
      };
      const tick = ({ delta }: { delta: number }) => {
        if (near > 0) {
          // Shortest way round to the pointer.
          let d = aim - a.x;
          d = ((((d + 180) % 360) + 360) % 360) - 180;
          stepSpring(a, a.x + d, delta, 120, 16);
        } else {
          a.v *= Math.exp(-delta * 3);
          a.x += (opts.current.speed + a.v) * delta;
        }
        stepSpring(glow, near, delta, 140, 18);
        paint();
        return true;
      };
      const unPointer = onPointerMove((p) => {
        const r = node.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = clamp(p.x, r.left, r.right) - p.x;
        const dy = clamp(p.y, r.top, r.bottom) - p.y;
        const dist = Math.hypot(dx, dy);
        near = p.active ? clamp(1 - dist / opts.current.proximity, 0, 1) : 0;
        aim = (Math.atan2(p.y - cy, p.x - cx) * 180) / Math.PI + 90;
        if (prefersReducedMotion()) {
          glow.x = near;
          paint();
        }
      });
      const unVis = observeVisibility(node, (v) => {
        stop?.();
        stop = v && !prefersReducedMotion() ? frame.add(tick, 'render') : null;
      });
      paint();
      return () => {
        unPointer();
        unVis();
        stop?.();
      };
    }, [opts]);
    return createElement(
      as,
      {
        ref: useMergedRef(ref, el),
        className: cx('vz-border-light', className),
        style: { '--vz-bl-width': `${width}px`, ...style } as CSSProperties,
        ...rest,
      },
      <span className="vz-bl-glow" aria-hidden="true">
        <span />
      </span>,
      children,
    );
  },
);
