import type { DocEntry } from '@/lib/types';

const cat = 'Components' as const;

export const kitEntries: DocEntry[] = [
  {
    slug: 'copy-button',
    title: 'Copy button',
    category: cat,
    description:
      'Copy to clipboard that answers like liquid: the icon folds into a check that draws itself, light washes out from where you pressed, droplets burst and a "Copied" bubble rises off the button.',
    keywords: ['clipboard', 'copy', 'copied', 'code', 'share', 'useClipboard'],
    isNew: true,
    height: 340,
    controls: [
      { type: 'text', name: 'label', default: 'Copy link' },
      { type: 'text', name: 'copiedLabel', label: 'copied label', default: 'Copied' },
      { type: 'select', name: 'size', options: ['md', 'sm'], default: 'md' },
    ],
    code: {
      react: `import { CopyButton, useClipboard } from '@vizzele/react';

<CopyButton value="npm i @vizzele/react">Copy</CopyButton>

// Icon only — a "Copied" bubble rises off it
<CopyButton value={() => window.location.href} aria-label="Copy link" />

// Build your own
const { copy, copied } = useClipboard();`,
      vanilla: `import { copyToClipboard } from '@vizzele/core';

const ok = await copyToClipboard('Hello'); // falls back to execCommand on old browsers`,
    },
    props: [
      {
        name: 'value',
        type: 'string | () => string',
        description: 'Text to copy, or a function that builds it on click.',
      },
      { name: 'children', type: 'ReactNode', description: 'Label. Omit for an icon-only button.' },
      {
        name: 'copiedLabel',
        type: 'ReactNode',
        default: "'Copied'",
        description: 'Shown once copied.',
      },
      {
        name: 'announce',
        type: 'string',
        default: "'Copied to clipboard'",
        description: 'What screen readers hear.',
      },
      {
        name: 'timeout',
        type: 'number',
        default: '1800',
        description: 'How long the copied state lasts (ms).',
      },
      { name: 'size', type: "'md' | 'sm'", default: "'md'", description: 'Size.' },
      { name: 'onCopy', type: '(text, ok) => void', description: 'Called after every attempt.' },
    ],
    a11y: [
      'A real <button>. Icon-only buttons get the name "Copy to clipboard" unless you pass aria-label.',
      'The result is announced in a polite live region outside the button, so its name never changes.',
      'Both labels share one grid cell: the button never jumps in width.',
      'With reduced motion the label simply swaps — no wash, droplets or jelly.',
      'If the clipboard is blocked it shows "Failed" with a cross instead of pretending it worked.',
    ],
  },
  {
    slug: 'sidebar',
    title: 'Sidebar',
    category: cat,
    description:
      'Navigation with a liquid current-page marker that stretches between links on two springs, a light that follows the hovered link, foldable sections and an iridescent edge that glows near the pointer.',
    keywords: ['navigation', 'nav', 'menu', 'docs', 'side nav', 'drawer'],
    isNew: true,
    height: 520,
    controls: [
      { type: 'select', name: 'variant', options: ['panel', 'plain'], default: 'panel' },
      { type: 'boolean', name: 'collapsible', default: true },
      { type: 'boolean', name: 'icons', default: true },
    ],
    code: {
      react: `import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@vizzele/react';

<Sidebar
  active={usePathname()}
  linkAs={Link}
  sections={[
    {
      title: 'Workspace',
      items: [
        { href: '/', label: 'Overview', icon: <HomeIcon /> },
        { href: '/inbox', label: 'Inbox', badge: 3 },
      ],
    },
    { title: 'Projects', collapsible: true, items: [{ href: '/p/aurora', label: 'Aurora' }] },
  ]}
/>`,
    },
    props: [
      {
        name: 'sections',
        type: 'SidebarSection[]',
        description: '{ title?, items, collapsible?, defaultOpen? }',
      },
      {
        name: 'items[]',
        type: 'SidebarItem',
        description: '{ href, label, icon?, badge? }',
      },
      {
        name: 'active',
        type: 'string',
        description: 'href of the current page — gets the marker and aria-current.',
      },
      {
        name: 'linkAs',
        type: 'ElementType',
        default: "'a'",
        description: 'Your router link, e.g. Next.js Link.',
      },
      {
        name: 'variant',
        type: "'panel' | 'plain'",
        default: "'panel'",
        description: 'Glass panel or bare list.',
      },
      {
        name: 'header / footer',
        type: 'ReactNode',
        description: 'Pinned above and below the scrolling list.',
      },
      {
        name: 'label',
        type: 'string',
        default: "'Sidebar'",
        description: 'Accessible name of the nav landmark.',
      },
      {
        name: 'onNavigate',
        type: '(href) => void',
        description: 'Called when a link is clicked (close a drawer here).',
      },
    ],
    a11y: [
      'A <nav> landmark with a name; the current link has aria-current="page".',
      'Foldable section titles are buttons with aria-expanded and aria-controls; links inside a folded section leave the tab order.',
      'The marker and hover light are decorative (aria-hidden).',
      'On load the current link is scrolled into view inside the sidebar without moving the page.',
    ],
  },
  {
    slug: 'footer',
    title: 'Footer',
    category: cat,
    description:
      'A footer that ends the page with weight: link columns whose underlines pour in as light, a hairline that brightens under the pointer, and a giant liquid wordmark rising out of the bottom edge.',
    keywords: ['footer', 'site footer', 'links', 'wordmark', 'brand', 'bottom'],
    isNew: true,
    wide: true,
    height: 640,
    controls: [
      { type: 'text', name: 'wordmark', default: 'Vizzele' },
      { type: 'boolean', name: 'columns', default: true },
    ],
    code: {
      react: `import Link from 'next/link';
import { Footer } from '@vizzele/react';

<Footer
  linkAs={Link}
  brand={<Logo />}
  tagline="Interfaces that feel alive."
  columns={[
    { title: 'Product', links: [{ href: '/pricing', label: 'Pricing' }] },
    { title: 'Company', links: [{ href: 'https://github.com/you', label: 'GitHub' }] },
  ]}
  legal="© 2026 Acme"
  meta="Made with Vizzele"
  wordmark="Acme"
>
  <NewsletterForm />
</Footer>`,
    },
    props: [
      { name: 'brand', type: 'ReactNode', description: 'Logo / name, top left.' },
      { name: 'tagline', type: 'ReactNode', description: 'A line under the brand.' },
      {
        name: 'children',
        type: 'ReactNode',
        description: 'Goes under the brand: a form, social links…',
      },
      {
        name: 'columns',
        type: 'FooterColumn[]',
        description:
          '{ title, links: { href, label, external? }[] } — absolute URLs open in a new tab.',
      },
      { name: 'legal / meta', type: 'ReactNode', description: 'Bottom row, left and right.' },
      { name: 'wordmark', type: 'string | false', description: 'Giant text across the bottom.' },
      { name: 'wordmarkOptions', type: 'WordmarkOptions', description: 'Passed to the Wordmark.' },
      { name: 'linkAs', type: 'ElementType', default: "'a'", description: 'Your router link.' },
    ],
    a11y: [
      'A <footer> (contentinfo landmark) with one named <nav> for the link columns.',
      'External links are marked visually and announce "opens in a new tab".',
      'The wordmark is read once as plain text; the animated letters are hidden from screen readers.',
    ],
  },
  {
    slug: 'wordmark',
    title: 'Wordmark',
    category: cat,
    description:
      'Giant text made of liquid light. Letters rise out of a surface, reach up toward your pointer like pulled fluid, wobble when pressed, and a spotlight lights the flowing iridescent fill.',
    keywords: ['big text', 'logo', 'brand', 'display', 'hero text', 'footer text'],
    isNew: true,
    wide: true,
    height: 420,
    controls: [
      { type: 'text', name: 'text', default: 'Liquid' },
      { type: 'range', name: 'lift', min: 0, max: 0.4, step: 0.01, default: 0.14 },
      { type: 'range', name: 'reach', min: 0.05, max: 0.4, step: 0.01, default: 0.16 },
    ],
    code: {
      react: `import { Wordmark } from '@vizzele/react';

<Wordmark text="Vizzele" lift={0.14} />`,
      vanilla: `import { wordmark } from '@vizzele/core';

wordmark(document.querySelector('.brand'), { lift: 0.14 });`,
      html: `<div data-vz-wordmark>Vizzele</div>`,
    },
    props: [
      { name: 'text', type: 'string', description: 'The word(s) to show.' },
      {
        name: 'fit',
        type: 'boolean',
        default: 'true',
        description: 'Scale the text to span the full width.',
      },
      {
        name: 'lift',
        type: 'number',
        default: '0.14',
        description: 'How high letters rise toward the pointer (× font size).',
      },
      {
        name: 'reach',
        type: 'number',
        default: '0.16',
        description: 'Width of the pointer influence (× element width).',
      },
      {
        name: 'entrance',
        type: 'boolean',
        default: 'true',
        description: 'Letters rise in when scrolled into view.',
      },
    ],
    a11y: [
      'The text is in the page once as real text (visually hidden); the animated letters are aria-hidden.',
      'With reduced motion letters stay still and the spotlight stops drifting — it only follows your pointer.',
      'In forced-colors mode the letters render as plain system text.',
    ],
  },
];
