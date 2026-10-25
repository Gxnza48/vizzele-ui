import { isBrowser } from './env';
import type { EffectInstance } from './effects/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFactory = (el: HTMLElement, options?: any) => { destroy(): void; update?(o: any): void };

const registry = new Map<string, AnyFactory>();
const instances = new WeakMap<Element, Map<string, { destroy(): void }>>();

const camel = (s: string) => s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

function coerce(raw: string): unknown {
  const v = raw.trim();
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'null') return null;
  if (v !== '' && !Number.isNaN(Number(v))) return Number(v);
  if (v.startsWith('[') || v.startsWith('{')) {
    try {
      return JSON.parse(v);
    } catch {
      /* fall through */
    }
  }
  return v.replace(/^['"]|['"]$/g, '');
}

/**
 * Parses attribute options. Accepts JSON or a CSS-like list:
 *   `data-vz-magnetic="strength: 0.5; radius: 120"`
 *   `data-vz-drag='{"axis":"x","snap":{"x":[0,200]}}'`
 */
export function parseOptions(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  const s = value.trim();
  if (s.startsWith('{')) {
    try {
      return JSON.parse(s) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  const out: Record<string, unknown> = {};
  // Split on ; or , that are not inside brackets.
  let depth = 0;
  let current = '';
  const pairs: string[] = [];
  for (const ch of s) {
    if (ch === '[' || ch === '{') depth++;
    if (ch === ']' || ch === '}') depth--;
    if ((ch === ';' || ch === ',') && depth === 0) {
      pairs.push(current);
      current = '';
    } else current += ch;
  }
  pairs.push(current);
  for (const pair of pairs) {
    const i = pair.indexOf(':');
    if (i < 0) {
      if (pair.trim()) out[camel(pair.trim())] = true;
      continue;
    }
    out[camel(pair.slice(0, i).trim())] = coerce(pair.slice(i + 1));
  }
  return out;
}

/** Makes an effect available as `data-vz-<name>`. */
export function registerEffect<O>(
  name: string,
  factory: (el: HTMLElement, options?: O) => EffectInstance<O> | { destroy(): void },
) {
  registry.set(name, factory as AnyFactory);
}

function mount(el: Element, name: string) {
  const factory = registry.get(name);
  if (!factory || !(el instanceof HTMLElement)) return;
  let map = instances.get(el);
  if (!map) {
    map = new Map();
    instances.set(el, map);
  }
  if (map.has(name)) return;
  map.set(name, factory(el, parseOptions(el.getAttribute(`data-vz-${name}`))));
}

function unmount(el: Element, name?: string) {
  const map = instances.get(el);
  if (!map) return;
  for (const [n, inst] of map) {
    if (name && n !== name) continue;
    inst.destroy();
    map.delete(n);
  }
}

/** Initializes every `data-vz-*` effect inside `root`. Returns a cleanup function. */
export function init(root: ParentNode = document): () => void {
  if (!isBrowser) return () => {};
  const mounted: Element[] = [];
  for (const name of registry.keys()) {
    const sel = `[data-vz-${name}]`;
    if (root instanceof Element && root.matches(sel)) {
      mount(root, name);
      mounted.push(root);
    }
    root.querySelectorAll(sel).forEach((el) => {
      mount(el, name);
      mounted.push(el);
    });
  }
  return () => mounted.forEach((el) => unmount(el));
}

/**
 * Watches the DOM and mounts / destroys `data-vz-*` effects as elements come and go,
 * or as their attributes change. Returns a function that stops watching.
 */
export function observe(root: Element = document.body): () => void {
  if (!isBrowser || typeof MutationObserver === 'undefined') return () => {};
  init(root);
  const mo = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'attributes' && r.attributeName?.startsWith('data-vz-')) {
        const name = r.attributeName.slice(8);
        if (!registry.has(name)) continue;
        const el = r.target as Element;
        unmount(el, name);
        if (el.hasAttribute(r.attributeName)) mount(el, name);
        continue;
      }
      r.removedNodes.forEach((n) => {
        if (!(n instanceof Element) || n.isConnected) return;
        unmount(n);
        n.querySelectorAll('*').forEach((c) => unmount(c));
      });
      r.addedNodes.forEach((n) => {
        if (n instanceof Element) init(n);
      });
    }
  });
  mo.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [...registry.keys()].map((n) => `data-vz-${n}`),
  });
  return () => mo.disconnect();
}
