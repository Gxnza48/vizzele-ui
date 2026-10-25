import {
  forwardRef,
  useEffect,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import {
  holdToConfirm,
  liquidFocus,
  liquidSelection,
  surfaceTension,
  type HoldToConfirmOptions,
  type LiquidFocusOptions,
  type SurfaceTensionOptions,
} from '@vizzele/core';
import { useVizzeleEffect } from '../hooks/effects';
import { cx, useLatest, useMergedRef } from '../hooks/utils';
import { _strip as strip } from './pointer';

export type LiquidFocusProps = LiquidFocusOptions;

/**
 * Mount once (e.g. in your root layout): keyboard focus becomes a drop of mercury that travels
 * from element to element, stretching toward where focus went.
 */
export function LiquidFocus({ offset, keyboardOnly }: LiquidFocusProps) {
  const opts = useLatest(strip({ offset, keyboardOnly } as LiquidFocusOptions));
  useEffect(() => {
    const inst = liquidFocus(opts.current);
    return () => inst.destroy();
  }, [opts]);
  return null;
}

const selectionIn = (el: HTMLElement) => liquidSelection({ root: el });

export interface LiquidSelectionProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
}

/** Text selected inside becomes a blob of liquid light that stretches and fuses across lines. */
export const LiquidSelection = /* @__PURE__ */ forwardRef<HTMLElement, LiquidSelectionProps>(
  function LiquidSelection({ as: Tag = 'div', ...rest }, ref) {
    const own = useVizzeleEffect(selectionIn);
    return <Tag ref={useMergedRef(ref, own)} {...rest} />;
  },
);

export interface HoldButtonProps
  extends
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onProgress'>,
    Omit<HoldToConfirmOptions, 'onConfirm'> {
  onConfirm?: () => void;
  /** 'danger' fills with red liquid (destructive actions); 'liquid' with the iridescent one. */
  tone?: 'danger' | 'liquid';
  /** Text shown (and announced) once confirmed. */
  confirmedLabel?: ReactNode;
  /** Instruction for screen readers. Default "Press and hold to confirm". */
  hint?: string;
}

/**
 * A hold-to-confirm button that fills with liquid. The surface sloshes when you move, splashes
 * where you press and drains if you let go early — so an accidental tap can never confirm.
 */
export const HoldButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, HoldButtonProps>(
  function HoldButton(
    {
      duration,
      resetAfter,
      onProgress,
      onConfirm,
      tone = 'danger',
      confirmedLabel = 'Confirmed',
      hint = 'Press and hold to confirm',
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const [done, setDone] = useState(false);
    const hintId = useId();
    const after = resetAfter ?? 1600;
    const own = useVizzeleEffect<HoldToConfirmOptions, HTMLButtonElement>(
      holdToConfirm,
      strip({
        duration,
        resetAfter: after,
        onProgress,
        onConfirm: () => {
          setDone(true);
          if (after > 0) setTimeout(() => setDone(false), after);
          onConfirm?.();
        },
      } as HoldToConfirmOptions),
    );
    return (
      <button
        ref={useMergedRef(ref, own)}
        type="button"
        className={cx('vz-button vz-hold-btn', className)}
        data-tone={tone}
        data-size="lg"
        aria-describedby={hintId}
        {...rest}
      >
        <span className="vz-hold-label">{done ? confirmedLabel : children}</span>
        <span id={hintId} className="vz-sr-only">
          {hint}
        </span>
        <span className="vz-sr-only" aria-live="polite">
          {done ? confirmedLabel : ''}
        </span>
      </button>
    );
  },
);

export interface SurfaceTensionProps
  extends HTMLAttributes<HTMLElement>, Omit<SurfaceTensionOptions, 'selector'> {
  as?: ElementType;
  /** Which descendants become drops. Default: direct children. */
  itemSelector?: string;
}

/**
 * Its children sit like drops of liquid: they lean toward the pointer, fuse with their
 * neighbours through a meniscus, and a droplet follows the pointer and merges with them.
 */
export const SurfaceTension = /* @__PURE__ */ forwardRef<HTMLElement, SurfaceTensionProps>(
  function SurfaceTension(
    { as: Tag = 'div', reach, droplet, itemSelector, className, ...rest },
    ref,
  ) {
    const own = useVizzeleEffect(
      surfaceTension,
      strip({ reach, droplet, selector: itemSelector } as SurfaceTensionOptions),
    );
    return <Tag ref={useMergedRef(ref, own)} className={cx('vz-tension', className)} {...rest} />;
  },
);
