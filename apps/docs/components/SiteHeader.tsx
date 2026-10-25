'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search } from './Search';
import { CURSOR_EVENT, CURSOR_KEY } from './SiteEffects';
import { Logo } from './Logo';

export function SiteHeader() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [cursorOn, setCursorOn] = useState(true);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
    try {
      setCursorOn(localStorage.getItem(CURSOR_KEY) !== 'off');
    } catch {
      /* storage blocked */
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('vz-theme', next);
    } catch {
      /* storage blocked */
    }
  };

  const toggleCursor = () => {
    const next = !cursorOn;
    setCursorOn(next);
    try {
      localStorage.setItem(CURSOR_KEY, next ? 'on' : 'off');
    } catch {
      /* storage blocked */
    }
    window.dispatchEvent(new Event(CURSOR_EVENT));
  };

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label="Vizzele UI home">
          <Logo size={26} />
          <span className="brand-name">
            Vizzele <span className="brand-ui">UI</span>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Main">
          <Link href="/docs" aria-current={pathname === '/docs' ? 'page' : undefined}>
            Docs
          </Link>
          <Link
            href="/docs/button"
            aria-current={
              pathname?.startsWith('/docs/') && !pathname.startsWith('/docs/guides')
                ? 'page'
                : undefined
            }
          >
            Components
          </Link>
          <Link
            href="/docs/guides/springs"
            className="hide-sm"
            aria-current={pathname === '/docs/guides/springs' ? 'page' : undefined}
          >
            Physics
          </Link>
        </nav>
        <div className="site-actions">
          <Search />
          <button
            type="button"
            className="icon-button hide-sm"
            onClick={toggleCursor}
            aria-pressed={cursorOn}
            title="Toggle liquid cursor"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
            <span className="vz-sr-only">Liquid cursor</span>
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6" />
                <path
                  d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          <a
            className="icon-button"
            href="https://github.com/Gxnza48/vizzele-ui"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}
