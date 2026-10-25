'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, ScrambleText, TextReveal } from '@vizzele/react';
import { MeshGradient } from '@vizzele/react/gl';
import { inkOf, usePalette } from './palette';

// ——————————————————————————— Final call to action ———————————————————————————

export function HomeFinalCta() {
  const { palette } = usePalette();
  const [copied, setCopied] = useState(false);
  const cmd = 'pnpm add @vizzele/react @vizzele/css';
  return (
    <section className="home-section" aria-labelledby="cta-title">
      <div className="home-cta">
        <MeshGradient
          className="home-cta-bg"
          speed={0.3}
          warp={1.4}
          intensity={0.95}
          colors={inkOf(palette)}
        />
        <div className="home-cta-veil" aria-hidden="true" />
        <div className="home-cta-inner">
          <TextReveal
            as="h2"
            by="words"
            variant="blur"
            className="vz-display home-cta-title"
            id="cta-title"
          >
            Make your interface feel alive.
          </TextReveal>
          <p className="home-cta-lead">
            Free, open source, and ready for React, vanilla JS or plain HTML.
          </p>
          <div className="home-ctas">
            <Button as={Link} href="/docs/guides/installation" variant="liquid" size="lg" magnetic>
              Install Vizzele
            </Button>
            <Button as={Link} href="/docs" variant="holo" size="lg" magnetic>
              Read the docs
            </Button>
          </div>
          <button
            type="button"
            className="home-install home-install-cta"
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
            <ScrambleText key={String(copied)} trigger={copied ? 'mount' : 'view'} duration={600}>
              {copied ? 'copied to clipboard ✓' : cmd}
            </ScrambleText>
          </button>
        </div>
      </div>
    </section>
  );
}
