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
  draggable: load(() => import('./drag').then((m) => m.DraggableDemo)),
  reorder: load(() => import('./drag').then((m) => m.ReorderDemo)),
  'swipe-stack': load(() => import('./drag').then((m) => m.SwipeStackDemo)),
  'elastic-slider': load(() => import('./drag').then((m) => m.ElasticSliderDemo)),
  'drag-to-dismiss': load(() => import('./drag').then((m) => m.DragDismissDemo)),
  'bottom-sheet': load(() => import('./drag').then((m) => m.BottomSheetDemo)),
  'infinite-canvas': load(() => import('./drag').then((m) => m.InfiniteCanvasDemo)),
  physics: load(() => import('./drag').then((m) => m.PhysicsDemo)),
  scramble: load(() => import('./text-scroll').then((m) => m.ScrambleDemo)),
  'text-reveal': load(() => import('./text-scroll').then((m) => m.TextRevealDemo)),
  shimmer: load(() => import('./text-scroll').then((m) => m.ShimmerDemo)),
  'weight-wave': load(() => import('./text-scroll').then((m) => m.WeightWaveDemo)),
  'morph-text': load(() => import('./text-scroll').then((m) => m.MorphDemo)),
  counter: load(() => import('./text-scroll').then((m) => m.CounterDemo)),
  parallax: load(() => import('./text-scroll').then((m) => m.ParallaxDemo)),
  'horizontal-scroll': load(() => import('./text-scroll').then((m) => m.HorizontalScrollDemo)),
  'sticky-stack': load(() => import('./text-scroll').then((m) => m.StickyStackDemo)),
  'scroll-progress': load(() => import('./text-scroll').then((m) => m.ScrollProgressDemo)),
  reveal: load(() => import('./text-scroll').then((m) => m.RevealDemo)),
  'smooth-scroll': load(() => import('./text-scroll').then((m) => m.SmoothScrollDemo)),
  fluid: load(() => import('./backgrounds').then((m) => m.FluidDemo)),
  'mesh-gradient': load(() => import('./backgrounds').then((m) => m.MeshGradientDemo)),
  'particle-field': load(() => import('./backgrounds').then((m) => m.ParticleFieldDemo)),
  'liquid-metal': load(() => import('./backgrounds').then((m) => m.LiquidMetalDemo)),
  'lens-grid': load(() => import('./backgrounds').then((m) => m.LensGridDemo)),
  grain: load(() => import('./backgrounds').then((m) => m.GrainDemo)),
};
