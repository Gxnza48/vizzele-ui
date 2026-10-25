'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CommandPalette, type CommandItem } from '@vizzele/react';
import { categoryOrder, searchIndex } from '@/content/nav';

const groupOrder: string[] = ['Guide', ...categoryOrder];

/** ⌘K / Ctrl+K (or /) component search, built on the library's own CommandPalette. */
export function Search() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const items = useMemo<CommandItem[]>(
    () =>
      [...searchIndex]
        .sort((a, b) => groupOrder.indexOf(a.category) - groupOrder.indexOf(b.category))
        .map((e) => ({
          id: e.href,
          label: e.title,
          group: e.category === 'Guide' ? 'Guides' : e.category,
          keywords: [...e.keywords, e.category, e.description],
          onSelect: () => router.push(e.href),
        })),
    [router],
  );

  // "/" opens it too, unless you're typing somewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key !== '/' || t?.closest('input, textarea, [contenteditable="true"]')) return;
      e.preventDefault();
      setOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        className="search-trigger"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span className="hide-sm">Search</span>
        <kbd className="hide-sm">⌘K</kbd>
      </button>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        items={items}
        label="Search components"
        placeholder="Search components, hooks, guides…"
      />
    </>
  );
}
