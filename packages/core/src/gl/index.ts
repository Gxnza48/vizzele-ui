import { isBrowser } from '../env';
import { frame } from '../scheduler';
import { getDeviceTier, prefersReducedMotion } from '../motion';
import { observeVisibility } from '../observe';

export type UniformValue =
  | number
  | readonly [number, number]
  | readonly [number, number, number]
  | readonly [number, number, number, number];

export const FULLSCREEN_VERTEX = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

export function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('vizzele/gl: could not create shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`vizzele/gl: shader error\n${log ?? ''}`);
  }
  return shader;
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vertex: string,
  fragment: string,
): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error('vizzele/gl: could not create program');
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertex);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragment);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, 'aPos');
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`vizzele/gl: link error\n${gl.getProgramInfoLog(program) ?? ''}`);
  }
  return program;
}

/** Binds a full-screen triangle pair to attribute 0. */
export function createQuad(gl: WebGL2RenderingContext): WebGLVertexArrayObject {
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  return vao;
}

export function setUniform(
  gl: WebGL2RenderingContext,
  loc: WebGLUniformLocation | null,
  value: UniformValue,
) {
  if (!loc) return;
  if (typeof value === 'number') gl.uniform1f(loc, value);
  else if (value.length === 2) gl.uniform2f(loc, value[0], value[1]);
  else if (value.length === 3) gl.uniform3f(loc, value[0], value[1], value[2]);
  else gl.uniform4f(loc, value[0], value[1], value[2], value[3]);
}

/** Pixel ratio cap per device tier: weak devices render at lower resolution. */
export function pixelRatioFor(tier = getDeviceTier()): number {
  const dpr = isBrowser ? window.devicePixelRatio || 1 : 1;
  return Math.min(dpr, tier === 'low' ? 0.75 : tier === 'mid' ? 1.25 : 2);
}

export interface CanvasLoopOptions {
  /** Multiplier on the device-tier pixel ratio. Default 1. */
  resolution?: number;
  /** Render a single still frame when the user prefers reduced motion. Default true. */
  respectReducedMotion?: boolean;
  onResize?: (width: number, height: number, dpr: number) => void;
  /** Called every visible frame with elapsed seconds and frame delta. */
  render: (time: number, delta: number) => void;
}

/**
 * Drives a canvas: keeps its backing store sized to its CSS box, pauses while off-screen
 * or in a background tab, and renders a single frame under reduced motion.
 */
export function canvasLoop(canvas: HTMLCanvasElement, options: CanvasLoopOptions) {
  let width = 0;
  let height = 0;
  let dpr = 1;
  let time = 0;
  let visible = false;
  let stopFrame: (() => void) | null = null;
  const reduced = () => options.respectReducedMotion !== false && prefersReducedMotion();

  const resize = () => {
    dpr = pixelRatioFor() * (options.resolution ?? 1);
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width * dpr));
    height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    options.onResize?.(width, height, dpr);
    if (reduced() || !stopFrame) options.render(time, 0);
  };

  const start = () => {
    if (stopFrame || reduced()) return;
    stopFrame = frame.add(({ delta }) => {
      time += delta;
      options.render(time, delta);
    }, 'render');
  };
  const stop = () => {
    stopFrame?.();
    stopFrame = null;
  };

  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  ro?.observe(canvas);
  resize();
  const unobserve = observeVisibility(canvas, (v) => {
    visible = v;
    if (v && !document.hidden) start();
    else stop();
  });
  const onVisibility = () => (document.hidden || !visible ? stop() : start());
  document.addEventListener('visibilitychange', onVisibility);

  return {
    get size() {
      return { width, height, dpr };
    },
    resize,
    destroy() {
      stop();
      ro?.disconnect();
      unobserve();
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
