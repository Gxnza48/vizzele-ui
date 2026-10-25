'use client';

import { useState } from 'react';
import { Button, HoldButton, Input, LiquidSelection, Switch, SurfaceTension } from '@vizzele/react';
import { CausticCard } from '@vizzele/react/gl';
import type { ControlValues } from '@/lib/types';

type P = { values: ControlValues };

export function LiquidFocusDemo() {
  return (
    <div className="demo-focus">
      <p className="demo-hint">
        Click here, then press <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd>
      </p>
      <div className="demo-focus-row">
        <Button variant="liquid">Springs</Button>
        <Button>Inertia</Button>
        <Button variant="holo">Glass</Button>
      </div>
      <div className="demo-focus-row">
        <Input label="Email" placeholder="you@example.com" />
        <Switch label="Liquid mode" defaultChecked />
      </div>
      <div className="demo-focus-row">
        <a href="#focus-a">A link</a>
        <Button size="sm">Small</Button>
        <Button size="lg" variant="glow">
          Large button
        </Button>
      </div>
    </div>
  );
}

export function LiquidSelectionDemo() {
  return (
    <LiquidSelection as="article" className="demo-select">
      <p className="demo-hint">Drag across these lines ↓</p>
      <h3>Light behaves like a liquid here.</h3>
      <p>
        Select a few words and the highlight springs out of the caret. Keep dragging across lines
        and watch them fuse where they touch — the selection stretches like a drop of ink being
        pulled across paper, then settles when you let go.
      </p>
      <p>
        Copy, find-in-page and screen readers see an ordinary selection; only the light changed.
      </p>
    </LiquidSelection>
  );
}

export function HoldButtonDemo({ values }: P) {
  const [count, setCount] = useState(0);
  return (
    <div className="demo-hold">
      <HoldButton
        tone={values.tone as 'danger' | 'liquid'}
        duration={Number(values.duration)}
        onConfirm={() => setCount((c) => c + 1)}
        confirmedLabel={values.tone === 'danger' ? 'Deleted' : 'Shipped'}
      >
        {values.tone === 'danger' ? 'Hold to delete project' : 'Hold to ship it'}
      </HoldButton>
      <p className="demo-hint">Hold it (or hold Space). Wiggle while holding. Confirmed {count}×</p>
    </div>
  );
}

export function CausticsDemo({ values }: P) {
  return (
    <div className="demo-caustics">
      <CausticCard
        scale={Number(values.scale)}
        speed={Number(values.speed)}
        intensity={Number(values.intensity)}
        cardClassName="demo-caustics-card"
      >
        <span className="vz-mono">caustics · webgl2</span>
        <h3>Light through glass</h3>
        <p>Move your pointer — the light beneath follows it.</p>
      </CausticCard>
    </div>
  );
}

const chips = ['Springs', 'Inertia', 'Glass', 'Fluid', 'Holo', 'Physics'];

export function SurfaceTensionDemo({ values }: P) {
  const [on, setOn] = useState('Glass');
  return (
    <div className="demo-tension">
      <SurfaceTension
        key={`${values.reach}-${values.droplet}`}
        className="demo-chips"
        reach={Number(values.reach)}
        droplet={Number(values.droplet)}
        role="group"
        aria-label="Topics"
      >
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            className="demo-chip"
            aria-pressed={on === c}
            onClick={() => setOn(c)}
          >
            {c}
          </button>
        ))}
      </SurfaceTension>
      <p className="demo-hint">Move slowly between the chips</p>
    </div>
  );
}
