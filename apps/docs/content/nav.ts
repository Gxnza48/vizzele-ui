import type { Category, DocEntry } from '@/lib/types';
import { pointerEntries } from './pointer';
import { dragEntries } from './drag';
import { scrollEntries, textEntries } from './text-scroll';
import { backgroundEntries } from './backgrounds';
import { uiEntries } from './ui';
import { kitEntries } from './kit';
import { mockupEntries } from './mockups';
import { menuEntries } from './menus';
import { formEntries } from './forms';
import { dataEntries } from './data';
import { originalEntries } from './originals';
import { liquidKitEntries } from './liquid-kit';
import { delightEntries } from './delight';
import { keysShopEntries } from './keys-shop';
import { extraEntries } from './extras';

export const entries: DocEntry[] = [
  ...pointerEntries,
  ...dragEntries,
  ...backgroundEntries,
  ...textEntries,
  ...scrollEntries,
  ...uiEntries,
  ...kitEntries,
  ...mockupEntries,
  ...menuEntries,
  ...formEntries,
  ...dataEntries,
  ...originalEntries,
  ...liquidKitEntries,
  ...delightEntries,
  ...keysShopEntries,
  ...extraEntries,
];

export const guides = [
  {
    slug: 'installation',
    title: 'Installation',
    description: 'Add Vizzele to a React, Next.js or plain HTML project.',
  },
  {
    slug: 'theming',
    title: 'Themes & tokens',
    description: 'Every color, radius, spring and blur is a CSS variable.',
  },
  {
    slug: 'springs',
    title: 'Spring physics',
    description: 'Stiffness, damping and mass, explained by playing.',
  },
  {
    slug: 'performance',
    title: 'Performance',
    description: 'Adaptive quality, lazy mounting and what runs when nobody is looking.',
  },
  {
    slug: 'reduced-motion',
    title: 'Reduced motion',
    description: 'How every effect degrades with dignity.',
  },
] as const;

export const categoryOrder: Category[] = [
  'Originals',
  'Cursor & pointer',
  'Drag & physics',
  'Backgrounds',
  'Text',
  'Scroll',
  'Components',
  'Mockups',
  'Charts',
  'AI',
  'Hooks',
];

export function getEntry(slug: string) {
  return entries.find((e) => e.slug === slug);
}

export const sidebar = [
  {
    title: 'Getting started' as const,
    items: [
      { href: '/docs', title: 'Introduction', isNew: false },
      ...guides.map((g) => ({ href: `/docs/guides/${g.slug}`, title: g.title, isNew: false })),
    ],
  },
  ...categoryOrder
    .map((cat) => ({
      title: cat,
      items: entries
        .filter((e) => e.category === cat)
        .map((e) => ({ href: `/docs/${e.slug}`, title: e.title, isNew: !!e.isNew })),
    }))
    .filter((g) => g.items.length),
];

export const searchIndex = [
  ...entries.map((e) => ({
    href: `/docs/${e.slug}`,
    title: e.title,
    category: e.category as string,
    description: e.description,
    keywords: e.keywords ?? [],
  })),
  ...guides.map((g) => ({
    href: `/docs/guides/${g.slug}`,
    title: g.title,
    category: 'Guide',
    description: g.description,
    keywords: [] as string[],
  })),
];
