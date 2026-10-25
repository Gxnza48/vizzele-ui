import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { Aurora, LavaLamp, Ripples, Silk, WaveLines } from '../src/gl';

const backgrounds = { Aurora, LavaLamp, Ripples, Silk, WaveLines };

describe('new backgrounds', () => {
  for (const [name, Bg] of Object.entries(backgrounds)) {
    it(`${name} renders a decorative canvas that falls back without WebGL2`, () => {
      const { container } = render(<Bg />);
      const canvas = container.querySelector('canvas')!;
      expect(canvas.getAttribute('aria-hidden')).toBe('true');
      expect(canvas.classList.contains('vz-gl-fill')).toBe(true);
      expect(canvas.classList.contains('vz-gl-fallback')).toBe(true);
    });
    it(`${name} renders on the server`, () => {
      expect(renderToString(<Bg className="x" />)).toContain('<canvas');
    });
  }
});
