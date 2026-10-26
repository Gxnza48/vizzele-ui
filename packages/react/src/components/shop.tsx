import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react';
import { frame, prefersReducedMotion } from '@vizzele/core';
import { cx, useMergedRef } from '../hooks/utils';
import { Marquee } from './media';

const money = (n: number, currency: string, locale?: string | undefined) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n);

/** Eases a displayed number to its new value instead of jumping. */
function useTweened(value: number, ms = 500) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (prefersReducedMotion() || from.current === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = from.current;
    let t = 0;
    const stop = frame.add(({ delta }) => {
      t = Math.min(1, t + (delta * 1000) / ms);
      const v = start + (value - start) * (1 - (1 - t) ** 3);
      from.current = v;
      setShown(v);
      return t < 1;
    }, 'update');
    return stop;
  }, [value, ms]);
  return shown;
}

/** A number whose digits roll up or down when it changes. */
function Roll({ value }: { value: number }) {
  const prev = useRef(value);
  const dir = value >= prev.current ? 'up' : 'down';
  useEffect(() => {
    prev.current = value;
  }, [value]);
  return (
    <span className="vz-roll" aria-hidden="true">
      <span key={value} data-dir={dir}>
        {value}
      </span>
    </span>
  );
}

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} />
  </svg>
);
const BAG = 'M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8zM9 8V6.5a3 3 0 0 1 6 0V8';
const TRASH = 'M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12';

// ——————————————————————————— Fly to cart ———————————————————————————

/**
 * Throws a drop (or a thumbnail) from one element into another along an arc, then gives the
 * target a little bump. Resolves when it lands.
 */
export function flyToCart(
  from: Element,
  to: Element,
  options: { image?: string | undefined; color?: string | undefined } = {},
): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  const bump = () => {
    to.classList.remove('vz-cart-bump');
    void (to as HTMLElement).offsetWidth;
    to.classList.add('vz-cart-bump');
  };
  if (prefersReducedMotion()) {
    bump();
    return Promise.resolve();
  }
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const x0 = a.left + a.width / 2;
  const y0 = a.top + a.height / 2;
  const dx = b.left + b.width / 2 - x0;
  const dy = b.top + b.height / 2 - y0;
  const outer = document.createElement('span');
  outer.className = 'vz-fly';
  outer.setAttribute('aria-hidden', 'true');
  outer.style.cssText = `left:${x0}px;top:${y0}px`;
  const dot = document.createElement('span');
  dot.className = 'vz-fly-dot';
  if (options.image) dot.style.backgroundImage = `url("${options.image}")`;
  if (options.color) dot.style.background = options.color;
  outer.appendChild(dot);
  document.body.appendChild(outer);
  const ms = 650 + Math.min(Math.hypot(dx, dy), 900) * 0.25;
  // X travels evenly while Y is thrown up and falls: together they draw an arc.
  outer.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${dx}px)` }], {
    duration: ms,
    easing: 'cubic-bezier(.3,0,.6,1)',
    fill: 'forwards',
  });
  const lift = Math.min(-60, dy - 120);
  const anim = dot.animate(
    [
      { transform: 'translateY(0) scale(1)' },
      { transform: `translateY(${lift}px) scale(1.15)`, offset: 0.35 },
      { transform: `translateY(${dy}px) scale(0.35)` },
    ],
    { duration: ms, easing: 'ease-in-out', fill: 'forwards' },
  );
  return anim.finished
    .catch(() => {})
    .then(() => {
      outer.remove();
      bump();
    });
}

// ——————————————————————————— Add to cart ———————————————————————————

export interface AddToCartButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Called on click; return a promise to wait before the throw. */
  onAdd?: () => void | Promise<unknown>;
  /** The cart to throw into — a ref or a CSS selector. */
  target?: RefObject<Element | null> | string;
  /** Thumbnail that flies (a URL). Default a coloured drop. */
  image?: string;
  /** Default "Added". */
  addedLabel?: ReactNode;
}

/** "Add to cart" that throws the product into your cart icon, then turns into a check. */
export const AddToCartButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, AddToCartButtonProps>(
  function AddToCartButton(
    {
      onAdd,
      target,
      image,
      addedLabel = 'Added',
      className,
      children = 'Add to cart',
      onClick,
      ...rest
    },
    ref,
  ) {
    const el = useRef<HTMLButtonElement>(null);
    const [state, setState] = useState<'idle' | 'busy' | 'added'>('idle');
    useEffect(() => {
      if (state !== 'added') return;
      const t = setTimeout(() => setState('idle'), 1600);
      return () => clearTimeout(t);
    }, [state]);
    return (
      <button
        ref={useMergedRef(ref, el)}
        type="button"
        className={cx('vz-add-cart', className)}
        data-state={state}
        aria-busy={state === 'busy' || undefined}
        onClick={async (e) => {
          onClick?.(e);
          if (state === 'busy') return;
          setState('busy');
          try {
            await onAdd?.();
          } catch {
            setState('idle');
            return;
          }
          const to = typeof target === 'string' ? document.querySelector(target) : target?.current;
          setState('added');
          if (to && el.current) void flyToCart(el.current, to, { image });
        }}
        {...rest}
      >
        <span className="vz-add-cart-label">
          <Icon d={BAG} />
          {children}
        </span>
        <span className="vz-add-cart-done" aria-hidden={state !== 'added'}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
          {addedLabel}
        </span>
      </button>
    );
  },
);

// ——————————————————————————— Cart button ———————————————————————————

export interface CartButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  count?: number;
  /** Accessible name. Default "Cart". */
  label?: string;
  /** How the count is spoken. Default "3 items". */
  countLabel?: (count: number) => string;
}

/** A bag icon with a count that pops whenever it goes up — the target for AddToCartButton. */
export const CartButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, CartButtonProps>(
  function CartButton(
    { count = 0, label = 'Cart', countLabel = itemsLabel, className, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        className={cx('vz-cart-button', className)}
        aria-label={count ? `${label}, ${countLabel(count)}` : label}
        {...rest}
      >
        <Icon d={BAG} />
        {count > 0 && (
          <span className="vz-cart-count" key={count}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
    );
  },
);

// ——————————————————————————— Shopping cart ———————————————————————————

export interface CartItem {
  id: string;
  name: string;
  /** Unit price. */
  price: number;
  quantity: number;
  /** Image URL or any node. */
  image?: string | ReactNode;
  /** A line under the name — size, colour. */
  meta?: ReactNode;
  /** Most you can have of this one (stock). Default the cart's maxQuantity. */
  max?: number;
}

/** Every word the cart says, for translation. */
export interface ShoppingCartLabels {
  items: (count: number) => string;
  freeShippingUnlocked: ReactNode;
  awayFromFreeShipping: (amount: ReactNode) => ReactNode;
  empty: ReactNode;
  list: string;
  quantityOf: (name: string) => string;
  decrease: string;
  increase: string;
  remove: string;
  subtotal: string;
  shipping: string;
  free: string;
  total: string;
}

const itemsLabel = (n: number) => `${n} ${n === 1 ? 'item' : 'items'}`;

const CART_LABELS: ShoppingCartLabels = {
  items: itemsLabel,
  freeShippingUnlocked: 'Free shipping unlocked ✦',
  awayFromFreeShipping: (amount) => (
    <>
      You’re <b>{amount}</b> away from free shipping
    </>
  ),
  empty: 'Your cart is empty',
  list: 'Items',
  quantityOf: (name) => `Quantity of ${name}`,
  decrease: 'Decrease',
  increase: 'Increase',
  remove: 'Remove',
  subtotal: 'Subtotal',
  shipping: 'Shipping',
  free: 'Free',
  total: 'Total',
};

export interface ShoppingCartProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  items: CartItem[];
  onQuantityChange?: (id: string, quantity: number) => void;
  onRemove?: (id: string) => void;
  /** Return a promise to show a spinner on the button. */
  onCheckout?: () => void | Promise<unknown>;
  /** ISO code. Default 'USD'. */
  currency?: string;
  locale?: string;
  /** Show a bar toward free shipping at this subtotal. */
  freeShippingAt?: number;
  /** Shipping cost below the free threshold. */
  shipping?: number;
  /** Default "Your cart". */
  title?: ReactNode;
  /** Default "Checkout". */
  checkoutLabel?: string;
  /** Default 99. */
  maxQuantity?: number;
  /** Shown when there is nothing in the cart. */
  empty?: ReactNode;
  /** Translate any of the cart's words. */
  labels?: Partial<ShoppingCartLabels>;
  /** Format prices yourself (e.g. without cents). Overrides currency and locale. */
  formatPrice?: (value: number) => string;
}

function Money({ value, format }: { value: number; format: (n: number) => string }) {
  return <>{format(useTweened(value))}</>;
}

/**
 * A cart drawer's contents: line items that slide in and collapse away, quantity steppers whose
 * numbers roll, a liquid bar toward free shipping, and totals that count to their new value.
 */
export const ShoppingCart = /* @__PURE__ */ forwardRef<HTMLDivElement, ShoppingCartProps>(
  function ShoppingCart(
    {
      items,
      onQuantityChange,
      onRemove,
      onCheckout,
      currency = 'USD',
      locale,
      freeShippingAt,
      shipping = 0,
      title = 'Your cart',
      checkoutLabel = 'Checkout',
      maxQuantity = 99,
      empty,
      labels: labelsProp,
      formatPrice,
      className,
      ...rest
    },
    ref,
  ) {
    const t = { ...CART_LABELS, ...labelsProp };
    const [leaving, setLeaving] = useState<Set<string>>(new Set());
    const [busy, setBusy] = useState(false);
    const live = items.filter((i) => !leaving.has(i.id));
    const count = live.reduce((n, i) => n + i.quantity, 0);
    const subtotal = live.reduce((n, i) => n + i.price * i.quantity, 0);
    const free = freeShippingAt !== undefined && subtotal >= freeShippingAt;
    const ship = !count || free ? 0 : shipping;
    const fmt = formatPrice ?? ((n: number) => money(n, currency, locale));

    const remove = (id: string) => {
      if (prefersReducedMotion()) onRemove?.(id);
      else setLeaving((s) => new Set(s).add(id));
    };
    useEffect(() => {
      // Forget ids the parent has already dropped.
      setLeaving((s) => {
        const next = new Set([...s].filter((id) => items.some((i) => i.id === id)));
        return next.size === s.size ? s : next;
      });
    }, [items]);

    return (
      <div ref={ref} className={cx('vz-cart', className)} {...rest}>
        <div className="vz-cart-head">
          <h2 className="vz-cart-title">{title}</h2>
          <span className="vz-cart-items" aria-live="polite">
            {t.items(count)}
          </span>
        </div>

        {freeShippingAt !== undefined && count > 0 && (
          <div className="vz-cart-ship" data-free={free ? '' : undefined}>
            <p>
              {free
                ? t.freeShippingUnlocked
                : t.awayFromFreeShipping(fmt(freeShippingAt - subtotal))}
            </p>
            <span
              className="vz-cart-ship-bar"
              style={{ '--p': Math.min(1, subtotal / freeShippingAt) } as CSSProperties}
            />
          </div>
        )}

        {items.length === 0 ? (
          <div className="vz-cart-empty">
            {empty ?? (
              <>
                <Icon d={BAG} />
                <p>{t.empty}</p>
              </>
            )}
          </div>
        ) : (
          <ul className="vz-cart-list" aria-label={t.list}>
            {items.map((item) => (
              <li
                key={item.id}
                className="vz-cart-line"
                data-leaving={leaving.has(item.id) ? '' : undefined}
                onAnimationEnd={(e) => {
                  // Ignore the rolling numbers inside; only the line's own collapse counts.
                  if (e.target === e.currentTarget && leaving.has(item.id)) onRemove?.(item.id);
                }}
              >
                <div>
                  <div className="vz-cart-thumb">
                    {typeof item.image === 'string' ? <img src={item.image} alt="" /> : item.image}
                  </div>
                  <div className="vz-cart-info">
                    <p className="vz-cart-name">{item.name}</p>
                    {item.meta && <p className="vz-cart-meta">{item.meta}</p>}
                    <div className="vz-cart-qty" role="group" aria-label={t.quantityOf(item.name)}>
                      <button
                        type="button"
                        aria-label={item.quantity <= 1 ? `${t.remove} ${item.name}` : t.decrease}
                        onClick={() =>
                          item.quantity <= 1
                            ? remove(item.id)
                            : onQuantityChange?.(item.id, item.quantity - 1)
                        }
                      >
                        <Icon d={item.quantity <= 1 ? TRASH : 'M6 12h12'} />
                      </button>
                      <output aria-live="polite" aria-label={`${item.quantity}`}>
                        <Roll value={item.quantity} />
                      </output>
                      <button
                        type="button"
                        aria-label={t.increase}
                        disabled={item.quantity >= (item.max ?? maxQuantity)}
                        onClick={() => onQuantityChange?.(item.id, item.quantity + 1)}
                      >
                        <Icon d="M12 6v12M6 12h12" />
                      </button>
                    </div>
                  </div>
                  <div className="vz-cart-price">
                    <Money value={item.price * item.quantity} format={fmt} />
                    <button
                      type="button"
                      className="vz-cart-remove"
                      onClick={() => remove(item.id)}
                    >
                      {t.remove}
                      <span className="vz-sr-only"> {item.name}</span>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <dl className="vz-cart-totals">
          <div>
            <dt>{t.subtotal}</dt>
            <dd>
              <Money value={subtotal} format={fmt} />
            </dd>
          </div>
          {(shipping > 0 || freeShippingAt !== undefined) && (
            <div>
              <dt>{t.shipping}</dt>
              <dd>{ship ? fmt(ship) : count ? t.free : '—'}</dd>
            </div>
          )}
          <div className="vz-cart-total">
            <dt>{t.total}</dt>
            <dd>
              <Money value={subtotal + ship} format={fmt} />
            </dd>
          </div>
        </dl>
        <button
          type="button"
          className="vz-cart-checkout"
          disabled={!count}
          data-busy={busy ? '' : undefined}
          aria-busy={busy || undefined}
          onClick={async () => {
            const r = onCheckout?.();
            if (r && typeof (r as Promise<unknown>).then === 'function') {
              setBusy(true);
              try {
                await r;
              } finally {
                setBusy(false);
              }
            }
          }}
        >
          <span>{checkoutLabel}</span>
          <span className="vz-cart-checkout-total">{fmt(subtotal + ship)}</span>
        </button>
      </div>
    );
  },
);

// ——————————————————————————— Logo marquee ———————————————————————————

export interface LogoMarqueeLogo {
  name: string;
  logo: ReactNode;
  href?: string;
}

export interface LogoMarqueeProps {
  logos: LogoMarqueeLogo[];
  /** Two rows run in opposite directions. Default 1. */
  rows?: 1 | 2;
  /** px per second. Default 40. */
  speed?: number;
  /** Grey until hovered. Default true. */
  grayscale?: boolean;
  /** Gap between logos, px. Default 56. */
  gap?: number;
  /** Accessible name. Default "Sponsors". */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * A sponsors strip: logos glide past, ease to a stop under the pointer, wake to full colour on
 * hover and can be grabbed and thrown. Two rows run against each other.
 */
export function LogoMarquee({
  logos,
  rows = 1,
  speed = 40,
  grayscale = true,
  gap = 56,
  label = 'Sponsors',
  className,
  style,
}: LogoMarqueeProps) {
  const half = Math.ceil(logos.length / 2);
  const sets = rows === 2 ? [logos.slice(0, half), logos.slice(half)] : [logos];
  return (
    <div className={cx('vz-logos', className)} data-gray={grayscale ? '' : undefined} style={style}>
      {sets.map((set, r) => (
        <Marquee
          key={r}
          speed={speed * (r ? 0.8 : 1)}
          reverse={r === 1}
          gap={gap}
          label={r ? `${label}, row 2` : label}
        >
          {set.map((l) =>
            l.href ? (
              <a key={l.name} className="vz-logo" href={l.href} aria-label={l.name}>
                {l.logo}
              </a>
            ) : (
              <span key={l.name} className="vz-logo" role="img" aria-label={l.name}>
                {l.logo}
              </span>
            ),
          )}
        </Marquee>
      ))}
    </div>
  );
}

// ——————————————————————————— Countdown ———————————————————————————

type Unit = 'days' | 'hours' | 'minutes' | 'seconds';

export interface CountdownProps extends HTMLAttributes<HTMLDivElement> {
  /** The moment it reaches zero. */
  to: Date | string | number;
  /** Default all four. */
  units?: Unit[];
  labels?: Partial<Record<Unit, string>>;
  onComplete?: () => void;
}

const SIZES: Record<Unit, number> = { days: 86400, hours: 3600, minutes: 60, seconds: 1 };

const split = (ms: number, units: Unit[]) => {
  let left = Math.max(0, Math.floor(ms / 1000));
  return units.map((u) => {
    const v = Math.floor(left / SIZES[u]);
    left -= v * SIZES[u];
    return v;
  });
};

/** A countdown whose digits roll over like an odometer — for launches, drops and sales. */
export const Countdown = /* @__PURE__ */ forwardRef<HTMLDivElement, CountdownProps>(
  function Countdown(
    { to, units = ['days', 'hours', 'minutes', 'seconds'], labels, onComplete, className, ...rest },
    ref,
  ) {
    const target = new Date(to).getTime();
    const [now, setNow] = useState<number | null>(null);
    const done = useRef(false);
    useEffect(() => {
      let t: ReturnType<typeof setTimeout>;
      const tick = () => {
        const n = Date.now();
        setNow(n);
        if (n >= target) {
          if (!done.current) onComplete?.();
          done.current = true;
          return;
        }
        done.current = false;
        t = setTimeout(tick, 1000 - (n % 1000) + 5);
      };
      tick();
      return () => clearTimeout(t);
    }, [target, onComplete]);
    const values = now === null ? units.map(() => -1) : split(target - now, units);
    const name = (u: Unit, v: number) => labels?.[u] ?? (v === 1 ? u.slice(0, -1) : u);
    const spoken =
      now === null
        ? ''
        : units
            .map((u, i) => (u === 'seconds' ? '' : `${values[i]} ${name(u, values[i]!)}`))
            .filter(Boolean)
            .join(', ');
    return (
      <div ref={ref} className={cx('vz-countdown', className)} role="timer" {...rest}>
        <span className="vz-sr-only">{spoken || 'Loading'}</span>
        {units.map((u, i) => {
          const v = values[i]!;
          const text = v < 0 ? '--' : String(v).padStart(2, '0');
          return (
            <div key={u} className="vz-countdown-unit" aria-hidden="true">
              <span className="vz-countdown-digits">
                {Array.from(text).map((d, j) => (
                  <span key={`${j}-${text.length}`} className="vz-roll">
                    <span key={d} data-dir="down">
                      {d}
                    </span>
                  </span>
                ))}
              </span>
              <span className="vz-countdown-label">{labels?.[u] ?? u}</span>
            </div>
          );
        })}
      </div>
    );
  },
);
