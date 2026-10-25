import { isBrowser } from '../env';
import { clamp } from '../math';
import { isCoarsePointer, prefersReducedMotion } from '../motion';
import { inView } from '../observe';
import { onPointerMove, type PointerState } from '../pointer';
import { frame } from '../scheduler';
import { splitText, type SplitTextResult } from '../split-text';
import { Spring, resolveSpring, type SpringConfig, type SpringPreset } from '../spring';
import { inertInstance, type EffectInstance } from './types';
import { accessibleText } from '../a11y';

// ——————————————————————————— Scramble ———————————————————————————

export interface ScrambleOptions {
  /** Final text. Default: the element's current text. */
  text?: string;
  /** Total time in ms. Default 900. */
  duration?: number;
  /** Glyphs used while decoding. */
  chars?: string;
  /** When to play. Default `'view'`. `'manual'` waits for `play()`. */
  trigger?: 'view' | 'hover' | 'manual' | 'mount';
}

const GLYPHS = '!<>-_\\/[]{}—=+*^?#ABCDEFXYZ0123456789';

/** Decodes text from random glyphs into place, left to right. */
export function scramble(el: HTMLElement, options: ScrambleOptions = {}) {
  if (!isBrowser) return { ...inertInstance<ScrambleOptions>(), play() {} };
  let opts = options;
  let final = opts.text ?? el.textContent ?? '';
  const a11y = accessibleText(el, final);
  const out = a11y.visual;
  let stop: (() => void) | null = null;

  const play = () => {
    stop?.();
    final = opts.text ?? final;
    a11y.setLabel(final);
    if (prefersReducedMotion()) {
      out.textContent = final;
      return;
    }
    const duration = opts.duration ?? 900;
    const chars = opts.chars ?? GLYPHS;
    // Each character settles at its own time, mostly left to right.
    const settle = Array.from(
      final,
      (_, i) => (i / Math.max(final.length, 1)) * 0.7 + Math.random() * 0.3,
    );
    let t = 0;
    let lastSwap = 0;
    stop = frame.add(({ delta }) => {
      t += (delta * 1000) / duration;
      if (t - lastSwap < 0.03 && t < 1) return true;
      lastSwap = t;
      let next = '';
      for (let i = 0; i < final.length; i++) {
        const c = final[i]!;
        next += c === ' ' || t >= settle[i]! ? c : chars[Math.floor(Math.random() * chars.length)];
      }
      out.textContent = next;
      if (t >= 1) {
        out.textContent = final;
        stop = null;
        return false;
      }
      return true;
    }, 'render');
  };

  const trigger = opts.trigger ?? 'view';
  const cleanups: (() => void)[] = [];
  if (trigger === 'view') cleanups.push(inView(el, () => play(), { once: true, amount: 0.5 }));
  if (trigger === 'mount') play();
  if (trigger === 'hover') {
    el.addEventListener('pointerenter', play);
    el.addEventListener('focus', play);
    cleanups.push(() => {
      el.removeEventListener('pointerenter', play);
      el.removeEventListener('focus', play);
    });
  }

  return {
    play,
    update(next: Partial<ScrambleOptions>) {
      opts = { ...opts, ...next };
      if (next.text !== undefined && next.text !== final) play();
    },
    destroy() {
      stop?.();
      cleanups.forEach((c) => c());
      el.textContent = final;
    },
  };
}

// ——————————————————————————— Text reveal ———————————————————————————

export interface TextRevealOptions {
  /** Unit to animate. Default `'words'`. */
  by?: 'chars' | 'words' | 'lines';
  /** Delay between units, ms. Default chars 18, words 45, lines 90. */
  stagger?: number;
  /** Look of the entrance. Default `'rise'`. */
  variant?: 'rise' | 'blur' | 'mask' | 'scale';
  /** Only once. Default true. */
  once?: boolean;
  /** Portion visible before playing. Default 0.3. */
  amount?: number;
}

/**
 * Splits text and reveals it unit by unit as it scrolls into view. Uses CSS transitions with
 * spring easings (`.vz-text-reveal` in @vizzele/css), so hundreds of letters stay cheap.
 */
export function textReveal(
  el: HTMLElement,
  options: TextRevealOptions = {},
): EffectInstance<TextRevealOptions> {
  if (!isBrowser) return inertInstance();
  const opts = options;
  const by = opts.by ?? 'words';
  let split: SplitTextResult | null = splitText(el, {
    by: by === 'chars' ? 'chars' : by === 'lines' ? 'lines' : 'words',
  });
  const units = by === 'chars' ? split.chars : by === 'lines' ? split.lines : split.words;
  const stagger = opts.stagger ?? (by === 'chars' ? 18 : by === 'lines' ? 90 : 45);
  units.forEach((u, i) => {
    u.classList.add('vz-reveal-unit');
    u.style.setProperty('--vz-i', String(i));
    if (opts.variant === 'mask' || by === 'lines') {
      // Each unit slides up from behind its own clip.
      const wrap = document.createElement('span');
      wrap.className = 'vz-reveal-clip';
      u.replaceWith(wrap);
      wrap.appendChild(u);
    }
  });
  el.classList.add('vz-text-reveal');
  el.dataset.variant = opts.variant ?? (by === 'lines' ? 'mask' : 'rise');
  el.style.setProperty('--vz-stagger', `${stagger}ms`);
  const stop = inView(
    el,
    () => {
      el.dataset.revealed = '';
      return () => {
        if (opts.once === false) delete el.dataset.revealed;
      };
    },
    { once: opts.once !== false, amount: opts.amount ?? 0.3 },
  );
  return {
    update() {},
    destroy() {
      stop();
      split?.revert();
      split = null;
      el.classList.remove('vz-text-reveal');
      delete el.dataset.revealed;
      delete el.dataset.variant;
    },
  };
}

// ——————————————————————————— Weight wave ———————————————————————————

export interface WeightWaveOptions {
  /** Weight far from the pointer. Default 300. */
  min?: number;
  /** Weight right under the pointer. Default 800. */
  max?: number;
  /** Influence radius in px. Default 160. */
  radius?: number;
  /** Also widen glyphs (needs a `wdth` axis). Default false. */
  width?: boolean;
  /** Smoothing 0..1 (higher = snappier). Default 0.18. */
  ease?: number;
}

/**
 * A variable-font wave: letters near the pointer swell in weight, like light pooling under it.
 * Needs a variable font with a `wght` axis.
 */
export function weightWave(
  el: HTMLElement,
  options: WeightWaveOptions = {},
): EffectInstance<WeightWaveOptions> {
  if (!isBrowser) return inertInstance();
  let opts = options;
  const split = splitText(el, { by: 'chars' });
  const chars = split.chars;
  const min = () => opts.min ?? 300;
  const current = chars.map(() => min());
  const targets = chars.map(() => min());
  let centers: { x: number; y: number }[] = [];
  let stale = true;
  let running: (() => void) | null = null;

  const paint = () =>
    chars.forEach((c, i) => {
      const w = current[i]!;
      const wd = opts.width
        ? 100 + ((w - min()) / Math.max((opts.max ?? 800) - min(), 1)) * 25
        : null;
      c.style.fontVariationSettings = wd
        ? `'wght' ${w.toFixed(0)}, 'wdth' ${wd.toFixed(1)}`
        : `'wght' ${w.toFixed(0)}`;
    });
  paint();

  const measure = () => {
    // Measure at rest weight so letters don't chase their own growth.
    centers = chars.map((c) => {
      const r = c.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    stale = false;
  };
  const invalidate = () => (stale = true);
  window.addEventListener('scroll', invalidate, { passive: true });
  window.addEventListener('resize', invalidate);

  const tick = () => {
    const k = opts.ease ?? 0.18;
    let moving = false;
    for (let i = 0; i < chars.length; i++) {
      const d = targets[i]! - current[i]!;
      if (Math.abs(d) > 0.5) {
        current[i]! += d * k;
        moving = true;
      } else current[i] = targets[i]!;
    }
    paint();
    if (!moving) running = null;
    return moving;
  };

  const onMove = (p: Readonly<PointerState>) => {
    if (prefersReducedMotion()) return;
    if (p.type === 'touch' && !p.down) return;
    if (stale) measure();
    const radius = opts.radius ?? 160;
    const max = opts.max ?? 800;
    centers.forEach((c, i) => {
      const d = Math.hypot(p.x - c.x, (p.y - c.y) * 1.6);
      const t = p.active ? clamp(1 - d / radius, 0, 1) : 0;
      // Smoothstep for a soft-edged pool of weight.
      targets[i] = min() + (max - min()) * t * t * (3 - 2 * t);
    });
    running ??= frame.add(tick, 'render');
  };
  const unsubscribe = onPointerMove(onMove);
  const onLeave = () => {
    targets.fill(min());
    running ??= frame.add(tick, 'render');
  };
  el.addEventListener('pointerleave', onLeave);
  if (isCoarsePointer()) el.addEventListener('pointerup', onLeave);

  return {
    update(next) {
      opts = { ...opts, ...next };
      onLeave();
    },
    destroy() {
      unsubscribe();
      running?.();
      window.removeEventListener('scroll', invalidate);
      window.removeEventListener('resize', invalidate);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('pointerup', onLeave);
      split.revert();
    },
  };
}

// ——————————————————————————— Morph ———————————————————————————

export interface MorphTextOptions {
  words: string[];
  /** Time each word stays, ms. Default 1800. */
  hold?: number;
  /** Morph duration, ms. Default 900. */
  morph?: number;
}

let morphFilterAdded = false;
function ensureMorphFilter() {
  if (morphFilterAdded) return;
  morphFilterAdded = true;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
  svg.innerHTML =
    '<defs><filter id="vz-threshold"><feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -140"/></filter></defs>';
  document.body.appendChild(svg);
}

/**
 * Words melt into each other: two layers cross-blur and an SVG alpha-threshold filter
 * turns the blur into a liquid, gooey morph.
 */
export function morphText(el: HTMLElement, options: MorphTextOptions) {
  if (!isBrowser || !options.words.length) return { ...inertInstance<MorphTextOptions>() };
  let opts = options;
  ensureMorphFilter();
  el.classList.add('vz-morph');
  el.textContent = '';
  const a = document.createElement('span');
  const b = document.createElement('span');
  a.className = b.className = 'vz-morph-layer';
  a.setAttribute('aria-hidden', 'true');
  b.setAttribute('aria-hidden', 'true');
  const live = document.createElement('span');
  live.className = 'vz-sr-only';
  el.append(a, b, live);

  let index = 0;
  let t = 0; // 0..1 morph progress, then hold
  let phase: 'hold' | 'morph' = 'hold';
  const words = () => opts.words;
  a.textContent = words()[0]!;
  b.textContent = words()[1 % words().length]!;
  b.style.opacity = '0';
  live.textContent = words()[0]!;

  const setMorph = (p: number) => {
    // Crossfade with blur; the threshold filter on the parent makes it liquid.
    const fIn = Math.max(0, p);
    const fOut = Math.max(0, 1 - p);
    b.style.filter = `blur(${Math.min(8 / Math.max(fIn, 0.01) - 8, 100).toFixed(2)}px)`;
    b.style.opacity = `${Math.pow(fIn, 0.4) * 100}%`;
    a.style.filter = `blur(${Math.min(8 / Math.max(fOut, 0.01) - 8, 100).toFixed(2)}px)`;
    a.style.opacity = `${Math.pow(fOut, 0.4) * 100}%`;
  };

  if (prefersReducedMotion()) {
    // Swap words without the morph.
    const id = setInterval(() => {
      index = (index + 1) % words().length;
      a.textContent = live.textContent = words()[index]!;
    }, opts.hold ?? 1800);
    return {
      update(next: Partial<MorphTextOptions>) {
        opts = { ...opts, ...next };
      },
      destroy() {
        clearInterval(id);
        el.classList.remove('vz-morph');
      },
    };
  }

  const stop = frame.add(({ delta }) => {
    if (phase === 'hold') {
      t += (delta * 1000) / (opts.hold ?? 1800);
      if (t >= 1) {
        phase = 'morph';
        t = 0;
        b.textContent = words()[(index + 1) % words().length]!;
      }
      return true;
    }
    t += (delta * 1000) / (opts.morph ?? 900);
    if (t >= 1) {
      index = (index + 1) % words().length;
      a.textContent = live.textContent = words()[index]!;
      a.style.filter = '';
      a.style.opacity = '100%';
      b.style.opacity = '0';
      phase = 'hold';
      t = 0;
      return true;
    }
    setMorph(t);
    return true;
  }, 'render');

  return {
    update(next: Partial<MorphTextOptions>) {
      opts = { ...opts, ...next };
    },
    destroy() {
      stop();
      el.classList.remove('vz-morph');
      el.textContent = words()[index] ?? '';
    },
  };
}

// ——————————————————————————— Counter ———————————————————————————

export interface CounterOptions {
  /** Target value. */
  to: number;
  /** Start value. Default 0. */
  from?: number;
  /** Decimals. Default 0. */
  decimals?: number;
  /** Any Intl.NumberFormat options (currency, compact…). */
  format?: Intl.NumberFormatOptions;
  locale?: string;
  prefix?: string;
  suffix?: string;
  spring?: SpringConfig | SpringPreset;
  /** Start when scrolled into view. Default true. */
  inView?: boolean;
}

/** Counts up (or down) with a spring — it overshoots a hair and settles, like a gauge. */
export function counter(el: HTMLElement, options: CounterOptions) {
  if (!isBrowser) return { ...inertInstance<CounterOptions>(), set(_: number) {} };
  let opts = options;
  const fmt = () =>
    new Intl.NumberFormat(opts.locale, {
      minimumFractionDigits: opts.decimals ?? 0,
      maximumFractionDigits: opts.decimals ?? 0,
      ...opts.format,
    });
  let formatter = fmt();
  const label = (v: number) => `${opts.prefix ?? ''}${formatter.format(v)}${opts.suffix ?? ''}`;
  // Screen readers get the final value once; the ticking digits are aria-hidden.
  const a11y = accessibleText(el, label(opts.to));
  const render = (v: number) => {
    a11y.visual.textContent = label(v);
  };
  el.style.fontVariantNumeric = 'tabular-nums';
  const spring = new Spring({
    ...resolveSpring(opts.spring ?? { stiffness: 60, damping: 16 }),
    from: opts.from ?? 0,
    restDelta: 0.001,
    onUpdate: render,
  });
  render(opts.from ?? 0);
  const start = () => {
    spring.set(opts.to);
  };
  const stop =
    opts.inView === false ? (start(), () => {}) : inView(el, start, { once: true, amount: 0.6 });
  return {
    set(value: number) {
      opts = { ...opts, to: value };
      a11y.setLabel(label(value));
      spring.set(value);
    },
    update(next: Partial<CounterOptions>) {
      opts = { ...opts, ...next };
      formatter = fmt();
      a11y.setLabel(label(opts.to));
      if (next.to !== undefined) spring.set(next.to);
    },
    destroy() {
      stop();
      spring.stop();
    },
  };
}
