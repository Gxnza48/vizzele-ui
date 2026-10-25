import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  Spring,
  createSprings,
  frame,
  resolveSpring,
  setReducedMotion,
  solveSpring,
  springDuration,
  springToCss,
  springs,
} from '../src';

beforeEach(() => frame.setManual(true));
afterEach(() => {
  setReducedMotion('system');
  frame.setManual(false);
});

describe('solveSpring', () => {
  const configs = {
    under: resolveSpring({ stiffness: 200, damping: 10 }),
    critical: resolveSpring({ stiffness: 100, damping: 20, mass: 1 }),
    over: resolveSpring({ stiffness: 100, damping: 60 }),
  };

  it.each(Object.entries(configs))('%s-damped starts at the initial state', (_, c) => {
    const [x, v] = solveSpring(1, 5, 0, c);
    expect(x).toBeCloseTo(1, 6);
    expect(v).toBeCloseTo(5, 6);
  });

  it.each(Object.entries(configs))('%s-damped converges to 0', (_, c) => {
    const [x, v] = solveSpring(1, 0, 10, c);
    expect(Math.abs(x)).toBeLessThan(1e-4);
    expect(Math.abs(v)).toBeLessThan(1e-3);
  });

  it('velocity is the derivative of position', () => {
    const c = configs.under;
    const t = 0.13;
    const h = 1e-5;
    const [x1] = solveSpring(1, 2, t - h, c);
    const [x2] = solveSpring(1, 2, t + h, c);
    const [, v] = solveSpring(1, 2, t, c);
    expect(v).toBeCloseTo((x2 - x1) / (2 * h), 3);
  });

  it('is frame-rate independent (one big step == many small ones)', () => {
    const c = configs.under;
    const [bigX] = solveSpring(1, 0, 0.5, c);
    let x = 1;
    let v = 0;
    for (let i = 0; i < 30; i++) [x, v] = solveSpring(x, v, 0.5 / 30, c);
    expect(x).toBeCloseTo(bigX, 8);
  });

  it('underdamped springs overshoot, overdamped do not', () => {
    const minOf = (c: ReturnType<typeof resolveSpring>) => {
      let min = Infinity;
      for (let t = 0; t < 3; t += 0.005) min = Math.min(min, solveSpring(1, 0, t, c)[0]);
      return min;
    };
    expect(minOf(configs.under)).toBeLessThan(-0.1);
    expect(minOf(configs.over)).toBeGreaterThanOrEqual(-1e-9);
  });
});

describe('Spring', () => {
  it('animates to its target and rests', () => {
    const values: number[] = [];
    let rested = false;
    const s = new Spring({ onUpdate: (v) => values.push(v), onRest: () => (rested = true) });
    s.set(100);
    expect(s.isAnimating).toBe(true);
    frame.advance(3000);
    expect(s.value).toBe(100);
    expect(s.velocity).toBe(0);
    expect(rested).toBe(true);
    expect(s.isAnimating).toBe(false);
    expect(values.length).toBeGreaterThan(10);
    expect(frame.size).toBe(0);
  });

  it('keeps velocity when retargeted mid-flight', () => {
    const s = new Spring();
    s.set(100);
    frame.advance(100);
    const v = s.velocity;
    expect(v).toBeGreaterThan(0);
    s.set(-100);
    expect(s.velocity).toBe(v);
  });

  it('jumps instead of animating under reduced motion', () => {
    setReducedMotion('always');
    const s = new Spring();
    s.set(50);
    expect(s.value).toBe(50);
    expect(s.isAnimating).toBe(false);
  });

  it('impulse moves a resting spring and returns it', () => {
    const s = new Spring({ from: 0 });
    s.impulse(1000);
    frame.advance(50);
    expect(s.value).toBeGreaterThan(0);
    frame.advance(5000);
    expect(s.value).toBe(0);
  });
});

describe('createSprings', () => {
  it('batches updates to one call per frame', () => {
    let calls = 0;
    const g = createSprings({ x: 0, y: 0 }, { onUpdate: () => calls++ });
    g.set({ x: 10, y: 20 });
    frame.advance(1000 / 60);
    expect(calls).toBe(1);
    frame.advance(4000);
    expect(g.values).toEqual({ x: 10, y: 20 });
  });
});

describe('springDuration / springToCss', () => {
  it('stiffer springs settle faster', () => {
    expect(springDuration(springs.snappy)).toBeLessThan(springDuration(springs.gentle));
  });

  it('produces a valid CSS linear() easing ending at 1', () => {
    const { easing, duration } = springToCss('liquid');
    expect(easing.startsWith('linear(0,')).toBe(true);
    expect(easing.endsWith('1)')).toBe(true);
    expect(duration).toBeGreaterThan(100);
  });
});
