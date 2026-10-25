'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, HoldButton, LiquidSelection, SurfaceTension, TextReveal } from '@vizzele/react';
import { CausticCard } from '@vizzele/react/gl';

const chips = ['Springs', 'Inertia', 'Glass', 'Fluid', 'Holo'];

/** The five effects that only exist in Vizzele, each live in its own tile. */
export function HomeOriginals() {
  const [chip, setChip] = useState('Glass');
  const [deleted, setDeleted] = useState(0);
  return (
    <section className="home-section" aria-labelledby="originals-title">
      <div className="home-section-head">
        <p className="home-eyebrow">Only in Vizzele</p>
        <TextReveal as="h2" by="words" className="vz-display home-h2" id="originals-title">
          Five effects you won’t find anywhere else.
        </TextReveal>
        <p className="home-sub">
          Not reskins of the usual suspects — new interactions, built on the same physics.
        </p>
      </div>

      <div className="home-originals">
        <article className="orig-tile orig-caustics">
          <CausticCard cardClassName="orig-caustic-card" spread={70} scale={60}>
            <span className="orig-kicker vz-mono">caustics</span>
            <h3>Glass that casts light</h3>
            <p>The net of light at the bottom of a pool — move your pointer, you hold the lamp.</p>
          </CausticCard>
        </article>

        <article className="orig-tile">
          <span className="orig-kicker vz-mono">hold to confirm</span>
          <div className="orig-center">
            <HoldButton onConfirm={() => setDeleted((d) => d + 1)} confirmedLabel="Deleted">
              Hold to delete
            </HoldButton>
          </div>
          <p className="orig-note">
            It fills with liquid. Wiggle while holding — it sloshes.
            {deleted > 0 && ` Deleted ${deleted}×.`}
          </p>
        </article>

        <article className="orig-tile">
          <span className="orig-kicker vz-mono">surface tension</span>
          <div className="orig-center">
            <SurfaceTension className="orig-chips" role="group" aria-label="Topics">
              {chips.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="demo-chip"
                  aria-pressed={chip === c}
                  onClick={() => setChip(c)}
                >
                  {c}
                </button>
              ))}
            </SurfaceTension>
          </div>
          <p className="orig-note">Move between the chips: they fuse like drops.</p>
        </article>

        <article className="orig-tile">
          <span className="orig-kicker vz-mono">liquid selection</span>
          <LiquidSelection className="orig-select">
            <p>
              Select this text. The highlight springs out of the caret and the lines melt into one
              drop of light where they touch.
            </p>
          </LiquidSelection>
        </article>

        <article className="orig-tile">
          <span className="orig-kicker vz-mono">liquid focus</span>
          <div className="orig-center orig-focus">
            <Button size="sm">One</Button>
            <Button size="sm" variant="holo">
              Two
            </Button>
            <Button size="sm" variant="liquid">
              Three
            </Button>
          </div>
          <p className="orig-note">
            Press <kbd>Tab</kbd> anywhere on this site: focus travels like mercury.
          </p>
        </article>
      </div>
      <div className="home-ctas home-ctas-center">
        <Button as={Link} href="/docs/liquid-focus" variant="ghost">
          See all five →
        </Button>
      </div>
    </section>
  );
}
