import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Spring, resolveSpring } from '@vizzele/core';
import { cx, useLatest } from '../hooks/utils';
import { canPortal, useFloating, type Placement } from './overlay';

// ——————————————————————————— Liquid highlight ———————————————————————————

/**
 * The blob that slides between options. Two edge springs (top & bottom) with different
 * stiffness make it stretch in the direction of travel and settle with a wobble.
 */
function useLiquidHighlight(
  container: React.RefObject<HTMLElement | null>,
  blob: React.RefObject<HTMLElement | null>,
) {
  const edges = useRef<{ t: Spring; b: Spring } | null>(null);
  const shown = useRef(false);
  return useCallback(
    (target: HTMLElement | null) => {
      const el = blob.current;
      if (!el || !container.current) return;
      if (!target) {
        el.style.opacity = '0';
        shown.current = false;
        return;
      }
      if (!edges.current) {
        const paint = () => {
          const e = edges.current!;
          el.style.transform = `translateY(${e.t.value}px)`;
          el.style.height = `${Math.max(e.b.value - e.t.value, 0)}px`;
        };
        edges.current = { t: new Spring({ onUpdate: paint }), b: new Spring({ onUpdate: paint }) };
      }
      const e = edges.current;
      const top = target.offsetTop;
      const bottom = top + target.offsetHeight;
      el.style.opacity = '1';
      if (!shown.current) {
        e.t.jump(top);
        e.b.jump(bottom);
        shown.current = true;
        return;
      }
      const down = top > e.t.target;
      const fast = resolveSpring({ stiffness: 620, damping: 38 });
      const slow = resolveSpring({ stiffness: 240, damping: 21 });
      e.t.set(top, { config: down ? slow : fast });
      e.b.set(bottom, { config: down ? fast : slow });
    },
    [container, blob],
  );
}

/** Type-to-jump: letters typed within half a second build a search string. */
function useTypeahead(labels: () => string[], onMatch: (index: number) => void) {
  const buffer = useRef('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (key: string, from: number) => {
    if (key.length !== 1 || key === ' ') return false;
    buffer.current += key.toLowerCase();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => (buffer.current = ''), 500);
    const list = labels();
    const n = list.length;
    // A fresh letter searches after the current item; a growing word refines from it.
    const start = buffer.current.length > 1 ? from : from + 1;
    for (let k = 0; k < n; k++) {
      const i = (start + k) % n;
      if (list[i]?.toLowerCase().startsWith(buffer.current)) {
        onMatch(i);
        return true;
      }
    }
    return true;
  };
}

const Chevron = () => (
  <svg
    className="vz-select-chevron"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M6 9l6 6 6-6"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const Check = () => (
  <svg
    className="vz-option-check"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M5 12.5l4.5 4.5L19 7.5"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ——————————————————————————— Select ———————————————————————————

export interface SelectOption {
  value: string;
  label: ReactNode;
  /** Plain text used for typeahead and the button when `label` isn't a string. */
  textValue?: string;
  description?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  options: (SelectOption | string)[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  /** Accessible name (or use `aria-labelledby` via `labelledBy`). */
  label?: string;
  labelledBy?: string;
  id?: string;
  disabled?: boolean;
  /** Visual size. Default `md`. */
  size?: 'sm' | 'md';
  placement?: 'bottom' | 'top';
  className?: string;
  style?: CSSProperties;
  /** Submitted with forms. */
  name?: string;
}

const norm = (o: SelectOption | string): SelectOption =>
  typeof o === 'string' ? { value: o, label: o } : o;
const textOf = (o: SelectOption) =>
  o.textValue ?? (typeof o.label === 'string' ? o.label : o.value);

/**
 * A select in liquid light: the list springs out of the button and a blob of light slides
 * between options. WAI-ARIA select-only combobox — arrows, Home/End, typeahead, Enter, Escape.
 */
export function Select({
  options: raw,
  value,
  defaultValue,
  onValueChange,
  placeholder = 'Select…',
  label,
  labelledBy,
  id,
  disabled,
  size = 'md',
  placement = 'bottom',
  className,
  style,
  name,
}: SelectProps) {
  const options = raw.map(norm);
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const [open, setOpen] = useState(false);
  const selectedIndex = options.findIndex((o) => o.value === current);
  const [active, setActive] = useState(Math.max(selectedIndex, 0));
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const blob = useRef<HTMLSpanElement>(null);
  const auto = useId();
  const baseId = id ?? auto;
  const listId = `${baseId}-listbox`;
  const { mounted, floating } = useFloating(open, trigger, placement, 8);
  const highlight = useLiquidHighlight(list, blob);
  const latest = useLatest({ options, onValueChange });

  const choose = (i: number) => {
    const o = options[i];
    if (!o || o.disabled) return;
    if (value === undefined) setInner(o.value);
    latest.current.onValueChange?.(o.value);
    setOpen(false);
    trigger.current?.focus();
  };

  const step = (from: number, dir: 1 | -1) => {
    const n = options.length;
    for (let k = 1; k <= n; k++) {
      const i = (from + dir * k + n) % n;
      if (!options[i]?.disabled) return i;
    }
    return from;
  };

  const typeahead = useTypeahead(
    () => latest.current.options.map(textOf),
    (i) => {
      if (open) setActive(i);
      else if (!options[i]?.disabled) choose(i);
    },
  );

  // Open: start on the selected option and size the list to the button.
  useLayoutEffect(() => {
    if (!open) return;
    setActive(Math.max(selectedIndex, 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useLayoutEffect(() => {
    const f = floating.current;
    if (!open || !mounted || !f || !trigger.current) return;
    f.style.minWidth = `${trigger.current.offsetWidth}px`;
    // On every open (including a reopen during the exit animation, when it stays mounted).
    list.current?.focus({ preventScroll: true });
  }, [open, mounted, floating]);

  useEffect(() => {
    if (!mounted) return;
    const el = list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`) ?? null;
    highlight(el);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [active, mounted, highlight]);

  // Close on outside press.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!floating.current?.contains(t) && !trigger.current?.contains(t)) setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [open, floating]);

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (typeahead(e.key, Math.max(selectedIndex, 0))) e.preventDefault();
  };

  const onListKey = (e: React.KeyboardEvent) => {
    const n = options.length;
    if (e.key === 'ArrowDown') setActive((a) => step(a, 1));
    else if (e.key === 'ArrowUp') setActive((a) => step(a, -1));
    else if (e.key === 'Home') setActive(step(-1 + n, 1));
    else if (e.key === 'End') setActive(step(0, -1));
    else if (e.key === 'Enter' || e.key === ' ') choose(active);
    else if (e.key === 'Escape') {
      setOpen(false);
      trigger.current?.focus();
    } else if (e.key === 'Tab') {
      choose(active);
      return;
    } else if (!typeahead(e.key, active)) return;
    e.preventDefault();
  };

  const selected = options[selectedIndex];
  return (
    <>
      <button
        ref={trigger}
        id={baseId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
        disabled={disabled}
        className={cx('vz-select', className)}
        data-size={size === 'md' ? undefined : size}
        data-open={open || undefined}
        data-placeholder={!selected || undefined}
        style={style}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKey}
      >
        {selected?.icon && <span className="vz-option-icon">{selected.icon}</span>}
        <span className="vz-select-value">{selected ? selected.label : placeholder}</span>
        <Chevron />
      </button>
      {name && <input type="hidden" name={name} value={current ?? ''} />}
      {mounted &&
        canPortal() &&
        createPortal(
          <div
            ref={floating}
            className="vz-select-popup vz-glass"
            data-size={size === 'md' ? undefined : size}
          >
            <div
              ref={list}
              id={listId}
              role="listbox"
              tabIndex={-1}
              aria-labelledby={labelledBy ?? baseId}
              aria-activedescendant={`${baseId}-opt-${active}`}
              className="vz-listbox"
              onKeyDown={onListKey}
            >
              <span ref={blob} className="vz-option-blob" aria-hidden="true" />
              {options.map((o, i) => (
                <div
                  key={o.value}
                  id={`${baseId}-opt-${i}`}
                  role="option"
                  aria-selected={o.value === current}
                  aria-disabled={o.disabled || undefined}
                  data-index={i}
                  data-active={i === active || undefined}
                  className="vz-option"
                  style={{ '--vz-i': i } as CSSProperties}
                  onPointerMove={() => !o.disabled && i !== active && setActive(i)}
                  onClick={() => choose(i)}
                >
                  {o.icon && <span className="vz-option-icon">{o.icon}</span>}
                  <span className="vz-option-text">
                    <span className="vz-option-label">{o.label}</span>
                    {o.description && <span className="vz-option-desc">{o.description}</span>}
                  </span>
                  {o.value === current && <Check />}
                </div>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

// ——————————————————————————— Dropdown menu ———————————————————————————

export interface MenuActionItem {
  type?: 'item';
  label: ReactNode;
  textValue?: string;
  icon?: ReactNode;
  /** Keyboard hint shown on the right, e.g. "⌘K". */
  shortcut?: string;
  onSelect?: () => void;
  disabled?: boolean;
  /** Destructive action styling. */
  danger?: boolean;
}

export type MenuItem = MenuActionItem | { type: 'separator' } | { type: 'label'; label: ReactNode };

export interface MenuTriggerProps {
  ref: React.RefObject<HTMLButtonElement | null>;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  'aria-haspopup': 'menu';
  'aria-expanded': boolean;
  'aria-controls': string | undefined;
  id: string;
}

export interface DropdownMenuProps {
  items: MenuItem[];
  /** Render the trigger and spread the props onto a button. */
  children: (props: MenuTriggerProps) => ReactNode;
  placement?: Placement;
  /** Accessible name of the menu (defaults to the trigger). */
  label?: string;
  className?: string;
}

/** An action menu that springs out of its button, with a liquid highlight and full keyboard support. */
export function DropdownMenu({
  items,
  children,
  placement = 'bottom',
  label,
  className,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const blob = useRef<HTMLSpanElement>(null);
  const id = useId();
  const menuId = `${id}-menu`;
  const { mounted, floating } = useFloating(open, trigger, placement, 8);
  const highlight = useLiquidHighlight(menu, blob);
  const actionable = items
    .map((it, i) => ({ it, i }))
    .filter(({ it }) => (it.type ?? 'item') === 'item' && !(it as { disabled?: boolean }).disabled)
    .map(({ i }) => i);
  const startAt = useRef<'first' | 'last'>('first');
  const latest = useLatest({ items, actionable });

  const close = (focusTrigger = true) => {
    setOpen(false);
    setActive(-1);
    if (focusTrigger) trigger.current?.focus();
  };
  const run = (i: number) => {
    const it = latest.current.items[i];
    if (!it || (it.type ?? 'item') !== 'item') return;
    const item = it as MenuActionItem;
    if (item.disabled) return;
    close();
    item.onSelect?.();
  };
  const move = (dir: 1 | -1) => {
    const list = latest.current.actionable;
    if (!list.length) return;
    const pos = list.indexOf(active);
    setActive(list[(pos + dir + list.length) % list.length]!);
  };

  const typeahead = useTypeahead(
    () =>
      latest.current.items.map((it) =>
        (it.type ?? 'item') === 'item'
          ? ((it as { textValue?: string }).textValue ??
            (typeof (it as { label: ReactNode }).label === 'string'
              ? (it as { label: string }).label
              : ''))
          : '',
      ),
    (i) => latest.current.actionable.includes(i) && setActive(i),
  );

  useLayoutEffect(() => {
    if (!open || !mounted) return;
    menu.current?.focus({ preventScroll: true });
    const list = latest.current.actionable;
    setActive(startAt.current === 'last' ? (list[list.length - 1] ?? -1) : (list[0] ?? -1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted]);

  useEffect(() => {
    if (!mounted) return;
    highlight(menu.current?.querySelector<HTMLElement>(`[data-index="${active}"]`) ?? null);
  }, [active, mounted, highlight]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!floating.current?.contains(t) && !trigger.current?.contains(t)) close(false);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, floating]);

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') move(1);
    else if (e.key === 'ArrowUp') move(-1);
    else if (e.key === 'Home') setActive(latest.current.actionable[0] ?? -1);
    else if (e.key === 'End') setActive(latest.current.actionable.at(-1) ?? -1);
    else if (e.key === 'Enter' || e.key === ' ') run(active);
    else if (e.key === 'Escape') close();
    else if (e.key === 'Tab') {
      close(false);
      return;
    } else if (!typeahead(e.key, Math.max(active, 0))) return;
    e.preventDefault();
  };

  return (
    <>
      {children({
        ref: trigger,
        id: `${id}-trigger`,
        onClick: () => {
          startAt.current = 'first';
          setOpen((o) => !o);
        },
        onKeyDown: (e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            startAt.current = e.key === 'ArrowUp' ? 'last' : 'first';
            setOpen(true);
          }
        },
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': open ? menuId : undefined,
      })}
      {mounted &&
        canPortal() &&
        createPortal(
          <div ref={floating} className={cx('vz-select-popup vz-menu-popup vz-glass', className)}>
            <div
              ref={menu}
              id={menuId}
              role="menu"
              tabIndex={-1}
              aria-label={label}
              aria-labelledby={label ? undefined : `${id}-trigger`}
              aria-activedescendant={active >= 0 ? `${id}-item-${active}` : undefined}
              className="vz-listbox"
              onKeyDown={onMenuKey}
            >
              <span ref={blob} className="vz-option-blob" aria-hidden="true" />
              {items.map((it, i) => {
                const type = it.type ?? 'item';
                if (type === 'separator')
                  return <div key={i} role="separator" className="vz-menu-separator" />;
                if (type === 'label')
                  return (
                    <div key={i} role="presentation" className="vz-menu-label">
                      {(it as { label: ReactNode }).label}
                    </div>
                  );
                const item = it as MenuActionItem;
                return (
                  <div
                    key={i}
                    id={`${id}-item-${i}`}
                    role="menuitem"
                    aria-disabled={item.disabled || undefined}
                    data-index={i}
                    data-active={i === active || undefined}
                    data-danger={item.danger || undefined}
                    className="vz-option"
                    style={{ '--vz-i': i } as CSSProperties}
                    onPointerMove={() => !item.disabled && i !== active && setActive(i)}
                    onClick={() => run(i)}
                  >
                    {item.icon && <span className="vz-option-icon">{item.icon}</span>}
                    <span className="vz-option-text">
                      <span className="vz-option-label">{item.label}</span>
                    </span>
                    {item.shortcut && <kbd className="vz-menu-shortcut">{item.shortcut}</kbd>}
                  </div>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
