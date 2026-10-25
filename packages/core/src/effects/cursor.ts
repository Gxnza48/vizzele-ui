import { isBrowser } from '../env';
import { clamp, radToDeg } from '../math';
import { isCoarsePointer, prefersReducedMotion } from '../motion';
import { onPointerMove } from '../pointer';
import {
  Spring,
  createSprings,
  resolveSpring,
  type SpringConfig,
  type SpringPreset,
} from '../spring';
import { setTransform } from '../transform';

export type CursorState = 'default' | 'hover' | 'text' | 'drag' | 'press' | 'hidden';

export interface CursorOptions {
  /** Number of trailing blobs following the ring. Default 4. */
  trail?: number;
  /** Ring size in px. Default 36. */
  size?: number;
  /** Hide the native cursor while the custom one is active. Default true. */
  hideNative?: boolean;
  /** Stretch the ring along its velocity like liquid. Default true. */
  stretch?: boolean;
  /** Spring the ring uses to follow. Default `{ stiffness: 380, damping: 30 }`. */
  spring?: SpringConfig | SpringPreset;
  /** Selector for elements that trigger the hover state. */
  hoverSelector?: string;
  /** Selector for elements that trigger the text (I-beam) state. */
  textSelector?: string;
  /** Element to append the cursor to. Default `document.body`. */
  container?: HTMLElement;
}

export interface CursorInstance {
  /** Forces a state (or `null` to go back to automatic detection). */
  setState(state: CursorState | null): void;
  /** Shows a short label inside the ring (or `null` to clear). */
  setLabel(label: string | null): void;
  update(options: Partial<CursorOptions>): void;
  destroy(): void;
}

const HOVER =
  'a, button, [role="button"], label, summary, select, [data-vz-cursor="hover"], [data-vz-magnetic]';
const TEXT =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, [contenteditable="true"], [data-vz-cursor="text"]';

/**
 * A custom cursor: a dot, a liquid ring that lags behind on a spring and stretches with speed,
 * and a trail of blobs. It reacts to what it's over: links grow it, text turns it into a beam,
 * dragging squeezes it. `data-vz-cursor-label="Open"` on an element shows a label.
 *
 * Inert on touch devices and with reduced motion: the native cursor stays.
 */
export function cursor(options: CursorOptions = {}): CursorInstance {
  const inert: CursorInstance = { setState() {}, setLabel() {}, update() {}, destroy() {} };
  if (!isBrowser || isCoarsePointer() || prefersReducedMotion()) return inert;
  let opts = options;

  const root = document.createElement('div');
  root.className = 'vz-cursor';
  root.setAttribute('aria-hidden', 'true');
  root.dataset.state = 'hidden';
  const dot = document.createElement('div');
  dot.className = 'vz-cursor-dot';
  const ring = document.createElement('div');
  ring.className = 'vz-cursor-ring';
  const label = document.createElement('span');
  label.className = 'vz-cursor-label';
  ring.appendChild(label);
  const trail: HTMLElement[] = [];
  for (let i = 0; i < (opts.trail ?? 4); i++) {
    const t = document.createElement('div');
    t.className = 'vz-cursor-trail';
    t.style.setProperty('--vz-i', String(i));
    trail.push(t);
    root.appendChild(t);
  }
  root.append(ring, dot);
  (opts.container ?? document.body).appendChild(root);
  if (opts.hideNative !== false) document.documentElement.classList.add('vz-cursor-none');
  root.style.setProperty('--vz-cursor-size', `${opts.size ?? 36}px`);

  const ringSpring = resolveSpring(opts.spring ?? { stiffness: 380, damping: 30 });
  let vx = 0;
  let vy = 0;
  const pos = createSprings(
    { x: -100, y: -100 },
    {
      ...ringSpring,
      onUpdate: ({ x, y }) => {
        const speed = Math.hypot(vx, vy);
        // The text beam stays upright; only the ring stretches like liquid.
        const stretch =
          opts.stretch === false || state === 'text' ? 0 : clamp(speed / 3000, 0, 0.45);
        setTransform(ring, 'pos', {
          x,
          y,
          rotate: stretch > 0.01 ? radToDeg(Math.atan2(vy, vx)) : 0,
          scaleX: 1 + stretch,
          scaleY: 1 - stretch * 0.6,
        });
      },
    },
  );
  // Each trail blob follows the previous one — a spring chain.
  const trailSprings = trail.map((el, i) =>
    createSprings(
      { x: -100, y: -100 },
      {
        stiffness: 260 - i * 30,
        damping: 22 + i * 2,
        onUpdate: ({ x, y }) => setTransform(el, 'pos', { x, y }),
      },
    ),
  );
  const scale = new Spring({
    ...resolveSpring('jelly'),
    from: 1,
    onUpdate: (s) => setTransform(ring, 'state', { scale: s }),
  });

  let forced: CursorState | null = null;
  let state: CursorState = 'hidden';
  const setVisualState = (s: CursorState) => {
    if (s === state) return;
    state = s;
    root.dataset.state = s;
    scale.set(
      s === 'hover' ? 1.7 : s === 'press' ? 0.75 : s === 'drag' ? 1.25 : s === 'hidden' ? 0 : 1,
    );
  };

  let hoverTarget: Element | null = null;
  const detect = (target: Element | null) => {
    if (forced) return setVisualState(forced);
    if (!target) return setVisualState('default');
    if (document.querySelector('[data-vz-dragging]')) return setVisualState('drag');
    const text = target.closest(opts.textSelector ?? TEXT);
    if (text) return setVisualState('text');
    const hover = target.closest(opts.hoverSelector ?? HOVER);
    hoverTarget = hover;
    const l = target.closest('[data-vz-cursor-label]')?.getAttribute('data-vz-cursor-label');
    label.textContent = l ?? '';
    root.toggleAttribute('data-label', !!l);
    setVisualState(hover || l ? 'hover' : 'default');
  };

  const unsubscribe = onPointerMove((p) => {
    if (p.type !== 'mouse' && p.type !== 'pen') return;
    if (!p.active) return setVisualState('hidden');
    vx = p.vx;
    vy = p.vy;
    if (state === 'hidden') {
      pos.jump({ x: p.x, y: p.y });
      trailSprings.forEach((t) => t.jump({ x: p.x, y: p.y }));
    }
    setTransform(dot, 'pos', { x: p.x, y: p.y });
    pos.set({ x: p.x, y: p.y });
    trailSprings.forEach((t, i) => {
      const lead = i === 0 ? pos.values : trailSprings[i - 1]!.values;
      t.set({ x: lead.x, y: lead.y });
    });
  });
  const onOver = (e: PointerEvent) => detect(e.target as Element);
  const onDown = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    if (!forced && state !== 'text') setVisualState('press');
  };
  const onUp = (e: PointerEvent) => detect(e.target as Element);
  const onLeave = () => setVisualState('hidden');
  document.addEventListener('pointerover', onOver, { passive: true });
  document.addEventListener('pointerdown', onDown, { passive: true });
  document.addEventListener('pointerup', onUp, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);

  return {
    setState(s) {
      forced = s;
      if (s) setVisualState(s);
      else detect(hoverTarget);
    },
    setLabel(l) {
      label.textContent = l ?? '';
      root.toggleAttribute('data-label', !!l);
    },
    update(next) {
      opts = { ...opts, ...next };
      if (next.size) root.style.setProperty('--vz-cursor-size', `${next.size}px`);
      if (next.spring) pos.setConfig(next.spring);
    },
    destroy() {
      unsubscribe();
      pos.stop();
      trailSprings.forEach((t) => t.stop());
      scale.stop();
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.documentElement.classList.remove('vz-cursor-none');
      root.remove();
    },
  };
}
