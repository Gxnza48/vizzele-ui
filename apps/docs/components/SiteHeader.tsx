'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Spring, onScroll, resolveSpring } from '@vizzele/core';
import { Button, ThemeToggle } from '@vizzele/react';
import { Search } from './Search';
import { CURSOR_EVENT, CURSOR_KEY } from './SiteEffects';
import { Logo } from './Logo';

const links = [
  { href: '/docs', label: 'Docs', match: (p: string) => p === '/docs' },
  {
    href: '/docs/button',
    label: 'Components',
    match: (p: string) => p.startsWith('/docs/') && !p.startsWith('/docs/guides'),
  },
  { href: '/blocks', label: 'Blocks', match: (p: string) => p.startsWith('/blocks') },
  {
    href: '/docs/guides/springs',
    label: 'Physics',
    match: (p: string) => p === '/docs/guides/springs',
  },
  {
    href: '/docs/guides/theming',
    label: 'Theming',
    match: (p: string) => p === '/docs/guides/theming',
  },
];

/**
 * On the landing it starts transparent and wide over the hero, then condenses into a glass pill
 * as you scroll. A liquid blob follows the hovered link (two edge springs, so it stretches
 * between links) and settles back on the current page.
 */
export function SiteHeader() {
  const pathname = usePathname() ?? '/';
  const home = pathname === '/';
  const [cursorOn, setCursorOn] = useState(true);
  const [condensed, setCondensed] = useState(!home);
  const nav = useRef<HTMLElement>(null);
  const blob = useRef<HTMLSpanElement>(null);
  const edges = useRef<{ l: Spring; r: Spring; o: Spring } | null>(null);

  useEffect(() => {
    try {
      setCursorOn(localStorage.getItem(CURSOR_KEY) !== 'off');
    } catch {
      /* storage blocked */
    }
  }, []);

  useEffect(() => {
    if (!home) {
      setCondensed(true);
      return;
    }
    return onScroll((s) => setCondensed(s.y > 24));
  }, [home]);

  // ——— Liquid hover blob ———
  const getEdges = () => {
    if (!edges.current) {
      const paint = () => {
        const e = edges.current!;
        const el = blob.current;
        if (!el) return;
        el.style.transform = `translateX(${e.l.value}px)`;
        el.style.width = `${Math.max(e.r.value - e.l.value, 0)}px`;
        el.style.opacity = e.o.value.toFixed(3);
      };
      edges.current = {
        l: new Spring({ onUpdate: paint }),
        r: new Spring({ onUpdate: paint }),
        o: new Spring({ ...resolveSpring('snappy'), onUpdate: paint }),
      };
    }
    return edges.current;
  };

  const moveTo = useCallback((target: HTMLElement | null, instant = false) => {
    const e = getEdges();
    if (!target) {
      e.o.set(0);
      return;
    }
    const left = target.offsetLeft;
    const right = left + target.offsetWidth;
    if (instant || e.o.value < 0.05) {
      // Appear in place instead of sliding in from the last position.
      e.l.jump(left);
      e.r.jump(right);
    } else {
      const goingRight = left > e.l.target;
      const fast = resolveSpring({ stiffness: 520, damping: 34 });
      const slow = resolveSpring({ stiffness: 200, damping: 19 });
      e.l.set(left, { config: goingRight ? slow : fast });
      e.r.set(right, { config: goingRight ? fast : slow });
    }
    e.o.set(1);
  }, []);

  const restOnActive = useCallback(
    (instant = false) => {
      const active = nav.current?.querySelector<HTMLElement>('[aria-current="page"]') ?? null;
      moveTo(active, instant);
    },
    [moveTo],
  );

  useEffect(() => {
    // Wait a frame so layout (fonts, condensed width) has settled.
    const r = requestAnimationFrame(() => restOnActive(true));
    return () => cancelAnimationFrame(r);
  }, [pathname, condensed, restOnActive]);

  const saveTheme = (next: 'dark' | 'light') => {
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
    <header
      className="site-header"
      data-condensed={condensed || undefined}
      data-home={home || undefined}
    >
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label="Vizzele UI home">
          <Logo size={26} />
          <span className="brand-name">
            Vizzele <span className="brand-ui">UI</span>
          </span>
          <span className="brand-version" aria-hidden="true">
            v0.10
          </span>
        </Link>
        <nav
          ref={nav}
          className="site-nav"
          aria-label="Main"
          onPointerLeave={() => restOnActive()}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) restOnActive();
          }}
        >
          <span ref={blob} className="site-nav-blob" aria-hidden="true" />
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                l.label === 'Theming'
                  ? 'hide-md'
                  : l.label === 'Physics'
                    ? 'hide-tab'
                    : l.label === 'Blocks'
                      ? 'hide-xs'
                      : undefined
              }
              aria-current={l.match(pathname) ? 'page' : undefined}
              onPointerEnter={(e) => moveTo(e.currentTarget)}
              onFocus={(e) => moveTo(e.currentTarget)}
            >
              {l.label}
            </Link>
          ))}
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
          {/* The library's own day-to-night switch, small: the page changes in a circle from it. */}
          <ThemeToggle className="site-theme" label="Dark theme" onThemeChange={saveTheme} />
          <a
            className="icon-button hide-sm"
            href="https://github.com/Gxnza48/vizzele-ui"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
            </svg>
          </a>
          <Button
            as={Link}
            href="/docs"
            variant="liquid"
            size="sm"
            magnetic
            className="site-cta hide-md"
          >
            Get started
          </Button>
        </div>
      </div>
    </header>
  );
}
