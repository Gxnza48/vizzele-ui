import Link from 'next/link';
import { HomeDashboard } from '@/components/home/HomeDashboard';
import { MultiCode } from '@/components/Code';
import { Logo } from '@/components/Logo';
import { entries } from '@/content/nav';
import { HomeHero } from '@/components/home/HomeHero';
import { SpringVsKeyframes } from '@/components/home/SpringVsKeyframes';
import {
  HomeFinalCta,
  HomeKit,
  HomeMarquee,
  HomeMaterials,
  HomePhysics,
  HomePillars,
  HomePlayground,
} from '@/components/home/HomeSections';

const usage = [
  {
    label: 'React',
    lang: 'tsx',
    code: `import { Button, Draggable } from '@vizzele/react';
import '@vizzele/css';

export function Hero() {
  return (
    <Draggable bounds="parent" rotate={8}>
      <Button variant="liquid" magnetic>Throw me</Button>
    </Draggable>
  );
}`,
  },
  {
    label: 'Vanilla JS',
    lang: 'ts',
    code: `import { draggable, magnetic } from '@vizzele/core';

draggable(card, { bounds: 'parent', rotate: 8 });
magnetic(button, { strength: 0.4 });`,
  },
  {
    label: 'HTML only',
    lang: 'html',
    code: `<script src="https://unpkg.com/@vizzele/core/dist/vizzele.global.js" defer></script>

<div class="vz-card" data-vz-drag="bounds: parent; rotate: 8">
  <button class="vz-button" data-variant="liquid" data-vz-magnetic>Throw me</button>
</div>`,
  },
];

const footer = [
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
      { href: '/docs/select', label: 'Select' },
      { href: '/docs/modal', label: 'Modal' },
      { href: '/docs/liquid-glass', label: 'Liquid glass' },
    ],
  },
  {
    title: 'Effects',
    links: [
      { href: '/docs/fluid', label: 'Fluid' },
      { href: '/docs/draggable', label: 'Draggable' },
      { href: '/docs/magnetic', label: 'Magnetic' },
      { href: '/docs/morph-text', label: 'Morph text' },
    ],
  },
  {
    title: 'Project',
    links: [
      { href: 'https://github.com/Gxnza48/vizzele-ui', label: 'GitHub' },
      { href: '/docs/guides/theming', label: 'Theming' },
      { href: 'https://github.com/Gxnza48/vizzele-ui/blob/main/LICENSE', label: 'MIT license' },
    ],
  },
];

export default function Home() {
  return (
    <main className="home">
      <HomeHero components={entries.length} />
      <SpringVsKeyframes />
      <HomePlayground />
      <HomeMarquee />
      <HomeKit />
      <HomeDashboard />
      <HomeMaterials />
      <HomePhysics />
      <HomePillars />
      <section className="home-section" aria-labelledby="code-title">
        <div className="home-section-head">
          <p className="home-eyebrow">React, vanilla or plain HTML</p>
          <h2 id="code-title" className="vz-display home-h2">
            Same physics, three doors.
          </h2>
        </div>
        <div className="home-code">
          <MultiCode variants={usage} />
        </div>
      </section>
      <HomeFinalCta />
      <footer className="home-footer">
        <div className="home-footer-top">
          <div className="home-footer-brand">
            <Link href="/" className="home-footer-logo">
              <Logo size={30} />
              <span>Vizzele UI</span>
            </Link>
            <p className="vz-muted">
              Liquid light for the web — springs, inertia, gestures and iridescent materials.
            </p>
          </div>
          <nav className="home-footer-cols" aria-label="Footer">
            {footer.map((col) => (
              <div key={col.title} className="home-footer-col">
                <p className="home-footer-title">{col.title}</p>
                <ul>
                  {col.links.map((l) => (
                    <li key={l.href}>
                      {l.href.startsWith('http') ? (
                        <a href={l.href} target="_blank" rel="noreferrer">
                          {l.label}
                        </a>
                      ) : (
                        <Link href={l.href}>{l.label}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="home-footer-bottom">
          <span>© {new Date().getFullYear()} Vizzele UI · MIT</span>
          <span>This site is built with Vizzele itself.</span>
        </div>
      </footer>
    </main>
  );
}
