'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, MorphText, ScrambleText, TextReveal } from '@vizzele/react';
import { FluidBackground } from '@vizzele/react/gl';

export function HomeHero() {
  const [copied, setCopied] = useState(false);
  const cmd = 'pnpm add @vizzele/react @vizzele/css';
  return (
    <section className="home-hero" aria-labelledby="hero-title">
      <FluidBackground className="home-fluid" intensity={0.7} curl={16} />
      <div className="home-hero-veil" aria-hidden="true" />
      <div className="home-hero-inner">
        <p className="home-kicker">
          <span className="home-kicker-dot" aria-hidden="true" />
          Vizzele UI · open source · MIT
        </p>
        <h1 id="hero-title" className="vz-display home-title">
          <TextReveal as="span" by="words" variant="blur" stagger={70} className="home-title-line">
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
          Springs, inertia, gestures and iridescent materials — components that have weight, catch
          the light and move like they mean it. Stir the ink behind this text.
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
        </button>
      </div>
      <a href="#playground" className="home-scroll-hint" aria-label="Scroll to the playground">
        <span />
      </a>
    </section>
  );
}
