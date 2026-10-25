import { afterEach, describe, expect, it, vi } from 'vitest';
import { holdToConfirm, liquidFocus, liquidSelection, surfaceTension } from '../src';

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('liquidFocus', () => {
  it('mounts one ring, hides native outlines, and cleans up', () => {
    const inst = liquidFocus();
    expect(document.querySelectorAll('.vz-focus-drop')).toHaveLength(1);
    expect(document.documentElement.classList.contains('vz-liquid-focus')).toBe(true);
    inst.destroy();
    expect(document.querySelector('.vz-focus-drop')).toBeNull();
    expect(document.documentElement.classList.contains('vz-liquid-focus')).toBe(false);
  });

  it('shows on keyboard focus and hides on pointer use', () => {
    const inst = liquidFocus({ keyboardOnly: false });
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    btn.focus();
    const ring = document.querySelector<HTMLElement>('.vz-focus-drop')!;
    expect(ring.hasAttribute('data-visible')).toBe(true);
    document.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    expect(ring.hasAttribute('data-visible')).toBe(false);
    inst.destroy();
  });

  it('skips controls that opt out with data-vz-focus-ring="off"', () => {
    const inst = liquidFocus({ keyboardOnly: false });
    const btn = document.createElement('button');
    const wrap = document.createElement('div');
    wrap.dataset.vzFocusRing = 'off';
    const field = document.createElement('input');
    wrap.appendChild(field);
    document.body.append(btn, wrap);
    const ring = document.querySelector<HTMLElement>('.vz-focus-drop')!;
    btn.focus();
    expect(ring.hasAttribute('data-visible')).toBe(true);
    field.focus();
    expect(ring.hasAttribute('data-visible')).toBe(false);
    inst.destroy();
  });
});

describe('holdToConfirm', () => {
  it('confirms only after being held for the duration (keyboard)', async () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    const onConfirm = vi.fn();
    const inst = holdToConfirm(btn, { duration: 150, onConfirm, resetAfter: 0 });
    btn.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    btn.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    expect(onConfirm).not.toHaveBeenCalled(); // a tap never confirms
    btn.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    await vi.waitFor(() => expect(onConfirm).toHaveBeenCalledOnce(), { timeout: 2000 });
    expect(btn.hasAttribute('data-confirmed')).toBe(true);
    inst.destroy();
    expect(btn.querySelector('.vz-hold-tank')).toBeNull();
  });
});

describe('surfaceTension', () => {
  it('adds one drop per item, a neck per neighbour pair, and a droplet', () => {
    const box = document.createElement('div');
    box.innerHTML = '<button>a</button><button>b</button><button>c</button>';
    document.body.appendChild(box);
    const inst = surfaceTension(box);
    expect(box.querySelectorAll('.vz-tension-drop')).toHaveLength(3);
    expect(box.querySelectorAll('.vz-tension-neck')).toHaveLength(2);
    expect(box.querySelectorAll('.vz-tension-droplet')).toHaveLength(1);
    expect(box.querySelectorAll('.vz-tension-item')).toHaveLength(3);
    inst.destroy();
    expect(box.querySelector('.vz-tension-layer')).toBeNull();
    expect(box.querySelectorAll('.vz-tension-item')).toHaveLength(0);
  });
});

describe('liquidSelection', () => {
  it('scopes itself to a root and removes its layer', () => {
    const root = document.createElement('article');
    document.body.appendChild(root);
    const inst = liquidSelection({ root });
    expect(root.hasAttribute('data-vz-liquid-select')).toBe(true);
    expect(document.querySelector('.vz-selection-layer')).not.toBeNull();
    inst.destroy();
    expect(root.hasAttribute('data-vz-liquid-select')).toBe(false);
    expect(document.querySelector('.vz-selection-layer')).toBeNull();
  });
});
