'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { ControlValues } from '@/lib/types';

type DemoComponent = ComponentType<{ values: ControlValues }>;

const load = (loader: () => Promise<DemoComponent>) =>
  dynamic(loader, {
    ssr: false,
    loading: () => <div className="demo-loading" aria-hidden="true" />,
  });

/** slug → demo, code-split so each page only loads its own demo. */
export const demos: Record<string, DemoComponent> = {
  cursor: load(() => import('./pointer').then((m) => m.CursorDemo)),
  magnetic: load(() => import('./pointer').then((m) => m.MagneticDemo)),
  spotlight: load(() => import('./pointer').then((m) => m.SpotlightDemo)),
  tilt: load(() => import('./pointer').then((m) => m.TiltDemo)),
  ripple: load(() => import('./pointer').then((m) => m.RippleDemo)),
  'particle-trail': load(() => import('./pointer').then((m) => m.ParticleTrailDemo)),
};
