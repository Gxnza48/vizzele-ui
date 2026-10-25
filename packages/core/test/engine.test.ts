import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  VelocityTracker,
  composeTransform,
  frame,
  inertia,
  mixColors,
  parseColor,
  parseOptions,
  projectInertia,
  rubberband,
  rubberbandClamp,
  setTransform,
  splitText,
  toHex,
  wrap,
} from '../src';

beforeEach(() => frame.setManual(true));
afterEach(() => frame.setManual(false));

describe('scheduler', () => {
  it('runs phases in read → update → render order', () => {
    const order: string[] = [];
    frame.once(() => void order.push('render'), 'render');
    frame.once(() => void order.push('update'), 'update');
    frame.once(() => void order.push('read'), 'read');
    frame.advance(16);
    expect(order).toEqual(['read', 'update', 'render']);
  });

  it('dedupes the same once-callback within a frame', () => {
    let n = 0;
    const cb = () => void n++;
    frame.once(cb);
    frame.once(cb);
    frame.advance(16);
    expect(n).toBe(1);
  });

  it('removes a callback that returns false and sleeps when idle', () => {
    let n = 0;
    frame.add(() => ++n < 3);
    frame.advance(1000);
    expect(n).toBe(3);
    expect(frame.size).toBe(0);
  });

  it('clamps delta to avoid huge jumps', () => {
    let delta = 0;
    frame.add((s) => {
      delta = s.delta;
      return false;
    });
    frame.advance(500, 500);
    expect(delta).toBeLessThanOrEqual(1 / 15);
  });
});

describe('math', () => {
  it('rubberband resists more the further you pull', () => {
    const a = rubberband(50, 300);
    const b = rubberband(100, 300);
    expect(a).toBeGreaterThan(0);
    expect(a).toBeLessThan(50);
    expect(b - a).toBeLessThan(a);
    expect(rubberband(-50, 300)).toBeCloseTo(-a);
    expect(rubberband(10_000, 300)).toBeLessThan(300);
  });

  it('rubberbandClamp is identity inside the range', () => {
    expect(rubberbandClamp(50, 0, 100, 200)).toBe(50);
    expect(rubberbandClamp(150, 0, 100, 200)).toBeGreaterThan(100);
    expect(rubberbandClamp(150, 0, 100, 200)).toBeLessThan(150);
    expect(rubberbandClamp(150, 0, 100, 200, 0)).toBe(100);
  });

  it('wrap', () => {
    expect(wrap(-1, 0, 10)).toBe(9);
    expect(wrap(12, 0, 10)).toBe(2);
  });
});

describe('VelocityTracker', () => {
  it('measures px/s and drops to 0 after a pause', () => {
    const t = new VelocityTracker(100);
    for (let i = 0; i <= 10; i++) t.add(i * 10, i * 10); // 10px every 10ms
    expect(t.get(100)).toBeCloseTo(1000, 0);
    expect(t.get(400)).toBe(0);
  });
});

describe('inertia', () => {
  it('glides to the projected target', () => {
    let last = 0;
    let done = false;
    inertia({
      from: 0,
      velocity: 1000,
      onUpdate: (v) => (last = v),
      onComplete: () => (done = true),
    });
    frame.advance(5000);
    expect(done).toBe(true);
    expect(last).toBeCloseTo(projectInertia(0, 1000), 0);
  });

  it('bounces back to a limit it overshoots', () => {
    let last = 0;
    let max = 0;
    inertia({
      from: 0,
      velocity: 3000,
      max: 200,
      onUpdate: (v) => {
        last = v;
        max = Math.max(max, v);
      },
    });
    frame.advance(5000);
    expect(max).toBeGreaterThan(200);
    expect(last).toBe(200);
  });

  it('lands on a snapped target', () => {
    let last = 0;
    inertia({
      from: 0,
      velocity: 700,
      modifyTarget: (t) => Math.round(t / 100) * 100,
      onUpdate: (v) => (last = v),
    });
    frame.advance(5000);
    expect(last % 100).toBe(0);
  });
});

describe('transform store', () => {
  it('composes layers', () => {
    expect(composeTransform([{ x: 10 }, { x: 5, y: 2, scale: 2 }, { scale: 0.5, rotate: 3 }])).toBe(
      'translate3d(15px, 2px, 0px) rotate(3deg)',
    );
    expect(composeTransform([{ perspective: 800, rotateX: 4 }, { perspective: 1000 }])).toBe(
      'perspective(1000px) rotateX(4deg)',
    );
  });

  it('writes to the element on the next frame', () => {
    const el = document.createElement('div');
    setTransform(el, 'a', { x: 4 });
    setTransform(el, 'b', { y: 6 });
    expect(el.style.transform).toBe('');
    frame.advance(16);
    expect(el.style.transform).toBe('translate3d(4px, 6px, 0px)');
  });
});

describe('parseOptions', () => {
  it('parses css-like lists with types', () => {
    expect(
      parseOptions('strength: 0.5; radius: 120, axis: x; momentum: false; snap: [0, 100]'),
    ).toEqual({
      strength: 0.5,
      radius: 120,
      axis: 'x',
      momentum: false,
      snap: [0, 100],
    });
  });
  it('parses JSON and kebab keys', () => {
    expect(parseOptions('{"axis":"y"}')).toEqual({ axis: 'y' });
    expect(parseOptions('inner-strength: 0.3')).toEqual({ innerStrength: 0.3 });
    expect(parseOptions('')).toEqual({});
  });
});

describe('color', () => {
  it('parses and formats', () => {
    expect(parseColor('#0ff')).toEqual([0, 255, 255]);
    expect(parseColor('rgb(1, 2, 3)')).toEqual([1, 2, 3]);
    expect(toHex([255, 0, 128])).toBe('#ff0080');
  });
  it('mixes endpoints exactly', () => {
    expect(toHex(mixColors('#ff0000', '#0000ff', 0))).toBe('#ff0000');
    expect(toHex(mixColors('#ff0000', '#0000ff', 1))).toBe('#0000ff');
  });
});

describe('splitText', () => {
  it('splits into words and chars, keeps an accessible label, and reverts', () => {
    const el = document.createElement('h1');
    el.innerHTML = 'Hola <em>mundo</em>';
    const s = splitText(el);
    expect(s.words.length).toBe(2);
    expect(s.chars.length).toBe(9);
    expect(el.getAttribute('aria-label')).toBe('Hola mundo');
    expect(s.words[0]!.getAttribute('aria-hidden')).toBe('true');
    s.revert();
    expect(el.innerHTML).toBe('Hola <em>mundo</em>');
    expect(el.hasAttribute('aria-label')).toBe(false);
  });
});
