import { canvasLoop, createQuad } from './core';
import { GLSL_COMMON, canvasPointer, createPass, getGL, setPalette } from './pass';
import { getDeviceTier } from '../motion';

const HEAD = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uPresence;
${GLSL_COMMON}
`;

interface ShaderEffectOptions {
  colors?: readonly string[];
  /** Render-resolution multiplier. Default 1. */
  resolution?: number;
}

/** Runs a fullscreen shader on a canvas with time, size, palette and an eased pointer. */
function shaderEffect<O extends ShaderEffectOptions>(
  canvas: HTMLCanvasElement,
  fragment: string,
  options: O,
  setUniforms: (pass: ReturnType<typeof createPass>, opts: O) => void,
) {
  let opts = options;
  const gl = getGL(canvas);
  if (!gl) return null;
  const vao = createQuad(gl);
  const pass = createPass(gl, vao, HEAD + fragment);
  const pointer = canvasPointer(canvas, 0.08);
  const loop = canvasLoop(canvas, {
    resolution: opts.resolution ?? 1,
    render: (time, delta) => {
      pointer.step(delta || 1 / 60);
      gl.viewport(0, 0, canvas.width, canvas.height);
      pass
        .use()
        .set('uRes', [canvas.width, canvas.height])
        .set('uTime', time)
        .set('uMouse', [pointer.state.x, pointer.state.y])
        .set('uPresence', pointer.state.presence);
      setPalette(pass, opts.colors);
      setUniforms(pass, opts);
      pass.draw();
    },
  });
  return {
    update(next: Partial<O>) {
      opts = { ...opts, ...next };
    },
    destroy() {
      loop.destroy();
      pointer.destroy();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}

// ——————————————————————————— Mesh gradient ———————————————————————————

export interface MeshGradientOptions extends ShaderEffectOptions {
  /** Animation speed. Default 0.25. */
  speed?: number;
  /** Swirl / warp amount. Default 1. */
  warp?: number;
  /** How much the pointer bends the colors. Default 1. */
  interactive?: number;
  /** Grain on top. Default 0.06. */
  grain?: number;
  /** Overall brightness 0..1. Default 0.85. */
  intensity?: number;
}

const MESH = `
uniform float uSpeed; uniform float uWarp; uniform float uInteractive; uniform float uGrain; uniform float uIntensity;
void main() {
  vec2 uv = vUv;
  vec2 p = uv; p.x *= uRes.x / uRes.y;
  float t = uTime * uSpeed;
  vec2 m = uMouse; m.x *= uRes.x / uRes.y;
  // Pointer pushes the field like a finger in oil.
  vec2 toM = p - m;
  float pull = exp(-dot(toM, toM) * 6.0) * uPresence * uInteractive;
  p += normalize(toM + 1e-4) * pull * 0.18;
  // Domain-warped fbm: soft, flowing bands.
  vec2 q = vec2(fbm(p * 1.4 + t), fbm(p * 1.4 - t + 3.7));
  vec2 r = vec2(fbm(p * 1.6 + q * 2.0 * uWarp + vec2(1.7, 9.2) + t * 0.6), fbm(p * 1.6 + q * 2.0 * uWarp + vec2(8.3, 2.8) - t * 0.4));
  float f = fbm(p + r * uWarp);
  vec3 col = iridescent(f * 1.4 + r.x * 0.6 + t * 0.15 + pull * 0.8);
  // Deep shadows between the bands keep it from looking flat.
  float shade = smoothstep(0.15, 0.85, f + length(q) * 0.25);
  col *= mix(0.12, 1.0, shade);
  col += pow(max(r.y - 0.45, 0.0), 2.0) * 1.5; // specular glints
  col *= uIntensity;
  col += (hash(uv * uRes + fract(uTime) * 100.0) - 0.5) * uGrain;
  o = vec4(col, 1.0);
}`;

/** An animated, domain-warped mesh gradient in the iridescent palette that bends around the pointer. */
export function meshGradient(canvas: HTMLCanvasElement, options: MeshGradientOptions = {}) {
  return shaderEffect(canvas, MESH, options, (p, o) =>
    p
      .set('uSpeed', o.speed ?? 0.25)
      .set('uWarp', o.warp ?? 1)
      .set('uInteractive', o.interactive ?? 1)
      .set('uGrain', o.grain ?? 0.06)
      .set('uIntensity', o.intensity ?? 0.85),
  );
}

// ——————————————————————————— Lens grid ———————————————————————————

export interface LensGridOptions extends ShaderEffectOptions {
  /** Grid cell size in CSS px. Default 36. */
  cell?: number;
  /** Lens strength. Default 0.35. */
  strength?: number;
  /** Lens radius (fraction of the shorter side). Default 0.28. */
  radius?: number;
  /** Line color (CSS hex). Default a cool grey. */
  lineColor?: string;
  /** Chromatic aberration inside the lens. Default 1. */
  aberration?: number;
}

const LENS = `
uniform float uCell; uniform float uStrength; uniform float uRadius; uniform vec3 uLine; uniform float uAberration; uniform float uDpr;
float grid(vec2 p) {
  vec2 g = abs(fract(p - 0.5) - 0.5) / fwidth(p);
  float line = 1.0 - min(min(g.x, g.y), 1.0);
  vec2 d = abs(fract(p) - 0.5);
  float dotv = 1.0 - smoothstep(0.03, 0.09, length(fract(p + 0.5) - 0.5));
  return max(line * 0.55, dotv);
}
void main() {
  vec2 px = vUv * uRes;
  vec2 m = uMouse * uRes;
  float R = uRadius * min(uRes.x, uRes.y);
  vec2 d = px - m;
  float dist = length(d);
  float k = smoothstep(R, 0.0, dist) * uPresence;
  // Bulge: pull sample positions toward the lens center.
  float bulge = 1.0 - uStrength * k * k;
  vec2 cellPx = vec2(uCell * uDpr);
  vec2 base = (m + d * bulge) / cellPx;
  float ab = uAberration * k * 0.06;
  vec2 dir = normalize(d + 1e-4);
  float r = grid(base + dir * ab);
  float g = grid(base);
  float b = grid(base - dir * ab);
  vec3 lineCol = mix(uLine, iridescent(dist / R * 0.5 + uTime * 0.05), k);
  vec3 col = vec3(r, g, b) * lineCol * (0.55 + k * 1.2);
  float a = max(max(col.r, col.g), col.b);
  // Soft glow at the rim of the lens.
  float rim = exp(-pow((dist - R * 0.8) / (R * 0.12), 2.0)) * uPresence * 0.12;
  col += iridescent(atan(d.y, d.x) / 6.2831 + uTime * 0.1) * rim;
  o = vec4(col, clamp(a + rim, 0.0, 1.0));
}`;

/** A dot-and-line grid that bulges like a lens under the pointer, splitting into color at the edges. */
export function lensGrid(canvas: HTMLCanvasElement, options: LensGridOptions = {}) {
  const hex = (h: string): [number, number, number] => {
    const n = parseInt(h.replace('#', ''), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  };
  return shaderEffect(canvas, LENS, options, (p, o) =>
    p
      .set('uCell', o.cell ?? 36)
      .set('uStrength', o.strength ?? 0.35)
      .set('uRadius', o.radius ?? 0.28)
      .set('uLine', hex(o.lineColor ?? '#5a6788'))
      .set('uAberration', o.aberration ?? 1)
      .set('uDpr', canvas.width / Math.max(canvas.getBoundingClientRect().width, 1)),
  );
}

// ——————————————————————————— Liquid metal ———————————————————————————

export interface LiquidMetalOptions extends ShaderEffectOptions {
  /** Number of blobs merging together. Default 5. */
  blobs?: number;
  /** Blob size. Default 1. */
  size?: number;
  /** Iridescent film on the chrome, 0..1. Default 0.55. */
  iridescence?: number;
  /** Animation speed. Default 0.6. */
  speed?: number;
  /** How strongly blobs chase the pointer. Default 1. */
  follow?: number;
}

const METAL = `
uniform float uBlobs; uniform float uSize; uniform float uIrid; uniform float uSpeed; uniform float uFollow;
float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
float sdf(vec3 p) {
  float t = uTime * uSpeed;
  vec2 m = (uMouse - 0.5) * vec2(uRes.x / uRes.y, 1.0) * 2.2;
  float d = 1e3;
  for (int i = 0; i < 8; i++) {
    if (float(i) >= uBlobs) break;
    float fi = float(i);
    vec3 c = vec3(sin(t * (0.6 + fi * 0.13) + fi * 1.7) * 0.9, cos(t * (0.5 + fi * 0.11) + fi * 2.3) * 0.55, sin(t * 0.4 + fi) * 0.3);
    c.xy = mix(c.xy, m * 0.9, uPresence * uFollow * (0.25 + 0.12 * fi / max(uBlobs, 1.0)));
    float r = (0.36 + 0.14 * sin(fi * 3.1 + t)) * uSize;
    d = smin(d, length(p - c) - r, 0.55);
  }
  return d;
}
vec3 normalAt(vec3 p) {
  vec2 e = vec2(0.002, 0.0);
  return normalize(vec3(sdf(p + e.xyy) - sdf(p - e.xyy), sdf(p + e.yxy) - sdf(p - e.yxy), sdf(p + e.yyx) - sdf(p - e.yyx)));
}
// A fake studio environment: bright horizon bands make chrome read as chrome.
vec3 env(vec3 r) {
  float y = r.y;
  vec3 sky = mix(vec3(0.02, 0.03, 0.06), vec3(0.85, 0.9, 1.0), smoothstep(-0.05, 0.6, y));
  sky += smoothstep(0.02, 0.0, abs(y - 0.08)) * 1.6;
  sky += smoothstep(0.9, 1.0, dot(r, normalize(vec3(-0.5, 0.6, 0.6)))) * 2.5;
  sky *= 0.75 + 0.25 * sin(r.x * 6.0 + uTime * 0.3);
  return sky;
}
void main() {
  vec2 uv = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0) * 2.2;
  vec3 ro = vec3(0.0, 0.0, 3.2);
  vec3 rd = normalize(vec3(uv, -2.4));
  float t = 0.0; float d; bool hit = false;
  for (int i = 0; i < 64; i++) {
    d = sdf(ro + rd * t);
    if (d < 0.001) { hit = true; break; }
    t += d;
    if (t > 8.0) break;
  }
  if (!hit) { o = vec4(0.0); return; }
  vec3 p = ro + rd * t;
  vec3 n = normalAt(p);
  vec3 r = reflect(rd, n);
  float fres = pow(1.0 - max(dot(-rd, n), 0.0), 3.0);
  vec3 chrome = env(r) * vec3(0.92, 0.95, 1.0);
  vec3 film = iridescent(fres * 1.6 + dot(n, vec3(0.3, 0.5, 0.2)) + uTime * 0.05);
  vec3 col = mix(chrome, chrome * film * 1.6 + film * 0.15, uIrid * (0.35 + fres));
  col = col / (1.0 + col * 0.25);
  o = vec4(col, 1.0);
}`;

/** Raymarched blobs of liquid chrome with an iridescent film; they merge and reach for the pointer. */
export function liquidMetal(canvas: HTMLCanvasElement, options: LiquidMetalOptions = {}) {
  const low = getDeviceTier() === 'low';
  return shaderEffect(canvas, METAL, { resolution: low ? 0.5 : 0.8, ...options }, (p, o) =>
    p
      .set('uBlobs', Math.min(o.blobs ?? 5, 8))
      .set('uSize', o.size ?? 1)
      .set('uIrid', o.iridescence ?? 0.55)
      .set('uSpeed', o.speed ?? 0.6)
      .set('uFollow', o.follow ?? 1),
  );
}

// ——————————————————————————— Animated grain ———————————————————————————

export interface GrainOptions {
  /** 0..1. Default 0.08. */
  opacity?: number;
  /** Grain size in px. Default 1.5. */
  size?: number;
  /** Frames per second of the noise. Default 24 (film). */
  fps?: number;
}

const GRAIN = `
uniform float uOpacity; uniform float uSize; uniform float uSeed;
void main() {
  vec2 cell = floor(vUv * uRes / uSize);
  float n = hash(cell + uSeed) - 0.5;
  o = vec4(vec3(0.5 + n), abs(n) * 2.0 * uOpacity);
}`;

/** Film grain rendered on the GPU at film frame rate. */
export function grain(canvas: HTMLCanvasElement, options: GrainOptions = {}) {
  let seed = 0;
  let acc = 0;
  let last = 0;
  return shaderEffect(canvas, GRAIN, options as ShaderEffectOptions & GrainOptions, (p, o) => {
    const now = performance.now() / 1000;
    acc += now - last;
    last = now;
    if (acc > 1 / (o.fps ?? 24)) {
      acc = 0;
      seed = Math.random() * 100;
    }
    p.set('uOpacity', o.opacity ?? 0.08)
      .set('uSize', o.size ?? 1.5)
      .set('uSeed', seed);
  });
}
