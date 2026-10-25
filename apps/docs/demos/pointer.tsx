'use client';

import { useEffect, useState } from 'react';
import {
  Cursor,
  HoloCard,
  Magnetic,
  ParticleTrail,
  Ripple,
  SpotlightCard,
  Tilt,
  type SpringPreset,
} from '@vizzele/react';
import type { ControlValues } from '@/lib/types';

type P = { values: ControlValues };

export function CursorDemo({ values }: P) {
  // The site-wide cursor is paused while this demo drives its own.
  useEffect(() => {
    document.documentElement.dataset.demoCursor = '';
    return () => {
      delete document.documentElement.dataset.demoCursor;
    };
  }, []);
  return (
    <div className="demo-center demo-col">
      {values.enabled ? (
        <Cursor
          trail={Number(values.trail)}
          size={Number(values.size)}
          stretch={Boolean(values.stretch)}
          spring={{ stiffness: Number(values.stiffness), damping: Number(values.damping) }}
        />
      ) : null}
      <p className="demo-hint">Move around — then hover the things below.</p>
      <div className="demo-row">
        <button type="button" className="vz-button" data-variant="holo">
          A button
        </button>
        <a href="#cursor" data-vz-cursor-label="Open" className="demo-link">
          A link with a label
        </a>
      </div>
      <input
        className="vz-input demo-input"
        placeholder="Text turns it into a beam"
        aria-label="Demo text input"
      />
    </div>
  );
}

export function MagneticDemo({ values }: P) {
  const common = {
    strength: Number(values.strength),
    radius: Number(values.radius),
    scale: Number(values.scale),
    innerStrength: Number(values.innerStrength),
    spring: values.spring as SpringPreset,
    inner: '.inner',
  };
  return (
    <div className="demo-center demo-row demo-gap-lg">
      <Magnetic {...common}>
        <button type="button" className="vz-button" data-variant="liquid" data-size="lg">
          <span className="inner">Liquid</span>
        </button>
      </Magnetic>
      <Magnetic {...common}>
        <button type="button" className="vz-button" data-variant="holo" data-size="lg">
          <span className="inner">Holo</span>
        </button>
      </Magnetic>
      <Magnetic {...common}>
        <button type="button" className="demo-orb" aria-label="Magnetic orb">
          <span className="inner demo-orb-core" />
        </button>
      </Magnetic>
    </div>
  );
}

const features = [
  { t: 'Springs', d: 'Analytic physics, exact at any frame rate.' },
  { t: 'Inertia', d: 'Throw it. It glides, then bounces off the walls.' },
  { t: 'Gestures', d: 'Mouse, touch and pen through one pointer model.' },
  { t: 'Materials', d: 'Liquid glass, holo foil and chrome as tokens.' },
];

export function SpotlightDemo({ values }: P) {
  return (
    <div
      className="demo-grid-2"
      style={
        {
          '--vz-spot-size': `${values.size}px`,
          '--vz-accent': String(values.color),
        } as React.CSSProperties
      }
    >
      {features.map((f) => (
        <SpotlightCard key={f.t} proximity={Number(values.proximity)}>
          <h3 className="vz-heading demo-card-title">{f.t}</h3>
          <p className="vz-muted demo-card-text">{f.d}</p>
        </SpotlightCard>
      ))}
    </div>
  );
}

export function TiltDemo({ values }: P) {
  const props = {
    max: Number(values.max),
    perspective: Number(values.perspective),
    scale: Number(values.scale),
    reverse: Boolean(values.reverse),
  };
  const content = (
    <div className="holo-content">
      <span className="holo-chip" aria-hidden="true" />
      <span className="holo-name vz-heading">Prismatic</span>
      <span className="holo-meta vz-mono">VZ · 0001 · ∞</span>
    </div>
  );
  if (values.variant === 'holo')
    return (
      <div className="demo-center">
        <HoloCard {...props} className="holo-card">
          {content}
        </HoloCard>
      </div>
    );
  if (values.variant === 'glass')
    return (
      <div className="demo-center demo-glass-bg">
        <Tilt {...props} className="vz-glass holo-card">
          {content}
        </Tilt>
      </div>
    );
  return (
    <div className="demo-center">
      <Tilt {...props} className="vz-card holo-card">
        {content}
      </Tilt>
    </div>
  );
}

export function RippleDemo({ values }: P) {
  const spring = { stiffness: Number(values.stiffness), damping: Number(values.damping) };
  const opacity = Number(values.opacity);
  return (
    <div className="demo-center demo-col">
      <div className="demo-row">
        <Ripple
          as="button"
          type="button"
          className="vz-button"
          data-size="lg"
          opacity={opacity}
          spring={spring}
        >
          Press me
        </Ripple>
        <Ripple
          as="button"
          type="button"
          className="vz-button"
          data-variant="holo"
          data-size="lg"
          opacity={opacity}
          spring={spring}
        >
          Or me
        </Ripple>
      </div>
      <Ripple className="vz-card demo-ripple-surface" opacity={opacity} spring={spring}>
        <span className="vz-muted">Tap anywhere on this surface</span>
      </Ripple>
    </div>
  );
}

export function ParticleTrailDemo({ values }: P) {
  const [on, setOn] = useState(true);
  return (
    <div className="demo-center demo-col">
      {on && (
        <ParticleTrail
          density={Number(values.density)}
          life={Number(values.life)}
          gravity={Number(values.gravity)}
          shape={values.shape as 'spark' | 'square' | 'ring'}
        />
      )}
      <p className="demo-hint">Move the pointer anywhere. Click for a burst.</p>
      <button
        type="button"
        className="vz-button"
        onClick={() => setOn((v) => !v)}
        aria-pressed={on}
      >
        {on ? 'Pause trail' : 'Resume trail'}
      </button>
    </div>
  );
}
