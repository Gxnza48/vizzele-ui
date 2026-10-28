import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { observeVisibility } from '@vizzele/core';
import { cx, useMergedRef } from '../hooks/utils';

export interface LazyMountProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  /** How far outside the viewport to start mounting, as a CSS margin. Default "50% 0px". */
  margin?: string;
  /** Space to hold until the children mount, so the page doesn't jump. */
  minHeight?: number | string;
  /** Shown until the children mount (also what the server renders). */
  placeholder?: ReactNode;
  /** Also mount when the browser goes idle, even if never scrolled to. Default false. */
  idle?: boolean;
  /** Element to render. Default "div". */
  as?: ElementType;
}

/**
 * Mounts its children only when they come near the viewport — the WebGL background, the 3D
 * phone, the chart three screens down cost nothing until they're about to be seen. Pair it
 * with `React.lazy` / `next/dynamic` and their code isn't even downloaded before then.
 * Once mounted, the children stay mounted (their own effects already pause off-screen).
 */
export const LazyMount = /* @__PURE__ */ forwardRef<HTMLElement, LazyMountProps>(function LazyMount(
  {
    children,
    margin = '50% 0px',
    minHeight,
    placeholder = null,
    idle = false,
    as: Tag = 'div',
    className,
    style,
    ...rest
  },
  forwarded,
) {
  const local = useRef<HTMLElement>(null);
  const ref = useMergedRef(local, forwarded);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const el = local.current;
    if (!el || mounted) return;
    const stop = observeVisibility(el, (visible) => visible && setMounted(true), { margin });
    let cancelIdle = () => {};
    if (idle) {
      const w = window as Window & {
        requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
        cancelIdleCallback?: (id: number) => void;
      };
      if (w.requestIdleCallback) {
        const id = w.requestIdleCallback(() => setMounted(true), { timeout: 4000 });
        cancelIdle = () => w.cancelIdleCallback?.(id);
      } else {
        const id = window.setTimeout(() => setMounted(true), 1500);
        cancelIdle = () => window.clearTimeout(id);
      }
    }
    return () => {
      stop();
      cancelIdle();
    };
  }, [mounted, margin, idle]);

  return (
    <Tag
      ref={ref}
      className={cx('vz-lazy', className)}
      data-mounted={mounted ? '' : undefined}
      style={
        mounted || minHeight === undefined ? style : ({ minHeight, ...style } as CSSProperties)
      }
      {...rest}
    >
      {mounted ? children : placeholder}
    </Tag>
  );
});
