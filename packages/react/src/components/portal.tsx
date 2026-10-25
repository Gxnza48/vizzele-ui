import { forwardRef, useId, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { textPortal, type TextPortalOptions } from '@vizzele/core';
import { useVizzeleEffect } from '../hooks/effects';
import { cx, useMergedRef } from '../hooks/utils';
import { _strip as strip } from './pointer';

export interface TextPortalProps
  extends
    Omit<HTMLAttributes<HTMLElement>, 'children' | 'onProgress'>,
    Omit<TextPortalOptions, 'text'> {
  /** The giant word you dive into. Decorative: name the section with your own heading. */
  text: string;
  /** The scene inside the word — what fills the screen once you're through. */
  children?: ReactNode;
  /** Shown over the word at the start and faded out as the dive begins (a tagline, a scroll hint). */
  cover?: ReactNode;
}

/**
 * Zoom-through text: a giant word is cut out of the page and scrolling dives into one of its
 * letters until the scene behind fills the screen — then the page carries on. One SVG mask and
 * a sticky stage; it only works while on screen. Reduced motion shows the scene, no dive.
 */
export const TextPortal = /* @__PURE__ */ forwardRef<HTMLElement, TextPortalProps>(
  function TextPortal(
    {
      text,
      focus,
      length,
      smooth,
      container,
      onProgress,
      cover,
      className,
      style,
      children,
      ...rest
    },
    ref,
  ) {
    const own = useVizzeleEffect<TextPortalOptions, HTMLElement>(
      textPortal,
      strip({ focus, length, smooth, container, onProgress } as TextPortalOptions),
    );
    const id = `vz-portal-${useId().replace(/[^\w-]/g, '')}`;
    return (
      <section
        ref={useMergedRef(ref, own)}
        className={cx('vz-portal', className)}
        data-state="closed"
        style={{ '--vz-portal-length': length ?? 1.5, ...style } as CSSProperties}
        {...rest}
      >
        <div className="vz-portal-stage">
          <div className="vz-portal-scene">{children}</div>
          <svg className="vz-portal-overlay" aria-hidden="true">
            <defs>
              <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
                <rect width="100%" height="100%" fill="#fff" />
                <g className="vz-portal-zoom">
                  <text
                    className="vz-portal-word"
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {text}
                  </text>
                </g>
              </mask>
            </defs>
            <rect className="vz-portal-fill" width="100%" height="100%" mask={`url(#${id})`} />
          </svg>
          {cover != null && <div className="vz-portal-cover">{cover}</div>}
        </div>
      </section>
    );
  },
);
