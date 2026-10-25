import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { draggable, frame, getTransform, init, magnetic, registerAll } from '../src';

// jsdom has no PointerEvent; MouseEvent carries what we need.
class FakePointerEvent extends MouseEvent {
  pointerId: number;
  pointerType: string;
  constructor(
    type: string,
    init: MouseEventInit & { pointerId?: number; pointerType?: string } = {},
  ) {
    super(type, { bubbles: true, cancelable: true, ...init });
    this.pointerId = init.pointerId ?? 1;
    this.pointerType = init.pointerType ?? 'mouse';
  }
}
const pe = (type: string, x: number, y: number, extra: object = {}) =>
  new FakePointerEvent(type, { clientX: x, clientY: y, ...extra }) as unknown as PointerEvent;

let now = 0;
beforeEach(() => {
  frame.setManual(true);
  now = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
});
afterEach(() => {
  frame.setManual(false);
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

function setup(opts: Parameters<typeof draggable>[1] = {}) {
  const el = document.createElement('div');
  el.setPointerCapture = () => {};
  document.body.appendChild(el);
  return { el, drag: draggable(el, opts) };
}

function gesture(el: HTMLElement, points: [number, number][], stepMs = 16) {
  const [first, ...rest] = points;
  el.dispatchEvent(pe('pointerdown', first![0], first![1]));
  for (const [x, y] of rest) {
    now += stepMs;
    window.dispatchEvent(pe('pointermove', x, y));
  }
  now += 1;
  const last = points[points.length - 1]!;
  window.dispatchEvent(pe('pointerup', last[0], last[1]));
}

describe('draggable', () => {
  it('follows the pointer and fires lifecycle callbacks', () => {
    const onStart = vi.fn();
    const onEnd = vi.fn();
    const { el, drag } = setup({ momentum: false, onStart, onEnd });
    el.dispatchEvent(pe('pointerdown', 0, 0));
    window.dispatchEvent(pe('pointermove', 1, 1)); // under threshold
    expect(onStart).not.toHaveBeenCalled();
    window.dispatchEvent(pe('pointermove', 40, 25));
    expect(onStart).toHaveBeenCalledOnce();
    expect(drag.x).toBe(40);
    expect(drag.y).toBe(25);
    expect(drag.dragging).toBe(true);
    window.dispatchEvent(pe('pointerup', 40, 25));
    expect(onEnd).toHaveBeenCalledOnce();
    frame.advance(16);
    expect(getTransform(el, 'drag').x).toBe(40);
  });

  it('locks to an axis', () => {
    const { el, drag } = setup({ axis: 'x', momentum: false });
    gesture(el, [
      [0, 0],
      [30, 50],
    ]);
    expect(drag.x).toBe(30);
    expect(drag.y).toBe(0);
  });

  it('rubber-bands past bounds and springs back inside', () => {
    const { el, drag } = setup({ bounds: { left: 0, right: 100 }, axis: 'x', momentum: false });
    el.dispatchEvent(pe('pointerdown', 0, 0));
    window.dispatchEvent(pe('pointermove', 300, 0));
    expect(drag.x).toBeGreaterThan(100);
    expect(drag.x).toBeLessThan(300);
    window.dispatchEvent(pe('pointerup', 300, 0));
    frame.advance(4000);
    expect(drag.x).toBe(100);
  });

  it('throws with momentum and snaps to points', () => {
    const { el, drag } = setup({ axis: 'x', snap: { x: [0, 200, 400] } });
    gesture(el, [
      [0, 0],
      [20, 0],
      [40, 0],
      [60, 0],
      [80, 0],
    ]);
    frame.advance(5000);
    expect([200, 400]).toContain(drag.x);
  });

  it('returns to origin when asked', () => {
    const { el, drag } = setup({ returnToOrigin: true });
    gesture(el, [
      [0, 0],
      [50, 50],
    ]);
    frame.advance(5000);
    expect(drag.x).toBe(0);
    expect(drag.y).toBe(0);
  });

  it('moves with arrow keys', () => {
    const { el, drag } = setup({ keyboard: 10 });
    el.tabIndex = 0;
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    frame.advance(4000);
    expect(drag.x).toBe(10);
  });

  it('cleans up listeners on destroy', () => {
    const onStart = vi.fn();
    const { el, drag } = setup({ onStart });
    drag.destroy();
    gesture(el, [
      [0, 0],
      [50, 0],
    ]);
    expect(onStart).not.toHaveBeenCalled();
  });
});

describe('declarative', () => {
  it('mounts effects from data-vz-* attributes and cleans them up', () => {
    registerAll();
    document.body.innerHTML =
      '<button data-vz-magnetic="strength: 0.5">Hi</button><div data-vz-drag="axis: x"></div>';
    const cleanup = init(document);
    const drag = document.querySelector<HTMLElement>('[data-vz-drag]')!;
    expect(drag.style.touchAction).toBe('pan-y');
    cleanup();
    expect(drag.style.touchAction).toBe('');
  });

  it('magnetic is inert on the server-like path and destroyable', () => {
    const el = document.createElement('button');
    const m = magnetic(el);
    expect(() => m.destroy()).not.toThrow();
  });
});
