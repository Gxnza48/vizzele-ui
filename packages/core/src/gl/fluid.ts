import { canvasLoop, createQuad } from './core';
import { DEFAULT_COLORS, canvasPointer, createPass, getGL, type Pass } from './pass';
import { getDeviceTier, prefersReducedMotion } from '../motion';
import { sampleGradient } from '../color';

export interface FluidOptions {
  /** Simulation grid resolution (shorter side). Default 128 (64 on low-end). */
  simResolution?: number;
  /** Dye texture resolution. Default 768 (384 on low-end). */
  dyeResolution?: number;
  /** How fast the ink fades, 0..1 per second-ish. Default 0.92 (lower = fades faster). */
  dissipation?: number;
  /** How fast motion calms down. Default 0.2. */
  velocityDissipation?: number;
  /** Swirliness. Default 18. */
  curl?: number;
  /** Pressure solver iterations. Default 20 (10 on low-end). */
  pressureIterations?: number;
  /** Ink splat radius (fraction of the canvas). Default 0.22. */
  splatRadius?: number;
  /** Force applied by the pointer. Default 5200. */
  splatForce?: number;
  /** Ink colors, cycled as you move. Default: the iridescent palette. */
  colors?: readonly string[];
  /** Ink brightness. Default 0.65. */
  intensity?: number;
  /** Ambient random splats so it's alive even when idle. Default true. */
  ambient?: boolean;
  /** Background color behind the ink (CSS hex). Default transparent. */
  background?: string;
}

interface FBO {
  tex: WebGLTexture;
  fb: WebGLFramebuffer;
  w: number;
  h: number;
}
interface DoubleFBO {
  read: FBO;
  write: FBO;
  swap(): void;
}

const VERT = `#version 300 es
in vec2 aPos;
uniform vec2 uTexel;
out vec2 vUv; out vec2 vL; out vec2 vR; out vec2 vT; out vec2 vB;
void main() {
  vUv = aPos * 0.5 + 0.5;
  vL = vUv - vec2(uTexel.x, 0.0); vR = vUv + vec2(uTexel.x, 0.0);
  vT = vUv + vec2(0.0, uTexel.y); vB = vUv - vec2(0.0, uTexel.y);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;
const HEAD = `#version 300 es
precision highp float;
in vec2 vUv; in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB;
out vec4 o;
`;

const SPLAT = `${HEAD}
uniform sampler2D uTarget; uniform float uAspect; uniform vec3 uColor; uniform vec2 uPoint; uniform float uRadius;
void main() {
  vec2 p = vUv - uPoint; p.x *= uAspect;
  vec3 splat = exp(-dot(p, p) / uRadius) * uColor;
  o = vec4(texture(uTarget, vUv).xyz + splat, 1.0);
}`;
const ADVECT = `${HEAD}
uniform sampler2D uVelocity; uniform sampler2D uSource; uniform vec2 uTexel; uniform float uDt; uniform float uDissipation;
void main() {
  vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uTexel;
  o = texture(uSource, coord) / (1.0 + uDissipation * uDt);
}`;
const DIVERGENCE = `${HEAD}
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).x, R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y, B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) L = -C.x; if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y; if (vB.y < 0.0) B = -C.y;
  o = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`;
const CURL = `${HEAD}
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).y, R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x, B = texture(uVelocity, vB).x;
  o = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`;
const VORTICITY = `${HEAD}
uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform float uCurlStrength; uniform float uDt;
void main() {
  float L = texture(uCurl, vL).x, R = texture(uCurl, vR).x, T = texture(uCurl, vT).x, B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= uCurlStrength * C; force.y *= -1.0;
  vec2 v = texture(uVelocity, vUv).xy + force * uDt;
  o = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0);
}`;
const PRESSURE = `${HEAD}
uniform sampler2D uPressure; uniform sampler2D uDivergence;
void main() {
  float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x, T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
  float d = texture(uDivergence, vUv).x;
  o = vec4((L + R + B + T - d) * 0.25, 0.0, 0.0, 1.0);
}`;
const GRADIENT = `${HEAD}
uniform sampler2D uPressure; uniform sampler2D uVelocity;
void main() {
  float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x, T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
  vec2 v = texture(uVelocity, vUv).xy - vec2(R - L, T - B);
  o = vec4(v, 0.0, 1.0);
}`;
const CLEAR = `${HEAD}
uniform sampler2D uTexture; uniform float uValue;
void main() { o = uValue * texture(uTexture, vUv); }`;
const DISPLAY = `${HEAD}
uniform sampler2D uTexture; uniform vec2 uTexel; uniform vec4 uBg;
void main() {
  vec3 c = texture(uTexture, vUv).rgb;
  // Fake lighting from the dye gradient gives the ink a glossy, liquid relief.
  float dx = length(texture(uTexture, vR).rgb) - length(texture(uTexture, vL).rgb);
  float dy = length(texture(uTexture, vT).rgb) - length(texture(uTexture, vB).rgb);
  vec3 n = normalize(vec3(dx, dy, length(uTexel)));
  float light = clamp(dot(n, normalize(vec3(-0.4, 0.6, 1.0))) * 0.35 + 0.8, 0.85, 1.12);
  c *= light * 2.6;
  float luma = dot(c, vec3(0.299, 0.587, 0.114));
  c = max(mix(vec3(luma), c, 1.5), 0.0);
  c = c / (1.0 + c * 0.6);
  // Output is premultiplied: the ink is emissive, alpha = its strongest channel.
  float a = clamp(max(c.r, max(c.g, c.b)), 0.0, 1.0);
  o = vec4(c + uBg.rgb * uBg.a * (1.0 - a), max(a, uBg.a));
}`;

/**
 * Real-time fluid simulation (stable fluids + vorticity confinement) that the pointer stirs
 * with iridescent ink. Returns null when WebGL2 float render targets aren't available —
 * fall back to `meshGradient` then.
 */
export function fluid(canvas: HTMLCanvasElement, options: FluidOptions = {}) {
  let opts = options;
  const gl = getGL(canvas);
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) return null;
  gl.getExtension('OES_texture_float_linear');
  const tier = getDeviceTier();
  const low = tier === 'low';
  const vao = createQuad(gl);

  const passes = {
    splat: createPass(gl, vao, SPLAT, VERT),
    advect: createPass(gl, vao, ADVECT, VERT),
    divergence: createPass(gl, vao, DIVERGENCE, VERT),
    curl: createPass(gl, vao, CURL, VERT),
    vorticity: createPass(gl, vao, VORTICITY, VERT),
    pressure: createPass(gl, vao, PRESSURE, VERT),
    gradient: createPass(gl, vao, GRADIENT, VERT),
    clear: createPass(gl, vao, CLEAR, VERT),
    display: createPass(gl, vao, DISPLAY, VERT),
  };

  const createFBO = (w: number, h: number, internal: number, format: number): FBO => {
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null);
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const fbo = { tex, fb, w, h };
    owned.push(fbo);
    return fbo;
  };
  const createDouble = (w: number, h: number, internal: number, format: number): DoubleFBO => {
    let a = createFBO(w, h, internal, format);
    let b = createFBO(w, h, internal, format);
    return {
      get read() {
        return a;
      },
      get write() {
        return b;
      },
      swap() {
        [a, b] = [b, a];
      },
    } as DoubleFBO;
  };
  const sizeFor = (res: number) => {
    const aspect = canvas.width / Math.max(canvas.height, 1);
    return aspect >= 1
      ? { w: Math.round(res * aspect), h: res }
      : { w: res, h: Math.round(res / aspect) };
  };

  let velocity: DoubleFBO, dye: DoubleFBO, pressure: DoubleFBO, divergence: FBO, curl: FBO;
  let owned: FBO[] = [];
  const free = () => {
    for (const f of owned) {
      gl.deleteTexture(f.tex);
      gl.deleteFramebuffer(f.fb);
    }
    owned = [];
  };
  const allocate = () => {
    free();
    const sim = sizeFor(opts.simResolution ?? (low ? 64 : 128));
    const dyeS = sizeFor(opts.dyeResolution ?? (low ? 384 : 768));
    velocity = createDouble(sim.w, sim.h, gl.RG16F, gl.RG);
    dye = createDouble(dyeS.w, dyeS.h, gl.RGBA16F, gl.RGBA);
    pressure = createDouble(sim.w, sim.h, gl.R16F, gl.RED);
    divergence = createFBO(sim.w, sim.h, gl.R16F, gl.RED);
    curl = createFBO(sim.w, sim.h, gl.R16F, gl.RED);
  };

  const blit = (target: FBO | null) => {
    if (target) {
      gl.viewport(0, 0, target.w, target.h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb);
    } else {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };
  const bindTex = (unit: number, tex: WebGLTexture) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    return unit;
  };
  const texel = (f: FBO): [number, number] => [1 / f.w, 1 / f.h];

  const splat = (x: number, y: number, dx: number, dy: number, color: [number, number, number]) => {
    const aspect = canvas.width / Math.max(canvas.height, 1);
    const radius = ((opts.splatRadius ?? 0.22) / 100) * (aspect > 1 ? aspect : 1);
    const s: Pass = passes.splat.use();
    s.set('uTexel', texel(velocity.read))
      .setInt('uTarget', bindTex(0, velocity.read.tex))
      .set('uAspect', aspect)
      .set('uPoint', [x, y])
      .set('uColor', [dx, dy, 0])
      .set('uRadius', radius);
    blit(velocity.write);
    velocity.swap();
    s.setInt('uTarget', bindTex(0, dye.read.tex)).set('uColor', color);
    blit(dye.write);
    dye.swap();
  };

  let hue = Math.random();
  const inkColor = (): [number, number, number] => {
    // Slow hue drift: neighbouring splats share a color instead of mixing into mud.
    hue += 0.004;
    const [r, g, b] = sampleGradient(hue, opts.colors ?? DEFAULT_COLORS);
    const k = (opts.intensity ?? 0.65) * 0.12;
    return [(r / 255) * k, (g / 255) * k, (b / 255) * k];
  };

  const step = (dt: number) => {
    gl.disable(gl.BLEND);
    const t = texel(velocity.read);
    passes.curl.use().set('uTexel', t).setInt('uVelocity', bindTex(0, velocity.read.tex));
    blit(curl);
    passes.vorticity
      .use()
      .set('uTexel', t)
      .setInt('uVelocity', bindTex(0, velocity.read.tex))
      .setInt('uCurl', bindTex(1, curl.tex))
      .set('uCurlStrength', opts.curl ?? 18)
      .set('uDt', dt);
    blit(velocity.write);
    velocity.swap();
    passes.divergence.use().set('uTexel', t).setInt('uVelocity', bindTex(0, velocity.read.tex));
    blit(divergence);
    passes.clear
      .use()
      .set('uTexel', t)
      .setInt('uTexture', bindTex(0, pressure.read.tex))
      .set('uValue', 0.8);
    blit(pressure.write);
    pressure.swap();
    const p = passes.pressure
      .use()
      .set('uTexel', t)
      .setInt('uDivergence', bindTex(1, divergence.tex));
    const iterations = opts.pressureIterations ?? (low ? 10 : 20);
    for (let i = 0; i < iterations; i++) {
      p.setInt('uPressure', bindTex(0, pressure.read.tex));
      blit(pressure.write);
      pressure.swap();
    }
    passes.gradient
      .use()
      .set('uTexel', t)
      .setInt('uPressure', bindTex(0, pressure.read.tex))
      .setInt('uVelocity', bindTex(1, velocity.read.tex));
    blit(velocity.write);
    velocity.swap();
    const adv = passes.advect.use().set('uTexel', t).set('uDt', dt);
    adv
      .setInt('uVelocity', bindTex(0, velocity.read.tex))
      .setInt('uSource', bindTex(0, velocity.read.tex))
      .set('uDissipation', opts.velocityDissipation ?? 0.2);
    blit(velocity.write);
    velocity.swap();
    adv
      .setInt('uVelocity', bindTex(0, velocity.read.tex))
      .setInt('uSource', bindTex(1, dye.read.tex))
      .set('uDissipation', (1 - (opts.dissipation ?? 0.92)) * 6);
    blit(dye.write);
    dye.swap();
  };

  const bg = () => {
    if (!opts.background) return [0, 0, 0, 0] as [number, number, number, number];
    const n = parseInt(opts.background.replace('#', ''), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1] as [
      number,
      number,
      number,
      number,
    ];
  };

  const pointer = canvasPointer(canvas, 0.5);
  let lastX = 0.5;
  let lastY = 0.5;
  let ambientT = 0;
  let allocated = false;

  const loop = canvasLoop(canvas, {
    resolution: 1,
    onResize: () => {
      allocate();
      allocated = true;
      // A few opening splats so it never starts empty.
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2;
        splat(
          0.3 + Math.random() * 0.4,
          0.3 + Math.random() * 0.4,
          Math.cos(a) * 600,
          Math.sin(a) * 600,
          inkColor(),
        );
      }
    },
    render: (_time, delta) => {
      if (!allocated) return;
      const dt = Math.min(delta || 1 / 60, 1 / 30);
      pointer.step(dt);
      const { x, y } = pointer.state;
      const dx = x - lastX;
      const dy = y - lastY;
      if (pointer.state.presence > 0.05 && (Math.abs(dx) > 1e-4 || Math.abs(dy) > 1e-4)) {
        const f = opts.splatForce ?? 5200;
        splat(x, y, dx * f, dy * f, inkColor());
      }
      lastX = x;
      lastY = y;
      if (opts.ambient !== false) {
        ambientT += dt;
        if (ambientT > 1.6) {
          ambientT = 0;
          const a = Math.random() * Math.PI * 2;
          hue += 0.12;
          splat(
            0.15 + Math.random() * 0.7,
            0.15 + Math.random() * 0.7,
            Math.cos(a) * 400,
            Math.sin(a) * 400,
            inkColor(),
          );
        }
      }
      if (!prefersReducedMotion()) step(dt);
      passes.display
        .use()
        .set('uTexel', [1 / canvas.width, 1 / canvas.height])
        .set('uBg', bg())
        .setInt('uTexture', bindTex(0, dye.read.tex));
      blit(null);
    },
  });

  return {
    /** Adds ink and force at a point (UV 0..1, y up). */
    splat(x: number, y: number, dx = 0, dy = 0) {
      splat(x, y, dx, dy, inkColor());
    },
    update(next: Partial<FluidOptions>) {
      const realloc = next.simResolution !== undefined || next.dyeResolution !== undefined;
      opts = { ...opts, ...next };
      if (realloc) allocate();
    },
    destroy() {
      loop.destroy();
      pointer.destroy();
      free();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
