import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import {
  liquidGlass,
  magnetic,
  ripple,
  spotlight,
  tilt,
  type LiquidGlassOptions,
  type MagneticOptions,
} from '@vizzele/core';
import { useVizzeleEffect } from '../hooks/effects';
import { cx, useMergedRef } from '../hooks/utils';
import type { DivProps } from './pointer';

// ——————————————————————————— Button ———————————————————————————

export type ButtonVariant = 'default' | 'liquid' | 'holo' | 'glow' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  /** Pull toward the pointer. Pass options to tune it. */
  magnetic?: boolean | MagneticOptions;
  /** Liquid ripple on press. Default true. */
  ripple?: boolean;
  loading?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  /** Render as another element, e.g. `'a'` or a router Link. */
  as?: React.ElementType;
  href?: string;
}

/**
 * The Vizzele button. `liquid` flows with the pointer, `holo` has a prismatic rim that turns
 * toward it, `glow` breathes light. All variants can be magnetic and ripple on press.
 */
export const Button = /* @__PURE__ */ forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'default',
    size = 'md',
    magnetic: mag = false,
    ripple: rip = true,
    loading = false,
    startIcon,
    endIcon,
    as: Tag = 'button',
    className,
    children,
    disabled,
    onPointerMove,
    type,
    ...rest
  },
  ref,
) {
  const magRef = useVizzeleEffect(
    magnetic,
    typeof mag === 'object' ? mag : { strength: 0.3 },
    !!mag && !disabled,
  );
  const ripRef = useVizzeleEffect(ripple, {}, rip && !disabled, magRef);
  return (
    <Tag
      ref={useMergedRef(ref, ripRef)}
      type={Tag === 'button' ? (type ?? 'button') : undefined}
      className={cx('vz-button', className)}
      data-variant={variant === 'default' ? undefined : variant}
      data-size={size === 'md' ? undefined : size}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={Tag === 'button' ? disabled || loading : undefined}
      aria-disabled={Tag !== 'button' && disabled ? true : undefined}
      onPointerMove={(e: React.PointerEvent<HTMLButtonElement>) => {
        // Feed the pointer to the liquid / holo materials.
        const el = e.currentTarget;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--vz-px', px.toFixed(3));
        el.style.setProperty(
          '--vz-angle',
          `${((Math.atan2(py - 0.5, px - 0.5) * 180) / Math.PI).toFixed(1)}deg`,
        );
        onPointerMove?.(e);
      }}
      {...rest}
    >
      {loading ? <span className="vz-spinner" aria-hidden="true" /> : startIcon}
      {children}
      {!loading && endIcon}
    </Tag>
  );
});

// ——————————————————————————— Liquid glass ———————————————————————————

export type LiquidGlassProps = DivProps & LiquidGlassOptions;

/** A pane of liquid glass that refracts what's behind it (Chromium) or frosts it (elsewhere). */
export const LiquidGlass = /* @__PURE__ */ forwardRef<HTMLElement, LiquidGlassProps>(
  function LiquidGlass(
    { as: Tag = 'div', refraction, bezel, blur, dispersion, saturation, className, ...rest },
    ref,
  ) {
    const opts: LiquidGlassOptions = {};
    if (refraction !== undefined) opts.refraction = refraction;
    if (bezel !== undefined) opts.bezel = bezel;
    if (blur !== undefined) opts.blur = blur;
    if (dispersion !== undefined) opts.dispersion = dispersion;
    if (saturation !== undefined) opts.saturation = saturation;
    const own = useVizzeleEffect(liquidGlass, opts);
    return (
      <Tag
        ref={useMergedRef(ref, own)}
        className={cx('vz-glass vz-liquid-glass', className)}
        {...rest}
      />
    );
  },
);

// ——————————————————————————— Card ———————————————————————————

export interface CardProps extends DivProps {
  /** Material. Default `'default'`. */
  variant?: 'default' | 'glass' | 'holo' | 'spotlight';
  /** Lift on hover. */
  interactive?: boolean;
}

/** Surface for content, in four materials. */
export const Card = /* @__PURE__ */ forwardRef<HTMLElement, CardProps>(function Card(
  { as: Tag = 'div', variant = 'default', interactive, className, ...rest },
  ref,
) {
  const holo = useVizzeleEffect(tilt, { max: 10, scale: 1.02 }, variant === 'holo');
  const spot = useVizzeleEffect(spotlight, {}, variant === 'spotlight', holo);
  const glass = useVizzeleEffect(liquidGlass, {}, variant === 'glass', spot);
  return (
    <Tag
      ref={useMergedRef(ref, glass)}
      className={cx(
        'vz-card',
        variant === 'glass' && 'vz-glass vz-liquid-glass',
        variant === 'holo' && 'vz-holo',
        variant === 'spotlight' && 'vz-spotlight',
        interactive && 'vz-lift',
        className,
      )}
      {...rest}
    />
  );
});

// ——————————————————————————— Switch / Checkbox / Radio ———————————————————————————

type InputBase = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  label?: ReactNode;
  description?: ReactNode;
};

export interface SwitchProps extends Omit<InputBase, 'onChange'> {
  onCheckedChange?: (checked: boolean) => void;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

/** A switch whose thumb stretches as it travels and lands with a jelly bounce. Native input underneath. */
export const Switch = /* @__PURE__ */ forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, description, className, onCheckedChange, onChange, style, ...rest },
  ref,
) {
  return (
    <label className={cx('vz-switch', className)} style={style}>
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        className="vz-switch-input"
        onChange={(e) => {
          onChange?.(e);
          onCheckedChange?.(e.target.checked);
        }}
        {...rest}
      />
      <span className="vz-switch-track" aria-hidden="true">
        <span className="vz-switch-thumb" />
      </span>
      {(label || description) && (
        <span className="vz-choice-text">
          {label && <span className="vz-choice-label">{label}</span>}
          {description && <span className="vz-choice-desc">{description}</span>}
        </span>
      )}
    </label>
  );
});

export interface CheckboxProps extends Omit<InputBase, 'onChange'> {
  onCheckedChange?: (checked: boolean) => void;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  indeterminate?: boolean;
}

/** A checkbox whose tick draws itself with a spring and whose box bounces. */
export const Checkbox = /* @__PURE__ */ forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    { label, description, className, onCheckedChange, onChange, indeterminate, style, ...rest },
    ref,
  ) {
    const own = useRef<HTMLInputElement>(null);
    // The native property is what assistive tech reads (aria-checked isn't allowed on checkboxes).
    useEffect(() => {
      if (own.current) own.current.indeterminate = !!indeterminate;
    }, [indeterminate]);
    return (
      <label className={cx('vz-checkbox', className)} style={style}>
        <input
          ref={useMergedRef(ref, own)}
          type="checkbox"
          className="vz-check-input"
          onChange={(e) => {
            onChange?.(e);
            onCheckedChange?.(e.target.checked);
          }}
          {...rest}
        />
        <span className="vz-check-box" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            {indeterminate ? <path d="M6 12h12" /> : <path d="M5 12.5l4.5 4.5L19 7.5" />}
          </svg>
        </span>
        {(label || description) && (
          <span className="vz-choice-text">
            {label && <span className="vz-choice-label">{label}</span>}
            {description && <span className="vz-choice-desc">{description}</span>}
          </span>
        )}
      </label>
    );
  },
);

export interface RadioGroupProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: { value: string; label: ReactNode; description?: ReactNode; disabled?: boolean }[];
  /** Accessible group label. */
  label: ReactNode;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

/** Native radios with a drop of light that lands in the selected one. */
export function RadioGroup({
  name,
  value,
  defaultValue,
  onValueChange,
  options,
  label,
  orientation = 'vertical',
  className,
}: RadioGroupProps) {
  const auto = useId();
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  return (
    <fieldset className={cx('vz-radio-group', className)} data-orientation={orientation}>
      <legend className="vz-radio-legend">{label}</legend>
      {options.map((o) => (
        <label key={o.value} className="vz-radio">
          <input
            type="radio"
            className="vz-radio-input"
            name={name ?? auto}
            value={o.value}
            checked={current === o.value}
            disabled={o.disabled}
            onChange={() => {
              if (value === undefined) setInner(o.value);
              onValueChange?.(o.value);
            }}
          />
          <span className="vz-radio-dot" aria-hidden="true" />
          <span className="vz-choice-text">
            <span className="vz-choice-label">{o.label}</span>
            {o.description && <span className="vz-choice-desc">{o.description}</span>}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

// ——————————————————————————— Input ———————————————————————————

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
  startIcon?: ReactNode;
  /** Light the border around the pointer. Default true. */
  glow?: boolean;
  wrapperClassName?: string;
  wrapperStyle?: CSSProperties;
}

/** Text field with a floating label and a border of light that follows the pointer and wakes on focus. */
export const Input = /* @__PURE__ */ forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    startIcon,
    glow = true,
    wrapperClassName,
    wrapperStyle,
    className,
    id,
    ...rest
  },
  ref,
) {
  const auto = useId();
  const inputId = id ?? auto;
  const hintId = `${inputId}-hint`;
  const field = useVizzeleEffect(spotlight, { proximity: 60 }, glow);
  return (
    <div className={cx('vz-input-wrap', wrapperClassName)} style={wrapperStyle}>
      <div
        ref={field as React.RefObject<HTMLDivElement | null>}
        className={cx('vz-field vz-field-glow', !!startIcon && 'has-icon')}
        data-invalid={error ? '' : undefined}
      >
        {startIcon && <span className="vz-field-icon">{startIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          className={cx('vz-input', className)}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={hint || error ? hintId : undefined}
          {...rest}
        />
        <label htmlFor={inputId} className="vz-field-label">
          {label}
        </label>
      </div>
      {(hint || error) && (
        <p id={hintId} className={cx('vz-field-hint', !!error && 'is-error')}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
});

// ——————————————————————————— Skeleton ———————————————————————————

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  circle?: boolean;
  /** Render several text lines. */
  lines?: number;
  className?: string;
  style?: CSSProperties;
}

/** Iridescent loading placeholder. */
export function Skeleton({
  width,
  height = 14,
  radius,
  circle,
  lines,
  className,
  style,
}: SkeletonProps) {
  if (lines && lines > 1) {
    return (
      <span className={cx('vz-skeleton-lines', className)} style={style} aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => (
          <span
            key={i}
            className="vz-skeleton"
            style={{ height, width: i === lines - 1 ? '62%' : '100%', borderRadius: radius }}
          />
        ))}
      </span>
    );
  }
  return (
    <span
      className={cx('vz-skeleton', className)}
      aria-hidden="true"
      style={{
        width: circle ? height : width,
        height,
        borderRadius: circle ? '50%' : radius,
        ...style,
      }}
    />
  );
}
