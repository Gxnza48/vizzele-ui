import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { TextPortal } from '../src';

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});
afterEach(cleanup);

describe('TextPortal', () => {
  it('renders the scene, the cover and a decorative word', () => {
    render(
      <TextPortal text="LIQUID" focus={1} aria-label="Hero" cover={<p>Scroll</p>}>
        <button>Inside</button>
      </TextPortal>,
    );
    const button = screen.getByRole('button', { name: 'Inside' });
    expect(button.closest('.vz-portal-scene')).not.toBeNull();
    expect(screen.getByText('Scroll').closest('.vz-portal-cover')).not.toBeNull();
    expect(screen.getByText('LIQUID').closest('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.getByRole('region', { name: 'Hero' }).dataset.state).toBe('closed');
  });

  it('server-renders with a valid mask reference', () => {
    const html = renderToString(<TextPortal text="DIVE">scene</TextPortal>);
    const id = /<mask id="([^"]+)"/.exec(html)![1]!;
    expect(id).toMatch(/^[\w-]+$/);
    expect(html).toContain(`mask="url(#${id})"`);
    expect(html).toContain('--vz-portal-length:1.5');
  });
});
