import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { gooFilter } from '@vizzele/core';
import { cx, useMergedRef } from '../hooks/utils';

/** The shared goo filter, injected on first use (client only). */
function useGoo(blur = 7, sharpness = 22) {
  const [filter, setFilter] = useState<string | undefined>(undefined);
  useEffect(
    () => setFilter(gooFilter(`vz-goo-${blur}-${sharpness}`, blur, sharpness)),
    [blur, sharpness],
  );
  return filter;
}

// ——————————————————————————— Gooey menu ———————————————————————————

export interface GooeyMenuItem {
  /** Accessible name, also shown as a tooltip. */
  label: string;
  icon: ReactNode;
  onSelect?: () => void;
}

export interface GooeyMenuProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  items: GooeyMenuItem[];
  /** Where the drops travel. Default 'up'. */
  direction?: 'up' | 'down' | 'left' | 'right' | 'arc';
  /** Trigger content. Default a plus that turns into a cross. */
  icon?: ReactNode;
  /** Accessible name of the trigger. Default "Actions". */
  label?: string;
  /** Distance between drops, px. Default 64. */
  gap?: number;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const offsets = (n: number, dir: GooeyMenuProps['direction'], gap: number) =>
  Array.from({ length: n }, (_, i) => {
    const d = (i + 1) * gap;
    if (dir === 'arc') {
      // A quarter-to-half circle above the trigger, evenly spread.
      const a = Math.PI * (n === 1 ? 0.5 : 0.15 + (0.7 * i) / (n - 1));
      return [Math.cos(a) * gap * 1.5, -Math.sin(a) * gap * 1.5];
    }
    return dir === 'down' ? [0, d] : dir === 'left' ? [-d, 0] : dir === 'right' ? [d, 0] : [0, -d];
  });

/**
 * A floating action button that splits into drops of liquid: each action buds off the trigger
 * and the necks between them stretch and snap. A real menu underneath — arrow keys, Escape,
 * focus return — and the drops just stay round with reduced motion.
 */
export const GooeyMenu = /* @__PURE__ */ forwardRef<HTMLDivElement, GooeyMenuProps>(
  function GooeyMenu(
    {
      items,
      direction = 'up',
      icon,
      label = 'Actions',
      gap = 64,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      className,
      style,
      ...rest
    },
    ref,
  ) {
    const [inner, setInner] = useState(defaultOpen);
    const open = openProp ?? inner;
    const setOpen = useCallback(
      (v: boolean) => {
        setInner(v);
        onOpenChange?.(v);
      },
      [onOpenChange],
    );
    const filter = useGoo();
    const id = useId();
    const root = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const pos = offsets(items.length, direction, gap);

    useEffect(() => {
      if (!open) return;
      itemRefs.current[0]?.focus();
      const away = (e: PointerEvent) => {
        if (!root.current?.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener('pointerdown', away);
      return () => document.removeEventListener('pointerdown', away);
    }, [open, setOpen]);

    const close = () => {
      setOpen(false);
      trigger.current?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      const i = itemRefs.current.indexOf(document.activeElement as HTMLButtonElement);
      const move = (d: number) => {
        e.preventDefault();
        itemRefs.current[(i + d + items.length) % items.length]?.focus();
      };
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') move(1);
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') move(-1);
      else if (e.key === 'Home') move(-i);
      else if (e.key === 'End') move(items.length - 1 - i);
      else if (e.key === 'Tab') setOpen(false);
    };

    const place = (i: number) =>
      ({ '--i': i, '--x': `${pos[i]![0]}px`, '--y': `${pos[i]![1]}px` }) as CSSProperties;

    return (
      <div
        ref={useMergedRef(ref, root)}
        className={cx('vz-gooey-menu', className)}
        data-open={open ? '' : undefined}
        data-direction={direction}
        style={style}
        {...rest}
      >
        <div className="vz-gooey-blobs" style={{ filter }} aria-hidden="true">
          {items.map((it, i) => (
            <span key={it.label} className="vz-gooey-blob" style={place(i)} />
          ))}
          <span className="vz-gooey-blob vz-gooey-core" />
        </div>
        <div role="menu" id={id} aria-label={label} className="vz-gooey-items" onKeyDown={onKey}>
          {items.map((it, i) => (
            <button
              key={it.label}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              type="button"
              role="menuitem"
              className="vz-gooey-item"
              style={place(i)}
              aria-label={it.label}
              data-label={it.label}
              tabIndex={-1}
              onClick={() => {
                it.onSelect?.();
                close();
              }}
            >
              {it.icon}
            </button>
          ))}
        </div>
        <button
          ref={trigger}
          type="button"
          className="vz-gooey-trigger"
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(!open)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
              setOpen(true);
            }
          }}
        >
          {icon ?? <span className="vz-gooey-plus" aria-hidden="true" />}
        </button>
      </div>
    );
  },
);

// ——————————————————————————— Avatar stack ———————————————————————————

export interface AvatarPerson {
  name: string;
  /** Image URL. Without it, initials on a gradient. */
  src?: string;
}

export interface AvatarStackProps extends HTMLAttributes<HTMLDivElement> {
  people: AvatarPerson[];
  /** How many to show before "+N". Default 5. */
  max?: number;
  /** Diameter, px. Default 44. */
  size?: number;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/**
 * Overlapping avatars fused into one drop of liquid. Hover or focus the group and they part:
 * the necks between them thin and snap, and each face rises with its name.
 */
export const AvatarStack = /* @__PURE__ */ forwardRef<HTMLDivElement, AvatarStackProps>(
  function AvatarStack({ people, max = 5, size = 44, className, style, ...rest }, ref) {
    const filter = useGoo(5, 18);
    const shown = people.slice(0, max);
    const extra = people.length - shown.length;
    const all = people.map((p) => p.name).join(', ');
    return (
      <div
        ref={ref}
        role="group"
        aria-label={`${people.length} people: ${all}`}
        className={cx('vz-avatar-stack', className)}
        style={{ '--vz-avatar-size': `${size}px`, ...style } as CSSProperties}
        tabIndex={0}
        {...rest}
      >
        <div className="vz-avatar-goo" style={{ filter }} aria-hidden="true">
          {shown.map((p, i) => (
            <span key={p.name} className="vz-avatar-drop" style={{ '--i': i } as CSSProperties} />
          ))}
          {extra > 0 && (
            <span className="vz-avatar-drop" style={{ '--i': shown.length } as CSSProperties} />
          )}
        </div>
        <ul className="vz-avatar-faces" aria-hidden="true">
          {shown.map((p, i) => (
            <li
              key={p.name}
              className="vz-avatar"
              style={{ '--i': i, '--h': (i * 67) % 360 } as CSSProperties}
              data-name={p.name}
            >
              {p.src ? <img src={p.src} alt="" draggable={false} /> : initials(p.name)}
            </li>
          ))}
          {extra > 0 && (
            <li
              className="vz-avatar vz-avatar-more"
              style={{ '--i': shown.length } as CSSProperties}
            >
              +{extra}
            </li>
          )}
        </ul>
      </div>
    );
  },
);

// ——————————————————————————— Liquid stepper ———————————————————————————

export interface LiquidStep {
  label: string;
  description?: string;
}

export interface LiquidStepperProps extends HTMLAttributes<HTMLDivElement> {
  steps: (string | LiquidStep)[];
  /** Index of the current step. Steps before it are done. */
  current: number;
  /** Makes finished steps clickable (to go back). */
  onStepClick?: (index: number) => void;
}

/**
 * Progress through steps as liquid: the finished part is one stream that flows into the next
 * dot when you advance — it bulges, fuses and settles on a jelly spring.
 */
export const LiquidStepper = /* @__PURE__ */ forwardRef<HTMLDivElement, LiquidStepperProps>(
  function LiquidStepper({ steps, current, onStepClick, className, style, ...rest }, ref) {
    const filter = useGoo(6, 20);
    const n = Math.max(steps.length, 1);
    const at = Math.min(Math.max(current, 0), n - 1);
    return (
      <div
        ref={ref}
        className={cx('vz-stepper', className)}
        style={{ '--n': n, '--at': at, ...style } as CSSProperties}
        {...rest}
      >
        <div className="vz-stepper-goo" style={{ filter }} aria-hidden="true">
          <span className="vz-stepper-track" />
          <span className="vz-stepper-flow" />
          {steps.map((_, i) => (
            <span
              key={i}
              className="vz-stepper-dot"
              data-done={i <= at ? '' : undefined}
              style={{ '--i': i } as CSSProperties}
            />
          ))}
        </div>
        <ol className="vz-stepper-list">
          {steps.map((s, i) => {
            const step = typeof s === 'string' ? { label: s } : s;
            const state = i < at ? 'done' : i === at ? 'current' : 'todo';
            const body = (
              <>
                <span className="vz-stepper-mark" aria-hidden="true">
                  {i < at ? '✓' : i + 1}
                </span>
                <span className="vz-stepper-label">{step.label}</span>
                {step.description && <span className="vz-stepper-desc">{step.description}</span>}
                {state === 'done' && <span className="vz-sr-only"> (completed)</span>}
              </>
            );
            return (
              <li
                key={step.label}
                className="vz-stepper-step"
                data-state={state}
                aria-current={state === 'current' ? 'step' : undefined}
              >
                {onStepClick && i < at ? (
                  <button type="button" onClick={() => onStepClick(i)}>
                    {body}
                  </button>
                ) : (
                  <div>{body}</div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    );
  },
);
