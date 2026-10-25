import { afterEach, describe, expect, it } from 'vitest';
import { mockup, mockupTree, type MockupNode } from '../src';

afterEach(() => {
  document.body.innerHTML = '';
});

const all = (nodes: MockupNode[]): MockupNode[] => nodes.flatMap((n) => [n, ...all(n.k ?? [])]);

describe('mockupTree', () => {
  it('has exactly one screen slot per device, and hides everything else', () => {
    for (const device of ['iphone', 'galaxy', 'laptop'] as const) {
      const nodes = all(mockupTree(device));
      expect(nodes.filter((n) => n.slot)).toHaveLength(1);
      // The path to the screen stays visible to assistive tech; decoration is hidden.
      expect(nodes.find((n) => n.slot)!.a).toBeUndefined();
      expect(nodes.find((n) => n.c.includes('vz-m-shadow'))!.a).toBe(true);
      expect(nodes.filter((n) => n.c === 'vz-m-edge').length).toBeGreaterThan(20);
    }
  });

  it('can drop the status bar and change the clock', () => {
    expect(all(mockupTree('iphone', { statusBar: false })).some((n) => n.c === 'vz-m-status')).toBe(
      false,
    );
    expect(all(mockupTree('galaxy', { time: '8:00' })).find((n) => n.c === 'vz-m-time')!.t).toBe(
      '8:00',
    );
  });
});

describe('mockup (vanilla)', () => {
  it('builds the device around the existing children and restores them', () => {
    const el = document.body.appendChild(document.createElement('div'));
    el.dataset.vzDevice = 'galaxy';
    el.innerHTML = '<img alt="App">';
    const inst = mockup(el);
    expect(el.querySelector('.vz-mockup-content img')).not.toBeNull();
    expect(el.querySelector('.vz-m-shadow')!.getAttribute('aria-hidden')).toBe('true');
    expect(el.style.aspectRatio).not.toBe('');
    inst.destroy();
    expect(el.innerHTML).toBe('<img alt="App">');
  });
});
