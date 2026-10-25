import { HomeDashboard } from '@/components/home/HomeDashboard';
import { HomeOriginals } from '@/components/home/HomeOriginals';
import { MultiCode } from '@/components/Code';
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

export default function Home() {
  return (
    <main className="home">
      <HomeHero components={entries.length} />
      <SpringVsKeyframes />
      <HomePlayground />
      <HomeMarquee />
      <HomeKit />
      <HomeDashboard />
      <HomeOriginals />
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
    </main>
  );
}
