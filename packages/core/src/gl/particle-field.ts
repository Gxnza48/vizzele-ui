import { canvasLoop, createProgram } from './core';
import { canvasPointer, getGL } from './pass';
import { getDeviceTier } from '../motion';
import { sampleGradient, iridescentPalette } from '../color';

export interface ParticleFieldOptions {
  /** Particle count. Default 2400 (halved on low-end devices). */
  count?: number;
  /** `'repel'` scatters away from the pointer, `'attract'` swirls into it. Default 'repel'. */
  mode?: 'repel' | 'attract';
  /** Pointer influence radius (fraction of the shorter side). Default 0.22. */
  radius?: number;
  /** Pointer force. Default 1. */
  force?: number;
  /** Point size in CSS px. Default 2. */
  size?: number;
  /** Drift speed of the ambient flow. Default 1. */
  flow?: number;
  colors?: readonly string[];
}

const VERT = `#version 300 es
in vec2 aPos; in vec3 aColor; in float aSize;
uniform vec2 uRes; uniform float uDpr;
out vec3 vColor;
void main() {
  vColor = aColor;
  vec2 clip = aPos / uRes * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = aSize * uDpr;
}`;
const FRAG = `#version 300 es
precision mediump float;
in vec3 vColor; out vec4 o;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.0, d);
  o = vec4(vColor * a * 1.35, a);
}`;

/**
 * Thousands of iridescent particles drifting in a flow field; they part around the pointer
 * (or swirl into it) and spring back to their place.
 */
export function particleField(canvas: HTMLCanvasElement, options: ParticleFieldOptions = {}) {
  let opts = options;
  const gl = getGL(canvas);
  if (!gl) return null;
  const program = createProgram(gl, VERT, FRAG);
  const uRes = gl.getUniformLocation(program, 'uRes');
  const uDpr = gl.getUniformLocation(program, 'uDpr');
  const tier = getDeviceTier();
  const count = Math.round((opts.count ?? 2400) * (tier === 'low' ? 0.5 : 1));

  // Per particle: home x/y (0..1), position, velocity.
  const home = new Float32Array(count * 2);
  const pos = new Float32Array(count * 2);
  const vel = new Float32Array(count * 2);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const seed = new Float32Array(count);

  const paint = () => {
    for (let i = 0; i < count; i++) {
      const [r, g, b] = sampleGradient(
        home[i * 2]! * 0.8 + home[i * 2 + 1]! * 0.4,
        opts.colors ?? iridescentPalette,
      );
      colors.set([r / 255, g / 255, b / 255], i * 3);
    }
  };
  for (let i = 0; i < count; i++) {
    home[i * 2] = Math.random();
    home[i * 2 + 1] = Math.random();
    seed[i] = Math.random() * 1000;
    sizes[i] = (opts.size ?? 2) * (0.6 + Math.random() * 0.9);
  }
  paint();

  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  const mk = (data: Float32Array, loc: number, n: number, usage: number) => {
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, n, gl.FLOAT, false, 0, 0);
    return buf;
  };
  const posBuf = mk(pos, gl.getAttribLocation(program, 'aPos'), 2, gl.DYNAMIC_DRAW);
  const colBuf = mk(colors, gl.getAttribLocation(program, 'aColor'), 3, gl.STATIC_DRAW);
  mk(sizes, gl.getAttribLocation(program, 'aSize'), 1, gl.STATIC_DRAW);

  const pointer = canvasPointer(canvas, 0.25);
  let w = 1;
  let h = 1;
  let dpr = 1;
  let placed = false;

  const loop = canvasLoop(canvas, {
    onResize: (W, H, D) => {
      w = W / D;
      h = H / D;
      dpr = D;
      if (!placed) {
        for (let i = 0; i < count; i++) {
          pos[i * 2] = home[i * 2]! * w;
          pos[i * 2 + 1] = home[i * 2 + 1]! * h;
        }
        placed = true;
      }
    },
    render: (time, delta) => {
      const dt = Math.min(delta || 1 / 60, 1 / 30);
      pointer.step(dt);
      const mx = pointer.state.x * w;
      const my = (1 - pointer.state.y) * h;
      const presence = pointer.state.presence;
      const R = (opts.radius ?? 0.22) * Math.min(w, h);
      const force = (opts.force ?? 1) * 2400;
      const attract = opts.mode === 'attract';
      const flow = (opts.flow ?? 1) * 14;
      for (let i = 0; i < count; i++) {
        const ix = i * 2;
        const iy = ix + 1;
        let x = pos[ix]!;
        let y = pos[iy]!;
        // Home drifts along a slow flow field so the field breathes.
        const s = seed[i]!;
        const hx = home[ix]! * w + Math.sin(time * 0.3 + s) * flow;
        const hy = home[iy]! * h + Math.cos(time * 0.25 + s * 1.3) * flow;
        let ax = (hx - x) * 9;
        let ay = (hy - y) * 9;
        const dx = x - mx;
        const dy = y - my;
        const d2 = dx * dx + dy * dy;
        if (presence > 0.01 && d2 < R * R) {
          const d = Math.sqrt(d2) || 1;
          const k = (1 - d / R) * presence * force;
          if (attract) {
            // Swirl: tangential + inward.
            ax += (-dy / d) * k - (dx / d) * k * 0.6;
            ay += (dx / d) * k - (dy / d) * k * 0.6;
          } else {
            ax += (dx / d) * k;
            ay += (dy / d) * k;
          }
        }
        const vx = (vel[ix]! + ax * dt) * Math.exp(-5 * dt);
        const vy = (vel[iy]! + ay * dt) * Math.exp(-5 * dt);
        x += vx * dt;
        y += vy * dt;
        vel[ix] = vx;
        vel[iy] = vy;
        pos[ix] = x;
        pos[iy] = y;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(program);
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uDpr, dpr);
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);
      gl.drawArrays(gl.POINTS, 0, count);
    },
  });

  return {
    update(next: Partial<ParticleFieldOptions>) {
      opts = { ...opts, ...next };
      if (next.colors) {
        paint();
        gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
      }
    },
    destroy() {
      loop.destroy();
      pointer.destroy();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
