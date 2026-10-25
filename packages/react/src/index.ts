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

// Drag & physics
export {
  BottomSheet,
  Draggable,
  ElasticSlider,
  InfiniteCanvas,
  PhysicsWorld,
  ReorderGroup,
  ReorderHandle,
  ReorderItem,
  SwipeStack,
  useDragDismiss,
  type BottomSheetProps,
  type DragDismissOptions,
  type DraggableProps,
  type ElasticSliderProps,
  type InfiniteCanvasProps,
  type PhysicsWorldProps,
  type ReorderGroupProps,
  type ReorderItemProps,
  type SwipeDirection,
  type SwipeStackHandle,
  type SwipeStackProps,
} from './components/drag';
export { useModalFocus } from './hooks/a11y';

// Text & scroll
export {
  Counter,
  HorizontalScroll,
  MorphText,
  Parallax,
  Reveal,
  ScrambleText,
  ScrollProgress,
  ShimmerText,
  SmoothScroll,
  StickyStack,
  TextReveal,
  WeightWave,
  type CounterProps,
  type HorizontalScrollProps,
  type MorphTextProps,
  type ParallaxProps,
  type RevealProps,
  type ScrambleTextHandle,
  type ScrambleTextProps,
  type ScrollProgressProps,
  type ShimmerTextProps,
  type StickyStackProps,
  type TextRevealProps,
  type WeightWaveProps,
} from './components/text';

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
  type PhysicsWorld as PhysicsWorldApi,
  type PhysicsOptions,
} from '@vizzele/core';
