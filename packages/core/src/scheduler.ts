import { isBrowser, now } from './env';

/**
 * A single requestAnimationFrame loop shared by every animation in Vizzele.
 *
 * Work is split into three phases that run in order every frame, which keeps DOM
 * reads and writes batched and avoids layout thrashing:
 *  - `read`:   measure the DOM (getBoundingClientRect, scroll positions…)
 *  - `update`: advance physics (springs, inertia)
 *  - `render`: write to the DOM (styles, transforms, canvas)
 *
 * The loop sleeps when nothing is scheduled.
 */
export type FramePhase = 'read' | 'update' | 'render';

export interface FrameState {
  /** Seconds since the previous frame, clamped to avoid huge jumps after a tab was hidden. */
  delta: number;
  /** Milliseconds timestamp of the current frame. */
  time: number;
}

/** Return `false` to unsubscribe from inside the callback. */
export type FrameCallback = (state: FrameState) => void | boolean;

const MAX_DELTA = 1 / 15;
const phases: FramePhase[] = ['read', 'update', 'render'];
const queues: Record<FramePhase, Set<FrameCallback>> = {
  read: new Set(),
  update: new Set(),
  render: new Set(),
};
const onceQueues: Record<FramePhase, Set<FrameCallback>> = {
  read: new Set(),
  update: new Set(),
  render: new Set(),
};

let running = false;
let rafId = 0;
let lastTime = 0;
let manual = false;
const state: FrameState = { delta: 0, time: 0 };

const hasWork = () => phases.some((p) => queues[p].size > 0 || onceQueues[p].size > 0);

function tick(time: number) {
  state.delta = lastTime ? Math.min((time - lastTime) / 1000, MAX_DELTA) : 1 / 60;
  state.time = time;
  lastTime = time;
  for (const phase of phases) {
    for (const cb of queues[phase]) {
      if (cb(state) === false) queues[phase].delete(cb);
    }
    if (onceQueues[phase].size) {
      const once = [...onceQueues[phase]];
      onceQueues[phase].clear();
      for (const cb of once) cb(state);
    }
  }
  if (!manual && hasWork()) rafId = requestAnimationFrame(tick);
  else running = false;
}

function wake() {
  if (running || manual) return;
  if (!isBrowser || typeof requestAnimationFrame !== 'function') return;
  running = true;
  lastTime = 0;
  rafId = requestAnimationFrame(tick);
}

export const frame = {
  /** Runs `cb` every frame in the given phase until removed. Returns an unsubscribe function. */
  add(cb: FrameCallback, phase: FramePhase = 'update'): () => void {
    queues[phase].add(cb);
    wake();
    return () => {
      queues[phase].delete(cb);
    };
  },
  /** Runs `cb` once on the next frame. Scheduling the same function twice in a frame runs it once. */
  once(cb: FrameCallback, phase: FramePhase = 'render'): () => void {
    onceQueues[phase].add(cb);
    wake();
    return () => {
      onceQueues[phase].delete(cb);
    };
  },
  remove(cb: FrameCallback) {
    for (const p of phases) {
      queues[p].delete(cb);
      onceQueues[p].delete(cb);
    }
  },
  /** Current frame state (delta / time). */
  get state(): Readonly<FrameState> {
    return state;
  },
  /** Number of scheduled callbacks — handy to assert that everything went to sleep. */
  get size(): number {
    return phases.reduce((n, p) => n + queues[p].size + onceQueues[p].size, 0);
  },
  /**
   * Switches to a manually stepped clock (for tests or offline rendering).
   * Use `frame.advance(ms)` to move time forward.
   */
  setManual(value: boolean) {
    manual = value;
    if (value && running) {
      if (isBrowser) cancelAnimationFrame(rafId);
      running = false;
    }
    lastTime = 0;
    if (!value && hasWork()) wake();
  },
  /** Advances the manual clock by `ms`, in steps of `step` ms. */
  advance(ms: number, step = 1000 / 60) {
    let t = lastTime || now();
    if (!lastTime) lastTime = t;
    let remaining = ms;
    while (remaining > 1e-6 && hasWork()) {
      const dt = Math.min(step, remaining);
      t += dt;
      remaining -= dt;
      tick(t);
    }
  },
};
