'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { sidebar } from '@/content/nav';

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
      <nav
        id="docs-sidebar"
        className={`sidebar ${open ? 'is-open' : ''}`}
        aria-label="Documentation"
      >
        {sidebar.map((group) => (
          <div key={group.title} className="sidebar-group">
            <p className="sidebar-title">{group.title}</p>
            <ul>
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} aria-current={pathname === item.href ? 'page' : undefined}>
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}
