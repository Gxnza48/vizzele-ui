'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, MorphText, ScrambleText, TextPortal, TextReveal } from '@vizzele/react';
import { FluidBackground } from '@vizzele/react/gl';
import { FloatingShapes } from './FloatingShapes';

export function HomeHero({ components }: { components: number }) {
  const [copied, setCopied] = useState(false);
  const cmd = 'pnpm add @vizzele/react @vizzele/css';
  // Inside the word: replay the title reveal each time the dive lands.
  const [inside, setInside] = useState(false);
  return (
    <TextPortal
      text="VIZZELE"
      focus={1}
      length={1.3}
      className="home-portal"
      aria-labelledby="hero-title"
      onProgress={(p) => setInside(p > 0.7)}
      cover={
        <div className="home-cover">
          <Link href="/docs/text-portal" className="home-announce">
            <span className="home-announce-tag">New</span>Text portal — the dive you are about to
            take
            <span aria-hidden="true" className="home-announce-arrow">
              →
            </span>
          </Link>
          <p className="home-cover-tag">Liquid light for the web · scroll to dive in</p>
          <button
            type="button"
            className="home-scroll-hint"
            aria-label="Dive into the hero"
            onClick={() => window.scrollBy({ top: window.innerHeight * 1.3, behavior: 'smooth' })}
          >
            <span />
          </button>
        </div>
      }
    >
      <FluidBackground
        className="home-fluid"
        intensity={0.7}
        curl={16}
        colors={['#00e5ff', '#ff2bd6', '#7c5cff', '#ffb238']}
      />
      <div className="home-portal-glow" aria-hidden="true" />
      <div className="home-hero-veil" aria-hidden="true" />
      <FloatingShapes />
      <div className="home-hero">
        <div className="home-hero-inner">
          <h1 id="hero-title" className="vz-display home-title">
            <TextReveal
              key={String(inside)}
              as="span"
              by="words"
              variant="blur"
              stagger={70}
              className="home-title-line"
            >
              Interfaces that feel
            </TextReveal>
            <MorphText
              words={['liquid', 'alive', 'elastic', 'holographic', 'physical']}
              hold={2200}
              gradient
              className="home-title-morph"
            />
          </h1>
          <p className="home-lead">
            Springs, inertia, gestures and iridescent materials — components with weight, that catch
            the light and move like they mean it. Go on, stir the ink behind this text.
          </p>
          <div className="home-ctas">
            <Button as={Link} href="/docs" variant="liquid" size="lg" magnetic>
              Get started
            </Button>
            <Button as={Link} href="/docs/draggable" variant="holo" size="lg" magnetic>
              Play with physics
            </Button>
          </div>
          <button
            type="button"
            className="home-install"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(cmd);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {
                /* clipboard blocked */
              }
            }}
            aria-label={`Copy install command: ${cmd}`}
          >
            <span className="home-install-prompt" aria-hidden="true">
              $
            </span>
            <ScrambleText key={String(copied)} trigger="mount" duration={600}>
              {copied ? 'copied to clipboard ✓' : cmd}
            </ScrambleText>
            <svg
              className="home-install-copy"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M8 8h11v11H8zM5 16V5h11"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <ul className="home-trust" aria-label="At a glance">
            <li>
              <strong>{components}</strong> components &amp; effects
            </li>
            <li>
              <strong>0</strong> dependencies in core
            </li>
            <li>
              <strong>4.3 kB</strong> per button
            </li>
            <li>
              <strong>MIT</strong> · open source
            </li>
          </ul>
        </div>
      </div>
    </TextPortal>
  );
}
