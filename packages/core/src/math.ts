export const clamp = (v: number, min: number, max: number): number =>
  v < min ? min : v > max ? max : v;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const mapRange = (
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  clamped = false,
): number => {
  const t = inMax === inMin ? 0 : (v - inMin) / (inMax - inMin);
  return lerp(outMin, outMax, clamped ? clamp(t, 0, 1) : t);
};

/** Wraps `v` into the half-open range [min, max). */
export const wrap = (v: number, min: number, max: number): number => {
  const range = max - min;
  return range === 0 ? min : ((((v - min) % range) + range) % range) + min;
};

export const distance = (x: number, y: number): number => Math.sqrt(x * x + y * y);

/**
 * Apple-style rubber band: the further you pull past a limit, the less it moves.
 * `overflow` is the distance past the limit, `dimension` the size of the element, `elastic` 0..1.
 */
export const rubberband = (overflow: number, dimension: number, elastic = 0.55): number => {
  if (elastic <= 0 || dimension <= 0) return 0;
  const sign = Math.sign(overflow);
  const abs = Math.abs(overflow);
  return sign * (1 - 1 / ((abs * elastic) / dimension + 1)) * dimension;
};

/** Clamps `v` into [min, max] but lets it overflow with rubber-band resistance. */
export const rubberbandClamp = (
  v: number,
  min: number,
  max: number,
  dimension: number,
  elastic = 0.55,
): number => {
  if (v < min) return min + rubberband(v - min, dimension, elastic);
  if (v > max) return max + rubberband(v - max, dimension, elastic);
  return v;
};

/** Returns the closest value in `points` to `v`. */
export const closest = (v: number, points: readonly number[]): number => {
  let best = points[0] ?? v;
  let bestDist = Infinity;
  for (const p of points) {
    const d = Math.abs(p - v);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
};

export const round = (v: number, precision = 3): number => {
  const p = 10 ** precision;
  return Math.round(v * p) / p;
};

export const degToRad = (deg: number): number => (deg * Math.PI) / 180;
export const radToDeg = (rad: number): number => (rad * 180) / Math.PI;
