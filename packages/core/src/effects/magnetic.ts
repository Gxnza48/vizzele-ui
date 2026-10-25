import { isBrowser } from '../env';
import { onPointerMove, type PointerState } from '../pointer';
import { createSprings, type SpringConfig, type SpringPreset } from '../spring';
import { clearTransform, setTransform } from '../transform';
import { frame } from '../scheduler';
import { prefersReducedMotion } from '../motion';
import { inertInstance, type EffectInstance } from './types';

export interface MagneticOptions {
  /** How much the element follows the pointer, 0..1. Default 0.35. */
  strength?: number;
  /** Extra distance (px) around the element where the pull starts. Default 80. */
  radius?: number;
  /** Scale while attracted. Default 1.04. */
  scale?: number;
  /** A child (selector or element) that moves further, for a layered parallax feel. */
  inner?: string | HTMLElement;
  /** How much further the inner element moves, 0..1. Default 0.2. */
  innerStrength?: number;
  spring?: SpringConfig | SpringPreset;
  /** Squish on press (also the touch alternative to hover). Default true. */
  press?: boolean;
}

/**
 * Pulls an element toward the pointer when it gets close, and lets it snap back with a spring.
 *
 *     magnetic(button, { strength: 0.4 })
 */
export function magnetic(
  el: HTMLElement,
  options: MagneticOptions = {},
): EffectInstance<MagneticOptions> {
  if (!isBrowser) return inertInstance();
  let opts = options;
  let innerEl: HTMLElement | null = null;
  const resolveInner = () => {
    innerEl =
      typeof opts.inner === 'string'
        ? el.querySelector<HTMLElement>(opts.inner)
        : (opts.inner ?? null);
  };
  resolveInner();

  const springs = createSprings(
    { x: 0, y: 0, s: 1, press: 1 },
    {
      ...(typeof opts.spring === 'object' ? opts.spring : {}),
      onUpdate: ({ x, y, s, press }) => {
        setTransform(el, 'magnetic', { x, y, scale: s * press });
        if (innerEl) {
          const k = opts.innerStrength ?? 0.2;
          setTransform(innerEl, 'magnetic-inner', { x: x * k * 2, y: y * k * 2 });
        }
      },
    },
  );
  if (typeof opts.spring === 'string') springs.setConfig(opts.spring);
  else if (!opts.spring) springs.setConfig('liquid');

  let attracted = false;
  let last: Readonly<PointerState> | null = null;
  // Translation is excluded when measuring so the element doesn't chase itself.
  const measure = () => {
    if (!last || last.type === 'touch' || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2 - springs.values.x;
    const cy = r.top + r.height / 2 - springs.values.y;
    const radius = opts.radius ?? 80;
    const dx = last.x - cx;
    const dy = last.y - cy;
    const inside =
      last.active && Math.abs(dx) < r.width / 2 + radius && Math.abs(dy) < r.height / 2 + radius;
    if (inside) {
      const strength = opts.strength ?? 0.35;
      attracted = true;
      springs.set({ x: dx * strength, y: dy * strength, s: opts.scale ?? 1.04 });
      el.dataset.vzAttracted = '';
    } else if (attracted) {
      attracted = false;
      springs.set({ x: 0, y: 0, s: 1 });
      delete el.dataset.vzAttracted;
    }
  };
  const unsubscribe = onPointerMove((p) => {
    last = p;
    frame.once(measure, 'read');
  });

  const onDown = () => {
    if (opts.press !== false) springs.set({ press: 0.94 }, { config: 'snappy' });
  };
  const onUp = () => {
    if (opts.press !== false) springs.springs.press.set(1, { config: 'jelly' });
  };
  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointerleave', onUp);
  el.addEventListener('pointercancel', onUp);

  return {
    update(next) {
      opts = { ...opts, ...next };
      if (next.inner !== undefined) resolveInner();
      if (next.spring) springs.setConfig(next.spring);
    },
    destroy() {
      unsubscribe();
      springs.stop();
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointerleave', onUp);
      el.removeEventListener('pointercancel', onUp);
      delete el.dataset.vzAttracted;
      clearTransform(el, 'magnetic');
      if (innerEl) clearTransform(innerEl, 'magnetic-inner');
    },
  };
}
