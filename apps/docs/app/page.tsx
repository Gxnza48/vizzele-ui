import dynamic from 'next/dynamic';
import { MultiCode } from '@/components/Code';
import { entries } from '@/content/nav';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeFinalCta } from '@/components/home/HomeSections';
import { PaletteProvider } from '@/components/home/palette';

// Everything below the hero is its own chunk. It's still rendered on the server (no layout
// shift, nothing lost for search), but each chapter downloads and hydrates on its own, so the
// hero is interactive first and the page never freezes on one long hydration task.
const SpringVsKeyframes = dynamic(() =>
  import('@/components/home/SpringVsKeyframes').then((m) => m.SpringVsKeyframes),
);
const HomeCollection = dynamic(() =>
  import('@/components/home/HomeCollection').then((m) => m.HomeCollection),
);
const HomeStory = dynamic(() => import('@/components/home/HomeStory').then((m) => m.HomeStory));
const HomeLight = dynamic(() => import('@/components/home/HomeLight').then((m) => m.HomeLight));
const HomeStudio = dynamic(() => import('@/components/home/HomeStudio').then((m) => m.HomeStudio));

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

/**
 * The landing tells one story, each chapter with its own kind of scroll: dive into the word,
 * feel a spring, travel the collection sideways, hold a live phone, pick a light, make it yours.
 */
export default function Home() {
  return (
    <main className="home">
      <PaletteProvider>
        <HomeHero components={entries.length} />
        <SpringVsKeyframes />
        <HomeCollection components={entries.length} />
        <HomeStory />
        <HomeLight />
        <HomeStudio />
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
      </PaletteProvider>
    </main>
  );
}
