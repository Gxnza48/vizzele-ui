'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PhoneMockup, TextReveal } from '@vizzele/react';
import { ChatApp, MusicApp, WalletApp } from '@/demos/screens';

const steps: { title: string; text: string; app: ReactNode; angle: number }[] = [
  {
    title: 'Your app, live, in their hands.',
    text: 'The phone is CSS 3D and the screen is real DOM: this wallet works — switch the range, press Send.',
    app: <WalletApp />,
    angle: -20,
  },
  {
    title: 'An assistant with a face.',
    text: 'Type a question. The agent orb listens, thinks and answers — the same component you ship.',
    app: <ChatApp />,
    angle: 0,
  },
  {
    title: 'Motion you can hear.',
    text: 'The orb pulses with the music; scrub the elastic slider and it stretches past the ends.',
    app: <MusicApp />,
    angle: 20,
  },
];

/**
 * A phone pinned beside the story: each step you scroll to swaps its screen and turns it. Only
 * the active app is mounted, so the others cost nothing.
 */
export function HomeStory() {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) setActive(items.current.indexOf(e.target as HTMLElement));
      },
      // A step is active as it crosses the middle — on phones, the band under the pinned phone.
      {
        rootMargin: matchMedia('(max-width: 760px)').matches
          ? '-66% 0px -26% 0px'
          : '-45% 0px -45% 0px',
      },
    );
    items.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);
  const step = steps[active]!;
  return (
    <section className="home-section home-story" aria-labelledby="story-title">
      <div className="home-section-head">
        <p className="home-eyebrow">Mockups · live apps inside</p>
        <TextReveal as="h2" by="words" className="vz-display home-h2" id="story-title">
          Show the product, not a picture of it.
        </TextReveal>
      </div>
      <div className="story">
        <div className="story-stage">
          <div className="story-sticky">
            <PhoneMockup
              model="iphone"
              finish="natural"
              rotate={[-4, step.angle]}
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
          <li className="story-step story-step-end">
            <Link href="/docs/phone-iphone" className="coll-link">
              iPhone-style, Galaxy-style &amp; laptop mockups →
            </Link>
          </li>
        </ol>
      </div>
    </section>
  );
}
