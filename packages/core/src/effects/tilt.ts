import { isBrowser } from '../env';
import { clamp, radToDeg } from '../math';
import { createSprings, type SpringConfig, type SpringPreset } from '../spring';
import { clearTransform, setTransform } from '../transform';
import { prefersReducedMotion } from '../motion';
import { inertInstance, type EffectInstance } from './types';

export interface TiltOptions {
  /** Maximum rotation in degrees. Default 12. */
  max?: number;
  /** CSS perspective in px. Default 1000. */
  perspective?: number;
  /** Scale while hovered. Default 1.03. */
  scale?: number;
  /** Tilt away from the pointer instead of toward it. */
  reverse?: boolean;
  axis?: 'x' | 'y' | 'both';
  spring?: SpringConfig | SpringPreset;
}

/**
 * 3D tilt that follows the pointer. It also exposes CSS variables so styles can paint
 * reflections that follow the angle:
 *  - `--vz-px` / `--vz-py`: pointer position over the element, 0..1
 *  - `--vz-tx` / `--vz-ty`: tilt, -1..1
 *  - `--vz-angle`: angle of the pointer around the center, in deg
 *  - `--vz-hover`: 0..1 hover intensity
 */
export function tilt(el: HTMLElement, options: TiltOptions = {}): EffectInstance<TiltOptions> {
  if (!isBrowser) return inertInstance();
  let opts = options;
  let rect: DOMRect | null = null;

  const springs = createSprings(
    { tx: 0, ty: 0, px: 0.5, py: 0.5, hover: 0 },
    {
      onUpdate: ({ tx, ty, px, py, hover }) => {
        const max = opts.max ?? 12;
        const dir = opts.reverse ? -1 : 1;
        const axis = opts.axis ?? 'both';
        setTransform(el, 'tilt', {
          perspective: opts.perspective ?? 1000,
          rotateX: axis === 'x' ? 0 : -ty * max * dir,
          rotateY: axis === 'y' ? 0 : tx * max * dir,
          scale: 1 + ((opts.scale ?? 1.03) - 1) * hover,
        });
        const s = el.style;
        s.setProperty('--vz-px', px.toFixed(4));
        s.setProperty('--vz-py', py.toFixed(4));
        s.setProperty('--vz-tx', tx.toFixed(4));
        s.setProperty('--vz-ty', ty.toFixed(4));
        s.setProperty('--vz-hover', hover.toFixed(4));
        s.setProperty('--vz-angle', `${radToDeg(Math.atan2(py - 0.5, px - 0.5)).toFixed(2)}deg`);
      },
    },
  );
  springs.setConfig(opts.spring ?? 'liquid');

  const move = (e: PointerEvent) => {
    if (prefersReducedMotion()) return;
    rect ??= el.getBoundingClientRect();
    const px = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const py = clamp((e.clientY - rect.top) / rect.height, 0, 1);
    springs.set({ px, py, tx: px * 2 - 1, ty: py * 2 - 1, hover: 1 });
  };
  const enter = (e: PointerEvent) => {
    rect = el.getBoundingClientRect();
    move(e);
  };
  const leave = () => {
    rect = null;
    springs.set({ tx: 0, ty: 0, hover: 0 }, { config: 'gentle' });
  };
  const invalidate = () => (rect = null);

  el.addEventListener('pointerenter', enter);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerdown', enter);
  el.addEventListener('pointerleave', leave);
  el.addEventListener('pointercancel', leave);
  window.addEventListener('scroll', invalidate, { passive: true });

  return {
    update(next) {
      opts = { ...opts, ...next };
      if (next.spring) springs.setConfig(next.spring);
    },
    destroy() {
      springs.stop();
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerdown', enter);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('pointercancel', leave);
      window.removeEventListener('scroll', invalidate);
      clearTransform(el, 'tilt');
      for (const v of ['px', 'py', 'tx', 'ty', 'hover', 'angle'])
        el.style.removeProperty(`--vz-${v}`);
    },
  };
}
