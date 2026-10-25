import { isBrowser } from '../env';
import { prefersReducedMotion } from '../motion';
import { observeVisibility } from '../observe';
import { onPointerMove } from '../pointer';
import { stepSpring } from './goo';
import { inertInstance, type EffectInstance } from './types';

export type MockupDevice = 'iphone' | 'galaxy' | 'laptop';

/**
 * A device described as plain data, so React and vanilla JS build exactly the same markup.
 * `slot` marks the node your screen content goes into.
 */
export interface MockupNode {
  /** Class name. */
  c: string;
  /** Inline styles. */
  s?: Record<string, string>;
  /** Children. */
  k?: MockupNode[];
  /** Text content. */
  t?: string;
  /** Static, trusted markup (status bar icons). */
  h?: string;
  /** Decorative: hidden from assistive technology. */
  a?: boolean;
  slot?: boolean;
}

export interface MockupTreeOptions {
  /** Status bar over the screen (phones). Default true. */
  statusBar?: boolean;
  /** Clock text in the status bar. Default "9:41". */
  time?: string;
}

interface Box {
  w: number;
  h: number;
  d: number;
  r: number;
  seg: number;
}

/** Design size of each device, in CSS px at scale 1. The screen is its real CSS resolution. */
export const MOCKUP_SPECS = {
  iphone: { w: 426, h: 868, d: 42, r: 70, seg: 8, bezel: 16, screenR: 55 },
  galaxy: { w: 420, h: 872, d: 38, r: 44, seg: 6, bezel: 12, screenR: 34 },
  laptop: {
    lid: { w: 1380, h: 900, d: 12, r: 26, seg: 6 },
    base: { w: 1440, h: 960, d: 26, r: 30, seg: 6 },
    stageW: 1780,
    stageH: 1320,
  },
} as const;

/** Size of the stage (the device plus room to rotate), in design px. */
export function mockupStage(device: MockupDevice): { w: number; h: number } {
  if (device === 'laptop') return { w: MOCKUP_SPECS.laptop.stageW, h: MOCKUP_SPECS.laptop.stageH };
  const s = MOCKUP_SPECS[device];
  return { w: s.w + 50, h: s.h + 110 };
}

const px = (n: number) => `${Math.round(n * 100) / 100}px`;
const DEG = Math.PI / 180;

/**
 * A rounded slab: front and back faces plus a ring of thin strips for the rounded sides.
 * Each strip is shaded by which way it faces (light from the top left), so the frame reads
 * as solid metal from any angle — about 30 small planes instead of a heavy WebGL mesh.
 */
function slab(b: Box, front: MockupNode, back: MockupNode, extra: MockupNode[] = []): MockupNode[] {
  const face = (node: MockupNode, transform: string): MockupNode => ({
    ...node,
    c: `vz-m-face ${node.c}`,
    s: {
      width: px(b.w),
      height: px(b.h),
      left: px(-b.w / 2),
      top: px(-b.h / 2),
      borderRadius: px(b.r),
      transform,
      ...node.s,
    },
  });
  const nodes: MockupNode[] = [];
  const strip = (x: number, y: number, len: number, normal: number) => {
    const light = Math.cos((normal + 135) * DEG);
    const mix = Math.round(light * 34);
    const l = len + 0.8;
    nodes.push({
      c: 'vz-m-edge',
      s: {
        width: px(l),
        height: px(b.d),
        left: px(-l / 2),
        top: px(-b.d / 2),
        transform: `translate3d(${px(x)},${px(y)},0) rotateZ(${(normal + 90).toFixed(2)}deg) rotateX(-90deg)`,
        backgroundColor: `color-mix(in oklab, var(--vz-m-frame), ${mix >= 0 ? '#fff' : '#000'} ${Math.abs(mix)}%)`,
      },
    });
  };
  const hw = b.w / 2;
  const hh = b.h / 2;
  strip(0, -hh, b.w - 2 * b.r, -90);
  strip(hw, 0, b.h - 2 * b.r, 0);
  strip(0, hh, b.w - 2 * b.r, 90);
  strip(-hw, 0, b.h - 2 * b.r, 180);
  const corners: [number, number, number][] = [
    [hw - b.r, hh - b.r, 0],
    [-hw + b.r, hh - b.r, 90],
    [-hw + b.r, -hh + b.r, 180],
    [hw - b.r, -hh + b.r, 270],
  ];
  const step = 90 / b.seg;
  for (const [cx, cy, start] of corners) {
    for (let i = 0; i < b.seg; i++) {
      const a = start + step * (i + 0.5);
      // Chord midpoints, so neighbouring strips meet edge to edge.
      const dist = b.r * Math.cos((step / 2) * DEG);
      strip(
        cx + dist * Math.cos(a * DEG),
        cy + dist * Math.sin(a * DEG),
        2 * b.r * Math.sin((step / 2) * DEG),
        a,
      );
    }
  }
  return [
    face(front, `translateZ(${px(b.d / 2)})`),
    face(back, `rotateY(180deg) translateZ(${px(b.d / 2)})`),
    ...nodes,
    ...extra,
  ];
}

/** A side button: a short plane standing just proud of the frame. */
const button = (b: Box, side: 1 | -1, top: number, len: number): MockupNode => ({
  c: 'vz-m-btn',
  s: {
    width: px(len),
    height: px(b.d * 0.42),
    left: px(-len / 2),
    top: px((-b.d * 0.42) / 2),
    transform: `translate3d(${px(side * (b.w / 2 + 2.5))},${px(-b.h / 2 + top + len / 2)},0) rotateZ(90deg) rotateX(-90deg)`,
  },
});

const ICONS =
  '<svg viewBox="0 0 74 14" width="74" height="14" fill="currentColor" aria-hidden="true">' +
  '<rect x="0" y="9" width="3.2" height="4.5" rx="1"/><rect x="5" y="6.5" width="3.2" height="7" rx="1"/>' +
  '<rect x="10" y="4" width="3.2" height="9.5" rx="1"/><rect x="15" y="1" width="3.2" height="12.5" rx="1"/>' +
  '<path d="M33 3.2a11 11 0 0 1 8 3.3l1.5-1.6a13.2 13.2 0 0 0-19 0l1.5 1.6a11 11 0 0 1 8-3.3zm0 4a6.8 6.8 0 0 1 4.9 2l1.6-1.6a9 9 0 0 0-13 0l1.6 1.6a6.8 6.8 0 0 1 4.9-2zm0 4.1-2.4 2.4 2.4 2.3 2.4-2.3z"/>' +
  '<rect x="48.5" y="1.5" width="22" height="11" rx="3.4" fill="none" stroke="currentColor" stroke-opacity=".45"/>' +
  '<rect x="50.5" y="3.5" width="15" height="7" rx="1.8"/><rect x="71.5" y="5" width="1.6" height="4" rx=".8" fill-opacity=".45"/></svg>';

function phone(device: 'iphone' | 'galaxy', o: MockupTreeOptions): MockupNode[] {
  const s = MOCKUP_SPECS[device];
  const b: Box = s;
  const iphone = device === 'iphone';
  const screen: MockupNode = {
    c: 'vz-m-screen',
    s: { inset: px(s.bezel), borderRadius: px(s.screenR) },
    k: [
      { c: 'vz-mockup-content', slot: true },
      ...(o.statusBar === false
        ? []
        : [
            {
              c: 'vz-m-status',
              k: [
                { c: 'vz-m-time', t: o.time ?? (iphone ? '9:41' : '12:45') },
                { c: 'vz-m-icons', h: ICONS },
              ],
            },
          ]),
      { c: iphone ? 'vz-m-island' : 'vz-m-punch' },
      { c: 'vz-m-home' },
      { c: 'vz-m-glare' },
    ],
  };
  const lens = (n: number): MockupNode => ({ c: `vz-m-lens vz-m-lens-${n}` });
  const back: MockupNode = {
    c: 'vz-m-back',
    k: [
      {
        c: 'vz-m-bump',
        k: [
          lens(1),
          lens(2),
          lens(3),
          { c: 'vz-m-flash' },
          ...(iphone ? [{ c: 'vz-m-lidar' }] : []),
        ],
      },
    ],
  };
  const buttons = iphone
    ? [
        button(b, -1, 168, 36),
        button(b, -1, 238, 66),
        button(b, -1, 318, 66),
        button(b, 1, 268, 102),
      ]
    : [button(b, 1, 214, 130), button(b, 1, 372, 70)];
  return slab(b, { c: 'vz-m-glass', k: [screen] }, back, buttons);
}

const KEY_ROWS = [
  [1.5, ...Array<number>(12).fill(1), 1.5],
  [...Array<number>(13).fill(1), 2],
  [1.5, ...Array<number>(12).fill(1), 1.5],
  [1.8, ...Array<number>(11).fill(1), 2.2],
  [2.3, ...Array<number>(10).fill(1), 2.7],
  [1, 1, 1, 1.3, 5.4, 1.3, 1, 1, 1, 1],
];

function laptop(): MockupNode[] {
  const { lid, base } = MOCKUP_SPECS.laptop;
  const keys: MockupNode = {
    c: 'vz-m-keys',
    k: KEY_ROWS.map((row, r) => ({
      c: r === 0 ? 'vz-m-row vz-m-row-f' : 'vz-m-row',
      k: row.map((g) => ({ c: 'vz-m-key', s: { flexGrow: String(g) } })),
    })),
  };
  const deck: MockupNode = {
    c: 'vz-m-deck',
    k: [
      { c: 'vz-m-speaker vz-m-speaker-l' },
      keys,
      { c: 'vz-m-speaker vz-m-speaker-r' },
      { c: 'vz-m-pad' },
      { c: 'vz-m-notch' },
    ],
  };
  const screen: MockupNode = {
    c: 'vz-m-bezel',
    k: [
      { c: 'vz-m-cam' },
      {
        c: 'vz-m-screen',
        k: [{ c: 'vz-mockup-content', slot: true }, { c: 'vz-m-glare' }],
      },
    ],
  };
  return [
    {
      c: 'vz-m-base',
      s: { transform: `translateY(${px(base.d / 2)}) rotateX(90deg)` },
      k: slab(base, deck, { c: 'vz-m-under' }),
    },
    {
      c: 'vz-m-lid',
      // Hinged on its bottom edge, a little in from the back of the base; --vz-lid is the
      // opening angle in degrees (0 = closed, 90 = upright).
      s: {
        transform: `translateZ(${px(-base.h / 2 + 18)}) rotateX(calc(var(--vz-lid, 108) * 1deg - 90deg)) translateY(${px(-lid.h / 2)}) translateZ(${px(-lid.d / 2)})`,
      },
      k: slab(lid, screen, { c: 'vz-m-lidback', k: [{ c: 'vz-m-emblem' }] }),
    },
  ];
}

// Everything except the path down to the screen content is decoration.
const hasSlot = (n: MockupNode): boolean => !!n.slot || !!n.k?.some(hasSlot);
function mark(n: MockupNode): MockupNode {
  if (!hasSlot(n)) return { ...n, a: true };
  return n.k ? { ...n, k: n.k.map(mark) } : n;
}

/** The device as data: a shadow plus a 3D stage. Your content goes into the `slot` node. */
export function mockupTree(device: MockupDevice, options: MockupTreeOptions = {}): MockupNode[] {
  const stage = mockupStage(device);
  return (
    [
      { c: 'vz-m-shadow' },
      {
        c: 'vz-m-stage',
        s: { width: px(stage.w), height: px(stage.h) },
        k: [{ c: 'vz-m-body', k: device === 'laptop' ? laptop() : phone(device, options) }],
      },
    ] as MockupNode[]
  ).map(mark);
}

export interface MockupOptions {
  /** Resting angle `[rotateX, rotateY]` in degrees. */
  rotate?: readonly [number, number];
  /** How far (deg) it turns toward the pointer. 0 disables. Default 8. */
  tilt?: number;
  /** Drag the frame to spin it; it settles back on a spring. Default true. */
  drag?: boolean;
  /** Gently float and sway. Default true for phones, false for the laptop. */
  float?: boolean;
  /** Laptop lid angle in degrees; it opens to this when scrolled into view. Default 108. */
  open?: number;
}

const DEFAULT_ROTATE: Record<MockupDevice, readonly [number, number]> = {
  iphone: [-3, -20],
  galaxy: [-3, 20],
  laptop: [-15, -9],
};

/**
 * Brings a device mockup to life: fits it to its container, turns it toward the pointer,
 * lets you spin it by dragging the frame (it settles back with inertia), floats it, and opens
 * the laptop lid when it scrolls into view. Builds the markup itself when given an empty
 * element with `data-vz-device`; the element's children become the screen content.
 * Runs only while visible, and only animates what changed.
 */
export function mockup(
  el: HTMLElement,
  options: MockupOptions = {},
): EffectInstance<MockupOptions> {
  if (!isBrowser) return inertInstance();
  let opts = options;
  const device = (el.dataset.vzDevice as MockupDevice) || 'iphone';
  el.classList.add('vz-mockup');

  // Vanilla usage: build the device and move the element's children onto the screen.
  let moved: Node[] | null = null;
  if (!el.querySelector('.vz-m-body')) {
    moved = Array.from(el.childNodes);
    const build = (n: MockupNode): HTMLElement => {
      const node = document.createElement('div');
      node.className = n.c;
      if (n.s)
        for (const [k, v] of Object.entries(n.s))
          node.style.setProperty(
            k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()),
            v,
          );
      if (n.t) node.textContent = n.t;
      if (n.h) node.innerHTML = n.h;
      if (n.a) node.setAttribute('aria-hidden', 'true');
      if (n.slot) node.append(...moved!);
      n.k?.forEach((c) => node.appendChild(build(c)));
      return node;
    };
    mockupTree(device).forEach((n) => el.appendChild(build(n)));
  }

  const stage = el.querySelector<HTMLElement>('.vz-m-stage')!;
  const body = el.querySelector<HTMLElement>('.vz-m-body')!;
  const lid = el.querySelector<HTMLElement>('.vz-m-lid');
  const shadow = el.querySelector<HTMLElement>('.vz-m-shadow');
  const glares = Array.from(el.querySelectorAll<HTMLElement>('.vz-m-glare'));
  const size = mockupStage(device);
  const reduced = prefersReducedMotion();
  const laptopDevice = device === 'laptop';

  if (!el.style.aspectRatio) el.style.aspectRatio = `${size.w} / ${size.h}`;
  const fit = () => {
    const w = el.clientWidth;
    if (!w) return;
    el.style.setProperty('--vz-m-scale', String(w / size.w));
    el.style.perspective = `${Math.round(w * (laptopDevice ? 2.6 : 3.4))}px`;
  };

  const base = () => opts.rotate ?? DEFAULT_ROTATE[device];
  const rx = { x: base()[0], v: 0 };
  const ry = { x: base()[1], v: 0 };
  const openTo = () => opts.open ?? 108;
  const lidAngle = { x: laptopDevice && !reduced ? 0 : openTo(), v: 0 };
  let lidOpen = !laptopDevice || reduced;
  let pointer: { nx: number; ny: number } | null = null;
  let dragging: { x: number; y: number; ry: number; rx: number; t: number; vx: number } | null =
    null;
  let spinRest = 0; // full turns already spun, so a fling settles on the nearest whole turn
  let visible = false;
  let raf = 0;
  let last = 0;
  let clock = Math.random() * 10;

  const tick = (now: number) => {
    raf = 0;
    const dt = Math.min(0.032, (now - (last || now)) / 1000) || 1 / 60;
    last = now;
    clock += dt;
    const [bx, by] = base();
    const tiltDeg = reduced ? 0 : (opts.tilt ?? 8);
    const floating = !reduced && (opts.float ?? !laptopDevice);
    let moving = false;

    if (!dragging) {
      const tx =
        bx -
        (pointer ? pointer.ny * tiltDeg * 0.7 : 0) +
        (floating ? Math.sin(clock * 0.9) * 1.2 : 0);
      const ty =
        by +
        spinRest +
        (pointer ? pointer.nx * tiltDeg : 0) +
        (floating ? Math.sin(clock * 0.55) * 2.5 : 0);
      moving = stepSpring(rx, tx, dt, 90, 14) || moving;
      moving = stepSpring(ry, ty, dt, 70, 11) || moving;
    }
    if (lid) {
      moving = stepSpring(lidAngle, lidOpen ? openTo() : 0, dt, 60, 13) || moving;
      lid.style.setProperty('--vz-lid', lidAngle.x.toFixed(2));
    }
    const fy = floating ? Math.sin(clock * 1.1) * 10 : 0;
    body.style.transform = `translateY(${fy.toFixed(2)}px) rotateX(${rx.x.toFixed(2)}deg) rotateY(${ry.x.toFixed(2)}deg)`;
    // Reflections slide across the glass as it turns.
    const turn = ((((ry.x % 360) + 540) % 360) - 180) / 40;
    for (const g of glares) g.style.setProperty('--vz-m-gx', (turn * 22).toFixed(1));
    if (shadow) {
      const lift = (fy + 10) / 20;
      shadow.style.transform = `translateX(${(-turn * 4).toFixed(1)}%) scale(${(1 - lift * 0.12).toFixed(3)}, ${(1 - lift * 0.18).toFixed(3)})`;
      shadow.style.opacity = (0.95 - lift * 0.3).toFixed(2);
    }
    if (visible && (moving || floating || pointer || dragging)) raf = requestAnimationFrame(tick);
    else last = 0;
  };
  const kick = () => {
    if (!raf && visible) raf = requestAnimationFrame(tick);
  };

  const stopVisibility = observeVisibility(
    el,
    (v) => {
      visible = v;
      if (v && !lidOpen) setTimeout(() => ((lidOpen = true), kick()), 250);
      kick();
    },
    { amount: 0.25 },
  );

  const stopPointer = onPointerMove((p) => {
    if (dragging) return;
    const r = el.getBoundingClientRect();
    const padX = r.width * 0.35;
    const padY = r.height * 0.25;
    const inside =
      p.active &&
      p.type !== 'touch' &&
      p.x > r.left - padX &&
      p.x < r.right + padX &&
      p.y > r.top - padY &&
      p.y < r.bottom + padY;
    const was = pointer;
    pointer = inside
      ? {
          nx: Math.max(-1, Math.min(1, (p.x - r.left - r.width / 2) / (r.width / 2 + padX))),
          ny: Math.max(-1, Math.min(1, (p.y - r.top - r.height / 2) / (r.height / 2 + padY))),
        }
      : null;
    if (pointer || was) kick();
  });

  // Dragging the frame spins the device. The screen stays usable: presses on it are ignored.
  const onDown = (e: PointerEvent) => {
    if (opts.drag === false || e.button !== 0) return;
    if ((e.target as Element).closest('.vz-mockup-content')) return;
    el.setPointerCapture?.(e.pointerId);
    dragging = { x: e.clientX, y: e.clientY, ry: ry.x, rx: rx.x, t: performance.now(), vx: 0 };
    el.dataset.vzDragging = '';
    kick();
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    const now = performance.now();
    const k = 220 / Math.max(el.clientWidth, 120);
    const next = dragging.ry + (e.clientX - dragging.x) * k;
    const dtm = Math.max(now - dragging.t, 1) / 1000;
    dragging.vx = dragging.vx * 0.6 + ((next - ry.x) / dtm) * 0.4;
    dragging.t = now;
    ry.x = next;
    rx.x = Math.max(-35, Math.min(35, dragging.rx - (e.clientY - dragging.y) * k * 0.4));
  };
  const onUp = () => {
    if (!dragging) return;
    // Settle on the whole turn the fling is heading for.
    const projected = ry.x + dragging.vx * 0.35 - base()[1];
    spinRest = Math.round(projected / 360) * 360;
    ry.v = reduced ? 0 : dragging.vx;
    if (reduced) ry.x = base()[1] + spinRest;
    dragging = null;
    delete el.dataset.vzDragging;
    kick();
  };
  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);

  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
  ro?.observe(el);
  fit();
  tick(performance.now());
  stage.dataset.vzReady = '';

  return {
    update(next) {
      opts = { ...opts, ...next };
      kick();
    },
    destroy() {
      cancelAnimationFrame(raf);
      stopVisibility();
      stopPointer();
      ro?.disconnect();
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      if (moved) {
        el.replaceChildren(...moved);
        el.classList.remove('vz-mockup');
      } else body.style.transform = '';
    },
  };
}
