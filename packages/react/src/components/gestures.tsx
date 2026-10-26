import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { clamp, frame, gooFilter, prefersReducedMotion, Spring } from '@vizzele/core';
import { cx, useLatest, useMergedRef } from '../hooks/utils';

// ——————————————————————————— Number scrubber ———————————————————————————

export interface NumberScrubberProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue' | 'prefix'
> {
  /** Accessible name and visible label. */
  label: string;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  /** Default 1. Decimals shown follow the step. */
  step?: number;
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Pixels of drag per step. Default 4. */
  pixelsPerStep?: number;
}

const decimals = (step: number) => {
  const s = String(step);
  return s.includes('.') ? s.length - s.indexOf('.') - 1 : 0;
};

/**
 * A number you drag. Pull left or right anywhere on it and the value runs under a sliding ruler;
 * let go mid-flick and it coasts on inertia, stretches like rubber past its limits and springs
 * back. Shift = ×10, Alt = fine. Double-click (or Enter) to type a value. A spinbutton for
 * keyboards and screen readers.
 */
export const NumberScrubber = /* @__PURE__ */ forwardRef<HTMLDivElement, NumberScrubberProps>(
  function NumberScrubber(
    {
      label,
      value: valueProp,
      defaultValue = 0,
      onChange,
      min = -Infinity,
      max = Infinity,
      step = 1,
      prefix,
      suffix,
      pixelsPerStep = 4,
      className,
      style,
      ...rest
    },
    ref,
  ) {
    const [inner, setInner] = useState(defaultValue);
    const value = valueProp ?? inner;
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const root = useRef<HTMLDivElement>(null);
    const num = useRef<HTMLSpanElement>(null);
    const places = decimals(step);
    const latest = useLatest({ value, onChange, valueProp });
    const raw = useRef(value);
    const coast = useRef<(() => void) | null>(null);
    const stretch = useRef<Spring | null>(null);

    useEffect(() => {
      stretch.current = new Spring({
        stiffness: 380,
        damping: 18,
        onUpdate: (v) => num.current?.style.setProperty('--vz-scrub-stretch', String(v)),
      });
      return () => {
        stretch.current?.stop();
        coast.current?.();
      };
    }, []);

    const commit = (v: number) => {
      const next = clamp(Number((Math.round(v / step) * step).toFixed(places)), min, max);
      if (next === latest.current.value) return;
      if (latest.current.valueProp === undefined) setInner(next);
      latest.current.onChange?.(next);
    };
    // Past a limit the number stretches instead of moving: a rubber band, eased.
    const rubber = (v: number) => {
      const over = v > max ? v - max : v < min ? v - min : 0;
      const pull = Math.tanh(over / (step * 20)) * 0.14;
      stretch.current?.jump(pull);
      return over;
    };

    const drag = useRef({ x: 0, t: 0, vel: 0, moved: false });
    const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
      if (editing || e.button !== 0) return;
      coast.current?.();
      raw.current = value;
      drag.current = { x: e.clientX, t: e.timeStamp, vel: 0, moved: false };
      e.currentTarget.setPointerCapture(e.pointerId);
      root.current?.setAttribute('data-scrubbing', '');
    };
    const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      const d = drag.current;
      const dx = e.clientX - d.x;
      if (Math.abs(dx) > 2) d.moved = true;
      const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
      const dv = (dx / pixelsPerStep) * step * mult;
      const dt = Math.max((e.timeStamp - d.t) / 1000, 1 / 240);
      d.vel = d.vel * 0.6 + (dv / dt) * 0.4;
      d.x = e.clientX;
      d.t = e.timeStamp;
      raw.current += dv;
      rubber(raw.current);
      commit(raw.current);
    };
    const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      root.current?.removeAttribute('data-scrubbing');
      stretch.current?.set(0);
      let v = drag.current.vel;
      raw.current = clamp(raw.current, min, max);
      if (prefersReducedMotion() || Math.abs(v) < step * 4) return;
      // Coast on inertia, then rest on a step.
      coast.current = frame.add(({ delta }) => {
        v *= Math.exp(-delta * 5);
        raw.current += v * delta;
        if (raw.current > max || raw.current < min) {
          raw.current = clamp(raw.current, min, max);
          stretch.current?.set(0, { velocity: Math.sign(v) * 1.2 });
          v = 0;
        }
        commit(raw.current);
        if (Math.abs(v) < step * 2) {
          coast.current = null;
          return false;
        }
        return true;
      });
    };

    const startEdit = () => {
      setDraft(value.toFixed(places));
      setEditing(true);
    };
    const finishEdit = (save: boolean) => {
      setEditing(false);
      const n = Number(draft);
      if (save && draft.trim() !== '' && Number.isFinite(n)) commit(n);
      requestAnimationFrame(() => root.current?.focus());
    };
    const onKey = (e: KeyboardEvent) => {
      if (editing) return;
      const big = e.shiftKey ? 10 : 1;
      const map: Record<string, number | undefined> = {
        ArrowUp: value + step * big,
        ArrowRight: value + step * big,
        ArrowDown: value - step * big,
        ArrowLeft: value - step * big,
        PageUp: value + step * 10,
        PageDown: value - step * 10,
        ...(Number.isFinite(min) ? { Home: min } : {}),
        ...(Number.isFinite(max) ? { End: max } : {}),
      };
      if (e.key === 'Enter') {
        e.preventDefault();
        startEdit();
      } else if (map[e.key] !== undefined) {
        e.preventDefault();
        commit(map[e.key]!);
      }
    };

    const text = value.toFixed(places);
    return (
      <div
        ref={useMergedRef(ref, root)}
        className={cx('vz-scrubber', className)}
        style={
          { '--vz-scrub-offset': `${-((value / step) * 8) % 40}px`, ...style } as CSSProperties
        }
        role="spinbutton"
        tabIndex={editing ? -1 : 0}
        aria-label={label}
        aria-valuenow={value}
        aria-valuetext={`${typeof prefix === 'string' ? prefix : ''}${text}${typeof suffix === 'string' ? suffix : ''}`}
        {...(Number.isFinite(min) ? { 'aria-valuemin': min } : {})}
        {...(Number.isFinite(max) ? { 'aria-valuemax': max } : {})}
        onKeyDown={onKey}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={startEdit}
        {...rest}
      >
        <span className="vz-scrubber-label" aria-hidden="true">
          {label}
        </span>
        {editing ? (
          <input
            className="vz-scrubber-input"
            aria-label={label}
            inputMode="decimal"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => finishEdit(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') finishEdit(true);
              if (e.key === 'Escape') finishEdit(false);
            }}
          />
        ) : (
          <span ref={num} className="vz-scrubber-value" aria-hidden="true">
            {prefix && <span className="vz-scrubber-affix">{prefix}</span>}
            {text}
            {suffix && <span className="vz-scrubber-affix">{suffix}</span>}
          </span>
        )}
        <span className="vz-scrubber-ruler" aria-hidden="true" />
      </div>
    );
  },
);

// ——————————————————————————— Pull to refresh ———————————————————————————

export interface PullToRefreshProps extends HTMLAttributes<HTMLDivElement> {
  /** Called on release past the threshold; the drop spins until the promise settles. */
  onRefresh: () => Promise<unknown> | void;
  /** Pull distance that triggers a refresh, px. Default 72. */
  threshold?: number;
  children?: ReactNode;
  /** Announced and used for the keyboard button. Default "Refresh". */
  label?: string;
}

/**
 * Pull the top of a scrolling list and a drop of liquid stretches out of the edge, its neck
 * thinning until it snaps free at the threshold — release and it spins while you refresh.
 * Works with touch and mouse; keyboard users get a Refresh button on focus.
 */
export const PullToRefresh = /* @__PURE__ */ forwardRef<HTMLDivElement, PullToRefreshProps>(
  function PullToRefresh(
    { onRefresh, threshold = 72, children, label = 'Refresh', className, ...rest },
    ref,
  ) {
    const root = useRef<HTMLDivElement>(null);
    const [filter, setFilter] = useState<string | undefined>(undefined);
    const [status, setStatus] = useState('');
    const [busy, setBusy] = useState(false);
    const latest = useLatest({ onRefresh, threshold, busy });
    const pull = useRef<Spring | null>(null);

    const refresh = async () => {
      if (latest.current.busy) return;
      setBusy(true);
      setStatus('Refreshing…');
      root.current?.setAttribute('data-state', 'refreshing');
      pull.current?.set(latest.current.threshold * 0.8);
      try {
        await latest.current.onRefresh();
        setStatus('Updated');
      } catch {
        setStatus('Refresh failed');
      } finally {
        setBusy(false);
        root.current?.removeAttribute('data-state');
        pull.current?.set(0);
      }
    };
    const latestRefresh = useLatest(refresh);

    useEffect(() => {
      setFilter(gooFilter('vz-goo-8-24', 8, 24));
      const el = root.current;
      if (!el) return;
      const spring = (pull.current = new Spring({
        stiffness: 320,
        damping: 26,
        onUpdate: (v) => {
          el.style.setProperty('--vz-pull', `${v.toFixed(2)}px`);
          el.style.setProperty('--vz-pull-p', (v / latest.current.threshold).toFixed(3));
        },
      }));
      let start: number | null = null;
      let distance = 0;
      const resist = (raw: number) => {
        const cap = latest.current.threshold * 1.8;
        return cap * (1 - Math.exp(-raw / cap));
      };
      const begin = (y: number) => {
        if (latest.current.busy || el.scrollTop > 0) return;
        start = y;
        distance = 0;
        el.setAttribute('data-pulling', '');
      };
      const move = (y: number, e: Event) => {
        if (start === null) return;
        const dy = y - start;
        if (dy <= 0 && distance === 0) return;
        if (e.cancelable) e.preventDefault();
        distance = resist(Math.max(dy, 0));
        spring.jump(distance);
        el.toggleAttribute('data-armed', distance >= latest.current.threshold);
      };
      const end = () => {
        if (start === null) return;
        start = null;
        el.removeAttribute('data-armed');
        el.removeAttribute('data-pulling');
        if (distance >= latest.current.threshold) void latestRefresh.current();
        else spring.set(0);
        distance = 0;
      };
      const ts = (e: TouchEvent) => begin(e.touches[0]!.clientY);
      const tm = (e: TouchEvent) => move(e.touches[0]!.clientY, e);
      const pd = (e: globalThis.PointerEvent) => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        begin(e.clientY);
        if (start !== null) el.setPointerCapture(e.pointerId);
      };
      const pm = (e: globalThis.PointerEvent) => e.pointerType === 'mouse' && move(e.clientY, e);
      const pu = (e: globalThis.PointerEvent) => e.pointerType === 'mouse' && end();
      el.addEventListener('touchstart', ts, { passive: true });
      el.addEventListener('touchmove', tm, { passive: false });
      el.addEventListener('touchend', end);
      el.addEventListener('touchcancel', end);
      el.addEventListener('pointerdown', pd);
      el.addEventListener('pointermove', pm);
      el.addEventListener('pointerup', pu);
      return () => {
        spring.stop();
        el.removeEventListener('touchstart', ts);
        el.removeEventListener('touchmove', tm);
        el.removeEventListener('touchend', end);
        el.removeEventListener('touchcancel', end);
        el.removeEventListener('pointerdown', pd);
        el.removeEventListener('pointermove', pm);
        el.removeEventListener('pointerup', pu);
      };
    }, [latest, latestRefresh]);

    return (
      <div
        ref={useMergedRef(ref, root)}
        className={cx('vz-ptr', className)}
        aria-busy={busy}
        {...rest}
      >
        <div className="vz-ptr-goo" style={{ filter }} aria-hidden="true">
          <span className="vz-ptr-sheet" />
          <span className="vz-ptr-drop" />
        </div>
        <span className="vz-ptr-spin" aria-hidden="true" />
        <button type="button" className="vz-ptr-key" onClick={() => void refresh()}>
          {label}
        </button>
        <div className="vz-ptr-content">{children}</div>
        <span className="vz-sr-only" role="status">
          {status}
        </span>
      </div>
    );
  },
);
