import { describe, expect, it } from 'vitest';
import { aurora, lavaLamp, ripples, silk, waveLines } from '../src/gl';

describe('new backgrounds', () => {
  const factories = { aurora, lavaLamp, ripples, silk, waveLines };
  for (const [name, factory] of Object.entries(factories)) {
    it(`${name} returns null without WebGL2`, () => {
      const canvas = document.createElement('canvas');
      expect(factory(canvas)).toBeNull();
    });
  }
});
