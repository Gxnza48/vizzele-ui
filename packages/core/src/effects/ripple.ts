import { isBrowser } from '../env';
import { prefersReducedMotion } from '../motion';
import { Spring, resolveSpring, type SpringConfig, type SpringPreset } from '../spring';
import { inertInstance, type EffectInstance } from './types';

export interface RippleOptions {
  /** Ripple color. Default: the iridescent spectrum. */
  color?: string;
  /** Peak opacity. Default 0.35. */
  opacity?: number;
  spring?: SpringConfig | SpringPreset;
  /** Also ripple from the center on Enter / Space. Default true. */
  keyboard?: boolean;
}

/**
 * A liquid ripple that wells up from where the element was pressed: it overshoots like a
 * drop hitting water, then fades. Positioned inside the element (which gets `overflow: hidden`).
 */
export function ripple(
  el: HTMLElement,
  options: RippleOptions = {},
): EffectInstance<RippleOptions> {
  if (!isBrowser) return inertInstance();
  let opts = options;
  const cs = getComputedStyle(el);
  const restore = {
    position: el.style.position,
    overflow: el.style.overflow,
    isolation: el.style.isolation,
  };
  if (cs.position === 'static') el.style.position = 'relative';
  el.style.overflow = 'hidden';
  el.style.isolation = 'isolate';
  const live = new Set<() => void>();

  const spawn = (x: number, y: number) => {
    const r = el.getBoundingClientRect();
    const radius = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y));
    const drop = document.createElement('span');
    drop.className = 'vz-ripple';
    drop.setAttribute('aria-hidden', 'true');
    const size = radius * 2;
    Object.assign(drop.style, {
      left: `${x - radius}px`,
      top: `${y - radius}px`,
      width: `${size}px`,
      height: `${size}px`,
    });
    if (opts.color) drop.style.setProperty('--vz-ripple-color', opts.color);
    el.appendChild(drop);
    const peak = opts.opacity ?? 0.35;
    let fade: Spring | null = null;
    const remove = () => {
      grow.stop();
      fade?.stop();
      drop.remove();
      live.delete(remove);
    };
    live.add(remove);
    if (prefersReducedMotion()) {
      drop.style.transform = 'scale(1)';
      drop.style.opacity = String(peak * 0.6);
      setTimeout(remove, 200);
      return;
    }
    const grow = new Spring({
      ...resolveSpring(opts.spring ?? { stiffness: 140, damping: 13 }),
      from: 0,
      onUpdate: (s) => (drop.style.transform = `scale(${s.toFixed(4)})`),
    });
    drop.style.opacity = String(peak);
    grow.set(1);
    setTimeout(() => {
      fade = new Spring({
        stiffness: 60,
        damping: 18,
        from: peak,
        restDelta: 0.005,
        onUpdate: (o) => (drop.style.opacity = o.toFixed(3)),
        onRest: remove,
      });
      fade.set(0);
    }, 260);
  };

  const onDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    const r = el.getBoundingClientRect();
    spawn(e.clientX - r.left, e.clientY - r.top);
  };
  const onKey = (e: KeyboardEvent) => {
    if (opts.keyboard === false || e.repeat || (e.key !== 'Enter' && e.key !== ' ')) return;
    if (e.target !== el) return;
    spawn(el.clientWidth / 2, el.clientHeight / 2);
  };
  el.addEventListener('pointerdown', onDown);
  el.addEventListener('keydown', onKey);

  return {
    update(next) {
      opts = { ...opts, ...next };
    },
    destroy() {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('keydown', onKey);
      live.forEach((r) => r());
      Object.assign(el.style, restore);
    },
  };
}
