import { frame } from './scheduler';

/**
 * Several effects often animate the same element (a card that is draggable, magnetic and
 * tilting). Instead of fighting over `style.transform`, each effect writes to its own
 * named layer and Vizzele composes them once per frame.
 */
export interface TransformLayer {
  x?: number;
  y?: number;
  z?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  /** Degrees. */
  rotate?: number;
  rotateX?: number;
  rotateY?: number;
  skewX?: number;
  skewY?: number;
  /** Perspective (px) applied before the 3D rotations. The largest value of all layers wins. */
  perspective?: number;
}

interface Store {
  layers: Map<string, TransformLayer>;
  dirty: boolean;
}

const stores = new WeakMap<HTMLElement | SVGElement, Store>();
const pending = new Set<HTMLElement | SVGElement>();

const fmt = (n: number) => (Math.abs(n) < 1e-4 ? 0 : Math.round(n * 1000) / 1000);

export function composeTransform(layers: Iterable<TransformLayer>): string {
  let x = 0,
    y = 0,
    z = 0,
    sx = 1,
    sy = 1,
    r = 0,
    rx = 0,
    ry = 0,
    kx = 0,
    ky = 0,
    p = 0;
  for (const l of layers) {
    x += l.x ?? 0;
    y += l.y ?? 0;
    z += l.z ?? 0;
    const s = l.scale ?? 1;
    sx *= s * (l.scaleX ?? 1);
    sy *= s * (l.scaleY ?? 1);
    r += l.rotate ?? 0;
    rx += l.rotateX ?? 0;
    ry += l.rotateY ?? 0;
    kx += l.skewX ?? 0;
    ky += l.skewY ?? 0;
    if (l.perspective && l.perspective > p) p = l.perspective;
  }
  const parts: string[] = [];
  if (p) parts.push(`perspective(${fmt(p)}px)`);
  if (x || y || z) parts.push(`translate3d(${fmt(x)}px, ${fmt(y)}px, ${fmt(z)}px)`);
  if (rx) parts.push(`rotateX(${fmt(rx)}deg)`);
  if (ry) parts.push(`rotateY(${fmt(ry)}deg)`);
  if (r) parts.push(`rotate(${fmt(r)}deg)`);
  if (kx || ky) parts.push(`skew(${fmt(kx)}deg, ${fmt(ky)}deg)`);
  if (sx !== 1 || sy !== 1)
    parts.push(sx === sy ? `scale(${fmt(sx)})` : `scale(${fmt(sx)}, ${fmt(sy)})`);
  return parts.join(' ');
}

function flush() {
  for (const el of pending) {
    const store = stores.get(el);
    if (!store) continue;
    store.dirty = false;
    el.style.transform = composeTransform(store.layers.values());
  }
  pending.clear();
}

function schedule(el: HTMLElement | SVGElement, store: Store) {
  if (store.dirty) return;
  store.dirty = true;
  pending.add(el);
  frame.once(flush, 'render');
}

/** Writes (merges) a transform layer on an element. The DOM is updated on the next frame. */
export function setTransform(el: HTMLElement | SVGElement, layer: string, values: TransformLayer) {
  let store = stores.get(el);
  if (!store) {
    store = { layers: new Map(), dirty: false };
    stores.set(el, store);
  }
  const prev = store.layers.get(layer);
  store.layers.set(layer, prev ? Object.assign(prev, values) : { ...values });
  schedule(el, store);
}

/** Removes a layer (e.g. when an effect is destroyed). */
export function clearTransform(el: HTMLElement | SVGElement, layer: string) {
  const store = stores.get(el);
  if (!store || !store.layers.delete(layer)) return;
  schedule(el, store);
}

/** Reads the current value of a layer (useful to resume a gesture from where it is). */
export function getTransform(
  el: HTMLElement | SVGElement,
  layer: string,
): Readonly<TransformLayer> {
  return stores.get(el)?.layers.get(layer) ?? {};
}
