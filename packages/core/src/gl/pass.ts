import { FULLSCREEN_VERTEX, createProgram, setUniform, type UniformValue } from './core';
import { onPointerMove, type PointerState } from '../pointer';

export interface Pass {
  program: WebGLProgram;
  use(): Pass;
  set(name: string, value: UniformValue): Pass;
  setInt(name: string, value: number): Pass;
  draw(): void;
}

/** A fullscreen fragment-shader pass with cached uniform locations. */
export function createPass(
  gl: WebGL2RenderingContext,
  vao: WebGLVertexArrayObject,
  fragment: string,
  vertex = FULLSCREEN_VERTEX,
): Pass {
  const program = createProgram(gl, vertex, fragment);
  const locs = new Map<string, WebGLUniformLocation | null>();
  const loc = (n: string) => {
    if (!locs.has(n)) locs.set(n, gl.getUniformLocation(program, n));
    return locs.get(n)!;
  };
  const pass: Pass = {
    program,
    use() {
      gl.useProgram(program);
      return pass;
    },
    set(n, v) {
      setUniform(gl, loc(n), v);
      return pass;
    },
    setInt(n, v) {
      const l = loc(n);
      if (l) gl.uniform1i(l, v);
      return pass;
    },
    draw() {
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
  };
  return pass;
}

/**
 * Pointer position over a canvas in 0..1 UV space (y up), eased toward its target,
 * plus a 0..1 "presence" that fades in while the pointer is over/near the canvas.
 */
export function canvasPointer(canvas: HTMLCanvasElement, ease = 0.12) {
  const target = { x: 0.5, y: 0.5, inside: 0 };
  const state = { x: 0.5, y: 0.5, vx: 0, vy: 0, presence: 0 };
  let raw: Readonly<PointerState> | null = null;
  const unsubscribe = onPointerMove((p) => {
    raw = p;
    const r = canvas.getBoundingClientRect();
    target.x = (p.x - r.left) / Math.max(r.width, 1);
    target.y = 1 - (p.y - r.top) / Math.max(r.height, 1);
    const inside = target.x >= -0.05 && target.x <= 1.05 && target.y >= -0.05 && target.y <= 1.05;
    target.inside = p.active && inside && (p.type !== 'touch' || p.down) ? 1 : 0;
  });
  return {
    state,
    get raw() {
      return raw;
    },
    step(dt: number) {
      const k = 1 - Math.pow(1 - ease, dt * 60);
      const nx = state.x + (target.x - state.x) * k;
      const ny = state.y + (target.y - state.y) * k;
      state.vx = (nx - state.x) / Math.max(dt, 1e-3);
      state.vy = (ny - state.y) / Math.max(dt, 1e-3);
      state.x = nx;
      state.y = ny;
      state.presence += (target.inside - state.presence) * (1 - Math.pow(0.92, dt * 60));
    },
    destroy: unsubscribe,
  };
}

/** Shared GLSL: hash noise, simplex-ish value noise, fbm and the Vizzele iridescent palette. */
export const GLSL_COMMON = `
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3;
vec3 iridescent(float t) {
  t = fract(t) * 4.0;
  if (t < 1.0) return mix(uC0, uC1, smoothstep(0.0, 1.0, t));
  if (t < 2.0) return mix(uC1, uC2, smoothstep(1.0, 2.0, t));
  if (t < 3.0) return mix(uC2, uC3, smoothstep(2.0, 3.0, t));
  return mix(uC3, uC0, smoothstep(3.0, 4.0, t));
}
`;

const hex = (h: string): [number, number, number] => {
  const n = parseInt(h.replace('#', '').slice(0, 6), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export const DEFAULT_COLORS = ['#00e5ff', '#ff2bd6', '#ffb238', '#a8ff3e'] as const;

export function setPalette(pass: Pass, colors: readonly string[] = DEFAULT_COLORS) {
  const c = [0, 1, 2, 3].map((i) => hex(colors[i % colors.length] ?? DEFAULT_COLORS[i]!));
  pass.set('uC0', c[0]!).set('uC1', c[1]!).set('uC2', c[2]!).set('uC3', c[3]!);
}

export function getGL(
  canvas: HTMLCanvasElement,
  opts: WebGLContextAttributes = {},
): WebGL2RenderingContext | null {
  return canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: 'high-performance',
    ...opts,
  });
}
