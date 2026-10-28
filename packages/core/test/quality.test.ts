import { afterEach, describe, expect, it, vi } from 'vitest';
import { MIN_QUALITY, getQuality, onQualityChange, setQuality } from '../src';
import { resetFrameSamples, sampleFrame } from '../src/quality';

/** Feeds `seconds` worth of frames that each take `ms`. */
const run = (ms: number, seconds: number) => {
  for (let t = 0; t < seconds * 1000; t += ms) sampleFrame(ms);
};

afterEach(() => {
  setQuality('auto');
  resetFrameSamples();
});

describe('adaptive quality', () => {
  it('stays at full quality on a device that keeps up', () => {
    run(16.7, 5);
    expect(getQuality()).toBe(1);
  });

  it('ignores a single slow second, steps down after two, and floors at the minimum', () => {
    const seen: number[] = [];
    const off = onQualityChange((q) => seen.push(q));
    run(40, 1);
    expect(getQuality()).toBe(1);
    run(40, 1);
    expect(getQuality()).toBe(0.75);
    run(40, 20);
    expect(getQuality()).toBe(MIN_QUALITY);
    expect(document.documentElement.dataset.vzQuality).toBe('low');
    expect(seen).toEqual([0.75, 0.55, MIN_QUALITY]);
    off();
  });

  it('climbs back slowly once frames are fast again', () => {
    const before = getQuality();
    run(16, 4);
    expect(getQuality()).toBe(before); // it had stepped down: it waits longer than 4 s
    run(16, 30);
    expect(getQuality()).toBeGreaterThan(before);
  });

  it('can be pinned and handed back', () => {
    const cb = vi.fn();
    const off = onQualityChange(cb);
    setQuality(0.2);
    expect(getQuality()).toBe(MIN_QUALITY); // clamped
    run(40, 10); // pinned: the governor doesn't touch it
    expect(getQuality()).toBe(MIN_QUALITY);
    setQuality(1);
    expect(getQuality()).toBe(1);
    expect(cb).toHaveBeenCalledTimes(2);
    off();
  });
});
