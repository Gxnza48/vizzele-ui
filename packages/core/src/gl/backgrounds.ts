import { shaderEffect, type ShaderEffectOptions } from './shaders';
import { getDeviceTier } from '../motion';

// ——————————————————————————— Aurora ———————————————————————————

export interface AuroraOptions extends ShaderEffectOptions {
  /** Drift speed. Default 0.3. */
  speed?: number;
  /** Brightness. Default 1. */
  intensity?: number;
  /** Number of light curtains, 1..5. Default 3. */
  bands?: number;
  /** Where the curtains hang, 0 (bottom) .. 1 (top). Default 0.45. */
  height?: number;
}

const AURORA = `
uniform float uSpeed; uniform float uIntensity; uniform float uBands; uniform float uHeight;
void main() {
  vec2 uv = vUv;
  float asp = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * asp, uv.y);
  vec2 m = vec2(uMouse.x * asp, uMouse.y);
  float t = uTime * uSpeed;
  vec3 col = mix(vec3(0.006, 0.01, 0.03), vec3(0.025, 0.018, 0.07), uv.y);
  // A few faint, twinkling stars.
  vec2 sc = floor(uv * uRes / 3.0);
  float s = hash(sc);
  col += step(0.9975, s) * (0.35 + 0.35 * sin(uTime * 2.0 + s * 80.0));
  float near = exp(-dot(p - m, p - m) * 5.0) * uPresence;
  vec3 light = vec3(0.0);
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    if (fi >= uBands) break;
    float x = p.x * (0.8 + fi * 0.17) + fi * 3.1;
    // The lower edge of the curtain waves slowly; the pointer pulls it toward itself.
    float edge = uHeight - 0.1 + fi * 0.09 + (fbm(vec2(x * 0.7 + t * 0.35, fi * 2.3 + t * 0.1)) - 0.5) * 0.45;
    edge = mix(edge, m.y - 0.05, near * 0.35);
    float d = p.y - edge;
    float curtain = smoothstep(-0.015, 0.03, d) * exp(-max(d, 0.0) * (3.2 + fi * 0.8));
    // Vertical rays sliding along the curtain.
    float rays = 0.35 + 0.6 * pow(noise(vec2(x * 22.0 + t * 1.5, fi * 7.0 + t * 0.4)), 2.0) + 0.5 * pow(noise(vec2(x * 60.0 - t, fi)), 4.0);
    vec3 tint = iridescent(fi * 0.23 + x * 0.06 + d * 0.9 + t * 0.04);
    light += tint * curtain * rays * (0.55 + near * 1.4) / (1.0 + fi * 0.35);
  }
  col += light * uIntensity * 1.1;
  // Soft glow reflected near the horizon.
  col += iridescent(p.x * 0.1 + t * 0.05) * 0.05 * smoothstep(0.35, 0.0, uv.y) * uIntensity;
  col = 1.0 - exp(-col * 1.6);
  o = vec4(col, 1.0);
}`;

/** Curtains of northern light rippling over a starry sky; they lean toward and brighten under the pointer. */
export function aurora(canvas: HTMLCanvasElement, options: AuroraOptions = {}) {
  return shaderEffect(canvas, AURORA, options, (p, o) =>
    p
      .set('uSpeed', o.speed ?? 0.3)
      .set('uIntensity', o.intensity ?? 1)
      .set('uBands', Math.max(1, Math.min(o.bands ?? 3, 5)))
      .set('uHeight', o.height ?? 0.45),
  );
}

// ——————————————————————————— Silk ———————————————————————————

export interface SilkOptions extends ShaderEffectOptions {
  /** Flow speed. Default 0.35. */
  speed?: number;
  /** Size of the folds — higher means more, smaller folds. Default 1. */
  scale?: number;
  /** Strength of the satin highlight. Default 1. */
  sheen?: number;
  /** Brightness. Default 0.9. */
  intensity?: number;
}

const SILK = `
uniform float uSpeed; uniform float uScale; uniform float uSheen; uniform float uIntensity;
float height(vec2 p, vec2 m, float t) {
  float h = sin(p.x * 1.1 + sin(p.y * 1.4 + t) * 1.3 + t * 0.6);
  h += 0.6 * sin(p.y * 1.9 + sin(p.x * 0.9 - t * 0.7) * 1.6);
  h += 0.35 * sin(p.x * 0.7 - p.y * 1.2 + t * 0.4);
  // The pointer presses a soft dent into the fabric.
  vec2 dm = p - m;
  h -= exp(-dot(dm, dm) * 0.9) * uPresence * 1.4;
  return h;
}
void main() {
  float asp = uRes.x / uRes.y;
  float k = 4.5 * uScale;
  vec2 p = vec2(vUv.x * asp, vUv.y) * k;
  vec2 m = vec2(uMouse.x * asp, uMouse.y) * k;
  float t = uTime * uSpeed;
  float e = 0.02;
  float h = height(p, m, t);
  vec2 g = vec2(height(p + vec2(e, 0.0), m, t) - h, height(p + vec2(0.0, e), m, t) - h) / e;
  vec3 n = normalize(vec3(-g * 0.8, 1.0));
  vec3 L = normalize(vec3(-0.5, 0.55, 0.7));
  vec3 V = vec3(0.0, 0.0, 1.0);
  float diff = max(dot(n, L), 0.0);
  float spec = pow(max(dot(n, normalize(L + V)), 0.0), 28.0);
  // Satin: a broad soft highlight that runs along the ridges of the folds.
  float satin = pow(max(dot(n, normalize(vec3(-0.3, 0.2, 1.0))), 0.0), 6.0);
  vec3 tint = iridescent(h * 0.08 + vUv.x * 0.3 - vUv.y * 0.15 + t * 0.03);
  vec3 col = tint * (0.02 + pow(diff, 2.0) * 0.5);
  col += mix(vec3(1.0), tint, 0.55) * (spec * 0.55 + satin * 0.12) * uSheen;
  col *= uIntensity;
  col = col / (1.0 + col * 0.35);
  o = vec4(col, 1.0);
}`;

/** Flowing iridescent satin with a soft sheen. The pointer presses a dent into the cloth. */
export function silk(canvas: HTMLCanvasElement, options: SilkOptions = {}) {
  return shaderEffect(canvas, SILK, options, (p, o) =>
    p
      .set('uSpeed', o.speed ?? 0.35)
      .set('uScale', o.scale ?? 1)
      .set('uSheen', o.sheen ?? 1)
      .set('uIntensity', o.intensity ?? 0.9),
  );
}

// ——————————————————————————— Lava lamp ———————————————————————————

export interface LavaLampOptions extends ShaderEffectOptions {
  /** Number of blobs, max 10. Default 7. */
  blobs?: number;
  /** Rise speed. Default 0.5. */
  speed?: number;
  /** Blob size. Default 1. */
  size?: number;
  /** Glossy highlight, 0..1. Default 0.8. */
  gloss?: number;
}

const LAVA = `
uniform float uBlobs; uniform float uSpeed; uniform float uSize; uniform float uGloss;
void main() {
  float asp = uRes.x / uRes.y;
  vec2 p = vec2(vUv.x * asp, vUv.y);
  float t = uTime * uSpeed;
  float f = 0.0;
  vec2 grad = vec2(0.0);
  for (int i = 0; i < 11; i++) {
    float fi = float(i);
    vec2 c; float r;
    if (i == 10) {
      // The pointer is one more blob of wax.
      c = vec2(uMouse.x * asp, uMouse.y);
      r = 0.11 * uSize * uPresence;
    } else {
      if (fi >= uBlobs) continue;
      float h = hash(vec2(fi, 3.7));
      float rise = fract(t * (0.05 + h * 0.06) + h * 7.0);
      c = vec2((0.12 + 0.76 * hash(vec2(fi, 1.3)) + 0.08 * sin(t * 0.7 + fi * 2.0)) * asp, mix(-0.25, 1.25, smoothstep(0.0, 1.0, rise)));
      r = (0.08 + 0.07 * hash(vec2(fi, 9.1))) * uSize * (0.9 + 0.1 * sin(t * 1.3 + fi));
    }
    vec2 d = p - c;
    float q = dot(d, d) + 1e-4;
    f += r * r / q;
    grad -= 2.0 * r * r * d / (q * q);
  }
  // A pool of wax resting at the bottom.
  float pool = exp(-vUv.y * 9.0) * 0.98;
  f += pool;
  grad.y -= 9.0 * pool;
  float inside = smoothstep(0.96, 1.04, f);
  // Shade the height 1 - 1/f: flat at the core, steep at the rim — no singularity in the middle.
  vec3 n = normalize(vec3(-grad / (f * f) * 0.09, 1.0));
  vec3 L = normalize(vec3(-0.4, 0.7, 0.6));
  float diff = max(dot(n, L), 0.0);
  float spec = pow(max(dot(n, normalize(L + vec3(0.0, 0.0, 1.0))), 0.0), 40.0);
  float rim = pow(1.0 - n.z, 1.5);
  vec3 tint = iridescent(vUv.y * 0.6 + vUv.x * 0.25 + t * 0.04);
  vec3 wax = tint * (0.25 + diff * 0.75) + tint * rim * 0.6 + spec * uGloss;
  // Inside a dark glass: warm glow leaks from the wax.
  vec3 bg = mix(vec3(0.012, 0.01, 0.03), vec3(0.03, 0.015, 0.05), vUv.y) + tint * smoothstep(0.2, 1.0, f) * 0.18;
  vec3 col = mix(bg, wax, inside);
  o = vec4(col, 1.0);
}`;

/** Blobs of glossy wax rise, merge and split like a lava lamp. The pointer is one more blob. */
export function lavaLamp(canvas: HTMLCanvasElement, options: LavaLampOptions = {}) {
  const low = getDeviceTier() === 'low';
  return shaderEffect(canvas, LAVA, { resolution: low ? 0.6 : 1, ...options }, (p, o) =>
    p
      .set('uBlobs', Math.min(o.blobs ?? 7, 10))
      .set('uSpeed', o.speed ?? 0.5)
      .set('uSize', o.size ?? 1)
      .set('uGloss', o.gloss ?? 0.8),
  );
}

// ——————————————————————————— Wave lines ———————————————————————————

export interface WaveLinesOptions extends ShaderEffectOptions {
  /** Number of lines. Default 42. */
  lines?: number;
  /** Wave height. Default 1. */
  amplitude?: number;
  /** Wave speed. Default 0.4. */
  speed?: number;
  /** Line thickness in CSS px. Default 1.2. */
  thickness?: number;
}

const WAVES = `
uniform float uLines; uniform float uAmp; uniform float uSpeed; uniform float uThick; uniform float uDpr;
void main() {
  vec2 uv = vUv;
  float asp = uRes.x / uRes.y;
  float t = uTime * uSpeed;
  vec2 m = uMouse;
  vec2 dm = vec2((uv.x - m.x) * asp, uv.y - m.y);
  float dist = length(dm);
  // A swell that rolls through the field, strongest in the middle.
  float env = sin(uv.x * 3.14159);
  float wave = (fbm(vec2(uv.x * 2.2 - t, uv.y * 1.3 + t * 0.3)) - 0.5) * 0.22 * uAmp * env;
  wave += sin(uv.x * 9.0 + t * 2.0 + uv.y * 4.0) * 0.008 * uAmp;
  // The pointer lifts the lines and sends a ring outward.
  float lift = exp(-dist * dist * 22.0) * uPresence;
  wave += lift * (0.06 + 0.012 * sin(dist * 70.0 - uTime * 7.0));
  float y = (uv.y + wave) * uLines;
  float w = fwidth(y);
  float d = abs(fract(y) - 0.5) / max(w, 1e-4);
  float line = 1.0 - smoothstep(uThick * uDpr * 0.5, uThick * uDpr * 0.5 + 1.0, d);
  float idx = floor(y);
  vec3 tint = iridescent(uv.x * 0.55 + idx * 0.025 - t * 0.12);
  float glow = 0.35 + 0.65 * smoothstep(0.0, 0.7, env) + lift * 1.2;
  vec3 col = vec3(0.012, 0.014, 0.03) + tint * line * glow;
  col += tint * 0.05 * env;
  o = vec4(col, 1.0);
}`;

/** Fine lines rolling like an ocean of sound, iridescent along their length. The pointer lifts them. */
export function waveLines(canvas: HTMLCanvasElement, options: WaveLinesOptions = {}) {
  return shaderEffect(canvas, WAVES, options, (p, o) =>
    p
      .set('uLines', o.lines ?? 42)
      .set('uAmp', o.amplitude ?? 1)
      .set('uSpeed', o.speed ?? 0.4)
      .set('uThick', o.thickness ?? 1.2)
      .set('uDpr', canvas.width / Math.max(canvas.getBoundingClientRect().width, 1)),
  );
}

// ——————————————————————————— Ripples ———————————————————————————

export interface RipplesOptions extends ShaderEffectOptions {
  /** How fast the rings travel. Default 1. */
  speed?: number;
  /** Brightness. Default 1. */
  intensity?: number;
  /** Raindrops fall on their own when nobody is touching. Default true. */
  rain?: boolean;
  /** How quickly rings fade. Default 1. */
  decay?: number;
}

const RIPPLES = `
uniform float uSpeed; uniform float uIntensity; uniform float uDecay;
uniform vec4 uDrops[8];
float surface(vec2 p, float asp) {
  float h = 0.0;
  for (int i = 0; i < 8; i++) {
    vec4 d = uDrops[i];
    if (d.w <= 0.0) continue;
    float age = uTime - d.z;
    if (age < 0.0) continue;
    float r = length(p - vec2(d.x * asp, d.y));
    float front = age * 0.32 * uSpeed;
    float x = r - front;
    h += sin(x * 70.0) * exp(-x * x * 90.0) * exp(-age * 0.9 * uDecay) * d.w / (1.0 + front * 6.0);
  }
  // Faint wake under the pointer.
  vec2 dm = p - vec2(uMouse.x * asp, uMouse.y);
  h += sin(length(dm) * 60.0 - uTime * 6.0) * exp(-dot(dm, dm) * 60.0) * 0.15 * uPresence;
  return h;
}
void main() {
  float asp = uRes.x / uRes.y;
  vec2 p = vec2(vUv.x * asp, vUv.y);
  float e = 1.5 / uRes.y;
  float h = surface(p, asp);
  vec2 g = vec2(surface(p + vec2(e, 0.0), asp) - h, surface(p + vec2(0.0, e), asp) - h) / e;
  // Refract a slowly moving bed of light through the surface.
  vec2 q = p + g * 0.0025;
  float t = uTime * 0.05;
  float bed = noise(q * 1.8 + vec2(t, -t)) * 0.65 + noise(q * 3.3 - vec2(t, 0.0)) * 0.35;
  vec3 tint = iridescent(bed * 1.3 + q.x * 0.2 + t);
  vec3 col = mix(vec3(0.008, 0.012, 0.03), vec3(0.02, 0.03, 0.07), vUv.y);
  // Thin bright contours, like light on the bottom of a pool.
  float lines = pow(0.5 + 0.5 * sin(bed * 26.0 + uTime * 0.4), 14.0);
  col += tint * (0.05 + lines * 0.28);
  vec3 n = normalize(vec3(-g * 0.02, 1.0));
  vec3 L = normalize(vec3(-0.5, 0.6, 0.6));
  float spec = pow(max(dot(n, normalize(L + vec3(0.0, 0.0, 1.0))), 0.0), 40.0);
  float slope = clamp(length(g) * 0.012, 0.0, 1.0);
  col += tint * slope * 1.2 + mix(vec3(1.0), tint, 0.5) * spec * 0.8;
  col *= uIntensity;
  o = vec4(col, 1.0);
}`;

/**
 * A dark liquid surface. Click or tap to drop rings that spread and refract the light below;
 * with `rain` on, drops also fall on their own.
 */
export function ripples(canvas: HTMLCanvasElement, options: RipplesOptions = {}) {
  const drops = new Float32Array(32);
  let slot = 0;
  let now = 0;
  let nextRain = 0.4;
  let loc: WebGLUniformLocation | null | undefined;
  const drop = (x: number, y: number, strength: number) => {
    drops.set([x, y, now, strength], slot * 4);
    slot = (slot + 1) % 8;
  };
  const inst = shaderEffect(canvas, RIPPLES, options, (p, o, gl, time) => {
    now = time;
    if (o.rain !== false && time > nextRain) {
      drop(Math.random(), 0.1 + Math.random() * 0.8, 0.35 + Math.random() * 0.4);
      nextRain = time + 0.7 + Math.random() * 1.6;
    }
    p.set('uSpeed', o.speed ?? 1)
      .set('uIntensity', o.intensity ?? 1)
      .set('uDecay', o.decay ?? 1);
    if (loc === undefined) loc = gl.getUniformLocation(p.program, 'uDrops');
    gl.uniform4fv(loc, drops);
  });
  if (!inst) return null;
  // The canvas never takes pointer events, so listen on the window and check the box.
  const onDown = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / Math.max(r.width, 1);
    const y = 1 - (e.clientY - r.top) / Math.max(r.height, 1);
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    drop(x, y, 1);
    nextRain = now + 2.5;
  };
  window.addEventListener('pointerdown', onDown);
  return {
    update: inst.update,
    /** Drops a ring at a point in 0..1 canvas space (y down). */
    drop(x: number, y: number, strength = 1) {
      drop(x, 1 - y, strength);
    },
    destroy() {
      window.removeEventListener('pointerdown', onDown);
      inst.destroy();
    },
  };
}
