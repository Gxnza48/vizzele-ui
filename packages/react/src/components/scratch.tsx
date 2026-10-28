import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { frame, prefersReducedMotion } from '@vizzele/core';
import { cx, inertProps, useLatest, useMergedRef } from '../hooks/utils';
import { confetti as fireConfetti } from './delight';

const FOIL = ['#c9ced9', '#eef1f6', '#a7afc0', '#f6f2ff', '#b9c1d3'];
/** Coverage is tracked on a coarse grid instead of reading pixels back from the canvas. */
const GRID = 24;

export interface ScratchCardProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onProgress'
> {
  /** The prize under the foil. */
  children: ReactNode;
  /** Printed on the foil. Default "Scratch to reveal". */
  label?: string;
  /** Foil gradient. Defaults to holographic silver. */
  colors?: string[];
  /** Brush radius in px. Default 22. */
  brush?: number;
  /** Share of the foil (0–1) to scratch before the rest falls away. Default 0.55. */
  threshold?: number;
  /** Throw confetti from the card when it's revealed. Default false. */
  confetti?: boolean;
  /** Text of the button keyboard and screen-reader users get instead. Default "Reveal". */
  revealLabel?: string;
  /** Scratched share, 0–1, as you go. */
  onProgress?: (progress: number) => void;
  onReveal?: () => void;
}

type Flake = { x: number; y: number; vx: number; vy: number; r: number; a: number; c: string };

/**
 * A lottery-ticket foil over any content. Drag a finger or the mouse to scratch it off: the
 * foil flakes away under the brush, catches the light as you hover, and once you've cleared
 * enough the rest dissolves. Keyboard and screen-reader users get a plain Reveal button.
 */
export const ScratchCard = /* @__PURE__ */ forwardRef<HTMLDivElement, ScratchCardProps>(
  function ScratchCard(
    {
      children,
      label = 'Scratch to reveal',
      colors = FOIL,
      brush = 22,
      threshold = 0.55,
      confetti = false,
      revealLabel = 'Reveal',
      onProgress,
      onReveal,
      className,
      ...rest
    },
    forwarded,
  ) {
    const root = useRef<HTMLDivElement>(null);
    const ref = useMergedRef(root, forwarded);
    const foil = useRef<HTMLCanvasElement>(null);
    const dust = useRef<HTMLCanvasElement>(null);
    const glint = useRef<HTMLSpanElement>(null);
    const [revealed, setRevealed] = useState(false);
    const latest = useLatest({ onProgress, onReveal, confetti, threshold, brush });
    const api = useRef<{
      start: (x: number, y: number) => void;
      move: (x: number, y: number) => void;
    } | null>(null);
    const done = useRef(false);

    const reveal = () => {
      if (done.current) return;
      done.current = true;
      setRevealed(true);
      latest.current.onProgress?.(1);
      latest.current.onReveal?.();
      if (latest.current.confetti) void fireConfetti(root.current, { count: 70 });
    };

    useEffect(() => {
      const el = root.current;
      const canvas = foil.current;
      const flakesCanvas = dust.current;
      const ctx = canvas?.getContext('2d');
      const fctx = flakesCanvas?.getContext('2d');
      if (!el || !canvas || !flakesCanvas || !ctx || !fctx) return;

      let w = 0;
      let h = 0;
      let dpr = 1;
      // Every stroke is kept, so a resize can repaint the foil and replay the scratches.
      const strokes: [number, number, number, number][] = [];
      const cells = new Uint8Array(GRID * GRID);
      let cleared = 0;
      let last: [number, number] | null = null;
      const flakes: Flake[] = [];
      let stopFlakes: (() => void) | null = null;

      const paintFoil = () => {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        const g = ctx.createLinearGradient(0, 0, w, h);
        colors.forEach((c, i) => g.addColorStop(i / Math.max(colors.length - 1, 1), c));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        // Fine brushed lines and a sprinkle of glitter.
        ctx.globalAlpha = 0.08;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        for (let x = -h; x < w; x += 6) {
          ctx.beginPath();
          ctx.moveTo(x, h);
          ctx.lineTo(x + h, 0);
          ctx.stroke();
        }
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#fff';
        for (let i = 0; i < (w * h) / 260; i++)
          ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
        ctx.globalAlpha = 1;
        if (label) {
          ctx.fillStyle = 'rgba(30, 34, 46, 0.55)';
          ctx.font = `600 ${Math.max(12, Math.min(18, w / 16))}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, w / 2, h / 2);
        }
      };

      const scratch = (x0: number, y0: number, x1: number, y1: number) => {
        const r = latest.current.brush;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = r * 2;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1 + 0.01, y1);
        ctx.stroke();
      };

      const mark = (x0: number, y0: number, x1: number, y1: number) => {
        const r = latest.current.brush;
        const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (r * 0.5)));
        for (let s = 0; s <= steps; s++) {
          const x = x0 + ((x1 - x0) * s) / steps;
          const y = y0 + ((y1 - y0) * s) / steps;
          const c0 = Math.max(0, Math.floor(((x - r * 0.7) / w) * GRID));
          const c1 = Math.min(GRID - 1, Math.floor(((x + r * 0.7) / w) * GRID));
          const r0 = Math.max(0, Math.floor(((y - r * 0.7) / h) * GRID));
          const r1 = Math.min(GRID - 1, Math.floor(((y + r * 0.7) / h) * GRID));
          for (let row = r0; row <= r1; row++)
            for (let col = c0; col <= c1; col++) {
              const i = row * GRID + col;
              if (!cells[i]) {
                cells[i] = 1;
                cleared++;
              }
            }
        }
      };

      const tickFlakes = ({ delta }: { delta: number }) => {
        fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        fctx.clearRect(0, 0, w, h);
        for (let i = flakes.length - 1; i >= 0; i--) {
          const f = flakes[i]!;
          f.vy += 900 * delta;
          f.x += f.vx * delta;
          f.y += f.vy * delta;
          f.a -= delta * 1.6;
          if (f.a <= 0 || f.y > h + 10) {
            flakes.splice(i, 1);
            continue;
          }
          fctx.globalAlpha = f.a;
          fctx.fillStyle = f.c;
          fctx.fillRect(f.x, f.y, f.r, f.r * 0.6);
        }
        if (flakes.length) return true;
        fctx.clearRect(0, 0, w, h);
        stopFlakes = null;
        return false;
      };

      const shed = (x: number, y: number, n: number) => {
        if (prefersReducedMotion()) return;
        for (let i = 0; i < n && flakes.length < 120; i++)
          flakes.push({
            x: x + (Math.random() - 0.5) * latest.current.brush,
            y: y + (Math.random() - 0.5) * latest.current.brush,
            vx: (Math.random() - 0.5) * 160,
            vy: -Math.random() * 140,
            r: 2 + Math.random() * 3,
            a: 1,
            c: colors[Math.floor(Math.random() * colors.length)]!,
          });
        stopFlakes ??= frame.add(tickFlakes, 'render');
      };

      const progress = () => {
        const p = cleared / cells.length;
        latest.current.onProgress?.(p);
        if (p >= latest.current.threshold) reveal();
      };

      const resize = () => {
        const rect = el.getBoundingClientRect();
        w = Math.max(1, rect.width);
        h = Math.max(1, rect.height);
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        for (const c of [canvas, flakesCanvas]) {
          c.width = Math.round(w * dpr);
          c.height = Math.round(h * dpr);
        }
        paintFoil();
        for (const [a, b, c, d] of strokes) scratch(a, b, c, d);
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el);

      let moves = 0;
      api.current = {
        start(x, y) {
          last = [x, y];
          strokes.push([x, y, x, y]);
          scratch(x, y, x, y);
          mark(x, y, x, y);
          shed(x, y, 6);
        },
        move(x, y) {
          if (!last) return;
          const [lx, ly] = last;
          strokes.push([lx, ly, x, y]);
          scratch(lx, ly, x, y);
          mark(lx, ly, x, y);
          shed(x, y, Math.min(4, Math.ceil(Math.hypot(x - lx, y - ly) / 12)));
          last = [x, y];
          // Counting cells is cheap, but there's no need to report every pointer event.
          if (++moves % 4 === 0) progress();
        },
      };
      const end = () => {
        if (last) progress();
        last = null;
      };
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
      return () => {
        ro.disconnect();
        stopFlakes?.();
        api.current = null;
        window.removeEventListener('pointerup', end);
        window.removeEventListener('pointercancel', end);
      };
      // The foil is painted once per mount; colours and label are read at paint time.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const local = (e: PointerEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top] as const;
    };

    return (
      <div
        ref={ref}
        className={cx('vz-scratch', className)}
        data-revealed={revealed ? '' : undefined}
        {...rest}
      >
        <div className="vz-scratch-prize" {...inertProps(!revealed)}>
          {children}
        </div>
        <canvas
          ref={foil}
          className="vz-scratch-foil"
          aria-hidden="true"
          onPointerDown={(e) => {
            if (revealed) return;
            e.currentTarget.setPointerCapture?.(e.pointerId);
            api.current?.start(...local(e));
          }}
          onPointerMove={(e) => {
            const [x, y] = local(e);
            // The glint is moved with a transform only: no style recalculation, no repaint.
            if (glint.current) glint.current.style.transform = `translate(${x}px, ${y}px)`;
            if (e.buttons || e.pointerType === 'touch') api.current?.move(x, y);
          }}
        />
        <span ref={glint} className="vz-scratch-glint" aria-hidden="true" />
        <canvas ref={dust} className="vz-scratch-dust" aria-hidden="true" />
        {!revealed && (
          <button type="button" className="vz-scratch-reveal" onClick={reveal}>
            {revealLabel}
          </button>
        )}
      </div>
    );
  },
);
