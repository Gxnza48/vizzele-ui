import { registerEffect } from '../declarative';
import { draggable } from '../drag';
import { magnetic } from './magnetic';
import { reveal } from './reveal';
import { spotlight } from './spotlight';
import { tilt } from './tilt';
import { ripple } from './ripple';
import { cursor, type CursorOptions } from './cursor';
import { particleTrail, type ParticleTrailOptions } from './particles';

/** Every effect that can be used declaratively as `data-vz-<name>`. */
export const effects = {
  magnetic,
  tilt,
  spotlight,
  reveal,
  drag: draggable,
  ripple,
  /** Put on <body> to enable the custom cursor. */
  'custom-cursor': (_el: HTMLElement, o?: CursorOptions) => cursor(o),
  /** Put on <body> to enable the particle trail. */
  'particle-trail': (_el: HTMLElement, o?: ParticleTrailOptions) => particleTrail(o),
};

export type EffectName = keyof typeof effects;

/** Registers all built-in effects for `data-vz-*` usage. */
export function registerAll() {
  for (const [name, factory] of Object.entries(effects))
    registerEffect(name, factory as Parameters<typeof registerEffect>[1]);
}
