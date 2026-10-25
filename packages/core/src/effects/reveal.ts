import { isBrowser } from '../env';
import { inView } from '../observe';
import { Spring, resolveSpring, type SpringConfig, type SpringPreset } from '../spring';
import { clearTransform, setTransform } from '../transform';
import { inertInstance, type EffectInstance } from './types';

export type RevealFrom = 'up' | 'down' | 'left' | 'right' | 'scale' | 'blur' | 'fade';

export interface RevealOptions {
  /** Where the element comes from. Default `'up'`. */
  from?: RevealFrom;
  /** Travel distance in px. Default 32. */
  distance?: number;
  /** Delay before starting, ms. Default 0. */
  delay?: number;
  /** Animate the children one after another, ms between each. Default 0 (animate the element itself). */
  stagger?: number;
  /** Children to stagger (selector). Default: direct children. */
  children?: string;
  /** Only reveal once. Default true. */
  once?: boolean;
  /** Portion visible before revealing, 0..1. Default 0.15. */
  amount?: number;
  spring?: SpringConfig | SpringPreset;
  onReveal?: () => void;
}

/** Fades and slides elements in with a spring when they scroll into view. */
export function reveal(
  el: HTMLElement,
  options: RevealOptions = {},
): EffectInstance<RevealOptions> {
  if (!isBrowser) return inertInstance();
  let opts = options;
  const targets: HTMLElement[] = opts.stagger
    ? Array.from(
        opts.children
          ? el.querySelectorAll<HTMLElement>(opts.children)
          : (el.children as HTMLCollectionOf<HTMLElement>),
      )
    : [el];

  const paint = (t: HTMLElement, p: number) => {
    const d = (opts.distance ?? 32) * (1 - p);
    const from = opts.from ?? 'up';
    t.style.opacity = p >= 1 ? '' : String(Math.max(0, Math.min(1, p)));
    if (from === 'blur') t.style.filter = p >= 1 ? '' : `blur(${((1 - p) * 12).toFixed(2)}px)`;
    setTransform(t, 'reveal', {
      x: from === 'left' ? -d : from === 'right' ? d : 0,
      y: from === 'up' ? d : from === 'down' ? -d : from === 'blur' ? d * 0.5 : 0,
      scale: from === 'scale' ? 1 - 0.08 * (1 - p) : 1,
    });
  };

  const timers: ReturnType<typeof setTimeout>[] = [];
  const springs = targets.map(
    (t) =>
      new Spring({
        ...resolveSpring(opts.spring ?? 'gentle'),
        restDelta: 0.001,
        onUpdate: (p) => paint(t, p),
      }),
  );
  targets.forEach((t) => paint(t, 0));
  el.dataset.vzReveal = 'hidden';

  const show = () => {
    el.dataset.vzReveal = 'visible';
    springs.forEach((s, i) => {
      timers.push(setTimeout(() => s.set(1), (opts.delay ?? 0) + i * (opts.stagger ?? 0)));
    });
    opts.onReveal?.();
    return () => {
      if (opts.once === false) {
        timers.splice(0).forEach(clearTimeout);
        el.dataset.vzReveal = 'hidden';
        springs.forEach((s) => s.set(0));
      }
    };
  };
  const stop = inView(el, show, { once: opts.once !== false, amount: opts.amount ?? 0.15 });

  return {
    update(next) {
      opts = { ...opts, ...next };
    },
    destroy() {
      stop();
      timers.forEach(clearTimeout);
      springs.forEach((s) => s.stop());
      targets.forEach((t) => {
        t.style.opacity = '';
        t.style.filter = '';
        clearTransform(t, 'reveal');
      });
      delete el.dataset.vzReveal;
    },
  };
}
