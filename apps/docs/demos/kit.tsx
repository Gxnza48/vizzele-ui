'use client';

import { useState, type AnchorHTMLAttributes } from 'react';
import { CopyButton, Footer, Sidebar, Wordmark } from '@vizzele/react';
import type { ControlValues } from '@/lib/types';

type P = { values: ControlValues };

export function CopyButtonDemo({ values }: P) {
  const size = values.size as 'md' | 'sm';
  return (
    <div className="kit-copy">
      <div className="kit-copy-install">
        <code>npm i @vizzele/react</code>
        <CopyButton value="npm i @vizzele/react" size={size} aria-label="Copy install command" />
      </div>
      <CopyButton
        value="https://vizzele-ui.vercel.app"
        size={size}
        copiedLabel={String(values.copiedLabel)}
      >
        {String(values.label)}
      </CopyButton>
    </div>
  );
}

const icon = (d: string) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);
const icons = {
  home: icon('M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z'),
  inbox: icon('M4 13l2.5-7h11L20 13v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 13h4l1.5 2.5h5L16 13h4'),
  chart: icon('M5 19V10M12 19V5M19 19v-7'),
  spark: icon('M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z'),
  folder: icon('M4 7a1 1 0 0 1 1-1h4l2 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z'),
  gear: icon(
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-1-3-2 .3-1.4-1.4.3-2-3-1-1 2h-2l-1-2-3 1 .3 2L5.8 7.3 4 7l-1 3 2 1v2l-2 1 1 3 2-.3 1.4 1.4-.3 2 3 1 1-2h2l1 2 3-1-.3-2 1.4-1.4 2 .3 1-3-2-1z',
  ),
};

// The demo stays on this page: links only move the marker.
function DemoLink(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...props}
      onClick={(e) => {
        e.preventDefault();
        props.onClick?.(e);
      }}
    />
  );
}

export function SidebarDemo({ values }: P) {
  const [active, setActive] = useState('/');
  const withIcons = Boolean(values.icons);
  const collapsible = Boolean(values.collapsible);
  const it = (href: string, label: string, ic: keyof typeof icons, badge?: string | number) => ({
    href,
    label,
    ...(withIcons ? { icon: icons[ic] } : {}),
    ...(badge !== undefined ? { badge } : {}),
  });
  return (
    <div className="kit-sidebar">
      <Sidebar
        variant={values.variant as 'panel' | 'plain'}
        active={active}
        label="Demo app"
        header={<p className="kit-sidebar-brand">Northwind</p>}
        footer={<p className="kit-sidebar-user">Ada Lovelace · Pro</p>}
        linkAs={DemoLink}
        onNavigate={setActive}
        sections={[
          {
            title: 'Workspace',
            items: [
              it('/', 'Overview', 'home'),
              it('/inbox', 'Inbox', 'inbox', 3),
              it('/analytics', 'Analytics', 'chart'),
              it('/agents', 'Agents', 'spark', 'New'),
            ],
          },
          {
            title: 'Projects',
            collapsible,
            items: [
              it('/p/aurora', 'Aurora redesign', 'folder'),
              it('/p/tide', 'Tide mobile app', 'folder'),
              it('/p/prism', 'Prism API', 'folder'),
            ],
          },
          {
            title: 'Account',
            collapsible,
            items: [it('/settings', 'Settings', 'gear')],
          },
        ]}
      />
      <div className="kit-sidebar-page" aria-live="polite">
        Current page: <code>{active}</code>
      </div>
    </div>
  );
}

export function FooterDemo({ values }: P) {
  return (
    <div className="kit-footer">
      <Footer
        brand={<strong className="kit-footer-brand">{String(values.wordmark) || 'Acme'}</strong>}
        tagline="Interfaces with weight, light and memory."
        columns={
          values.columns
            ? [
                {
                  title: 'Product',
                  links: [
                    { href: '#pricing', label: 'Pricing' },
                    { href: '#changelog', label: 'Changelog' },
                    { href: '#docs', label: 'Docs' },
                  ],
                },
                {
                  title: 'Company',
                  links: [
                    { href: '#about', label: 'About' },
                    { href: '#careers', label: 'Careers' },
                  ],
                },
                {
                  title: 'Social',
                  links: [
                    { href: 'https://github.com/Gxnza48/vizzele-ui', label: 'GitHub' },
                    { href: 'https://www.npmjs.com/package/@vizzele/react', label: 'npm' },
                  ],
                },
              ]
            : []
        }
        legal="© 2026 Acme Inc."
        meta="Made with Vizzele"
        wordmark={String(values.wordmark) || false}
      />
    </div>
  );
}

export function WordmarkDemo({ values }: P) {
  return (
    <div className="kit-wordmark">
      <Wordmark
        key={String(values.text)}
        text={String(values.text) || 'Liquid'}
        lift={Number(values.lift)}
        reach={Number(values.reach)}
      />
      <p className="kit-wordmark-hint">Move over the letters — press one</p>
    </div>
  );
}
