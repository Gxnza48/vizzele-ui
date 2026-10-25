import { isBrowser } from '../env';
import { prefersReducedMotion } from '../motion';
import { inertInstance, type EffectInstance } from './types';

export interface HoldToConfirmOptions {
  /** How long to hold, in ms. Default 1400. */
  duration?: number;
  /** Fires once the button is full. */
  onConfirm?: () => void;
  /** 0..1 while filling or draining. */
  onProgress?: (progress: number) => void;
  /** Drain and re-arm this many ms after confirming. 0 keeps it full. Default 1600. */
  resetAfter?: number;
}

const COLUMNS = 28;

/**
 * Hold-to-confirm where the button fills with liquid. The surface is a real wave simulation:
 * pressing splashes where your finger is, moving the pointer sloshes it from side to side,
 * letting go early drains it back down. When it reaches the top it overflows and confirms.
 * Works with Space / Enter held down too.
 */
export function holdToConfirm(
  el: HTMLElement,
  options: HoldToConfirmOptions = {},
): EffectInstance<HoldToConfirmOptions> {
  if (!isBrowser) return inertInstance();
  let opts = options;
  const restore = { position: el.style.position, isolation: el.style.isolation };
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  el.style.isolation = 'isolate';
  el.classList.add('vz-hold');
  const tank = document.createElement('span');
  tank.className = 'vz-hold-tank';
  tank.setAttribute('aria-hidden', 'true');
  const fill = document.createElement('span');
  fill.className = 'vz-hold-fill';
  tank.appendChild(fill);
  el.prepend(tank);

  const h = new Float32Array(COLUMNS); // surface offsets (px)
  const v = new Float32Array(COLUMNS);
  let progress = 0; // raw 0..1 hold progress
  let level = 0; // displayed fill, springs after progress
  let levelV = 0;
  let tilt = 0;
  let tiltV = 0;
  let holding = false;
  let confirmed = false;
  let raf = 0;
  let last = 0;
  let lastX: number | null = null;
  let resetTimer = 0;

  const splash = (fx: number, force: number) => {
    const c = Math.round(fx * (COLUMNS - 1));
    for (let i = 0; i < COLUMNS; i++) v[i]! -= force * Math.exp(-((i - c) ** 2) / 6);
  };

  const draw = () => {
    const W = el.clientWidth;
    const H = el.clientHeight;
    const base = H * (1 - level);
    let d = '';
    for (let i = 0; i < COLUMNS; i++) {
      const x = (i / (COLUMNS - 1)) * W;
      const y = base + h[i]! + tilt * (x - W / 2);
      d += `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
    }
    fill.style.clipPath = `path('${d}L${W},${H + 2}L0,${H + 2}Z')`;
    el.style.setProperty('--vz-hold-progress', level.toFixed(3));
  };

  const tick = (now: number) => {
    raf = 0;
    const dt = Math.min(0.032, (now - (last || now)) / 1000) || 1 / 60;
    last = now;
    const reduced = prefersReducedMotion();
    const duration = opts.duration ?? 1400;
    if (holding && !confirmed) progress = Math.min(1, progress + dt / (duration / 1000));
    else if (!confirmed) progress = Math.max(0, progress - dt * 2.2);
    // The displayed level chases the progress with a little inertia; overflows on confirm.
    const goal = confirmed ? 1.08 : progress;
    if (reduced) {
      level = goal;
      levelV = 0;
    } else {
      levelV += ((goal - level) * 140 - levelV * 18) * dt;
      level += levelV * dt;
    }
    let energy = 0;
    if (!reduced) {
      // 1D wave: each column springs to rest, pulls on its neighbours, and loses energy.
      for (let i = 0; i < COLUMNS; i++) {
        const left = h[i - 1] ?? h[i]!;
        const right = h[i + 1] ?? h[i]!;
        v[i]! += (-h[i]! * 60 + (left + right - 2 * h[i]!) * 380) * dt;
        v[i]! *= Math.exp(-3.2 * dt);
      }
      for (let i = 0; i < COLUMNS; i++) {
        h[i]! += v[i]! * dt;
        energy += Math.abs(v[i]!) + Math.abs(h[i]!);
      }
      tiltV += (-tilt * 90 - tiltV * 7) * dt;
      tilt += tiltV * dt;
      energy += Math.abs(tilt) * 400 + Math.abs(tiltV) * 40;
    }
    draw();
    opts.onProgress?.(Math.min(1, Math.max(0, level)));
    if (holding && progress >= 1 && !confirmed) confirm();
    const settled = Math.abs(goal - level) < 0.002 && Math.abs(levelV) < 0.01 && energy < 0.5;
    if (holding || !settled) raf = requestAnimationFrame(tick);
    else last = 0;
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const confirm = () => {
    confirmed = true;
    holding = false;
    el.dataset.confirmed = '';
    splash(0.5, 260);
    opts.onConfirm?.();
    const after = opts.resetAfter ?? 1600;
    if (after > 0) resetTimer = window.setTimeout(rearm, after);
  };
  const rearm = () => {
    confirmed = false;
    progress = 0;
    delete el.dataset.confirmed;
    kick();
  };

  const start = (fx: number) => {
    if (confirmed) return;
    holding = true;
    el.dataset.holding = '';
    splash(fx, 140);
    kick();
  };
  const release = () => {
    if (!holding) return;
    holding = false;
    delete el.dataset.holding;
    // Let go early: the liquid sloshes back down.
    splash(0.5, -60);
    kick();
  };

  const onDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    const r = el.getBoundingClientRect();
    lastX = e.clientX;
    el.setPointerCapture?.(e.pointerId);
    start((e.clientX - r.left) / Math.max(r.width, 1));
  };
  const onMove = (e: PointerEvent) => {
    if (lastX === null || prefersReducedMotion()) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    // Moving the pointer tilts the liquid against the motion and makes local waves.
    tiltV -= dx * 0.015;
    const r = el.getBoundingClientRect();
    splash((e.clientX - r.left) / Math.max(r.width, 1), dx * 3);
    kick();
  };
  const onUp = () => {
    lastX = null;
    release();
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
      e.preventDefault();
      start(0.5);
    } else if (e.key === ' ' || e.key === 'Enter') e.preventDefault();
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      release();
    }
  };

  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);
  el.addEventListener('lostpointercapture', onUp);
  el.addEventListener('keydown', onKeyDown);
  el.addEventListener('keyup', onKeyUp);
  el.addEventListener('blur', release);
  draw();

  return {
    update(next) {
      opts = { ...opts, ...next };
    },
    destroy() {
      cancelAnimationFrame(raf);
      clearTimeout(resetTimer);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('lostpointercapture', onUp);
      el.removeEventListener('keydown', onKeyDown);
      el.removeEventListener('keyup', onKeyUp);
      el.removeEventListener('blur', release);
      tank.remove();
      el.classList.remove('vz-hold');
      el.style.position = restore.position;
      el.style.isolation = restore.isolation;
      el.style.removeProperty('--vz-hold-progress');
    },
  };
}
