'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sidebar as VzSidebar } from '@vizzele/react';
import { sidebar } from '@/content/nav';

const sections = sidebar.map((group) => ({
  title: group.title,
  collapsible: true,
  items: group.items.map((item) => ({
    href: item.href,
    label: item.title,
    ...(item.isNew ? { badge: 'New' } : {}),
  })),
}));

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <button
        type="button"
        className="sidebar-toggle vz-button"
        data-size="sm"
        aria-expanded={open}
        aria-controls="docs-sidebar"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? 'Close menu' : 'Browse components'}
      </button>
      {/* Remount on open so the current page scrolls into view inside the drawer. */}
      <VzSidebar
        key={String(open)}
        id="docs-sidebar"
        className={`sidebar ${open ? 'is-open' : ''}`}
        label="Documentation"
        sections={sections}
        active={pathname ?? undefined}
        linkAs={Link}
      />
    </>
  );
}
