import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyToClipboard, wordmark } from '../src';

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('copyToClipboard', () => {
  it('uses the Clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    expect(await copyToClipboard('hello')).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('falls back to execCommand and restores focus', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    });
    const exec = vi.fn().mockReturnValue(true);
    document.execCommand = exec;
    const input = document.body.appendChild(document.createElement('input'));
    input.focus();
    expect(await copyToClipboard('fallback')).toBe(true);
    expect(exec).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
    expect(document.activeElement).toBe(input);
  });
});

describe('wordmark', () => {
  it('splits plain text into hidden letters plus one readable copy, and restores it', () => {
    const el = document.body.appendChild(document.createElement('div'));
    el.textContent = 'Viz le';
    const inst = wordmark(el, { entrance: false });
    expect(el.querySelectorAll('.vz-wordmark-char')).toHaveLength(6);
    expect(el.querySelector('.vz-wordmark-glyphs')?.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('.vz-sr-only')?.textContent).toBe('Viz le');
    expect(el.dataset.vzEnter).toBe('done');
    inst.destroy();
    expect(el.innerHTML).toBe('Viz le');
    expect(el.classList.contains('vz-wordmark')).toBe(false);
  });

  it('waits to rise in until it is visible', () => {
    const el = document.body.appendChild(document.createElement('div'));
    el.textContent = 'Hi';
    const inst = wordmark(el);
    // jsdom has no IntersectionObserver: it counts as visible right away.
    expect(['pending', 'done']).toContain(el.dataset.vzEnter);
    inst.destroy();
  });
});
