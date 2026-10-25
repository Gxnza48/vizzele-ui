import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { textPortal } from '../src';

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});
afterEach(() => {
  document.body.innerHTML = '';
});

describe('textPortal (vanilla)', () => {
  it('builds the stage around the children and restores them', () => {
    const el = document.body.appendChild(document.createElement('section'));
    el.dataset.vzText = 'DIVE';
    el.innerHTML = '<h2>Inside</h2><p data-vz-portal-cover>Scroll</p>';
    const onProgress = vi.fn();
    const inst = textPortal(el, { length: 2, onProgress });
    expect(el.classList.contains('vz-portal')).toBe(true);
    expect(el.querySelector('.vz-portal-scene h2')).not.toBeNull();
    expect(el.querySelector('.vz-portal-cover [data-vz-portal-cover]')).not.toBeNull();
    // The word is decoration, cut out of the sheet by a mask with a unique id.
    const overlay = el.querySelector('.vz-portal-overlay')!;
    expect(overlay.getAttribute('aria-hidden')).toBe('true');
    expect(overlay.querySelector('.vz-portal-word')!.textContent).toBe('DIVE');
    const id = overlay.querySelector('mask')!.id;
    expect(overlay.querySelector('.vz-portal-fill')!.getAttribute('mask')).toBe(`url(#${id})`);
    expect(el.style.getPropertyValue('--vz-portal-length')).toBe('2');
    inst.destroy();
    expect(el.querySelector('.vz-portal-stage')).toBeNull();
    expect(el.querySelector(':scope > h2')).not.toBeNull();
    expect(el.querySelector(':scope > [data-vz-portal-cover]')).not.toBeNull();
  });

  it('uses existing markup as is', () => {
    const el = document.body.appendChild(document.createElement('section'));
    el.innerHTML =
      '<div class="vz-portal-stage"><div class="vz-portal-scene"></div><svg class="vz-portal-overlay"></svg></div>';
    const inst = textPortal(el, { text: 'X' });
    expect(el.querySelectorAll('.vz-portal-stage')).toHaveLength(1);
    inst.destroy();
    expect(el.querySelector('.vz-portal-stage')).not.toBeNull();
  });
});
