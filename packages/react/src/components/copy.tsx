import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { copyToClipboard } from '@vizzele/core';
import { cx } from '../hooks/utils';

export type CopyState = 'idle' | 'copied' | 'error';

/** Copies text and remembers for `timeout` ms that it did — for building your own copy UI. */
export function useClipboard(timeout = 1800) {
  const [state, setState] = useState<CopyState>('idle');
  const [count, setCount] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = useCallback(
    async (text: string) => {
      const ok = await copyToClipboard(text);
      clearTimeout(timer.current);
      setState(ok ? 'copied' : 'error');
      setCount((c) => c + 1);
      timer.current = setTimeout(() => setState('idle'), timeout);
      return ok;
    },
    [timeout],
  );
  return { copy, state, copied: state === 'copied', count };
}

export interface CopyButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'value' | 'onCopy'
> {
  /** The text to copy, or a function that builds it at click time. */
  value: string | (() => string);
  /** Shown once copied. Default "Copied". */
  copiedLabel?: ReactNode;
  /** Announced to screen readers once copied. Default "Copied to clipboard". */
  announce?: string;
  /** How long the copied state lasts, ms. Default 1800. */
  timeout?: number;
  size?: 'sm' | 'md';
  onCopy?: (text: string, ok: boolean) => void;
}

const DROPS = [0, 60, 120, 180, 240, 300];

/**
 * A copy button that answers like liquid: the icon folds into a check that draws itself, a
 * wash of iridescent light spreads from where you pressed, droplets burst out and — for the
 * icon-only version — a "Copied" bubble rises off the button. Screen readers hear it too.
 */
export const CopyButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, CopyButtonProps>(
  function CopyButton(
    {
      value,
      copiedLabel = 'Copied',
      announce = 'Copied to clipboard',
      timeout,
      size = 'md',
      onCopy,
      onClick,
      className,
      style,
      children,
      ...rest
    },
    ref,
  ) {
    const { copy, state, count } = useClipboard(timeout);
    const [origin, setOrigin] = useState({ x: '50%', y: '50%' });
    const iconOnly = children === undefined || children === null;
    return (
      <>
        <button
          ref={ref}
          type="button"
          className={cx('vz-copy', className)}
          data-state={state}
          data-size={size}
          data-icon-only={iconOnly || undefined}
          aria-label={iconOnly ? (rest['aria-label'] ?? 'Copy to clipboard') : undefined}
          style={{ '--vz-copy-x': origin.x, '--vz-copy-y': origin.y, ...style } as CSSProperties}
          onClick={async (e) => {
            onClick?.(e);
            if (e.defaultPrevented) return;
            const r = e.currentTarget.getBoundingClientRect();
            // Keyboard clicks have no position: the wash starts from the centre.
            if (e.clientX || e.clientY)
              setOrigin({ x: `${e.clientX - r.left}px`, y: `${e.clientY - r.top}px` });
            else setOrigin({ x: '50%', y: '50%' });
            const text = typeof value === 'function' ? value() : value;
            const ok = await copy(text);
            onCopy?.(text, ok);
          }}
          {...rest}
        >
          <span key={`wash-${count}`} className="vz-copy-wash" aria-hidden="true" />
          <span className="vz-copy-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <rect className="vz-copy-sheet" x="8.5" y="8.5" width="11" height="11" rx="2.6" />
              <path
                className="vz-copy-sheet vz-copy-sheet-back"
                d="M15.5 8.5V6.6a2.1 2.1 0 0 0-2.1-2.1H6.6a2.1 2.1 0 0 0-2.1 2.1v6.8a2.1 2.1 0 0 0 2.1 2.1h1.9"
              />
              <path className="vz-copy-check" d="M5 12.6l4.4 4.4L19 7.4" pathLength={1} />
              <path className="vz-copy-cross" d="M7 7l10 10M17 7L7 17" pathLength={1} />
            </svg>
          </span>
          {!iconOnly && (
            <span className="vz-copy-text">
              <span className="vz-copy-idle">{children}</span>
              <span className="vz-copy-done" aria-hidden="true">
                {state === 'error' ? 'Failed' : copiedLabel}
              </span>
            </span>
          )}
          <span key={`drops-${count}`} className="vz-copy-drops" aria-hidden="true">
            {state === 'copied' &&
              DROPS.map((a) => <i key={a} style={{ '--vz-a': `${a}deg` } as CSSProperties} />)}
          </span>
          {iconOnly && (
            <span key={`bubble-${count}`} className="vz-copy-bubble" aria-hidden="true">
              {state === 'error' ? 'Failed' : copiedLabel}
            </span>
          )}
        </button>
        {/* Outside the button, so the announcement never becomes part of its name. */}
        <span className="vz-sr-only" role="status">
          {state === 'copied' ? announce : state === 'error' ? 'Copy failed' : ''}
        </span>
      </>
    );
  },
);
