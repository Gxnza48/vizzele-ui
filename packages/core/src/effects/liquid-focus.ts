import { isBrowser } from '../env';
import { Spring } from '../spring';
import { inertInstance, type EffectInstance } from './types';

export interface LiquidFocusOptions {
  /** Space between the element and the ring, in px. Default 4. */
  offset?: number;
  /** Only follow keyboard focus (`:focus-visible`). Default true. */
  keyboardOnly?: boolean;
}

type Edge = 'left' | 'top' | 'right' | 'bottom';

// The edge that leads the motion is stiff, the trailing one lags: the ring stretches like a
// drop of mercury in flight and snaps back to shape when it lands.
const LEAD = { stiffness: 420, damping: 32 };
const TRAIL = { stiffness: 140, damping: 17 };

/**
 * One focus ring for the whole page that travels between focused elements like a drop of
 * mercury — stretching toward where focus went, then settling around it. Keyboard users can
 * follow focus across the page at a glance. Mount once (it is global).
 */
export function liquidFocus(options: LiquidFocusOptions = {}): EffectInstance<LiquidFocusOptions> {
  if (!isBrowser) return inertInstance();
  let opts = options;
  const ring = document.createElement('div');
  ring.className = 'vz-focus-drop';
  ring.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ring);
  document.documentElement.classList.add('vz-liquid-focus');

  let target: HTMLElement | null = null;
  let shown = false;
  const box = { left: 0, top: 0, right: 0, bottom: 0 };
  const render = () => {
    ring.style.transform = `translate(${box.left}px, ${box.top}px)`;
    ring.style.width = `${Math.max(0, box.right - box.left)}px`;
    ring.style.height = `${Math.max(0, box.bottom - box.top)}px`;
  };
  const edges = Object.fromEntries(
    (['left', 'top', 'right', 'bottom'] as Edge[]).map((k) => [
      k,
      new Spring({
        ...TRAIL,
        onUpdate: (v) => {
          box[k] = v;
          render();
        },
      }),
    ]),
  ) as Record<Edge, Spring>;

  const rectOf = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const o = opts.offset ?? 4;
    return { left: r.left - o, top: r.top - o, right: r.right + o, bottom: r.bottom + o };
  };

  const radiusOf = (el: HTMLElement) => {
    const cs = getComputedStyle(el);
    const r = parseFloat(cs.borderTopLeftRadius) || 0;
    const h = el.getBoundingClientRect().height;
    return Math.min(r, h / 2) + (opts.offset ?? 4);
  };

  const moveTo = (el: HTMLElement, animate: boolean) => {
    const next = rectOf(el);
    ring.style.borderRadius = `${radiusOf(el)}px`;
    if (!shown || !animate) {
      (Object.keys(edges) as Edge[]).forEach((k) => edges[k].jump(next[k]));
      return;
    }
    const right = next.left + next.right > box.left + box.right;
    const down = next.top + next.bottom > box.top + box.bottom;
    edges.left.set(next.left, { config: right ? TRAIL : LEAD });
    edges.right.set(next.right, { config: right ? LEAD : TRAIL });
    edges.top.set(next.top, { config: down ? TRAIL : LEAD });
    edges.bottom.set(next.bottom, { config: down ? LEAD : TRAIL });
  };

  const show = (el: HTMLElement) => {
    moveTo(el, true);
    target = el;
    if (!shown) {
      shown = true;
      ring.dataset.visible = '';
    }
  };
  const hide = () => {
    shown = false;
    target = null;
    delete ring.dataset.visible;
  };

  const onFocusIn = (e: FocusEvent) => {
    const el = e.target;
    if (!(el instanceof HTMLElement) || el === document.body) return;
    let visible = true;
    try {
      visible = !(opts.keyboardOnly ?? true) || el.matches(':focus-visible');
    } catch {
      /* very old browsers: follow every focus */
    }
    if (visible) show(el);
    else hide();
  };
  const onFocusOut = () => {
    // Focus moving to another element fires focusin right after; only hide if it went nowhere.
    setTimeout(() => {
      const a = document.activeElement;
      if (!a || a === document.body) hide();
    });
  };
  const onPointerDown = () => hide();
  // Stay glued to the element while the page scrolls or reflows.
  let raf = 0;
  const follow = () => {
    raf = 0;
    if (!target || !shown) return;
    if (!target.isConnected) return hide();
    const next = rectOf(target);
    const dx = next.left - edges.left.target;
    const dy = next.top - edges.top.target;
    if (!dx && !dy && next.right === edges.right.target && next.bottom === edges.bottom.target)
      return;
    (Object.keys(edges) as Edge[]).forEach((k) => {
      const s = edges[k];
      const shift = k === 'left' || k === 'right' ? dx : dy;
      if (s.isAnimating) {
        s.value += shift;
        s.set(next[k]);
      } else s.jump(next[k]);
    });
  };
  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(follow);
  };

  document.addEventListener('focusin', onFocusIn);
  document.addEventListener('focusout', onFocusOut);
  document.addEventListener('pointerdown', onPointerDown, true);
  window.addEventListener('scroll', onScroll, { capture: true, passive: true });
  window.addEventListener('resize', onScroll);
  const active = document.activeElement;
  if (active instanceof HTMLElement && active !== document.body) {
    onFocusIn({ target: active } as unknown as FocusEvent);
  }

  return {
    update(next) {
      opts = { ...opts, ...next };
    },
    destroy() {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
      Object.values(edges).forEach((s) => s.stop());
      ring.remove();
      document.documentElement.classList.remove('vz-liquid-focus');
    },
  };
}
