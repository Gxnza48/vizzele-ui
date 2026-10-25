import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  counter,
  createPhysicsWorld,
  elementProgress,
  frame,
  reorder,
  scramble,
  setReducedMotion,
  springToCss,
  supportsRefraction,
} from '../src';

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});
beforeEach(() => frame.setManual(true));
afterEach(() => {
  frame.setManual(false);
  setReducedMotion('system');
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

const rect = (top: number, height: number, left = 0, width = 100) =>
  ({
    top,
    height,
    left,
    width,
    bottom: top + height,
    right: left + width,
    x: left,
    y: top,
    toJSON() {},
  }) as DOMRect;

describe('elementProgress', () => {
  it('goes 0 → 1 as an element crosses the viewport', () => {
    const el = document.createElement('div');
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect(1000, 200));
    expect(elementProgress(el)).toBe(0);
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect(400, 200));
    expect(elementProgress(el)).toBeCloseTo(0.5, 5);
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect(-200, 200));
    expect(elementProgress(el)).toBe(1);
  });
});

describe('physics world', () => {
  function world(n = 3) {
    const box = document.createElement('div');
    Object.defineProperty(box, 'clientWidth', { value: 400 });
    Object.defineProperty(box, 'clientHeight', { value: 300 });
    document.body.appendChild(box);
    const w = createPhysicsWorld(box, { gravity: { x: 0, y: 2000 } });
    for (let i = 0; i < n; i++) {
      const b = document.createElement('span');
      box.appendChild(b);
      w.add(b, { radius: 20, x: 60 + i * 30, y: 30 });
    }
    return w;
  }

  it('bodies fall, stay inside the walls and stop overlapping', () => {
    const w = world(4);
    frame.advance(4000);
    for (const b of w.bodies) {
      expect(b.y).toBeLessThanOrEqual(300 - 20 + 0.5);
      expect(b.x).toBeGreaterThanOrEqual(20 - 0.5);
      expect(b.x).toBeLessThanOrEqual(400 - 20 + 0.5);
    }
    for (let i = 0; i < w.bodies.length; i++)
      for (let j = i + 1; j < w.bodies.length; j++) {
        const a = w.bodies[i]!;
        const b = w.bodies[j]!;
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(40 - 1.5);
      }
    // and it goes to sleep
    expect(frame.size).toBe(0);
  });

  it('impulse pushes bodies away', () => {
    const w = world(1);
    frame.advance(3000);
    const before = w.bodies[0]!.x;
    w.impulse(before - 30, w.bodies[0]!.y, 3000, 200);
    frame.advance(100);
    expect(w.bodies[0]!.x).toBeGreaterThan(before);
  });
});

describe('reorder (vanilla)', () => {
  it('moves DOM nodes with the keyboard and reports indices', () => {
    document.body.innerHTML =
      '<ul><li tabindex="0">a</li><li tabindex="0">b</li><li tabindex="0">c</li></ul>';
    const ul = document.querySelector('ul')!;
    const onReorder = vi.fn();
    reorder(ul, { onReorder });
    const a = ul.children[0] as HTMLElement;
    a.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    a.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(onReorder).toHaveBeenCalledWith(0, 1);
    expect([...ul.children].map((c) => c.textContent).join('')).toBe('bac');
  });
});

describe('text effects', () => {
  it('scramble lands on the final text and keeps an accessible copy', () => {
    const el = document.createElement('span');
    el.textContent = 'Liquid';
    const s = scramble(el, { trigger: 'manual', duration: 300 });
    s.play();
    frame.advance(60);
    expect(el.querySelector('.vz-sr-only')!.textContent).toBe('Liquid');
    frame.advance(1000);
    expect(el.querySelector('[aria-hidden]')!.textContent).toBe('Liquid');
  });

  it('counter springs to its value and formats it', () => {
    const el = document.createElement('span');
    const c = counter(el, {
      to: 1234,
      inView: false,
      format: { useGrouping: true },
      locale: 'en-US',
    });
    const shown = () => el.querySelector('[aria-hidden]')!.textContent;
    frame.advance(6000);
    expect(shown()).toBe('1,234');
    c.set(10);
    frame.advance(6000);
    expect(shown()).toBe('10');
    expect(el.querySelector('.vz-sr-only')!.textContent).toBe('10');
  });

  it('counter jumps straight to the value with reduced motion', () => {
    setReducedMotion('always');
    const el = document.createElement('span');
    counter(el, { to: 42, inView: false });
    expect(el.querySelector('[aria-hidden]')!.textContent).toBe('42');
  });
});

describe('misc', () => {
  it('liquid glass refraction is not claimed outside Chromium', () => {
    expect(supportsRefraction()).toBe(false); // jsdom
  });

  it('every spring preset produces a usable CSS easing', () => {
    for (const p of ['liquid', 'gentle', 'jelly', 'snappy', 'heavy', 'bouncy', 'smooth'] as const) {
      const { easing, duration } = springToCss(p);
      expect(easing).toMatch(/^linear\(/);
      expect(duration).toBeGreaterThan(50);
      expect(duration).toBeLessThan(4000);
    }
  });
});
