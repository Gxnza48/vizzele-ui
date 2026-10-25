import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { Spring, resolveSpring } from '@vizzele/core';
import { cx, useIsomorphicLayoutEffect, useLatest } from '../hooks/utils';

export interface SidebarItem {
  href: string;
  label: ReactNode;
  icon?: ReactNode;
  /** A small pill after the label, e.g. "New" or a count. */
  badge?: ReactNode;
}

export interface SidebarSection {
  title?: ReactNode;
  items: SidebarItem[];
  /** The title becomes a button that folds the section. */
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export interface SidebarProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  sections: SidebarSection[];
  /** href of the current page. */
  active?: string;
  /** Link component, e.g. Next.js `Link`. Default `a`. */
  linkAs?: ElementType;
  header?: ReactNode;
  footer?: ReactNode;
  /** `panel` = a glass panel, `plain` = no background. Default `panel`. */
  variant?: 'panel' | 'plain';
  /** Accessible name. Default "Sidebar". */
  label?: string;
  onNavigate?: (href: string) => void;
}

const fast = /* @__PURE__ */ resolveSpring({ stiffness: 520, damping: 36 });
const slow = /* @__PURE__ */ resolveSpring({ stiffness: 170, damping: 19 });

/**
 * Navigation with a liquid current-page marker: when the page changes, its leading edge races
 * to the new link and the trailing edge follows, so it stretches between them and settles with
 * a wobble. A soft light follows the hovered link, and an iridescent edge glows near the pointer.
 */
export function Sidebar({
  sections,
  active,
  linkAs: Link = 'a',
  header,
  footer,
  variant = 'panel',
  label = 'Sidebar',
  onNavigate,
  className,
  onPointerMove,
  ...rest
}: SidebarProps) {
  const base = useId();
  const scroll = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const marker = useRef<HTMLSpanElement>(null);
  const edges = useRef<{ top: Spring; bottom: Spring } | null>(null);
  const [open, setOpen] = useState(() => sections.map((s) => s.defaultOpen ?? true));
  const [hover, setHover] = useState<{ top: number; height: number } | null>(null);
  // Read through a ref: the ResizeObserver below outlives the render that created it.
  const current = useLatest(active);

  const place = (animate: boolean) => {
    const box = scroll.current;
    const ind = marker.current;
    if (!box || !ind) return;
    const href = current.current;
    const link = href
      ? box.querySelector<HTMLElement>(`[data-vz-href="${CSS.escape(href)}"]`)
      : null;
    const hidden = !link || !!link.closest('[data-open="false"]');
    ind.dataset.hidden = String(hidden);
    if (!link || hidden) return;
    const r = link.getBoundingClientRect();
    const top = r.top - box.getBoundingClientRect().top + box.scrollTop;
    const bottom = top + r.height;
    const paint = () => {
      const e = edges.current!;
      ind.style.transform = `translateY(${e.top.value}px)`;
      ind.style.height = `${Math.max(e.bottom.value - e.top.value, 4)}px`;
    };
    if (!edges.current) {
      edges.current = {
        top: new Spring({ from: top, onUpdate: paint }),
        bottom: new Spring({ from: bottom, onUpdate: paint }),
      };
      paint();
      return;
    }
    const e = edges.current;
    if (!animate) {
      e.top.jump(top);
      e.bottom.jump(bottom);
      return;
    }
    // Leading edge snappy, trailing edge lazy: the marker flows instead of jumping.
    const down = top > e.top.target;
    e.top.set(top, { config: down ? slow : fast });
    e.bottom.set(bottom, { config: down ? fast : slow });
  };

  useIsomorphicLayoutEffect(() => place(true), [active]);

  useEffect(() => {
    // On load, scroll the current link into view without moving the page.
    const box = scroll.current;
    const link = active
      ? box?.querySelector<HTMLElement>(`[data-vz-href="${CSS.escape(active)}"]`)
      : null;
    if (box && link) {
      const top = link.offsetTop - box.offsetTop;
      if (top < box.scrollTop || top > box.scrollTop + box.clientHeight - 40)
        box.scrollTop = top - box.clientHeight / 3;
    }
    // Folding sections move everything below them: keep the marker glued to its link.
    if (!content.current || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => place(false));
    ro.observe(content.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      edges.current?.top.stop();
      edges.current?.bottom.stop();
    },
    [],
  );

  const showHover = (el: HTMLElement) => {
    const box = scroll.current;
    if (!box) return;
    const r = el.getBoundingClientRect();
    setHover({ top: r.top - box.getBoundingClientRect().top + box.scrollTop, height: r.height });
  };

  return (
    <nav
      className={cx('vz-sidebar', className)}
      data-variant={variant}
      aria-label={label}
      onPointerMove={(e) => {
        onPointerMove?.(e);
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--vz-sy', `${e.clientY - r.top}px`);
      }}
      {...rest}
    >
      {header && <div className="vz-sidebar-header">{header}</div>}
      <div ref={scroll} className="vz-sidebar-scroll" onPointerLeave={() => setHover(null)}>
        <span ref={marker} className="vz-sidebar-marker" aria-hidden="true" data-hidden="true" />
        <span
          className="vz-sidebar-hover"
          aria-hidden="true"
          data-on={hover ? 'true' : 'false'}
          style={
            hover
              ? ({ '--vz-ht': `${hover.top}px`, '--vz-hh': `${hover.height}px` } as CSSProperties)
              : undefined
          }
        />
        <div ref={content} className="vz-sidebar-content">
          {sections.map((section, i) => {
            const id = `${base}-s${i}`;
            const isOpen = !section.collapsible || open[i] !== false;
            return (
              <div key={id} className="vz-sidebar-section">
                {section.title !== undefined &&
                  (section.collapsible ? (
                    <button
                      type="button"
                      className="vz-sidebar-heading"
                      aria-expanded={isOpen}
                      aria-controls={id}
                      onClick={() => setOpen((o) => o.map((v, j) => (j === i ? !isOpen : v)))}
                    >
                      <span>{section.title}</span>
                      <svg viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M4 6l4 4 4-4" />
                      </svg>
                    </button>
                  ) : (
                    <p className="vz-sidebar-heading" id={`${id}-t`}>
                      {section.title}
                    </p>
                  ))}
                <div
                  className="vz-sidebar-fold"
                  id={id}
                  data-open={String(isOpen)}
                  aria-hidden={isOpen ? undefined : true}
                >
                  <ul
                    aria-labelledby={
                      section.title !== undefined && !section.collapsible ? `${id}-t` : undefined
                    }
                  >
                    {section.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="vz-sidebar-link"
                          data-vz-href={item.href}
                          aria-current={item.href === active ? 'page' : undefined}
                          tabIndex={isOpen ? undefined : -1}
                          onPointerEnter={(e: ReactPointerEvent<HTMLElement>) =>
                            showHover(e.currentTarget)
                          }
                          onClick={() => onNavigate?.(item.href)}
                        >
                          {item.icon && (
                            <span className="vz-sidebar-icon" aria-hidden="true">
                              {item.icon}
                            </span>
                          )}
                          <span className="vz-sidebar-label">{item.label}</span>
                          {item.badge !== undefined && (
                            <span className="vz-sidebar-badge">{item.badge}</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {footer && <div className="vz-sidebar-footer">{footer}</div>}
    </nav>
  );
}
