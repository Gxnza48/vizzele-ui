import { isBrowser } from '../env';
import { iridescentPalette, parseColor } from '../color';
import { getDeviceTier, isCoarsePointer, prefersReducedMotion } from '../motion';
import { onPointerMove } from '../pointer';
import { frame } from '../scheduler';

export interface ParticleTrailOptions {
  /** Colors to pick from. Default: the iridescent palette. */
  colors?: readonly string[];
  /** Particles spawned per 100px travelled. Default 6. */
  density?: number;
  /** Max particles alive. Default 220 (halved on low-end devices). */
  max?: number;
  /** Particle size range in px. Default [2, 6]. */
  size?: readonly [number, number];
  /** Upward drift (negative = up). Default -40 px/s². */
  gravity?: number;
  /** Lifetime in seconds. Default 1.1. */
  life?: number;
  /** Shape. Default `'spark'` (glowing dot). */
  shape?: 'spark' | 'square' | 'ring';
  /** Also emit while touching (on touch devices). Default true. */
  touch?: boolean;
  /** Canvas to draw into. Default: a fixed full-viewport overlay. */
  canvas?: HTMLCanvasElement;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
}

/**
 * Iridescent particles shed by the pointer, with velocity, drag and drift.
 * Draws on a single overlay canvas that sleeps when no particle is alive.
 */
export function particleTrail(options: ParticleTrailOptions = {}) {
  const inert = {
    update(_: Partial<ParticleTrailOptions>) {},
    burst(_x: number, _y: number, _n?: number) {},
    destroy() {},
  };
  if (!isBrowser || prefersReducedMotion()) return inert;
  let opts = options;
  const owned = !opts.canvas;
  const canvas = opts.canvas ?? document.createElement('canvas');
  if (owned) {
    canvas.className = 'vz-particles-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    Object.assign(canvas.style, {
      position: 'fixed',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 'var(--vz-z-cursor)',
    });
    document.body.appendChild(canvas);
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return inert;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
  };
  resize();
  window.addEventListener('resize', resize);

  // Glow is pre-rendered once per color: shadowBlur per particle is far too slow.
  const sprites = new Map<string, HTMLCanvasElement>();
  const sprite = (color: string) => {
    let c = sprites.get(color);
    if (!c) {
      c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d')!;
      const [r, gr, b] = parseColor(color);
      const rgba = (a: number) => `rgba(${r}, ${gr}, ${b}, ${a})`;
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.18, rgba(1));
      grad.addColorStop(0.45, rgba(0.33));
      grad.addColorStop(1, rgba(0));
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
      sprites.set(color, c);
    }
    return c;
  };

  const particles: Particle[] = [];
  const limit = () => Math.round((opts.max ?? 220) * (getDeviceTier() === 'low' ? 0.5 : 1));
  let carry = 0;
  let lastX = NaN;
  let lastY = NaN;
  let running: (() => void) | null = null;

  const emit = (x: number, y: number, vx: number, vy: number) => {
    if (particles.length >= limit()) particles.shift();
    const colors = opts.colors ?? iridescentPalette;
    const [min, max] = opts.size ?? [2, 6];
    const angle = Math.random() * Math.PI * 2;
    const spread = 20 + Math.random() * 60;
    const life = (opts.life ?? 1.1) * (0.6 + Math.random() * 0.6);
    particles.push({
      x,
      y,
      vx: vx * 0.12 + Math.cos(angle) * spread,
      vy: vy * 0.12 + Math.sin(angle) * spread,
      life,
      max: life,
      size: min + Math.random() * (max - min),
      color: colors[Math.floor(Math.random() * colors.length)]!,
    });
  };

  const draw = ({ delta }: { delta: number }) => {
    const r = canvas.getBoundingClientRect();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';
    const g = opts.gravity ?? -40;
    const drag = Math.exp(-2.4 * delta);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]!;
      p.life -= delta;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.vx *= drag;
      p.vy = p.vy * drag + g * delta;
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      const t = p.life / p.max;
      const size = p.size * (0.4 + 0.6 * t);
      const x = owned ? p.x : p.x - r.left;
      const y = owned ? p.y : p.y - r.top;
      ctx.globalAlpha = t * t;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;
      const shape = opts.shape ?? 'spark';
      if (shape === 'square') {
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      } else if (shape === 'ring') {
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        const s = size * 4;
        ctx.drawImage(sprite(p.color), x - s / 2, y - s / 2, s, s);
      }
    }
    ctx.globalAlpha = 1;
    if (!particles.length) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      running = null;
      return false;
    }
    return true;
  };

  const unsubscribe = onPointerMove((p) => {
    if (p.type === 'touch' && (opts.touch === false || !p.down)) {
      lastX = NaN;
      return;
    }
    if (p.type === 'mouse' && isCoarsePointer()) return;
    if (Number.isNaN(lastX)) {
      lastX = p.x;
      lastY = p.y;
      return;
    }
    const dist = Math.hypot(p.x - lastX, p.y - lastY);
    carry += (dist / 100) * (opts.density ?? 6);
    while (carry >= 1) {
      carry -= 1;
      const t = Math.random();
      emit(lastX + (p.x - lastX) * t, lastY + (p.y - lastY) * t, p.vx, p.vy);
    }
    lastX = p.x;
    lastY = p.y;
    if (!running && particles.length) running = frame.add(draw, 'render');
  });

  return {
    update(next: Partial<ParticleTrailOptions>) {
      opts = { ...opts, ...next };
    },
    /** Emits a burst at a point — e.g. on click. */
    burst(x: number, y: number, count = 24) {
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        emit(x, y, Math.cos(a) * 1600, Math.sin(a) * 1600);
      }
      if (!running) running = frame.add(draw, 'render');
    },
    destroy() {
      unsubscribe();
      running?.();
      window.removeEventListener('resize', resize);
      if (owned) canvas.remove();
    },
  };
}
