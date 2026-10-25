'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Button,
  CopyButton,
  ElasticSlider,
  Input,
  Sparkline,
  Switch,
  Tabs,
  TextReveal,
} from '@vizzele/react';
import { PalettePicker, paletteCss, usePalette } from './palette';

/** Your colours, live: pick a palette and the whole page — this preview included — follows. */
export function HomeStudio() {
  const { palette } = usePalette();
  const [on, setOn] = useState(true);
  const css = paletteCss(palette);
  return (
    <section className="home-section" aria-labelledby="studio-title">
      <div className="home-section-head">
        <p className="home-eyebrow">Theming</p>
        <TextReveal as="h2" by="words" className="vz-display home-h2" id="studio-title">
          Your brand. Our physics.
        </TextReveal>
        <p className="home-sub">
          Installing Vizzele changes nothing on your page until you opt in. Every colour is a CSS
          variable — pick a palette and watch this whole page follow.
        </p>
      </div>
      <div className="studio">
        <div className="studio-side">
          <PalettePicker />
          <div className="studio-code">
            <div className="studio-code-head">
              <span className="vz-mono">your.css</span>
              <CopyButton value={css} size="sm" />
            </div>
            <pre>
              <code>{css}</code>
            </pre>
          </div>
          <Link href="/docs/guides/theming" className="coll-link">
            The theming guide →
          </Link>
        </div>
        <div className="studio-preview vz-glass">
          <div className="studio-row">
            <Button variant="liquid">Get started</Button>
            <Button variant="holo">Holo</Button>
            <Button variant="glow">Glow</Button>
          </div>
          <Tabs
            label="Billing"
            items={[
              { value: 'm', label: 'Monthly' },
              { value: 'y', label: 'Yearly' },
              { value: 't', label: 'Team' },
            ]}
          />
          <div className="studio-row studio-fields">
            <Input label="Workspace" defaultValue={`${palette.name} Inc.`} />
            <Switch label="Notifications" checked={on} onCheckedChange={setOn} />
          </div>
          <ElasticSlider label="Intensity" defaultValue={64} />
          <div className="studio-chart">
            <Sparkline
              data={[12, 18, 15, 24, 22, 31, 29, 38]}
              height={70}
              label="Weekly signups"
              color="var(--vz-accent)"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
