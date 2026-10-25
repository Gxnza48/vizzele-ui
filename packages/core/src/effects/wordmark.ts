import { isBrowser } from '../env';
import { prefersReducedMotion } from '../motion';
import { observeVisibility } from '../observe';
import { onPointerMove } from '../pointer';
import { stepSpring } from './goo';
import { inertInstance, type EffectInstance } from './types';

export interface WordmarkOptions {
  /** Scale the text so it spans the full width of the element. Default true. */
  fit?: boolean;
  /** How high letters rise toward the pointer, as a fraction of the font size. Default 0.14. */
  lift?: number;
  /** Width of the pointer's influence, as a fraction of the element width. Default 0.16. */
  reach?: number;
  /** Letters rise out of the surface when scrolled into view. Default true. */
  entrance?: boolean;
}

interface Glyph {
  el: HTMLElement;
  cx: number;
  lift: { x: number; v: number };
  stretch: { x: number; v: number };
  enter: { x: number; v: number };
  shown: boolean;
}

/**
 * Giant display text made of liquid light. Letters rise out of a surface when they scroll into
 * view, reach up toward the pointer like a fluid being pulled, and wobble when pressed. A
 * spotlight follows the pointer and lights the iridescent fill; with no pointer it drifts on
 * its own. Screen readers get the plain text once.
 */
export function wordmark(
  el: HTMLElement,
  options: WordmarkOptions = {},
): EffectInstance<WordmarkOptions> {
  if (!isBrowser) return inertInstance();
  let opts = options;
  el.classList.add('vz-wordmark');

  // React renders the letters itself (no layout shift); vanilla usage splits them here.
  let built: { html: string } | null = null;
  let chars = Array.from(el.querySelectorAll<HTMLElement>('.vz-wordmark-char'));
  if (!chars.length) {
    const text = (el.textContent ?? '').trim();
    built = { html: el.innerHTML };
    el.textContent = '';
    const sr = document.createElement('span');
    sr.className = 'vz-sr-only';
    sr.textContent = text;
    const row = document.createElement('span');
    row.className = 'vz-wordmark-glyphs';
    row.setAttribute('aria-hidden', 'true');
    chars = Array.from(text).map((c) => {
      const s = document.createElement('span');
      s.className = 'vz-wordmark-char';
      s.textContent = c === ' ' ? ' ' : c;
      row.appendChild(s);
      return s;
    });
    el.append(sr, row);
  }
  const row = el.querySelector<HTMLElement>('.vz-wordmark-glyphs') ?? el;

  const glyphs: Glyph[] = chars.map((c) => ({
    el: c,
    cx: 0,
    lift: { x: 0, v: 0 },
    stretch: { x: 0, v: 0 },
    enter: { x: 1, v: 0 },
    shown: false,
  }));
  const reduced = prefersReducedMotion();
  const entrance = (opts.entrance ?? true) && !reduced;
  if (!entrance) glyphs.forEach((g) => ((g.enter.x = 0), (g.shown = true)));
  el.dataset.vzEnter = entrance ? 'pending' : 'done';

  let width = 0;
  let height = 0;
  let font = 0;
  const measure = () => {
    const cs = getComputedStyle(el);
    const w = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (opts.fit ?? true) {
      el.style.removeProperty('--vz-wordmark-size');
      const natural = row.scrollWidth;
      const size = parseFloat(getComputedStyle(row).fontSize) || 16;
      if (natural > 0) el.style.setProperty('--vz-wordmark-size', `${(size * w) / natural}px`);
    }
    width = w;
    height = el.clientHeight;
    font = parseFloat(getComputedStyle(row).fontSize) || 16;
    el.style.setProperty('--vz-wordmark-w', `${width}px`);
    glyphs.forEach((g) => {
      g.cx = g.el.offsetLeft + g.el.offsetWidth / 2;
      g.el.style.setProperty('--vz-ox', `${g.el.offsetLeft}px`);
      g.el.style.setProperty('--vz-oy', `${g.el.offsetTop}px`);
    });
  };

  const spot = { x: { x: 0, v: 0 }, y: { x: 0, v: 0 }, on: { x: 0, v: 0 } };
  let pointer: { x: number; y: number } | null = null;
  let visible = false;
  let raf = 0;
  let last = 0;
  let clock = 0;

  const tick = (now: number) => {
    raf = 0;
    const dt = Math.min(0.032, (now - (last || now)) / 1000) || 1 / 60;
    last = now;
    clock += dt;
    let moving = false;
    const lift = (opts.lift ?? 0.14) * font;
    const reach = Math.max((opts.reach ?? 0.16) * width, 1);

    // The spotlight eases toward the pointer, or drifts in a slow figure-eight without one.
    const tx = pointer ? pointer.x : width * (0.5 + 0.38 * Math.sin(clock * 0.31));
    const ty = pointer ? pointer.y : height * (0.42 + 0.18 * Math.sin(clock * 0.62));
    const still = reduced && !pointer;
    moving = stepSpring(spot.x, still ? width / 2 : tx, dt, 90, 16) || moving;
    moving = stepSpring(spot.y, still ? height / 2 : ty, dt, 90, 16) || moving;
    moving = stepSpring(spot.on, pointer ? 1 : 0, dt, 120, 18) || moving;
    el.style.setProperty('--vz-mx', `${spot.x.x}px`);
    el.style.setProperty('--vz-my', `${spot.y.x}px`);
    el.style.setProperty('--vz-spot', spot.on.x.toFixed(3));
    if (!reduced) el.style.setProperty('--vz-flow', `${(clock * 38) % Math.max(width, 1)}px`);

    // Letters near the pointer are pulled up and thinned, like liquid drawn by a finger.
    const near = pointer ? Math.max(0, 1 - Math.max(0, pointer.y - height) / (height * 0.6)) : 0;
    glyphs.forEach((g) => {
      const d = pointer ? (pointer.x - g.cx) / reach : 9;
      const pull = reduced ? 0 : Math.exp(-d * d) * near;
      moving = stepSpring(g.lift, -pull * lift, dt, 170, 11) || moving;
      moving = stepSpring(g.stretch, pull * 0.1, dt, 220, 9) || moving;
      if (g.shown) moving = stepSpring(g.enter, 0, dt, 120, 13) || moving;
      const s = g.stretch.x;
      const enter = g.enter.x;
      g.el.style.transform =
        `translateY(calc(${enter * 105}% + ${g.lift.x}px)) ` + `scale(${1 - s * 0.45}, ${1 + s})`;
      g.el.style.opacity = String(1 - Math.min(1, enter * 1.4));
    });

    if (visible && (moving || !reduced || pointer)) raf = requestAnimationFrame(tick);
    else last = 0;
  };
  const kick = () => {
    if (!raf && visible) raf = requestAnimationFrame(tick);
  };

  const timers: ReturnType<typeof setTimeout>[] = [];
  const stopVisibility = observeVisibility(
    el,
    (v) => {
      visible = v;
      if (v && entrance && el.dataset.vzEnter === 'pending') {
        el.dataset.vzEnter = 'done';
        glyphs.forEach((g, i) => timers.push(setTimeout(() => ((g.shown = true), kick()), i * 70)));
      }
      kick();
    },
    { amount: 0.2 },
  );

  const stopPointer = onPointerMove((p) => {
    const r = el.getBoundingClientRect();
    const pad = Math.min(160, r.height * 0.6);
    const inside =
      p.active &&
      (p.type !== 'touch' || p.down) &&
      p.x >= r.left &&
      p.x <= r.right &&
      p.y >= r.top - pad &&
      p.y <= r.bottom;
    pointer = inside ? { x: p.x - r.left, y: p.y - r.top } : null;
    kick();
  });

  // A press drops the letter into the surface; its spring throws it back up with a wobble.
  const onDown = (e: PointerEvent) => {
    if (reduced) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    let best: Glyph | undefined;
    glyphs.forEach((g) => {
      if (!best || Math.abs(g.cx - x) < Math.abs(best.cx - x)) best = g;
    });
    if (!best) return;
    best.lift.v += font * 3.2;
    best.stretch.v -= 3.5;
    kick();
  };
  el.addEventListener('pointerdown', onDown);

  const ro =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          if (el.clientWidth !== width) measure();
          kick();
        })
      : null;
  ro?.observe(el);
  measure();
  // Web fonts change the letter widths once they load.
  document.fonts?.ready.then(() => {
    measure();
    kick();
  });
  kick();

  return {
    update(next) {
      opts = { ...opts, ...next };
      measure();
      kick();
    },
    destroy() {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      stopVisibility();
      stopPointer();
      ro?.disconnect();
      el.removeEventListener('pointerdown', onDown);
      glyphs.forEach((g) => {
        g.el.style.transform = '';
        g.el.style.opacity = '';
      });
      [
        '--vz-mx',
        '--vz-my',
        '--vz-spot',
        '--vz-flow',
        '--vz-wordmark-w',
        '--vz-wordmark-size',
      ].forEach((p) => el.style.removeProperty(p));
      delete el.dataset.vzEnter;
      if (built) el.innerHTML = built.html;
      el.classList.remove('vz-wordmark');
    },
  };
}
