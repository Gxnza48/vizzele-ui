import {
  forwardRef,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { wordmark, type WordmarkOptions } from '@vizzele/core';
import { useVizzeleEffect } from '../hooks/effects';
import { cx, useMergedRef } from '../hooks/utils';
import { _strip as strip } from './pointer';

export interface WordmarkProps extends HTMLAttributes<HTMLDivElement>, WordmarkOptions {
  text: string;
}

/**
 * Giant text made of liquid light: letters rise out of a surface when they scroll into view,
 * reach up toward the pointer and wobble when pressed, while a spotlight lights the
 * iridescent fill. Screen readers read the text once.
 */
export const Wordmark = /* @__PURE__ */ forwardRef<HTMLDivElement, WordmarkProps>(function Wordmark(
  { text, fit, lift, reach, entrance, className, ...rest },
  ref,
) {
  const own = useVizzeleEffect<WordmarkOptions, HTMLDivElement>(
    wordmark,
    strip({ fit, lift, reach, entrance } as WordmarkOptions),
  );
  return (
    <div ref={useMergedRef(ref, own)} className={cx('vz-wordmark', className)} {...rest}>
      <span className="vz-sr-only">{text}</span>
      <span className="vz-wordmark-glyphs" aria-hidden="true">
        {Array.from(text).map((c, i) => (
          <span key={i} className="vz-wordmark-char" style={{ '--vz-i': i } as CSSProperties}>
            {c === ' ' ? ' ' : c}
          </span>
        ))}
      </span>
      <span className="vz-wordmark-surface" aria-hidden="true" />
    </div>
  );
});

export interface FooterLink {
  href: string;
  label: ReactNode;
  /** Opens in a new tab. Default: true for absolute http(s) URLs. */
  external?: boolean;
}

export interface FooterColumn {
  title: ReactNode;
  links: FooterLink[];
}

export interface FooterProps extends HTMLAttributes<HTMLElement> {
  /** Logo / name, top left. */
  brand?: ReactNode;
  tagline?: ReactNode;
  columns?: FooterColumn[];
  /** Bottom row, left (e.g. the copyright). */
  legal?: ReactNode;
  /** Bottom row, right. */
  meta?: ReactNode;
  /** Giant text across the bottom. `false` hides it. */
  wordmark?: string | false;
  wordmarkOptions?: WordmarkOptions;
  /** Link component, e.g. Next.js `Link`. Default `a`. */
  linkAs?: ElementType;
}

/**
 * A footer that ends the page with weight: link columns whose underlines pour in from the left,
 * a hairline of light that brightens under the pointer, and a giant liquid wordmark rising out
 * of the bottom edge. `children` go under the brand (a newsletter form, social links…).
 */
export const Footer = /* @__PURE__ */ forwardRef<HTMLElement, FooterProps>(function Footer(
  {
    brand,
    tagline,
    columns = [],
    legal,
    meta,
    wordmark: text,
    wordmarkOptions,
    linkAs: Link = 'a',
    className,
    children,
    onPointerMove,
    ...rest
  },
  ref,
) {
  return (
    <footer
      ref={ref}
      className={cx('vz-footer', className)}
      onPointerMove={(e) => {
        onPointerMove?.(e);
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--vz-fx', `${e.clientX - r.left}px`);
      }}
      {...rest}
    >
      <div className="vz-footer-inner">
        <div className="vz-footer-top">
          {(brand || tagline || children) && (
            <div className="vz-footer-brand">
              {brand}
              {tagline && <p className="vz-footer-tagline">{tagline}</p>}
              {children}
            </div>
          )}
          {columns.length > 0 && (
            <nav className="vz-footer-cols" aria-label="Footer">
              {columns.map((col, i) => (
                <div key={i} className="vz-footer-col">
                  <p className="vz-footer-title">{col.title}</p>
                  <ul>
                    {col.links.map((l) => {
                      const external = l.external ?? /^https?:\/\//.test(l.href);
                      return (
                        <li key={l.href}>
                          {external ? (
                            <a
                              href={l.href}
                              className="vz-footer-link"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {l.label}
                              <svg viewBox="0 0 12 12" aria-hidden="true">
                                <path d="M4 3h5v5M9 3L3.5 8.5" />
                              </svg>
                              <span className="vz-sr-only"> (opens in a new tab)</span>
                            </a>
                          ) : (
                            <Link href={l.href} className="vz-footer-link">
                              {l.label}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          )}
        </div>
        {(legal || meta) && (
          <div className="vz-footer-bottom">
            {legal && <span>{legal}</span>}
            {meta && <span>{meta}</span>}
          </div>
        )}
      </div>
      {text && <Wordmark text={text} {...wordmarkOptions} />}
    </footer>
  );
});
