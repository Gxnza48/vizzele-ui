import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { LaptopMockup, PhoneMockup } from '../src';

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});
afterEach(cleanup);

describe('mockups', () => {
  it('puts live, accessible content on the screen', () => {
    render(
      <PhoneMockup model="galaxy" finish="violet" width={300}>
        <button>Pay</button>
      </PhoneMockup>,
    );
    const button = screen.getByRole('button', { name: 'Pay' });
    expect(button.closest('.vz-mockup-content')).not.toBeNull();
    const root = button.closest('.vz-mockup') as HTMLElement;
    expect(root.dataset.vzDevice).toBe('galaxy');
    expect(root.dataset.vzFinish).toBe('violet');
    expect(root.style.getPropertyValue('--vz-m-scale')).not.toBe('');
    // Decoration is hidden; the clock is not read out.
    expect(screen.queryByText('12:45')?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('renders on the server', () => {
    const html = renderToString(
      <>
        <PhoneMockup>
          <p>Hi</p>
        </PhoneMockup>
        <LaptopMockup>
          <p>Site</p>
        </LaptopMockup>
      </>,
    );
    expect(html).toContain('data-vz-device="iphone"');
    expect(html).toContain('data-vz-device="laptop"');
    expect(html).toContain('vz-m-key');
  });
});
