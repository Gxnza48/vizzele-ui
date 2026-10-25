import {
  Children,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  Spring,
  VelocityTracker,
  clamp,
  draggable,
  frame,
  inView,
  observeVisibility,
  prefersReducedMotion,
  resolveSpring,
  wrap,
} from '@vizzele/core';
import { cx, useLatest } from '../hooks/utils';

// ——————————————————————————— Marquee ———————————————————————————

export interface MarqueeProps {
  children: ReactNode;
  /** px per second. Default 60. */
  speed?: number;
  /** Scroll right instead of left. */
  reverse?: boolean;
  /** Ease to a stop while hovered. Default true. */
  pauseOnHover?: boolean;
  /** Grab and throw it. Default true. */
  draggable?: boolean;
  /** Gap between items, px. Default 32. */
  gap?: number;
  /** Fade the edges. Default true. */
  fade?: boolean;
  className?: string;
  style?: CSSProperties;
  label?: string;
}

/**
 * An endless ticker. It eases to a stop on hover, can be grabbed and thrown, and returns
 * to its cruising speed with momentum.
 */
export function Marquee({
  children,
  speed = 60,
  reverse = false,
  pauseOnHover = true,
  draggable: canDrag = true,
  gap = 32,
  fade = true,
  className,
  style,
  label,
}: MarqueeProps) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const latest = useLatest({ speed, reverse, pauseOnHover });
  const [copies, setCopies] = useState(2);
  const reduced = useRef(false);

  useLayoutEffect(() => {
    const r = root.current;
    const t = track.current;
    if (!r || !t) return;
    const first = t.firstElementChild as HTMLElement | null;
    if (!first) return;
    const need = Math.ceil(r.clientWidth / Math.max(first.offsetWidth + gap, 1)) + 1;
    setCopies(Math.max(2, need));
  }, [children, gap]);

  useEffect(() => {
    const r = root.current;
    const t = track.current;
    if (!r || !t) return;
    reduced.current = prefersReducedMotion();
    if (reduced.current) return;
    let offset = 0;
    let velocity = 0; // extra velocity from throws, decays back to cruise
    let hoverFactor = 1;
    let hovered = false;
    let dragging = false;
    let visible = true;
    const vt = new VelocityTracker();
    const unit = () => {
      const first = t.firstElementChild as HTMLElement | null;
      return first ? first.offsetWidth + gap : 1;
    };
    const stopVis = observeVisibility(r, (v) => (visible = v));
    const tick = ({ delta }: { delta: number }) => {
      if (!visible) return true;
      if (!dragging) {
        const target = hovered && latest.current.pauseOnHover ? 0 : 1;
        hoverFactor += (target - hoverFactor) * (1 - Math.exp(-delta * 5));
        velocity *= Math.exp(-delta * 2.2);
        const dir = latest.current.reverse ? 1 : -1;
        offset += (dir * latest.current.speed * hoverFactor + velocity) * delta;
      }
      const u = unit();
      t.style.transform = `translate3d(${wrap(offset, -u, 0)}px, 0, 0)`;
      return true;
    };
    const stop = frame.add(tick, 'render');
    const enter = () => (hovered = true);
    const leave = () => (hovered = false);
    r.addEventListener('pointerenter', enter);
    r.addEventListener('pointerleave', leave);
    r.addEventListener('focusin', enter);
    r.addEventListener('focusout', leave);

    let startX = 0;
    let startOffset = 0;
    let pid = -1;
    const down = (e: PointerEvent) => {
      if (!canDrag || e.button !== 0) return;
      pid = e.pointerId;
      startX = e.clientX;
      startOffset = offset;
      vt.reset();
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pid) return;
      const dx = e.clientX - startX;
      if (!dragging && Math.abs(dx) < 4) return;
      if (!dragging) {
        dragging = true;
        r.setPointerCapture(e.pointerId);
        r.dataset.vzDragging = '';
      }
      offset = startOffset + dx;
      vt.add(offset);
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pid) return;
      pid = -1;
      if (!dragging) return;
      dragging = false;
      delete r.dataset.vzDragging;
      velocity = clamp(vt.get(), -4000, 4000);
      const swallow = (ev: Event) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      r.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => r.removeEventListener('click', swallow, { capture: true }), 0);
    };
    r.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      stop();
      stopVis();
      r.removeEventListener('pointerenter', enter);
      r.removeEventListener('pointerleave', leave);
      r.removeEventListener('focusin', enter);
      r.removeEventListener('focusout', leave);
      r.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [canDrag, gap, latest, copies]);

  return (
    <div
      ref={root}
      className={cx('vz-marquee-js', fade && 'vz-marquee-fade', className)}
      style={{ '--vz-marquee-gap': `${gap}px`, ...style } as CSSProperties}
      role="marquee"
      aria-label={label}
      // Focusable: it pauses on focus, and becomes a scrollable row with reduced motion.
      tabIndex={0}
    >
      <div ref={track} className="vz-marquee-js-track">
        {Array.from({ length: copies }, (_, i) => (
          <div
            key={i}
            className="vz-marquee-js-group"
            aria-hidden={i > 0 || undefined}
            inert={i > 0 || undefined}
          >
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}

// ——————————————————————————— 3D carousel ———————————————————————————

export interface Carousel3DProps {
  children: ReactNode;
  /** Card width in px. Default 220. */
  itemWidth?: number;
  /** Card height in px. Default 300. */
  itemHeight?: number;
  /** Extra space around the ring. Default 1.15. */
  spacing?: number;
  /** Auto-rotate (seconds per card), 0 to disable. Default 0. */
  autoplay?: number;
  onIndexChange?: (index: number) => void;
  className?: string;
  label?: string;
}

/** A ring of cards in 3D: drag to spin it with inertia; it snaps the nearest card to the front. */
export function Carousel3D({
  children,
  itemWidth = 220,
  itemHeight = 300,
  spacing = 1.15,
  autoplay = 0,
  onIndexChange,
  className,
  label = 'Carousel',
}: Carousel3DProps) {
  const items = Children.toArray(children);
  const n = Math.max(items.length, 1);
  const step = 360 / n;
  const radius = Math.round((itemWidth * spacing) / 2 / Math.tan(Math.PI / n));
  const stage = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const controls = useRef<ReturnType<typeof draggable> | null>(null);
  const [index, setIndex] = useState(0);
  const latest = useLatest({ onIndexChange, step, n });
  const id = useId();
  // px of drag per degree of rotation
  const pxPerDeg = (itemWidth * spacing) / step;

  useEffect(() => {
    const el = stage.current;
    const r = ring.current;
    if (!el || !r) return;
    const c = draggable(el, {
      axis: 'x',
      elastic: 0,
      cursor: true,
      keyboard: false,
      timeConstant: 0.35,
      snap: { x: (v) => Math.round(v / (step * pxPerDeg)) * step * pxPerDeg },
      spring: { stiffness: 140, damping: 20 },
      apply: (x) => {
        const angle = x / pxPerDeg;
        r.style.transform = `translateZ(${-radius}px) rotateY(${angle}deg)`;
        const i =
          ((Math.round(-angle / latest.current.step) % latest.current.n) + latest.current.n) %
          latest.current.n;
        setIndex((prev) => {
          if (prev !== i) latest.current.onIndexChange?.(i);
          return i;
        });
      },
    });
    controls.current = c;
    r.style.transform = `translateZ(${-radius}px) rotateY(0deg)`;
    return () => {
      c.destroy();
      controls.current = null;
    };
  }, [radius, step, pxPerDeg, latest]);

  const go = (dir: number) => {
    const c = controls.current;
    if (!c) return;
    const unitPx = step * pxPerDeg;
    c.setPosition({ x: Math.round(c.x / unitPx) * unitPx - dir * unitPx });
  };

  useEffect(() => {
    if (!autoplay || prefersReducedMotion()) return;
    const el = stage.current;
    let paused = false;
    const pause = () => (paused = true);
    const resume = () => (paused = false);
    el?.addEventListener('pointerenter', pause);
    el?.addEventListener('pointerleave', resume);
    const t = setInterval(() => !paused && go(1), autoplay * 1000);
    return () => {
      clearInterval(t);
      el?.removeEventListener('pointerenter', pause);
      el?.removeEventListener('pointerleave', resume);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, step, pxPerDeg]);

  return (
    <div
      className={cx('vz-carousel3d', className)}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      style={{ '--vz-card-w': `${itemWidth}px`, '--vz-card-h': `${itemHeight}px` } as CSSProperties}
    >
      <div
        ref={stage}
        className="vz-carousel3d-stage"
        tabIndex={0}
        aria-describedby={`${id}-status`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(1);
          if (e.key === 'ArrowLeft') go(-1);
        }}
      >
        <div ref={ring} className="vz-carousel3d-ring">
          {items.map((child, i) => (
            <div
              key={i}
              className="vz-carousel3d-item"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${n}`}
              aria-hidden={i !== index || undefined}
              data-front={i === index || undefined}
              style={{ transform: `rotateY(${i * step}deg) translateZ(${radius}px)` }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>
      <div className="vz-carousel3d-controls">
        <button
          type="button"
          className="vz-button"
          data-size="sm"
          onClick={() => go(-1)}
          aria-label="Previous slide"
        >
          ←
        </button>
        <span id={`${id}-status`} className="vz-carousel3d-status" aria-live="polite">
          {index + 1} / {n}
        </span>
        <button
          type="button"
          className="vz-button"
          data-size="sm"
          onClick={() => go(1)}
          aria-label="Next slide"
        >
          →
        </button>
      </div>
    </div>
  );
}

// ——————————————————————————— Image reveal ———————————————————————————

export interface ImageRevealProps {
  src: string;
  alt: string;
  /** `view`: a liquid blob grows to reveal the image when scrolled into view.
   *  `hover`: a liquid lens follows the pointer, revealing color over a monochrome base. */
  mode?: 'view' | 'hover';
  /** Lens radius for hover mode, px. Default 120. */
  radius?: number;
  /** Edge wobble. Default 1. */
  liquidity?: number;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
}

/** Reveals an image through a liquid, wobbling mask. */
export function ImageReveal({
  src,
  alt,
  mode = 'view',
  radius = 120,
  liquidity = 1,
  width = '100%',
  height = 360,
  className,
  style,
}: ImageRevealProps) {
  const root = useRef<HTMLDivElement>(null);
  const circle = useRef<SVGCircleElement>(null);
  const turb = useRef<SVGFETurbulenceElement>(null);
  const uid = useId().replace(/:/g, '');
  const latest = useLatest({ radius, mode });

  useEffect(() => {
    const el = root.current;
    const c = circle.current;
    if (!el || !c) return;
    const size = () => el.getBoundingClientRect();
    const reduced = prefersReducedMotion();
    const r = new Spring({
      ...resolveSpring(mode === 'view' ? { stiffness: 40, damping: 14 } : 'jelly'),
      from: 0,
      onUpdate: (v) => c.setAttribute('r', String(Math.max(v, 0))),
    });
    const cx = new Spring({
      ...resolveSpring('liquid'),
      onUpdate: (v) => c.setAttribute('cx', String(v)),
    });
    const cy = new Spring({
      ...resolveSpring('liquid'),
      onUpdate: (v) => c.setAttribute('cy', String(v)),
    });
    const b = size();
    cx.jump(b.width / 2);
    cy.jump(b.height / 2);
    // Animate the turbulence so the edge keeps flowing.
    let t = 0;
    const wobble = reduced
      ? () => {}
      : frame.add(({ delta }) => {
          t += delta;
          turb.current?.setAttribute(
            'baseFrequency',
            `${(0.012 + Math.sin(t * 0.7) * 0.003).toFixed(4)}`,
          );
          return true;
        }, 'render');
    const cleanups: (() => void)[] = [wobble];
    if (mode === 'view') {
      cleanups.push(
        inView(
          el,
          () => {
            const bb = size();
            r.set(Math.hypot(bb.width, bb.height) * 0.62);
          },
          { once: true, amount: 0.35 },
        ),
      );
    } else {
      const move = (e: PointerEvent) => {
        const bb = size();
        cx.set(e.clientX - bb.left);
        cy.set(e.clientY - bb.top);
        r.set(latest.current.radius);
      };
      const leave = () => r.set(0);
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerdown', move);
      el.addEventListener('pointerleave', leave);
      cleanups.push(() => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerdown', move);
        el.removeEventListener('pointerleave', leave);
      });
    }
    return () => {
      cleanups.forEach((f) => f());
      r.stop();
      cx.stop();
      cy.stop();
    };
  }, [mode, latest]);

  return (
    <div
      ref={root}
      className={cx('vz-image-reveal', className)}
      data-mode={mode}
      role="img"
      aria-label={alt}
      style={{ width, height, ...style }}
    >
      {mode === 'hover' && (
        <img className="vz-image-reveal-base" src={src} alt="" draggable={false} />
      )}
      <svg className="vz-image-reveal-svg" aria-hidden="true">
        <defs>
          <filter id={`f${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence
              ref={turb}
              type="fractalNoise"
              baseFrequency="0.012"
              numOctaves="2"
              seed="4"
            />
            <feDisplacementMap
              in="SourceGraphic"
              scale={60 * liquidity}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <mask id={`m${uid}`}>
            <circle ref={circle} cx="0" cy="0" r="0" fill="#fff" filter={`url(#f${uid})`} />
          </mask>
        </defs>
        <image
          href={src}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid slice"
          mask={`url(#m${uid})`}
        />
      </svg>
    </div>
  );
}
