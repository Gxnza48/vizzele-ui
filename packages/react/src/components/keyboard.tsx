import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent,
} from 'react';
import { frame, prefersReducedMotion } from '@vizzele/core';
import { cx, useLatest } from '../hooks/utils';

// ——————————————————————————— Layouts ———————————————————————————

interface KeyDef {
  code: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A key: [code, label, width = 1, height = 1]. A number is an empty gap of that width. */
type Item = [string, string, number?, number?] | number;

/** Lays a row of keys out from (x, y), in key units. */
const row = (items: Item[], x: number, y: number): KeyDef[] => {
  const out: KeyDef[] = [];
  for (const it of items) {
    if (typeof it === 'number') {
      x += it;
      continue;
    }
    const [code, label, w = 1, h = 1] = it;
    out.push({ code, label, x, y, w, h });
    x += w;
  }
  return out;
};

const letters = (s: string): Item[] => Array.from(s, (c) => [`Key${c}`, c]);
const digits: Item[] = Array.from('1234567890', (d) => [`Digit${d}`, d]);

const R0: Item[] = [['Backquote', '`'], ...digits, ['Minus', '-'], ['Equal', '=']];
const R1: Item[] = [
  ['Tab', 'Tab', 1.5],
  ...letters('QWERTYUIOP'),
  ['BracketLeft', '['],
  ['BracketRight', ']'],
];
const R2: Item[] = [
  ['CapsLock', 'Caps', 1.75],
  ...letters('ASDFGHJKL'),
  ['Semicolon', ';'],
  ['Quote', "'"],
];
const R3: Item[] = [
  ['ShiftLeft', 'Shift', 2.25],
  ...letters('ZXCVBNM'),
  ['Comma', ','],
  ['Period', '.'],
  ['Slash', '/'],
];
const MODS: Item[] = [
  ['ControlLeft', 'Ctrl', 1.25],
  ['MetaLeft', '❖', 1.25],
  ['AltLeft', 'Alt', 1.25],
  ['Space', '', 6.25],
];
const BOTTOM_60: Item[] = [
  ...MODS,
  ['AltRight', 'Alt', 1.25],
  ['MetaRight', '❖', 1.25],
  ['ContextMenu', 'Menu', 1.25],
  ['ControlRight', 'Ctrl', 1.25],
];
/** The 60% block, 15 × 5 units. */
const alpha = (y: number) => [
  ...row([...R0, ['Backspace', '⌫', 2]], 0, y),
  ...row([...R1, ['Backslash', '\\', 1.5]], 0, y + 1),
  ...row([...R2, ['Enter', 'Enter', 2.25]], 0, y + 2),
  ...row([...R3, ['ShiftRight', 'Shift', 2.75]], 0, y + 3),
];
const fn = (n: number[]): Item[] => n.map((i) => [`F${i}`, `F${i}`]);
const fRow = (): KeyDef[] =>
  row(
    [
      ['Escape', 'Esc'],
      1,
      ...fn([1, 2, 3, 4]),
      0.5,
      ...fn([5, 6, 7, 8]),
      0.5,
      ...fn([9, 10, 11, 12]),
      0.25,
      ['PrintScreen', 'PrtSc'],
      ['ScrollLock', 'ScrLk'],
      ['Pause', 'Pause'],
    ],
    0,
    0,
  );
const tkl = (): KeyDef[] => [
  ...fRow(),
  ...alpha(1.25),
  ...row(BOTTOM_60, 0, 5.25),
  ...row(
    [
      ['Insert', 'Ins'],
      ['Home', 'Home'],
      ['PageUp', 'PgUp'],
    ],
    15.25,
    1.25,
  ),
  ...row(
    [
      ['Delete', 'Del'],
      ['End', 'End'],
      ['PageDown', 'PgDn'],
    ],
    15.25,
    2.25,
  ),
  ...row([['ArrowUp', '↑']], 16.25, 4.25),
  ...row(
    [
      ['ArrowLeft', '←'],
      ['ArrowDown', '↓'],
      ['ArrowRight', '→'],
    ],
    15.25,
    5.25,
  ),
];

export type KeyboardLayout = 'full' | 'tkl' | '68' | '60';

const LAYOUTS: Record<KeyboardLayout, () => { keys: KeyDef[]; cols: number; rows: number }> = {
  '60': () => ({ keys: [...alpha(0), ...row(BOTTOM_60, 0, 4)], cols: 15, rows: 5 }),
  '68': () => ({
    keys: [
      ...row([...R0, ['Backspace', '⌫', 2], ['Delete', 'Del']], 0, 0),
      ...row([...R1, ['Backslash', '\\', 1.5], ['PageUp', 'PgUp']], 0, 1),
      ...row([...R2, ['Enter', 'Enter', 2.25], ['PageDown', 'PgDn']], 0, 2),
      ...row([...R3, ['ShiftRight', 'Shift', 1.75], ['ArrowUp', '↑'], ['End', 'End']], 0, 3),
      ...row(
        [
          ...MODS,
          ['AltRight', 'Alt'],
          ['Fn', 'Fn'],
          ['ControlRight', 'Ctrl'],
          ['ArrowLeft', '←'],
          ['ArrowDown', '↓'],
          ['ArrowRight', '→'],
        ],
        0,
        4,
      ),
    ],
    cols: 16,
    rows: 5,
  }),
  tkl: () => ({ keys: tkl(), cols: 18.25, rows: 6.25 }),
  full: () => ({
    keys: [
      ...tkl(),
      ...row(
        [
          ['NumLock', 'Num'],
          ['NumpadDivide', '/'],
          ['NumpadMultiply', '*'],
          ['NumpadSubtract', '-'],
        ],
        18.5,
        1.25,
      ),
      ...row(
        [
          ['Numpad7', '7'],
          ['Numpad8', '8'],
          ['Numpad9', '9'],
          ['NumpadAdd', '+', 1, 2],
        ],
        18.5,
        2.25,
      ),
      ...row(
        [
          ['Numpad4', '4'],
          ['Numpad5', '5'],
          ['Numpad6', '6'],
        ],
        18.5,
        3.25,
      ),
      ...row(
        [
          ['Numpad1', '1'],
          ['Numpad2', '2'],
          ['Numpad3', '3'],
          ['NumpadEnter', 'Ent', 1, 2],
        ],
        18.5,
        4.25,
      ),
      ...row(
        [
          ['Numpad0', '0', 2],
          ['NumpadDecimal', '.'],
        ],
        18.5,
        5.25,
      ),
    ],
    cols: 22.5,
    rows: 6.25,
  }),
};

/** What a click on a key types; undefined for keys that type nothing. */
function charFor(code: string, label: string, upper: boolean): string | undefined {
  if (code === 'Space') return ' ';
  if (code.startsWith('Key')) return upper ? label : label.toLowerCase();
  if (label.length === 1 && !/[←→↑↓⌫❖]/.test(label)) return label;
  return undefined;
}

// ——————————————————————————— Sound ———————————————————————————

/** A synthesised "thock": a short pitched body plus a soft filtered click. No samples. */
function makeThock() {
  let ctx: AudioContext | null = null;
  let noise: AudioBuffer | null = null;
  return (width: number, volume: number, down: boolean) => {
    const AC = typeof window === 'undefined' ? undefined : window.AudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (!noise) {
      noise = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2;
    }
    const t = ctx.currentTime;
    const v = volume * (down ? 1 : 0.45);
    const pitch = (down ? 150 : 230) / Math.sqrt(width) + Math.random() * 18;
    const body = ctx.createOscillator();
    body.type = 'triangle';
    body.frequency.setValueAtTime(pitch, t);
    body.frequency.exponentialRampToValueAtTime(pitch * 0.55, t + 0.06);
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(0.0001, t);
    bg.gain.exponentialRampToValueAtTime(0.5 * v, t + 0.004);
    bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    body.connect(bg).connect(ctx.destination);
    body.start(t);
    body.stop(t + 0.1);
    const click = ctx.createBufferSource();
    click.buffer = noise;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = down ? 1800 : 2600;
    const cg = ctx.createGain();
    cg.gain.value = 0.35 * v;
    click.connect(lp).connect(cg).connect(ctx.destination);
    click.start(t);
  };
}

// ——————————————————————————— Mechanical keyboard ———————————————————————————

export interface MechanicalKeyboardProps extends HTMLAttributes<HTMLDivElement> {
  /** 'full' (100%), 'tkl', '68' (65%) or '60'. Default 'tkl'. */
  layout?: KeyboardLayout;
  /** Underglow: a rainbow wave, a slow breathe, fixed colours, only on press, or none. Default 'wave'. */
  rgb?: 'wave' | 'breathe' | 'static' | 'reactive' | 'off';
  /** Keycap set. Default 'graphite'. */
  keycaps?: 'graphite' | 'milk' | 'lavender' | 'retro';
  /** Synthesised thock on every press. Default false. */
  sound?: boolean;
  /** 0–1. Default 0.6. */
  volume?: number;
  /** Show a text field above the board that drives it. Default true. */
  input?: boolean;
  placeholder?: string;
  /** Accessible name of the text field. Default "Type to play the keyboard". */
  inputLabel?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** React to keys typed in the field only, or anywhere on the page. Default 'input' (or 'window' without a field). */
  listen?: 'input' | 'window';
  /** Called with the KeyboardEvent.code of every press. */
  onKeyHit?: (code: string) => void;
  /** Lean the board back a little. Default true. */
  tilt?: boolean;
}

/**
 * A mechanical keyboard you can play: creamy keycaps that sink and spring back, RGB underglow
 * that runs in a wave and ripples out from every press, and an optional synthesised thock. Type
 * in the field above it — or click the keys — and it reacts. Full, TKL, 65% (68) or 60%.
 */
export const MechanicalKeyboard = /* @__PURE__ */ forwardRef<
  HTMLDivElement,
  MechanicalKeyboardProps
>(function MechanicalKeyboard(
  {
    layout = 'tkl',
    rgb = 'wave',
    keycaps = 'graphite',
    sound = false,
    volume = 0.6,
    input = true,
    placeholder = 'Start typing…',
    inputLabel = 'Type to play the keyboard',
    value: valueProp,
    defaultValue = '',
    onValueChange,
    listen,
    onKeyHit,
    tilt = true,
    className,
    style,
    ...rest
  },
  ref,
) {
  const { keys, cols, rows } = useMemo(() => LAYOUTS[layout](), [layout]);
  const [inner, setInner] = useState(defaultValue);
  const text = valueProp ?? inner;
  const [caps, setCaps] = useState(false);
  const board = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const thock = useMemo(makeThock, []);
  const opts = useLatest({ sound, volume, rgb, onKeyHit });
  const api = useRef<{ press: (code: string) => void; release: (code: string) => void }>(null);
  const shift = useRef(false);

  const setText = (v: string) => {
    setInner(v);
    onValueChange?.(v);
  };

  // Presses, releases and the light ripple each one sends across the plate.
  useEffect(() => {
    const el = board.current;
    if (!el) return;
    const nodes = new Map<string, HTMLElement[]>();
    el.querySelectorAll<HTMLElement>('[data-code]').forEach((n) => {
      const list = nodes.get(n.dataset.code!) ?? [];
      list.push(n);
      nodes.set(n.dataset.code!, list);
    });
    const centres = keys.map((k) => [k.x + k.w / 2, k.y + k.h / 2] as const);
    const all = Array.from(el.querySelectorAll<HTMLElement>('.vz-kb-led'));
    // Only touch the lights whose level actually changed: most of the plate sits at 0.
    const last = new Float64Array(all.length);
    const ripples: { x: number; y: number; t: number }[] = [];
    let stop: (() => void) | null = null;
    const tick = ({ delta }: { delta: number }) => {
      for (const r of ripples) r.t += delta;
      while (ripples.length && ripples[0]!.t > 0.9) ripples.shift();
      all.forEach((n, i) => {
        const [x, y] = centres[i]!;
        let hit = 0;
        for (const r of ripples) {
          const d = Math.hypot(x - r.x, (y - r.y) * 1.2);
          const front = r.t * 16;
          const band = Math.max(0, 1 - Math.abs(d - front) / 1.4) * (1 - r.t / 0.9);
          hit = Math.max(hit, d < 0.8 ? 1 - r.t / 0.9 : band);
        }
        hit = Math.round(hit * 100) / 100;
        if (hit === last[i]) return;
        last[i] = hit;
        n.style.setProperty('--hit', String(hit));
      });
      if (ripples.length) return true;
      stop = null;
      return false;
    };
    const press = (code: string) => {
      const list = nodes.get(code);
      if (!list) return;
      let w = 1;
      list.forEach((n) => {
        n.setAttribute('data-down', '');
        w = Number(n.style.getPropertyValue('--w')) || 1;
      });
      const o = opts.current;
      o.onKeyHit?.(code);
      if (o.sound) thock(w, o.volume, true);
      if (o.rgb === 'off' || prefersReducedMotion()) return;
      const i = keys.findIndex((k) => k.code === code);
      const c = centres[i];
      if (!c) return;
      ripples.push({ x: c[0], y: c[1], t: 0 });
      stop ??= frame.add(tick, 'render');
    };
    const release = (code: string) => {
      const list = nodes.get(code);
      if (!list?.some((n) => n.hasAttribute('data-down'))) return;
      list.forEach((n) => n.removeAttribute('data-down'));
      const o = opts.current;
      if (o.sound) thock(Number(list[0]!.style.getPropertyValue('--w')) || 1, o.volume, false);
    };
    api.current = { press, release };
    return () => {
      stop?.();
      api.current = null;
    };
  }, [keys, opts, thock]);

  // Physical keys: typed in the field, or anywhere on the page.
  const where = listen ?? (input ? 'input' : 'window');
  useEffect(() => {
    const target: HTMLElement | Window | null = where === 'window' ? window : field.current;
    if (!target) return;
    const down = (e: Event) => {
      const k = e as KeyboardEvent;
      setCaps(k.getModifierState?.('CapsLock') ?? false);
      if (!k.repeat) api.current?.press(k.code);
    };
    const up = (e: Event) => {
      const k = e as KeyboardEvent;
      setCaps(k.getModifierState?.('CapsLock') ?? false);
      api.current?.release(k.code);
    };
    const clear = () =>
      board.current
        ?.querySelectorAll('[data-down]')
        .forEach((n) => api.current?.release((n as HTMLElement).dataset.code!));
    target.addEventListener('keydown', down);
    target.addEventListener('keyup', up);
    target.addEventListener('blur', clear);
    return () => {
      target.removeEventListener('keydown', down);
      target.removeEventListener('keyup', up);
      target.removeEventListener('blur', clear);
    };
  }, [where]);

  // Clicking a key presses it and types into the field.
  const onKeyDown = (e: PointerEvent<HTMLDivElement>) => {
    const key = (e.target as HTMLElement).closest<HTMLElement>('[data-code]');
    if (!key) return;
    e.preventDefault(); // keep focus where it is
    const code = key.dataset.code!;
    key.setPointerCapture?.(e.pointerId);
    api.current?.press(code);
    if (!input) return;
    if (code.startsWith('Shift')) shift.current = !shift.current;
    else if (code === 'CapsLock') setCaps((c) => !c);
    else if (code === 'Backspace') setText(text.slice(0, -1));
    else {
      const ch = charFor(code, key.dataset.label ?? '', caps !== shift.current);
      if (ch !== undefined) {
        setText(text + ch);
        shift.current = false;
      }
    }
  };
  const onKeyUp = (e: PointerEvent<HTMLDivElement>) => {
    const key = (e.target as HTMLElement).closest<HTMLElement>('[data-code]');
    if (key) api.current?.release(key.dataset.code!);
  };

  return (
    <div
      ref={ref}
      className={cx('vz-kb', className)}
      data-keycaps={keycaps}
      data-rgb={rgb}
      data-tilt={tilt ? '' : undefined}
      style={{ '--cols': cols, '--rows': rows, ...style } as CSSProperties}
      {...rest}
    >
      {input && (
        <input
          ref={field}
          className="vz-kb-input"
          value={text}
          placeholder={placeholder}
          aria-label={inputLabel}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setText(e.target.value)}
        />
      )}
      <div className="vz-kb-deck">
        <span className="vz-kb-glow" aria-hidden="true" />
        <div className="vz-kb-case">
          <div
            ref={board}
            className="vz-kb-plate"
            aria-hidden="true"
            onPointerDown={onKeyDown}
            onPointerUp={onKeyUp}
            onPointerCancel={onKeyUp}
          >
            {/* All the lights live on one layer that rotates its hue on the GPU: no per-key work. */}
            <div className="vz-kb-leds">
              {keys.map((k) => (
                <span
                  key={k.code}
                  className="vz-kb-led"
                  style={{ '--x': k.x, '--y': k.y, '--w': k.w, '--h': k.h } as CSSProperties}
                />
              ))}
            </div>
            {keys.map((k) => (
              <div
                key={k.code}
                className="vz-kb-key"
                data-code={k.code}
                data-label={k.label}
                data-mod={
                  k.w > 1 || k.label.length > 1 || /[←→↑↓⌫❖]/.test(k.label) ? '' : undefined
                }
                data-accent={k.code === 'Escape' || k.code === 'Enter' ? '' : undefined}
                data-caps={k.code === 'CapsLock' && caps ? '' : undefined}
                style={{ '--x': k.x, '--y': k.y, '--w': k.w, '--h': k.h } as CSSProperties}
              >
                <span className="vz-kb-cap">
                  <span className="vz-kb-top">{k.label}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

// ——————————————————————————— Kbd ———————————————————————————

export interface KbdProps extends HTMLAttributes<HTMLElement> {
  /** Press the cap while this key is held (KeyboardEvent.key or .code, e.g. "k" or "MetaLeft"). */
  listen?: string;
}

/** A tiny mechanical keycap for shortcuts. Give it `listen` and it presses when you hit the key. */
export const Kbd = /* @__PURE__ */ forwardRef<HTMLElement, KbdProps>(function Kbd(
  { listen, className, children, ...rest },
  ref,
) {
  const [down, setDown] = useState(false);
  useEffect(() => {
    if (!listen) return;
    const want = listen.toLowerCase();
    const match = (e: KeyboardEvent) =>
      e.key?.toLowerCase() === want ||
      e.code?.toLowerCase() === want ||
      (want === 'meta' && e.metaKey) ||
      (want === 'control' && e.ctrlKey);
    const on = (e: KeyboardEvent) => match(e) && setDown(true);
    const off = (e: KeyboardEvent) => match(e) && setDown(false);
    const clear = () => setDown(false);
    window.addEventListener('keydown', on);
    window.addEventListener('keyup', off);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', on);
      window.removeEventListener('keyup', off);
      window.removeEventListener('blur', clear);
    };
  }, [listen]);
  return (
    <kbd ref={ref} className={cx('vz-kbd', className)} data-down={down ? '' : undefined} {...rest}>
      {children}
    </kbd>
  );
});
