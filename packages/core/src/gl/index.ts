export * from './core';
export { createPass, canvasPointer, getGL, GLSL_COMMON, type Pass } from './pass';
export { fluid, type FluidOptions } from './fluid';
export {
  grain,
  lensGrid,
  liquidMetal,
  meshGradient,
  type GrainOptions,
  type LensGridOptions,
  caustics,
  type CausticsOptions,
  type LiquidMetalOptions,
  type MeshGradientOptions,
} from './shaders';
export { particleField, type ParticleFieldOptions } from './particle-field';

/** True when the browser can run Vizzele's WebGL2 effects. */
export function supportsWebGL2(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}
