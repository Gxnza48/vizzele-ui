import { wrap } from './math';

export type RGB = [r: number, g: number, b: number];

/** The Vizzele iridescent palette: electric cyan, magenta, amber, acid green. */
export const iridescentPalette = ['#00e5ff', '#ff2bd6', '#ffb238', '#a8ff3e'] as const;

/** Parses `#rgb`, `#rrggbb` and `rgb()/rgba()` into 0..255 channels. */
export function parseColor(input: string): RGB {
  const s = input.trim();
  if (s.startsWith('#')) {
    let hex = s.slice(1);
    if (hex.length === 3 || hex.length === 4) hex = [...hex.slice(0, 3)].map((c) => c + c).join('');
    const n = parseInt(hex.slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = s.match(/rgba?\(([^)]+)\)/i);
  if (m?.[1]) {
    const [r = 0, g = 0, b = 0] = m[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map(Number);
    return [r, g, b];
  }
  return [0, 0, 0];
}

export const toHex = ([r, g, b]: RGB): string =>
  '#' +
  [r, g, b]
    .map((c) =>
      Math.round(Math.max(0, Math.min(255, c)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');

const toLinear = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (v: number) =>
  255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(v, 0), 1 / 2.4) - 0.055);

function rgbToOklab([r, g, b]: RGB): [number, number, number] {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToRgb([L, a, b]: [number, number, number]): RGB {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

/** Perceptual mix of two colors in OKLab (no muddy grey midpoints). */
export function mixColors(a: string | RGB, b: string | RGB, t: number): RGB {
  const A = rgbToOklab(typeof a === 'string' ? parseColor(a) : a);
  const B = rgbToOklab(typeof b === 'string' ? parseColor(b) : b);
  return oklabToRgb([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}

/** Samples a looping gradient through `palette` at `t` (any number, wraps at 1). */
export function sampleGradient(t: number, palette: readonly string[] = iridescentPalette): RGB {
  const n = palette.length;
  const x = wrap(t, 0, 1) * n;
  const i = Math.floor(x);
  return mixColors(palette[i % n]!, palette[(i + 1) % n]!, x - i);
}

/** Iridescent color for an angle in degrees — what makes surfaces shift as the pointer moves. */
export const iridescent = (angleDeg: number, palette?: readonly string[]): string =>
  toHex(sampleGradient(angleDeg / 360, palette));
