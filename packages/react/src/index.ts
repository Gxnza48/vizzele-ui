// Hooks
export {
  useDrag,
  useMagnetic,
  useReducedMotion,
  useReveal,
  useSpotlight,
  useTilt,
  useVizzeleEffect,
} from './hooks/effects';
export { useSpring, useSpringValue, useSprings, type UseSpringOptions } from './hooks/spring';
export { useMergedRef, cx } from './hooks/utils';

// Cursor & pointer
export {
  Cursor,
  HoloCard,
  Magnetic,
  ParticleTrail,
  Ripple,
  Spotlight,
  SpotlightCard,
  Tilt,
  type CursorProps,
  type HoloCardProps,
  type MagneticProps,
  type ParticleTrailProps,
  type RippleProps,
  type SpotlightProps,
  type TiltProps,
} from './components/pointer';

// Re-export the engine so apps need a single import.
export {
  Spring,
  createSprings,
  springs,
  frame,
  setReducedMotion,
  prefersReducedMotion,
  type DragOptions,
  type DragControls,
  type DragState,
  type SpringConfig,
  type SpringPreset,
  type MagneticOptions,
  type TiltOptions,
  type SpotlightOptions,
  type RevealOptions,
} from '@vizzele/core';
