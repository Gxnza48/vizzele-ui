import { registerEffect } from '../declarative';
import { draggable } from '../drag';
import { magnetic } from './magnetic';
import { reveal } from './reveal';
import { spotlight } from './spotlight';
import { tilt } from './tilt';

/** Every effect that can be used declaratively as `data-vz-<name>`. */
export const effects = {
  magnetic,
  tilt,
  spotlight,
  reveal,
  drag: draggable,
};

export type EffectName = keyof typeof effects;

/** Registers all built-in effects for `data-vz-*` usage. */
export function registerAll() {
  for (const [name, factory] of Object.entries(effects)) registerEffect(name, factory);
}
