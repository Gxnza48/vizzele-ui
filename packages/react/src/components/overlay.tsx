import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Spring, clamp, draggable, prefersReducedMotion, resolveSpring } from '@vizzele/core';
import { useModalFocus } from '../hooks/a11y';
import { cx, useIsomorphicLayoutEffect, useLatest } from '../hooks/utils';
import { useDragDismiss } from './drag';

export const canPortal = () => typeof document !== 'undefined';

// ——————————————————————————— Modal ———————————————————————————

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Element the modal morphs out of. Default: the element that had focus when it opened. */
  originRef?: React.RefObject<HTMLElement | null>;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Max width. Default 520px. */
  width?: number | string;
  /** Close by dragging the header down, Escape, the backdrop or the × button. Default true. */
  dismissible?: boolean;
  /** Accessible name of the × button. Default "Close". */
  closeLabel?: string;
  className?: string;
}

/**
 * A dialog that grows out of the element that opened it — the button morphs into the panel —
 * and shrinks back into it when closed. Drag the header down to dismiss.
 */
export function Modal({
  open,
  onOpenChange,
  originRef,
  title,
  description,
  children,
  width = 520,
  dismissible = true,
  closeLabel = 'Close',
  className,
}: ModalProps) {
  const [mounted, setMounted] = useState(open);
  const panel = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const origin = useRef<HTMLElement | null>(null);
  const progress = useRef<Spring | null>(null);
  const titleId = useId();
  const descId = useId();
  const latest = useLatest({ onOpenChange, dismissible });
  const closing = useRef(false);

  if (open && !mounted) {
    origin.current =
      originRef?.current ?? (canPortal() ? (document.activeElement as HTMLElement) : null);
  }
  useEffect(() => {
    if (open) {
      closing.current = false;
      setMounted(true);
    }
  }, [open]);

  // Interpolates the panel between the origin's box (p = 0) and its own (p = 1).
  const paint = useCallback((p: number) => {
    const el = panel.current;
    if (!el) return;
    const o = origin.current?.getBoundingClientRect();
    const f = el.getBoundingClientRect();
    // getBoundingClientRect includes our transform; measure the untransformed box instead.
    const fw = el.offsetWidth;
    const fh = el.offsetHeight;
    const fx = (window.innerWidth - fw) / 2;
    const fy = Math.max(16, (window.innerHeight - fh) / 2);
    void f;
    if (!o || !o.width) {
      el.style.transform = `translateY(${(1 - p) * 30}px) scale(${0.94 + 0.06 * p})`;
      el.style.opacity = String(clamp(p * 1.5, 0, 1));
    } else {
      const sx = o.width / fw + (1 - o.width / fw) * p;
      const sy = o.height / fh + (1 - o.height / fh) * p;
      const tx = (o.left - fx) * (1 - p);
      const ty = (o.top - fy) * (1 - p);
      el.style.transform = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
      el.style.opacity = String(clamp(p * 4, 0, 1));
      const r = parseFloat(getComputedStyle(origin.current!).borderTopLeftRadius) || 12;
      const target = 28;
      const radius = r + (target - r) * p;
      el.style.borderRadius = `${radius / sx}px / ${radius / sy}px`;
    }
    if (content.current) content.current.style.opacity = String(clamp((p - 0.55) / 0.45, 0, 1));
    if (backdrop.current) backdrop.current.style.opacity = String(clamp(p, 0, 1));
  }, []);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const s = progress.current;
    const done = () => {
      setMounted(false);
      latest.current.onOpenChange(false);
    };
    if (!s || prefersReducedMotion()) return done();
    s.set(0, { config: { stiffness: 320, damping: 32 } });
    const wait = () => (s.value < 0.02 ? done() : requestAnimationFrame(wait));
    requestAnimationFrame(wait);
  }, [latest]);

  useEffect(() => {
    if (!open && mounted) close();
  }, [open, mounted, close]);

  useIsomorphicLayoutEffect(() => {
    if (!mounted) return;
    const s = new Spring({
      ...resolveSpring({ stiffness: 230, damping: 24 }),
      from: 0,
      onUpdate: paint,
    });
    progress.current = s;
    paint(0);
    s.set(1);
    return () => {
      s.stop();
    };
  }, [mounted, paint]);

  // Drag the header down to dismiss.
  useLayoutEffect(() => {
    const el = panel.current;
    if (!mounted || !el || !dismissible) return;
    const header = el.querySelector<HTMLElement>('.vz-modal-header');
    if (!header) return;
    const c = draggable(header, {
      axis: 'y',
      cursor: false,
      elastic: 0.6,
      keyboard: false,
      apply: (_x, y) => {
        const v = y < 0 ? y * 0.2 : y;
        el.style.translate = `0 ${v}px`;
        if (backdrop.current) backdrop.current.style.opacity = String(clamp(1 - v / 400, 0, 1));
      },
      onEnd: (st) => {
        if (st.y > 120 || st.vy > 900) {
          el.style.translate = '';
          close();
        } else c.setPosition({ y: 0 });
        return false;
      },
    });
    return () => c.destroy();
  }, [mounted, dismissible, close]);

  useModalFocus(panel, mounted && open, () => latest.current.dismissible && close());

  if (!mounted || !canPortal()) return null;
  return createPortal(
    <div className="vz-modal-root">
      <div
        ref={backdrop}
        className="vz-modal-backdrop"
        aria-hidden="true"
        onClick={() => dismissible && close()}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cx('vz-modal vz-glass', className)}
        style={{
          width: `min(${typeof width === 'number' ? `${width}px` : width}, calc(100vw - 32px))`,
        }}
      >
        <div ref={content} className="vz-modal-content">
          <div className="vz-modal-header">
            {title && (
              <h2 id={titleId} className="vz-modal-title">
                {title}
              </h2>
            )}
            {/* A dialog that must be answered has no way out but its own buttons. */}
            {dismissible && (
              <button
                type="button"
                className="vz-modal-close"
                onClick={close}
                aria-label={closeLabel}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
          {description && (
            <p id={descId} className="vz-modal-desc">
              {description}
            </p>
          )}
          <div className="vz-modal-body">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ——————————————————————————— Positioning ———————————————————————————

export type Placement = 'top' | 'bottom' | 'left' | 'right';

function place(anchor: DOMRect, el: HTMLElement, placement: Placement, offset: number) {
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let p = placement;
  // Flip when there's no room.
  if (p === 'top' && anchor.top - h - offset < 8) p = 'bottom';
  else if (p === 'bottom' && anchor.bottom + h + offset > vh - 8) p = 'top';
  else if (p === 'left' && anchor.left - w - offset < 8) p = 'right';
  else if (p === 'right' && anchor.right + w + offset > vw - 8) p = 'left';
  const vertical = p === 'top' || p === 'bottom';
  let x = vertical
    ? anchor.left + anchor.width / 2 - w / 2
    : p === 'left'
      ? anchor.left - w - offset
      : anchor.right + offset;
  let y = vertical
    ? p === 'top'
      ? anchor.top - h - offset
      : anchor.bottom + offset
    : anchor.top + anchor.height / 2 - h / 2;
  x = clamp(x, 8, vw - w - 8);
  y = clamp(y, 8, vh - h - 8);
  return { x, y, placement: p };
}

/** Floating element that springs out of its anchor. */
export function useFloating(
  open: boolean,
  anchor: React.RefObject<HTMLElement | null>,
  placement: Placement,
  offset: number,
) {
  const [mounted, setMounted] = useState(false);
  const floating = useRef<HTMLDivElement>(null);
  const spring = useRef<Spring | null>(null);
  const side = useRef<Placement>(placement);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // Reopened while the exit animation was running: still mounted, so the entrance
      // effect won't rerun — spring back in from wherever the exit left it.
      spring.current?.set(1, { config: { stiffness: 420, damping: 22 } });
    } else if (spring.current) {
      const s = spring.current;
      if (prefersReducedMotion()) return setMounted(false);
      s.set(0, { config: { stiffness: 500, damping: 40 } });
      const t = setTimeout(() => setMounted(false), 160);
      return () => clearTimeout(t);
    } else setMounted(false);
  }, [open]);

  useIsomorphicLayoutEffect(() => {
    const el = floating.current;
    const a = anchor.current;
    if (!mounted || !el || !a) return;
    const position = () => {
      const r = place(a.getBoundingClientRect(), el, placement, offset);
      side.current = r.placement;
      el.style.left = `${r.x}px`;
      el.style.top = `${r.y}px`;
      el.dataset.side = r.placement;
    };
    position();
    const s = new Spring({
      ...resolveSpring({ stiffness: 420, damping: 22 }),
      from: 0,
      onUpdate: (p) => {
        const d = (1 - p) * 8;
        const dir = side.current;
        const tx = dir === 'left' ? d : dir === 'right' ? -d : 0;
        const ty = dir === 'top' ? d : dir === 'bottom' ? -d : 0;
        el.style.transform = `translate(${tx}px, ${ty}px) scale(${0.85 + 0.15 * p})`;
        el.style.opacity = String(clamp(p * 1.4, 0, 1));
      },
    });
    spring.current = s;
    s.set(1);
    window.addEventListener('scroll', position, true);
    window.addEventListener('resize', position);
    return () => {
      s.stop();
      spring.current = null;
      window.removeEventListener('scroll', position, true);
      window.removeEventListener('resize', position);
    };
  }, [mounted, placement, offset, anchor]);

  return { mounted, floating };
}

// ——————————————————————————— Tooltip ———————————————————————————

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: Placement;
  /** ms before showing on hover. Default 350. */
  delay?: number;
  offset?: number;
  className?: string;
}

/** A small label that springs out of its anchor on hover or keyboard focus. */
export function Tooltip({
  content,
  children,
  placement = 'top',
  delay = 350,
  offset = 10,
  className,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();
  const { mounted, floating } = useFloating(open, anchor, placement, offset);

  const show = (d: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), d);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  };
  useEffect(() => {
    const target = anchor.current?.querySelector<HTMLElement>(
      'a, button, input, select, textarea, [tabindex]',
    );
    target?.setAttribute('aria-describedby', id);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && hide();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, id]);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  return (
    <>
      <span
        ref={anchor}
        className="vz-tooltip-anchor"
        onPointerEnter={(e) => e.pointerType === 'mouse' && show(delay)}
        onPointerLeave={hide}
        onFocus={() => show(0)}
        onBlur={hide}
      >
        {children}
      </span>
      {mounted &&
        canPortal() &&
        createPortal(
          <div ref={floating} id={id} role="tooltip" className={cx('vz-tooltip', className)}>
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}

// ——————————————————————————— Popover ———————————————————————————

export interface PopoverTriggerProps {
  ref: React.RefObject<HTMLButtonElement | null>;
  onClick: () => void;
  'aria-expanded': boolean;
  'aria-controls': string;
  'aria-haspopup': 'dialog';
}

export interface PopoverProps {
  /** Render the trigger and spread the props onto a button. */
  children: (props: PopoverTriggerProps) => ReactNode;
  content: ReactNode;
  placement?: Placement;
  offset?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Accessible name of the panel. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

/** A panel anchored to a button: opens on click, closes on Escape or outside click. */
export function Popover({
  children,
  content,
  placement = 'bottom',
  offset = 10,
  open: controlled,
  onOpenChange,
  label,
  className,
  style,
}: PopoverProps) {
  const [inner, setInner] = useState(false);
  const open = controlled ?? inner;
  const setOpen = (v: boolean) => {
    if (controlled === undefined) setInner(v);
    onOpenChange?.(v);
  };
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const { mounted, floating } = useFloating(open, trigger, placement, offset);
  const latest = useLatest(setOpen);

  useEffect(() => {
    if (!open) return;
    // The panel mounts a frame after `open` flips; read the ref when focusing.
    let tries = 0;
    let raf = 0;
    const focusIn = () => {
      const el = floating.current;
      if (!el) {
        if (++tries < 10) raf = requestAnimationFrame(focusIn);
        return;
      }
      (
        el.querySelector<HTMLElement>('button, a, input, select, textarea, [tabindex]') ?? el
      ).focus();
    };
    raf = requestAnimationFrame(focusIn);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        latest.current(false);
        trigger.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!floating.current?.contains(t) && !trigger.current?.contains(t)) latest.current(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [open, floating, latest]);

  return (
    <>
      {children({
        ref: trigger,
        onClick: () => setOpen(!open),
        'aria-expanded': open,
        'aria-controls': id,
        'aria-haspopup': 'dialog',
      })}
      {mounted &&
        canPortal() &&
        createPortal(
          <div
            ref={floating}
            id={id}
            role="dialog"
            aria-label={label}
            tabIndex={-1}
            className={cx('vz-popover vz-glass', className)}
            style={style}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}

// ——————————————————————————— Toast ———————————————————————————

export type ToastVariant = 'default' | 'success' | 'error' | 'info';

export interface ToastData {
  id: number;
  title: ReactNode;
  description?: ReactNode;
  variant: ToastVariant;
  /** ms; 0 keeps it until dismissed. */
  duration: number;
  action?: { label: string; onClick: () => void };
}

type ToastInput = string | (Partial<Omit<ToastData, 'id'>> & { title: ReactNode });

let toasts: ToastData[] = [];
let nextId = 1;
const subscribers = new Set<() => void>();
const emit = () => subscribers.forEach((s) => s());

function addToast(input: ToastInput, variant?: ToastVariant) {
  const data = typeof input === 'string' ? { title: input } : input;
  const t: ToastData = { duration: 4500, variant: variant ?? 'default', ...data, id: nextId++ };
  toasts = [t, ...toasts].slice(0, 12);
  emit();
  return t.id;
}

/**
 * Shows a toast. Render `<Toaster />` once.
 *
 *     toast('Saved');
 *     toast.success({ title: 'Deployed', description: 'vizzele-ui is live' });
 */
export const toast = /* @__PURE__ */ Object.assign(addToast, {
  success: (t: ToastInput) => addToast(t, 'success'),
  error: (t: ToastInput) => addToast(t, 'error'),
  info: (t: ToastInput) => addToast(t, 'info'),
  dismiss(id?: number) {
    toasts = id === undefined ? [] : toasts.filter((t) => t.id !== id);
    emit();
  },
});

const subscribe = (cb: () => void) => {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
};

export interface ToasterProps {
  position?:
    'bottom-right' | 'bottom-left' | 'bottom-center' | 'top-right' | 'top-left' | 'top-center';
  /** Toasts visible in the collapsed stack. Default 3. */
  visible?: number;
  className?: string;
}

/** Renders toasts as a stack that fans out on hover. Swipe a toast to dismiss it. */
export function Toaster({ position = 'bottom-right', visible = 3, className }: ToasterProps) {
  const list = useSyncExternalStore(
    subscribe,
    () => toasts,
    () => toasts,
  );
  const [expanded, setExpanded] = useState(false);
  const [heights, setHeights] = useState<Record<number, number>>({});
  const top = position.startsWith('top');
  // Portal only after mount: the server renders nothing, so hydration must too.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const report = useCallback((id: number, h: number) => {
    setHeights((hs) => (hs[id] === h ? hs : { ...hs, [id]: h }));
  }, []);

  let acc = 0;
  const offsets = list.map((t) => {
    const o = acc;
    acc += (heights[t.id] ?? 64) + 10;
    return o;
  });

  if (!ready || !canPortal()) return null;
  return createPortal(
    <section
      className={cx('vz-toaster', className)}
      data-position={position}
      data-expanded={expanded || undefined}
      aria-label="Notifications"
      onPointerEnter={() => setExpanded(true)}
      onPointerLeave={() => setExpanded(false)}
      onFocus={() => setExpanded(true)}
      onBlur={() => setExpanded(false)}
    >
      <ol className="vz-toast-list">
        {list.map((t, i) => (
          <ToastItem
            key={t.id}
            toast={t}
            index={i}
            hidden={i >= visible && !expanded}
            offset={expanded ? offsets[i]! : i * 12}
            scale={expanded ? 1 : 1 - Math.min(i, visible) * 0.05}
            top={top}
            paused={expanded}
            onHeight={report}
          />
        ))}
      </ol>
    </section>,
    document.body,
  );
}

function ToastItem({
  toast: t,
  index,
  hidden,
  offset,
  scale,
  top,
  paused,
  onHeight,
}: {
  toast: ToastData;
  index: number;
  hidden: boolean;
  offset: number;
  scale: number;
  top: boolean;
  paused: boolean;
  onHeight: (id: number, h: number) => void;
}) {
  const el = useRef<HTMLLIElement | null>(null);
  const [entered, setEntered] = useState(false);
  const dismiss = useCallback(() => toast.dismiss(t.id), [t.id]);
  const dragRef = useDragDismiss<HTMLDivElement>({ axis: 'x', onDismiss: dismiss });

  useLayoutEffect(() => {
    if (el.current) onHeight(t.id, el.current.offsetHeight);
    const r = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(r);
  }, [t.id, onHeight]);

  // Auto-dismiss, paused while the stack is hovered/focused.
  useEffect(() => {
    if (!t.duration || paused) return;
    const timer = setTimeout(dismiss, t.duration);
    return () => clearTimeout(timer);
  }, [t.duration, paused, dismiss]);

  const sign = top ? 1 : -1;
  return (
    <li
      ref={el}
      className="vz-toast-slot"
      data-entered={entered || undefined}
      aria-hidden={hidden || undefined}
      style={
        {
          '--vz-toast-y': `${sign * offset}px`,
          '--vz-toast-scale': scale,
          zIndex: 100 - index,
          opacity: hidden ? 0 : undefined,
          pointerEvents: hidden ? 'none' : undefined,
        } as CSSProperties
      }
    >
      <div
        ref={dragRef}
        className="vz-toast vz-glass"
        data-variant={t.variant}
        role={t.variant === 'error' ? 'alert' : 'status'}
        aria-live={t.variant === 'error' ? 'assertive' : 'polite'}
      >
        <span className="vz-toast-glow" aria-hidden="true" />
        <div className="vz-toast-text">
          <p className="vz-toast-title">{t.title}</p>
          {t.description && <p className="vz-toast-desc">{t.description}</p>}
        </div>
        {t.action && (
          <button
            type="button"
            className="vz-button"
            data-size="sm"
            onClick={() => {
              t.action!.onClick();
              dismiss();
            }}
          >
            {t.action.label}
          </button>
        )}
        <button
          type="button"
          className="vz-toast-close"
          onClick={dismiss}
          aria-label="Dismiss notification"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </li>
  );
}
