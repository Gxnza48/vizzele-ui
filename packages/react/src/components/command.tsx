import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Spring, clamp, prefersReducedMotion } from '@vizzele/core';
import { useModalFocus } from '../hooks/a11y';
import { cx, useIsomorphicLayoutEffect, useLatest } from '../hooks/utils';
import { canPortal } from './overlay';
import { useLiquidHighlight } from './select';

// ——————————————————————————— Fuzzy matching ———————————————————————————

export interface FuzzyMatch {
  score: number;
  /** Indices of the matched characters in the text. */
  indices: number[];
}

/**
 * Subsequence match: every query character must appear in order. Consecutive runs, word
 * starts and an exact prefix score higher. Returns null when it doesn't match.
 */
export function fuzzyMatch(query: string, text: string): FuzzyMatch | null {
  const q = query.trim().toLowerCase();
  if (!q) return { score: 0, indices: [] };
  const t = text.toLowerCase();
  const indices: number[] = [];
  let score = 0;
  let from = 0;
  for (const ch of q) {
    if (ch === ' ') continue;
    const i = t.indexOf(ch, from);
    if (i < 0) return null;
    const prev = indices[indices.length - 1];
    if (prev !== undefined && i === prev + 1) score += 5;
    if (i === 0 || /[\s\-_/.]/.test(t[i - 1]!)) score += 8;
    score -= Math.min(i - from, 6) * 0.5;
    indices.push(i);
    from = i + 1;
  }
  if (t.startsWith(q)) score += 20;
  return { score: score - t.length * 0.05, indices };
}

function Highlighted({ text, indices }: { text: string; indices: number[] }) {
  if (!indices.length) return <>{text}</>;
  const set = new Set(indices);
  const parts: ReactNode[] = [];
  let run = '';
  let marked = false;
  const flush = (key: number) => {
    if (!run) return;
    parts.push(marked ? <mark key={key}>{run}</mark> : <Fragment key={key}>{run}</Fragment>);
    run = '';
  };
  for (let i = 0; i < text.length; i++) {
    if (set.has(i) !== marked) {
      flush(i);
      marked = !marked;
    }
    run += text[i];
  }
  flush(text.length);
  return <>{parts}</>;
}

// ——————————————————————————— Command palette ———————————————————————————

export interface CommandItem {
  /** Stable key. Defaults to the label. */
  id?: string;
  label: string;
  description?: ReactNode;
  icon?: ReactNode;
  /** Section heading the item is listed under. */
  group?: string;
  /** Extra words that should find this item. */
  keywords?: string[];
  /** Keyboard hint shown on the right, e.g. "⌘N". */
  shortcut?: string;
  onSelect?: () => void;
  disabled?: boolean;
}

export interface CommandPaletteProps {
  items: CommandItem[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Key that toggles the palette together with ⌘ (macOS) or Ctrl. Default `'k'`;
   * `false` turns the shortcut off.
   */
  hotkey?: string | false;
  placeholder?: string;
  /** Shown when nothing matches. Receives the query. */
  empty?: ReactNode | ((query: string) => ReactNode);
  /** Accessible name of the dialog. Default "Command palette". */
  label?: string;
  /** Keep it open after running a command. Default false. */
  keepOpen?: boolean;
  /** Footer content; defaults to keyboard hints. `null` hides it. */
  footer?: ReactNode;
  className?: string;
}

interface Result {
  item: CommandItem;
  key: string;
  indices: number[];
  score: number;
}

function search(items: CommandItem[], query: string): Result[] {
  const out: Result[] = [];
  items.forEach((item, order) => {
    const key = item.id ?? item.label;
    const label = fuzzyMatch(query, item.label);
    if (label) {
      out.push({ item, key, indices: label.indices, score: label.score - order * 1e-4 });
      return;
    }
    // Keywords and descriptions match as plain text — fuzzy matching long prose finds everything.
    const q = query.trim().toLowerCase();
    const extra = [
      ...(item.keywords ?? []),
      typeof item.description === 'string' ? item.description : '',
    ].some((w) => w.toLowerCase().includes(q));
    if (extra) out.push({ item, key, indices: [], score: -30 - order * 1e-4 });
  });
  if (query.trim()) out.sort((a, b) => b.score - a.score);
  // Keep sections together, ordered by their best result.
  const groups = new Map<string, Result[]>();
  for (const r of out) {
    const g = r.item.group ?? '';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(r);
  }
  return [...groups.values()].flat();
}

/** Springs a box's height to its content, so the list breathes as results come and go. */
function useLiquidHeight(box: React.RefObject<HTMLElement | null>, deps: unknown) {
  const spring = useRef<Spring | null>(null);
  const owner = useRef<HTMLElement | null>(null);
  useIsomorphicLayoutEffect(() => {
    const el = box.current;
    const inner = el?.firstElementChild as HTMLElement | null;
    if (!el || !inner) return;
    const max = parseFloat(getComputedStyle(el).maxHeight) || Infinity;
    const next = Math.min(inner.offsetHeight, max);
    if (owner.current !== el) {
      spring.current?.stop();
      owner.current = el;
      spring.current = new Spring({
        stiffness: 380,
        damping: 30,
        from: next,
        onUpdate: (v) => (el.style.height = `${Math.max(v, 0)}px`),
      });
      el.style.height = `${next}px`;
      return;
    }
    spring.current?.set(next);
  }, [deps]);
  useEffect(() => () => void spring.current?.stop(), []);
}

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

const SearchIcon = () => (
  <svg
    className="vz-command-search"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
    <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/**
 * A ⌘K command palette in liquid light: it drops in over a blurred page, the list springs to
 * fit its results, matched letters glow and the same liquid highlight slides between commands.
 */
export function CommandPalette({
  items,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  hotkey = 'k',
  placeholder = 'Type a command or search…',
  empty = (q: string) => <>No results for “{q}”</>,
  label = 'Command palette',
  keepOpen = false,
  footer,
  className,
}: CommandPaletteProps) {
  const [inner, setInner] = useState(defaultOpen);
  const open = openProp ?? inner;
  const [mounted, setMounted] = useState(false);
  // Portals only exist on the client: never render during SSR or the hydration pass.
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const listBox = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const blob = useRef<HTMLSpanElement>(null);
  const progress = useRef<Spring | null>(null);
  const id = useId();
  const listId = `${id}-list`;
  const highlight = useLiquidHighlight(list, blob);

  const results = useMemo(() => search(items, query), [items, query]);
  const enabled = results.map((r, i) => (r.item.disabled ? -1 : i)).filter((i) => i >= 0);
  const latest = useLatest({ onOpenChange, open, results, enabled, keepOpen });

  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setInner(next);
      latest.current.onOpenChange?.(next);
    },
    [openProp, latest],
  );

  // ⌘K / Ctrl+K toggles.
  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== hotkey.toLowerCase() || !(e.metaKey || e.ctrlKey)) return;
      if (e.altKey || e.shiftKey) return;
      e.preventDefault();
      setOpen(!latest.current.open);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hotkey, setOpen, latest]);

  useEffect(() => setReady(true), []);

  // Mount in the same render that opens it, so keys typed right after ⌘K land in the field.
  const [wasOpen, setWasOpen] = useState(false);
  if (ready && open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setMounted(true);
      setQuery('');
      setActive(0);
    }
  }

  const paint = useCallback((p: number) => {
    const el = panel.current;
    if (el) {
      el.style.opacity = String(clamp(p * 1.6, 0, 1));
      el.style.transform = `translateY(${(1 - p) * -18}px) scale(${0.95 + 0.05 * p})`;
    }
    if (backdrop.current) backdrop.current.style.opacity = String(clamp(p, 0, 1));
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (!mounted) return;
    const s =
      progress.current ?? new Spring({ stiffness: 340, damping: 26, from: 0, onUpdate: paint });
    progress.current = s;
    paint(s.value);
    if (open) {
      s.set(1);
      return;
    }
    if (prefersReducedMotion()) {
      s.jump(0);
      setMounted(false);
      return;
    }
    s.set(0, { config: { stiffness: 420, damping: 36 } });
    let raf = 0;
    const wait = () => {
      if (s.value < 0.02) {
        s.jump(0);
        setMounted(false);
      } else raf = requestAnimationFrame(wait);
    };
    raf = requestAnimationFrame(wait);
    return () => cancelAnimationFrame(raf);
  }, [open, mounted, paint]);

  useEffect(() => () => void progress.current?.stop(), []);

  useModalFocus(panel, mounted && open, () => setOpen(false));
  useEffect(() => {
    if (mounted && open) field.current?.focus({ preventScroll: true });
  }, [mounted, open]);
  useLiquidHeight(listBox, mounted && `${query}|${results.length}`);

  // Keep the active row valid as results change.
  useLayoutEffect(() => {
    setActive((a) => (enabled.includes(a) ? a : (enabled[0] ?? -1)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, results.length]);

  useEffect(() => {
    if (!mounted) return;
    const el = list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`) ?? null;
    highlight(el);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [active, mounted, query, highlight]);

  const run = (i: number) => {
    const r = latest.current.results[i];
    if (!r || r.item.disabled) return;
    if (!latest.current.keepOpen) setOpen(false);
    r.item.onSelect?.();
  };

  const move = (dir: 1 | -1) => {
    const list = latest.current.enabled;
    if (!list.length) return;
    const pos = list.indexOf(active);
    setActive(list[(pos + dir + list.length) % list.length]!);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') move(1);
    else if (e.key === 'ArrowUp') move(-1);
    else if (e.key === 'Enter') run(active);
    else if (e.key === 'Home' && e.ctrlKey) setActive(enabled[0] ?? -1);
    else if (e.key === 'End' && e.ctrlKey) setActive(enabled.at(-1) ?? -1);
    else return;
    e.preventDefault();
  };

  if (!ready || !mounted || !canPortal()) return null;

  const mod = isMac() ? '⌘' : 'Ctrl';
  let lastGroup: string | undefined;
  return createPortal(
    <div className="vz-command-root">
      <div ref={backdrop} className="vz-modal-backdrop" onPointerDown={() => setOpen(false)} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cx('vz-command vz-glass', className)}
      >
        <div className="vz-command-head">
          <SearchIcon />
          <input
            ref={field}
            className="vz-command-input"
            data-vz-focus-ring="off"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              active >= 0 && results[active] ? `${id}-opt-${active}` : undefined
            }
            aria-label={placeholder}
            placeholder={placeholder}
            value={query}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          {hotkey && <kbd className="vz-command-kbd">Esc</kbd>}
        </div>
        <div ref={listBox} className="vz-command-list">
          <div>
            <div ref={list} id={listId} role="listbox" aria-label={label} className="vz-listbox">
              <span ref={blob} className="vz-option-blob" aria-hidden="true" />
              {results.map((r, i) => {
                const g = r.item.group;
                const heading = g && g !== lastGroup;
                lastGroup = g;
                return (
                  <Fragment key={r.key}>
                    {heading && (
                      <div role="presentation" className="vz-menu-label">
                        {g}
                      </div>
                    )}
                    <div
                      id={`${id}-opt-${i}`}
                      role="option"
                      aria-selected={i === active}
                      aria-disabled={r.item.disabled || undefined}
                      data-index={i}
                      data-active={i === active || undefined}
                      className="vz-option vz-command-option"
                      style={{ '--vz-i': Math.min(i, 12) } as CSSProperties}
                      onPointerMove={() => !r.item.disabled && i !== active && setActive(i)}
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={() => run(i)}
                    >
                      {r.item.icon && <span className="vz-option-icon">{r.item.icon}</span>}
                      <span className="vz-option-text">
                        <span className="vz-option-label">
                          <Highlighted text={r.item.label} indices={r.indices} />
                        </span>
                        {r.item.description && (
                          <span className="vz-option-desc">{r.item.description}</span>
                        )}
                      </span>
                      {r.item.shortcut && <kbd className="vz-menu-shortcut">{r.item.shortcut}</kbd>}
                    </div>
                  </Fragment>
                );
              })}
            </div>
            {!results.length && (
              <p className="vz-command-empty" role="status">
                {typeof empty === 'function' ? empty(query) : empty}
              </p>
            )}
          </div>
        </div>
        {footer !== null && (
          <div className="vz-command-foot" aria-hidden={footer === undefined || undefined}>
            {footer ?? (
              <>
                <span>
                  <kbd>↑</kbd>
                  <kbd>↓</kbd> move
                </span>
                <span>
                  <kbd>↵</kbd> run
                </span>
                {hotkey && (
                  <span>
                    <kbd>{mod}</kbd>
                    <kbd>{hotkey.toUpperCase()}</kbd> toggle
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
