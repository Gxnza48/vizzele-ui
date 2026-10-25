import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { CopyButton, Footer, Sidebar, Wordmark } from '../src';

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});
afterEach(cleanup);

describe('CopyButton', () => {
  it('copies, shows the copied state and announces it outside the button', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const onCopy = vi.fn();
    render(
      <CopyButton value={() => 'built'} onCopy={onCopy}>
        Copy
      </CopyButton>,
    );
    const button = screen.getByRole('button', { name: 'Copy' });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(writeText).toHaveBeenCalledWith('built');
    expect(onCopy).toHaveBeenCalledWith('built', true);
    expect(button.dataset.state).toBe('copied');
    expect(screen.getByRole('status').textContent).toBe('Copied to clipboard');
    // The announcement is not part of the button's name.
    expect(button.contains(screen.getByRole('status'))).toBe(false);
  });

  it('icon-only buttons get an accessible name', () => {
    render(<CopyButton value="x" />);
    expect(screen.getByRole('button', { name: 'Copy to clipboard' })).toBeTruthy();
  });
});

const sections = [
  {
    title: 'Main',
    items: [
      { href: '/', label: 'Home' },
      { href: '/inbox', label: 'Inbox', badge: 3 },
    ],
  },
  { title: 'Projects', collapsible: true, items: [{ href: '/p/a', label: 'Alpha' }] },
];

describe('Sidebar', () => {
  it('marks the current page and folds sections accessibly', () => {
    render(<Sidebar sections={sections} active="/inbox" label="App" />);
    expect(screen.getByRole('navigation', { name: 'App' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Inbox/ }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBeNull();
    const toggle = screen.getByRole('button', { name: 'Projects' });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    const fold = document.getElementById(toggle.getAttribute('aria-controls')!)!;
    expect(fold.getAttribute('aria-hidden')).toBe('true');
    expect(fold.querySelector('a')!.getAttribute('tabindex')).toBe('-1');
  });

  it('renders custom link components', () => {
    const Link = (p: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a data-custom {...p} />;
    render(<Sidebar sections={sections} linkAs={Link} />);
    expect(screen.getByRole('link', { name: 'Home' }).hasAttribute('data-custom')).toBe(true);
  });
});

describe('Footer & Wordmark', () => {
  it('reads the wordmark once and marks external links', () => {
    render(
      <Footer
        columns={[
          {
            title: 'More',
            links: [
              { href: '/docs', label: 'Docs' },
              { href: 'https://github.com', label: 'GitHub' },
            ],
          },
        ]}
        legal="© Acme"
        wordmark="Acme"
      />,
    );
    expect(screen.getByRole('contentinfo')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Footer' })).toBeTruthy();
    expect(
      screen.getByRole('link', { name: /GitHub.*opens in a new tab/ }).getAttribute('target'),
    ).toBe('_blank');
    expect(screen.getByRole('link', { name: 'Docs' }).getAttribute('target')).toBeNull();
    const mark = document.querySelector('.vz-wordmark')!;
    expect(mark.querySelector('.vz-sr-only')!.textContent).toBe('Acme');
    expect(mark.querySelector('.vz-wordmark-glyphs')!.getAttribute('aria-hidden')).toBe('true');
    expect(mark.querySelectorAll('.vz-wordmark-char')).toHaveLength(4);
  });

  it('renders on the server', () => {
    const html = renderToString(
      <>
        <CopyButton value="x">Copy</CopyButton>
        <Sidebar sections={sections} active="/" />
        <Footer wordmark="Vizzele" />
        <Wordmark text="Hi" />
      </>,
    );
    expect(html).toContain('vz-copy');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('vz-wordmark-char');
  });
});
