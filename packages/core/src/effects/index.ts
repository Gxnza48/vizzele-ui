import { registerEffect } from '../declarative';
import { draggable } from '../drag';
import { magnetic } from './magnetic';
import { reveal } from './reveal';
import { spotlight } from './spotlight';
import { tilt } from './tilt';
import { ripple } from './ripple';
import { cursor, type CursorOptions } from './cursor';
import { particleTrail, type ParticleTrailOptions } from './particles';
import { reorder } from '../reorder';
import { liquidFocus, type LiquidFocusOptions } from './liquid-focus';
import { liquidSelection } from './liquid-selection';
import { holdToConfirm } from './hold';
import { surfaceTension } from './surface-tension';
import { wordmark } from './wordmark';
import { mockup } from './mockup';
import { liquidGlass } from './glass';
import {
  counter,
  morphText,
  scramble,
  textReveal,
  weightWave,
  type CounterOptions,
  type MorphTextOptions,
} from './text';
import { horizontalScroll, parallax, scrollProgress, stickyStack } from '../scroll';
import { createPhysicsWorld, type PhysicsOptions } from '../physics';

/** Every effect that can be used declaratively as `data-vz-<name>`. */
export const effects = {
  magnetic,
  tilt,
  spotlight,
  reveal,
  drag: draggable,
  ripple,
  'liquid-glass': liquidGlass,
  reorder,
  scramble,
  'text-reveal': textReveal,
  'weight-wave': weightWave,
  morph: (el: HTMLElement, o?: Partial<MorphTextOptions>) =>
    morphText(el, { words: (el.textContent ?? '').split('|').map((w) => w.trim()), ...o }),
  counter: (el: HTMLElement, o?: Partial<CounterOptions>) =>
    counter(el, { to: Number(el.textContent) || 0, ...o }),
  parallax,
  'scroll-progress': scrollProgress,
  'horizontal-scroll': (el: HTMLElement) => horizontalScroll(el),
  'sticky-stack': (el: HTMLElement) => stickyStack(el),
  /** Every child of the element becomes a physics body. */
  physics: (el: HTMLElement, o?: PhysicsOptions) => {
    const world = createPhysicsWorld(el, o);
    Array.from(el.children).forEach((c) => world.add(c as HTMLElement));
    return world;
  },
  /** Put on <body> to enable the custom cursor. */
  'custom-cursor': (_el: HTMLElement, o?: CursorOptions) => cursor(o),
  /** Put on <body> to enable the particle trail. */
  'particle-trail': (_el: HTMLElement, o?: ParticleTrailOptions) => particleTrail(o),
  /** Put on <body>: one liquid focus ring for the whole page. */
  'liquid-focus': (_el: HTMLElement, o?: LiquidFocusOptions) => liquidFocus(o),
  /** Selections inside this element turn liquid. */
  'liquid-select': (el: HTMLElement) => liquidSelection({ root: el }),
  /** Hold to confirm; listen for the `vz-confirm` event. */
  hold: (el: HTMLElement, o?: { duration?: number }) =>
    holdToConfirm(el, {
      ...o,
      onConfirm: () => el.dispatchEvent(new CustomEvent('vz-confirm', { bubbles: true })),
    }),
  'surface-tension': surfaceTension,
  /** Giant text of liquid light: letters rise, reach for the pointer and wobble. */
  wordmark,
  /** A 3D device; set data-vz-device="iphone|galaxy|laptop". Children become the screen. */
  mockup,
};

export type EffectName = keyof typeof effects;

/** Registers all built-in effects for `data-vz-*` usage. */
export function registerAll() {
  for (const [name, factory] of Object.entries(effects))
    registerEffect(name, factory as Parameters<typeof registerEffect>[1]);
}
