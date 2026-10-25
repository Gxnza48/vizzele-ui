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
import { Spring, clamp, onScroll, prefersReducedMotion, resolveSpring } from '@vizzele/core';
import { cx, useIsomorphicLayoutEffect, useLatest } from '../hooks/utils';

// ——————————————————————————— Tabs ———————————————————————————

export interface TabItem {
  value: string;
  label: ReactNode;
  content?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** `pill` = liquid blob behind the label, `underline` = flowing line. Default `pill`. */
  variant?: 'pill' | 'underline';
  /** Accessible name of the tab list. */
  label?: string;
  className?: string;
}

/**
 * Tabs whose indicator flows like liquid: the leading edge races ahead and the trailing
 * edge catches up, so it stretches between tabs and settles with a wobble.
 */
export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  variant = 'pill',
  label,
  className,
}: TabsProps) {
  const [inner, setInner] = useState(defaultValue ?? items[0]?.value);
  const current = value ?? inner;
  const list = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const edges = useRef<{ l: Spring; r: Spring } | null>(null);
  const base = useId();
  const ready = useRef(false);

  const select = (v: string) => {
    if (value === undefined) setInner(v);
    onValueChange?.(v);
  };

  useIsomorphicLayoutEffect(() => {
    const ul = list.current;
    const ind = indicator.current;
    if (!ul || !ind) return;
    const tab = ul.querySelector<HTMLElement>(`[data-value="${CSS.escape(current ?? '')}"]`);
    if (!tab) return;
    const left = tab.offsetLeft;
    const right = left + tab.offsetWidth;
    const paint = () => {
      const e = edges.current!;
      ind.style.transform = `translateX(${e.l.value}px)`;
      ind.style.width = `${Math.max(e.r.value - e.l.value, 4)}px`;
    };
    if (!edges.current) {
      edges.current = {
        l: new Spring({ from: left, onUpdate: paint }),
        r: new Spring({ from: right, onUpdate: paint }),
      };
      ind.style.top = `${tab.offsetTop}px`;
      ind.style.height = `${tab.offsetHeight}px`;
      paint();
      ready.current = true;
      return;
    }
    const e = edges.current;
    const goingRight = left > e.l.target;
    // Leading edge snappy, trailing edge lazy → liquid stretch.
    const fast = resolveSpring({ stiffness: 520, damping: 34 });
    const slow = resolveSpring({ stiffness: 180, damping: 18 });
    e.l.set(left, { config: goingRight ? slow : fast });
    e.r.set(right, { config: goingRight ? fast : slow });
  }, [current, variant]);

  useEffect(() => {
    const onResize = () => {
      const ul = list.current;
      const e = edges.current;
      const tab = ul?.querySelector<HTMLElement>(`[data-value="${CSS.escape(current ?? '')}"]`);
      if (!tab || !e) return;
      e.l.jump(tab.offsetLeft);
      e.r.jump(tab.offsetLeft + tab.offsetWidth);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [current]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const enabled = items.filter((i) => !i.disabled);
    const idx = enabled.findIndex((i) => i.value === current);
    let next = -1;
    if (e.key === 'ArrowRight') next = (idx + 1) % enabled.length;
    if (e.key === 'ArrowLeft') next = (idx - 1 + enabled.length) % enabled.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = enabled.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const v = enabled[next]!.value;
    select(v);
    list.current?.querySelector<HTMLElement>(`[data-value="${CSS.escape(v)}"]`)?.focus();
  };

  const active = items.find((i) => i.value === current);
  return (
    <div className={cx('vz-tabs', className)} data-variant={variant}>
      <div
        ref={list}
        role="tablist"
        aria-label={label}
        className="vz-tab-list"
        onKeyDown={onKeyDown}
      >
        <span ref={indicator} className="vz-tab-indicator" aria-hidden="true" />
        {items.map((item) => {
          const selected = item.value === current;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              id={`${base}-tab-${item.value}`}
              aria-selected={selected}
              aria-controls={item.content !== undefined ? `${base}-panel-${item.value}` : undefined}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              data-value={item.value}
              className="vz-tab"
              onClick={() => select(item.value)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {active?.content !== undefined && (
        <div
          key={active.value}
          role="tabpanel"
          id={`${base}-panel-${active.value}`}
          aria-labelledby={`${base}-tab-${active.value}`}
          tabIndex={0}
          className="vz-tab-panel"
        >
          {active.content}
        </div>
      )}
    </div>
  );
}

// ——————————————————————————— Dock ———————————————————————————

export interface DockItem {
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}

export interface DockProps {
  items: DockItem[];
  /** Resting icon size, px. Default 48. */
  size?: number;
  /** Peak magnification. Default 1.75. */
  magnification?: number;
  /** Distance (px) over which neighbours also grow. Default 150. */
  distance?: number;
  className?: string;
  label?: string;
}

/** macOS-style dock: icons swell as the pointer passes, neighbours following along a curve. */
export function Dock({
  items,
  size = 48,
  magnification = 1.75,
  distance = 150,
  className,
  label = 'Dock',
}: DockProps) {
  const root = useRef<HTMLElement>(null);
  const springs = useRef<Spring[]>([]);
  const latest = useLatest({ size, magnification, distance });

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const nodes = Array.from(el.querySelectorAll<HTMLElement>('.vz-dock-item'));
    springs.current.forEach((s) => s.stop());
    springs.current = nodes.map(
      (n) =>
        new Spring({
          ...resolveSpring({ stiffness: 380, damping: 26 }),
          from: latest.current.size,
          onUpdate: (v) => {
            n.style.width = `${v}px`;
            n.style.height = `${v}px`;
          },
        }),
    );
    springs.current.forEach((s) => s.jump(latest.current.size));
  }, [items.length, latest]);

  const magnify = (clientX: number | null) => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const { size: s, magnification: m, distance: d } = latest.current;
    const nodes = Array.from(el.querySelectorAll<HTMLElement>('.vz-dock-item'));
    nodes.forEach((n, i) => {
      const spring = springs.current[i];
      if (!spring) return;
      if (clientX === null) return spring.set(s);
      const r = n.getBoundingClientRect();
      const dist = Math.abs(clientX - (r.left + r.width / 2));
      const t = clamp(1 - dist / d, 0, 1);
      spring.set(s * (1 + (m - 1) * Math.sin((t * Math.PI) / 2) ** 2));
    });
  };

  return (
    <nav
      ref={root}
      aria-label={label}
      className={cx('vz-dock vz-glass', className)}
      style={{ '--vz-dock-size': `${size}px` } as CSSProperties}
      onPointerMove={(e) => (e.pointerType === 'mouse' || e.buttons) && magnify(e.clientX)}
      onPointerLeave={() => magnify(null)}
      onPointerUp={(e) => e.pointerType !== 'mouse' && magnify(null)}
    >
      <ul className="vz-dock-list">
        {items.map((item) => {
          const inner = (
            <>
              <span className="vz-dock-icon">{item.icon}</span>
              <span className="vz-dock-label" aria-hidden="true">
                {item.label}
              </span>
            </>
          );
          return (
            <li key={item.label} className="vz-dock-slot">
              {item.href ? (
                <a
                  href={item.href}
                  className="vz-dock-item"
                  aria-label={item.label}
                  aria-current={item.active ? 'page' : undefined}
                  onFocus={(e) => magnify(e.currentTarget.getBoundingClientRect().left + size / 2)}
                  onBlur={() => magnify(null)}
                >
                  {inner}
                </a>
              ) : (
                <button
                  type="button"
                  className="vz-dock-item"
                  aria-label={item.label}
                  aria-pressed={item.active}
                  onClick={item.onClick}
                  onFocus={(e) => magnify(e.currentTarget.getBoundingClientRect().left + size / 2)}
                  onBlur={() => magnify(null)}
                >
                  {inner}
                </button>
              )}
              {item.active && <span className="vz-dock-dot" aria-hidden="true" />}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ——————————————————————————— Navbar ———————————————————————————

export interface NavbarProps {
  brand: ReactNode;
  links?: { label: string; href: string; active?: boolean }[];
  actions?: ReactNode;
  /** Scroll distance (px) after which the bar condenses into a floating pill. Default 40. */
  threshold?: number;
  /** Slide away while scrolling down, back on scroll up. Default false. */
  hideOnScroll?: boolean;
  /** Scroll root. Default window. */
  container?: HTMLElement | Window;
  /** `fixed` (page) or `sticky` (inside a container). Default fixed. */
  position?: 'fixed' | 'sticky';
  className?: string;
}

/** A navigation bar that condenses into a floating glass pill as you scroll. */
export function Navbar({
  brand,
  links = [],
  actions,
  threshold = 40,
  hideOnScroll = false,
  container,
  position = 'fixed',
  className,
}: NavbarProps) {
  const [condensed, setCondensed] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menu, setMenu] = useState(false);
  const last = useRef(0);
  const menuId = useId();

  useEffect(() => {
    const target = container ?? window;
    return onScroll((s) => {
      setCondensed(s.y > threshold);
      if (hideOnScroll) {
        const dy = s.y - last.current;
        if (Math.abs(dy) > 6) setHidden(dy > 0 && s.y > threshold * 3);
      }
      last.current = s.y;
    }, target);
  }, [container, threshold, hideOnScroll]);

  return (
    <header
      className={cx('vz-navbar', className)}
      data-condensed={condensed || undefined}
      data-hidden={(hidden && !menu) || undefined}
      data-position={position}
    >
      <div className="vz-navbar-inner">
        <div className="vz-navbar-brand">{brand}</div>
        <nav className="vz-navbar-links" aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href} aria-current={l.active ? 'page' : undefined}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="vz-navbar-actions">{actions}</div>
        {links.length > 0 && (
          <button
            type="button"
            className="vz-navbar-toggle"
            aria-expanded={menu}
            aria-controls={menuId}
            aria-label={menu ? 'Close menu' : 'Open menu'}
            onClick={() => setMenu((m) => !m)}
          >
            <span />
            <span />
          </button>
        )}
      </div>
      <nav id={menuId} className="vz-navbar-menu" data-open={menu || undefined} aria-label="Mobile">
        {links.map((l, i) => (
          <a
            key={l.href}
            href={l.href}
            style={{ '--vz-i': i } as CSSProperties}
            tabIndex={menu ? 0 : -1}
            onClick={() => setMenu(false)}
          >
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  );
}

// ——————————————————————————— Accordion ———————————————————————————

export interface AccordionItem {
  id: string;
  title: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Allow several open at once. Default false. */
  multiple?: boolean;
  defaultOpen?: string[];
  open?: string[];
  onOpenChange?: (open: string[]) => void;
  className?: string;
}

/** Sections that open with a spring on their height — content pours in like liquid. */
export function Accordion({
  items,
  multiple = false,
  defaultOpen = [],
  open,
  onOpenChange,
  className,
}: AccordionProps) {
  const [inner, setInner] = useState<string[]>(defaultOpen);
  const current = open ?? inner;
  const toggle = (id: string) => {
    const isOpen = current.includes(id);
    const next = isOpen ? current.filter((x) => x !== id) : multiple ? [...current, id] : [id];
    if (open === undefined) setInner(next);
    onOpenChange?.(next);
  };
  const base = useId();
  return (
    <div className={cx('vz-accordion', className)}>
      {items.map((item) => (
        <AccordionSection
          key={item.id}
          item={item}
          open={current.includes(item.id)}
          onToggle={() => toggle(item.id)}
          id={`${base}-${item.id}`}
        />
      ))}
    </div>
  );
}

function AccordionSection({
  item,
  open,
  onToggle,
  id,
}: {
  item: AccordionItem;
  open: boolean;
  onToggle: () => void;
  id: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const spring = useRef<Spring | null>(null);
  const first = useRef(true);

  const getSpring = useCallback(() => {
    spring.current ??= new Spring({
      ...resolveSpring({ stiffness: 260, damping: 26 }),
      from: 0,
      onUpdate: (v) => {
        const p = panel.current;
        if (!p) return;
        p.style.height = `${Math.max(v, 0)}px`;
      },
      onRest: (v) => {
        // At rest, let the content size itself (responsive, dynamic content).
        if (panel.current && v > 0) panel.current.style.height = 'auto';
      },
    });
    return spring.current;
  }, []);

  useLayoutEffect(() => {
    const p = panel.current;
    const content = inner.current;
    if (!p || !content) return;
    const s = getSpring();
    const target = open ? content.offsetHeight : 0;
    if (first.current) {
      first.current = false;
      p.style.height = open ? 'auto' : '0px';
      s.jump(target);
      return;
    }
    // Start from the real current height, even if it was 'auto'.
    s.jump(p.offsetHeight);
    s.set(target);
  }, [open, getSpring]);

  return (
    <div className="vz-accordion-item" data-open={open || undefined}>
      <h3 className="vz-accordion-heading">
        <button
          type="button"
          id={`${id}-trigger`}
          className="vz-accordion-trigger"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          disabled={item.disabled}
          onClick={onToggle}
        >
          <span>{item.title}</span>
          <svg
            className="vz-accordion-chevron"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </h3>
      <div
        ref={panel}
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-trigger`}
        className="vz-accordion-panel"
        hidden={false}
        inert={!open || undefined}
      >
        <div ref={inner} className="vz-accordion-content">
          {item.content}
        </div>
      </div>
    </div>
  );
}
