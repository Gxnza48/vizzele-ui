import { isBrowser } from './env';

type Callback = (entry: IntersectionObserverEntry) => void;

const observers = new Map<
  string,
  { io: IntersectionObserver; callbacks: Map<Element, Set<Callback>> }
>();

function getObserver(threshold: number, rootMargin: string) {
  const key = `${threshold}|${rootMargin}`;
  let entry = observers.get(key);
  if (!entry) {
    const callbacks = new Map<Element, Set<Callback>>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) callbacks.get(e.target)?.forEach((cb) => cb(e));
      },
      { threshold, rootMargin },
    );
    entry = { io, callbacks };
    observers.set(key, entry);
  }
  return entry;
}

export interface VisibilityOptions {
  /** Portion of the element (0..1) that must be visible. Default 0. */
  amount?: number;
  /** CSS margin around the viewport, e.g. "0px 0px -10% 0px". */
  margin?: string;
}

/**
 * Calls `cb(true|false)` as the element enters/leaves the viewport.
 * All elements with the same options share one IntersectionObserver.
 */
export function observeVisibility(
  el: Element,
  cb: (visible: boolean, entry: IntersectionObserverEntry) => void,
  { amount = 0, margin = '0px' }: VisibilityOptions = {},
): () => void {
  if (!isBrowser || typeof IntersectionObserver === 'undefined') {
    cb(true, {} as IntersectionObserverEntry);
    return () => {};
  }
  const { io, callbacks } = getObserver(amount, margin);
  const wrapped: Callback = (e) => cb(e.isIntersecting && e.intersectionRatio >= amount * 0.99, e);
  let set = callbacks.get(el);
  if (!set) {
    set = new Set();
    callbacks.set(el, set);
    io.observe(el);
  }
  set.add(wrapped);
  return () => {
    const s = callbacks.get(el);
    if (!s) return;
    s.delete(wrapped);
    if (!s.size) {
      callbacks.delete(el);
      io.unobserve(el);
    }
  };
}

/** Runs `onEnter` when the element scrolls into view; with `once`, stops observing afterwards. */
export function inView(
  el: Element,
  onEnter: (
    entry: IntersectionObserverEntry,
  ) => void | ((entry: IntersectionObserverEntry) => void),
  options: VisibilityOptions & { once?: boolean } = {},
): () => void {
  let onLeave: ((entry: IntersectionObserverEntry) => void) | void;
  let stop = () => {};
  let inside = false;
  stop = observeVisibility(
    el,
    (visible, entry) => {
      if (visible && !inside) {
        inside = true;
        onLeave = onEnter(entry);
        if (options.once) stop();
      } else if (!visible && inside) {
        inside = false;
        onLeave?.(entry);
      }
    },
    options,
  );
  return () => stop();
}
