import { isBrowser } from '../env';
import { clamp } from '../math';
import { onPointerMove, type PointerState } from '../pointer';
import { createSprings, type SpringConfig, type SpringPreset } from '../spring';
import { frame } from '../scheduler';
import { inertInstance, type EffectInstance } from './types';

export interface SpotlightOptions {
  /** Distance (px) outside the element at which the light starts to appear. Default 160. */
  proximity?: number;
  spring?: SpringConfig | SpringPreset;
}

/**
 * Light that follows the pointer across an element — and glows on its border even before the
 * pointer enters. Writes CSS variables, the look is up to CSS (see `.vz-spotlight` in @vizzele/css):
 *  - `--vz-spot-x` / `--vz-spot-y`: pointer position in px relative to the element
 *  - `--vz-spot`: 0..1 intensity (1 inside, fading out with distance)
 */
export function spotlight(
  el: HTMLElement,
  options: SpotlightOptions = {},
): EffectInstance<SpotlightOptions> {
  if (!isBrowser) return inertInstance();
  let opts = options;
  const springs = createSprings(
    { x: 0, y: 0, o: 0 },
    {
      onUpdate: ({ x, y, o }) => {
        el.style.setProperty('--vz-spot-x', `${x.toFixed(1)}px`);
        el.style.setProperty('--vz-spot-y', `${y.toFixed(1)}px`);
        el.style.setProperty('--vz-spot', o.toFixed(3));
      },
    },
  );
  springs.setConfig(opts.spring ?? 'snappy');

  let last: Readonly<PointerState> | null = null;
  let warm = false;
  const measure = () => {
    if (!last) return;
    const r = el.getBoundingClientRect();
    const x = last.x - r.left;
    const y = last.y - r.top;
    const dx = Math.max(-x, 0, x - r.width);
    const dy = Math.max(-y, 0, y - r.height);
    const dist = Math.hypot(dx, dy);
    const proximity = opts.proximity ?? 160;
    const o = last.active ? clamp(1 - dist / proximity, 0, 1) : 0;
    if (o <= 0 && !warm) return;
    if (!warm) {
      // Appear where the pointer is instead of sliding in from the corner.
      springs.jump({ x, y });
    }
    warm = o > 0;
    springs.set({ x, y, o });
  };
  const unsubscribe = onPointerMove((p) => {
    last = p;
    frame.once(measure, 'read');
  });

  return {
    update(next) {
      opts = { ...opts, ...next };
      if (next.spring) springs.setConfig(next.spring);
    },
    destroy() {
      unsubscribe();
      springs.stop();
      for (const v of ['spot-x', 'spot-y', 'spot']) el.style.removeProperty(`--vz-${v}`);
    },
  };
}
