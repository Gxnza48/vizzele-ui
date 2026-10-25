'use client';

import { useEffect, useState } from 'react';
import { Cursor, LiquidFocus } from '@vizzele/react';
import { observe, registerAll } from '@vizzele/core';

export const CURSOR_KEY = 'vz-cursor';
export const CURSOR_EVENT = 'vz-cursor-toggle';

/**
 * Site-wide effects: the Vizzele cursor, toggleable from the header.
 * It steps aside while a demo mounts its own cursor (`data-demo-cursor` on <html>).
 */
export function SiteEffects() {
  const [enabled, setEnabled] = useState(false);
  const [demoOwnsCursor, setDemoOwnsCursor] = useState(false);
  // The docs themselves use the declarative API: any `data-vz-*` attribute just works.
  useEffect(() => {
    registerAll();
    return observe(document.body);
  }, []);
  useEffect(() => {
    const read = () => {
      try {
        setEnabled(localStorage.getItem(CURSOR_KEY) !== 'off');
      } catch {
        setEnabled(true);
      }
    };
    read();
    window.addEventListener(CURSOR_EVENT, read);
    const mo = new MutationObserver(() =>
      setDemoOwnsCursor('demoCursor' in document.documentElement.dataset),
    );
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-demo-cursor'],
    });
    return () => {
      window.removeEventListener(CURSOR_EVENT, read);
      mo.disconnect();
    };
  }, []);
  return (
    <>
      <Cursor disabled={!enabled || demoOwnsCursor} />
      {/* Keyboard focus travels like a drop of mercury across the whole site. */}
      <LiquidFocus />
    </>
  );
}
