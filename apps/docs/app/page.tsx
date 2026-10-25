import Link from 'next/link';
import { MultiCode } from '@/components/Code';
import { Logo } from '@/components/Logo';
import { entries } from '@/content/nav';
import { HomeHero } from '@/components/home/HomeHero';
import {
  HomeBento,
  HomeMarquee,
  HomePhysics,
  HomePillars,
  HomePlayground,
  HomeStats,
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

export default function Home() {
  return (
    <main className="home">
      <HomeHero />
      <HomePlayground />
      <HomeMarquee />
      <HomeBento />
      <HomePhysics />
      <HomePillars />
      <HomeStats components={entries.length} />
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
        <div className="home-ctas home-ctas-center">
          <Link
            href="/docs/guides/installation"
            className="vz-button"
            data-variant="liquid"
            data-size="lg"
            data-vz-magnetic
          >
            Install Vizzele
          </Link>
          <Link href="/docs" className="vz-button" data-variant="ghost" data-size="lg">
            Browse all {entries.length} pieces
          </Link>
        </div>
      </section>
      <footer className="home-footer">
        <div className="home-footer-brand">
          <Logo size={28} />
          <span>Vizzele UI</span>
        </div>
        <p className="vz-muted">Liquid light for the web. MIT licensed.</p>
        <nav aria-label="Footer" className="home-footer-links">
          <Link href="/docs">Docs</Link>
          <Link href="/docs/guides/theming">Theming</Link>
          <Link href="/docs/guides/reduced-motion">Accessibility</Link>
          <a href="https://github.com/Gxnza48/vizzele-ui" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </footer>
    </main>
  );
}
