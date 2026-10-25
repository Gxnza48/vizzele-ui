'use client';

import Link from 'next/link';
import { Footer } from '@vizzele/react';
import { Logo } from './Logo';

const columns = [
  {
    title: 'Learn',
    links: [
      { href: '/docs', label: 'Introduction' },
      { href: '/docs/guides/installation', label: 'Installation' },
      { href: '/docs/guides/springs', label: 'Spring physics' },
      { href: '/docs/guides/reduced-motion', label: 'Reduced motion' },
    ],
  },
  {
    title: 'Components',
    links: [
      { href: '/docs/button', label: 'Button' },
      { href: '/docs/copy-button', label: 'Copy button' },
      { href: '/docs/sidebar', label: 'Sidebar' },
      { href: '/docs/liquid-glass', label: 'Liquid glass' },
    ],
  },
  {
    title: 'Effects',
    links: [
      { href: '/docs/fluid', label: 'Fluid' },
      { href: '/docs/liquid-focus', label: 'Liquid focus' },
      { href: '/docs/wordmark', label: 'Wordmark' },
      { href: '/blocks', label: 'Blocks' },
    ],
  },
  {
    title: 'Project',
    links: [
      { href: 'https://github.com/Gxnza48/vizzele-ui', label: 'GitHub' },
      { href: 'https://www.npmjs.com/package/@vizzele/react', label: 'npm' },
      { href: '/docs/guides/theming', label: 'Theming' },
      { href: 'https://github.com/Gxnza48/vizzele-ui/blob/main/LICENSE', label: 'MIT license' },
    ],
  },
];

export function SiteFooter() {
  return (
    <Footer
      className="site-footer"
      linkAs={Link}
      brand={
        <Link href="/" className="site-footer-logo">
          <Logo size={30} />
          <span>Vizzele UI</span>
        </Link>
      }
      tagline="Liquid light for the web — springs, inertia, gestures and iridescent materials that feel alive."
      columns={columns}
      legal={`© ${new Date().getFullYear()} Vizzele UI · MIT`}
      meta="This footer is a Vizzele component. Touch the letters."
      wordmark="Vizzele"
    >
      <code className="site-footer-install">npm i @vizzele/react @vizzele/css</code>
    </Footer>
  );
}
