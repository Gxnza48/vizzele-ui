import { isBrowser, now } from './env';
import { VelocityTracker } from './velocity';

export interface PointerState {
  /** Viewport coordinates (clientX / clientY). */
  x: number;
  y: number;
  /** Normalized to -1..1 across the viewport (0 = center). */
  nx: number;
  ny: number;
  /** Velocity in px/s. */
  vx: number;
  vy: number;
  type: 'mouse' | 'touch' | 'pen' | '';
  down: boolean;
  /** False until the pointer has moved at least once. */
  active: boolean;
}

const pointer: PointerState = {
  x: 0,
  y: 0,
  nx: 0,
  ny: 0,
  vx: 0,
  vy: 0,
  type: '',
  down: false,
  active: false,
};
const listeners = new Set<(p: Readonly<PointerState>) => void>();
const tx = new VelocityTracker(80);
const ty = new VelocityTracker(80);
let attached = false;

function update(e: PointerEvent) {
  const t = now();
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.ny = (e.clientY / window.innerHeight) * 2 - 1;
  tx.add(e.clientX, t);
  ty.add(e.clientY, t);
  pointer.vx = tx.get(t);
  pointer.vy = ty.get(t);
  pointer.type = (e.pointerType as PointerState['type']) || 'mouse';
  pointer.active = true;
  for (const l of listeners) l(pointer);
}
const onMove = (e: PointerEvent) => update(e);
const onDown = (e: PointerEvent) => {
  pointer.down = true;
  update(e);
};
const onUp = (e: PointerEvent) => {
  pointer.down = false;
  update(e);
};
const onLeave = () => {
  pointer.active = false;
  for (const l of listeners) l(pointer);
};

function attach() {
  if (attached || !isBrowser) return;
  attached = true;
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  window.addEventListener('pointercancel', onUp, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave, { passive: true });
}

function detach() {
  if (!attached) return;
  attached = false;
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerdown', onDown);
  window.removeEventListener('pointerup', onUp);
  window.removeEventListener('pointercancel', onUp);
  document.documentElement.removeEventListener('pointerleave', onLeave);
}

/** The shared pointer state. Starts updating once something subscribes. */
export function getPointer(): Readonly<PointerState> {
  return pointer;
}

/** Subscribes to pointer movement across the whole page with a single shared listener. */
export function onPointerMove(cb: (p: Readonly<PointerState>) => void): () => void {
  listeners.add(cb);
  attach();
  return () => {
    listeners.delete(cb);
    if (!listeners.size) detach();
  };
}

/** Pointer position relative to an element: px from its top-left, and 0..1 progress. */
export function relativePointer(el: Element, p: Readonly<PointerState> = pointer) {
  const r = el.getBoundingClientRect();
  const x = p.x - r.left;
  const y = p.y - r.top;
  return {
    x,
    y,
    px: r.width ? x / r.width : 0,
    py: r.height ? y / r.height : 0,
    /** Distance from the element center, px. */
    dx: x - r.width / 2,
    dy: y - r.height / 2,
    width: r.width,
    height: r.height,
    inside: x >= 0 && y >= 0 && x <= r.width && y <= r.height,
  };
}
