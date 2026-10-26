'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PhoneMockup, Tabs, TextReveal } from '@vizzele/react';
import { ChatApp, MusicApp, WalletApp } from '@/demos/screens';
import { usePhone } from './usePhone';

const steps: { tab: string; title: string; text: string; app: ReactNode; angle: number }[] = [
  {
    tab: 'Wallet',
    title: 'Your app, live, in their hands.',
    text: 'The phone is CSS 3D and the screen is real DOM: this wallet works — switch the range, press Send.',
    app: <WalletApp />,
    angle: -20,
  },
  {
    tab: 'Assistant',
    title: 'An assistant with a face.',
    text: 'Type a question. The agent orb listens, thinks and answers — the same component you ship.',
    app: <ChatApp />,
    angle: 0,
  },
  {
    tab: 'Music',
    title: 'Motion you can hear.',
    text: 'The orb pulses with the music; scrub the elastic slider and it stretches past the ends.',
    app: <MusicApp />,
    angle: 20,
  },
];

/**
 * A phone pinned beside the story: each step you scroll to swaps its screen and turns it. Only
 * the active app is mounted, so the others cost nothing. Phones have no room to pin it beside
 * the text, so there liquid tabs switch the app instead.
 */
export function HomeStory() {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    const mq = matchMedia('(max-width: 760px)');
    let io: IntersectionObserver | null = null;
    // A step is active as it crosses the middle of the screen (tabs drive it on phones).
    const sync = () => {
      io?.disconnect();
      io = null;
      if (mq.matches) return;
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries)
            if (e.isIntersecting) setActive(items.current.indexOf(e.target as HTMLElement));
        },
        { rootMargin: '-45% 0px -45% 0px' },
      );
      items.current.forEach((el) => el && io!.observe(el));
    };
    sync();
    mq.addEventListener('change', sync);
    return () => {
      mq.removeEventListener('change', sync);
      io?.disconnect();
    };
  }, []);
  const step = steps[active]!;
  // Phones show the device straight on and still, so the app on its screen stays readable.
  const phone = usePhone('(max-width: 760px)');
  const more = (
    <Link href="/docs/phone-iphone" className="coll-link">
      iPhone-style, Galaxy-style &amp; laptop mockups →
    </Link>
  );
  return (
    <section className="home-section home-story" aria-labelledby="story-title">
      <div className="home-section-head">
        <p className="home-eyebrow">Mockups · live apps inside</p>
        <TextReveal as="h2" by="words" className="vz-display home-h2" id="story-title">
          Show the product, not a picture of it.
        </TextReveal>
      </div>
      <div className="story">
        <Tabs
          label="App on the phone"
          className="story-tabs"
          items={steps.map((s, i) => ({ value: String(i), label: s.tab }))}
          value={String(active)}
          onValueChange={(v) => setActive(Number(v))}
        />
        <div className="story-stage">
          <div className="story-sticky">
            <PhoneMockup
              model="iphone"
              finish="natural"
              rotate={phone ? [0, 0] : [-4, step.angle]}
              tilt={phone ? 0 : 8}
              float={!phone}
              drag={!phone}
              className="story-phone"
            >
              <div key={active} className="story-screen">
                {step.app}
              </div>
            </PhoneMockup>
          </div>
        </div>
        <ol className="story-steps">
          {steps.map((s, i) => (
            <li
              key={s.title}
              ref={(el) => {
                items.current[i] = el;
              }}
              className="story-step"
              data-active={i === active ? '' : undefined}
            >
              <div className="story-card">
                <span className="vz-mono story-n">0{i + 1}</span>
                <h3 className="vz-display">{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
          {!phone && <li className="story-step story-step-end">{more}</li>}
        </ol>
        {phone && <p className="story-more">{more}</p>}
      </div>
    </section>
  );
}
