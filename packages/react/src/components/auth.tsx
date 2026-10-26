import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { clamp, onPointerMove, prefersReducedMotion } from '@vizzele/core';
import { cx } from '../hooks/utils';
import { Input } from './controls';
import { confetti } from './delight';

// ——————————————————————————— Password score ———————————————————————————

export interface PasswordCheck {
  id: 'length' | 'case' | 'number' | 'symbol';
  label: string;
  ok: boolean;
}

export interface PasswordScore {
  /** 0 too weak · 1 weak · 2 fair · 3 strong · 4 excellent. */
  score: 0 | 1 | 2 | 3 | 4;
  checks: PasswordCheck[];
}

const COMMON =
  /^(?:password|passw0rd|qwerty|letmein|admin|welcome|iloveyou|abc123|monkey|dragon|123456)/i;

/**
 * A quick, dependency-free strength estimate: four rules plus a bonus for length, capped for
 * short, common or repetitive passwords. Good for feedback while typing — not a security check.
 */
export function scorePassword(password: string, minLength = 8): PasswordScore {
  const checks: PasswordCheck[] = [
    { id: 'length', label: `${minLength}+ characters`, ok: password.length >= minLength },
    {
      id: 'case',
      label: 'Upper & lower case',
      ok: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    { id: 'number', label: 'A number', ok: /\d/.test(password) },
    { id: 'symbol', label: 'A symbol', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  if (!password) return { score: 0, checks };
  let raw = checks.filter((c) => c.ok).length + (password.length >= minLength + 6 ? 1 : 0);
  if (!checks[0]!.ok || COMMON.test(password) || /^(.)\1+$/.test(password)) raw = Math.min(raw, 2);
  return { score: clamp(raw - 1, 0, 4) as PasswordScore['score'], checks };
}

// ——————————————————————————— Password strength ———————————————————————————

const STRENGTH = ['Too weak', 'Weak', 'Fair', 'Strong', 'Excellent'] as const;

export interface PasswordStrengthProps extends HTMLAttributes<HTMLDivElement> {
  password: string;
  /** Default 8. */
  minLength?: number;
  /** List the rules with a tick for each one met. Default true. */
  showChecks?: boolean;
  /** Five words for scores 0–4. */
  labels?: readonly [string, string, string, string, string];
}

const Tick = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="7" />
    <path d="m4.8 8.3 2.1 2.1 4.3-4.6" />
  </svg>
);

/**
 * A tube of liquid that fills and changes colour as the password gets stronger: the level
 * overshoots on a spring, the leading edge wobbles, and each rule ticks itself off.
 */
export const PasswordStrength = /* @__PURE__ */ forwardRef<HTMLDivElement, PasswordStrengthProps>(
  function PasswordStrength(
    { password, minLength = 8, showChecks = true, labels = STRENGTH, className, style, ...rest },
    ref,
  ) {
    const { score, checks } = scorePassword(password, minLength);
    const empty = !password;
    const word = empty ? '' : labels[score];
    return (
      <div
        ref={ref}
        className={cx('vz-strength', className)}
        data-score={empty ? undefined : score}
        style={{ '--vz-strength': empty ? 0 : (score + 1) / 5, ...style } as CSSProperties}
        {...rest}
      >
        <div
          className="vz-strength-tube"
          role="meter"
          aria-label="Password strength"
          aria-valuemin={0}
          aria-valuemax={4}
          aria-valuenow={empty ? 0 : score}
          aria-valuetext={word || 'Empty'}
        >
          <span className="vz-strength-liquid" />
        </div>
        <span className="vz-strength-label" aria-hidden="true">
          {word}
        </span>
        {showChecks && (
          <ul className="vz-strength-checks">
            {checks.map((c) => (
              <li key={c.id} data-ok={c.ok ? '' : undefined}>
                <Tick />
                {c.label}
                <span className="vz-sr-only">{c.ok ? ' — done' : ' — missing'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);

// ——————————————————————————— Password input ———————————————————————————

/** An eye that follows the pointer while it is open, and shuts (with lashes) when hidden. */
function Eye({ open }: { open: boolean }) {
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const el = svg.current;
    if (!el || !open || prefersReducedMotion()) return;
    return onPointerMove((p) => {
      const r = el.getBoundingClientRect();
      const dx = p.x - (r.left + r.width / 2);
      const dy = p.y - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const k = p.active ? Math.min(d / 90, 1) * 2.4 : 0;
      el.style.setProperty('--vz-eye-x', `${((dx / d) * k).toFixed(2)}px`);
      el.style.setProperty('--vz-eye-y', `${((dy / d) * k).toFixed(2)}px`);
    });
  }, [open]);
  return (
    <svg ref={svg} className="vz-eye" data-open={open ? '' : undefined} viewBox="0 0 24 24">
      <g className="vz-eye-lid">
        <g className="vz-eye-blink">
          <path
            className="vz-eye-shape"
            d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
          />
          <g className="vz-eye-iris">
            <circle cx="12" cy="12" r="3.4" />
            <circle className="vz-eye-glint" cx="13.2" cy="10.8" r="0.9" />
          </g>
        </g>
      </g>
      <path
        className="vz-eye-shut"
        d="M3 11.5c2.4 3.2 5.4 4.8 9 4.8s6.6-1.6 9-4.8M6.2 14.6 4.8 16.6M12 16.3v2.4M17.8 14.6l1.4 2"
      />
    </svg>
  );
}

export interface PasswordInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'type'
> {
  /** Default "Password". */
  label?: string;
  hint?: ReactNode;
  error?: ReactNode;
  /** Show the strength meter under the field. Default false. */
  meter?: boolean;
  visible?: boolean;
  defaultVisible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  wrapperClassName?: string;
}

/**
 * A password field whose show/hide button is a living eye — it watches the pointer while the
 * password is visible and closes when it is hidden. Warns about Caps Lock, and can carry the
 * liquid strength meter.
 */
export const PasswordInput = /* @__PURE__ */ forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {
      label = 'Password',
      hint,
      error,
      meter = false,
      visible: visibleProp,
      defaultVisible = false,
      onVisibleChange,
      wrapperClassName,
      className,
      id,
      value,
      defaultValue,
      onChange,
      onKeyDown,
      onKeyUp,
      onBlur,
      minLength,
      ...rest
    },
    ref,
  ) {
    const auto = useId();
    const inputId = id ?? auto;
    const hintId = `${inputId}-hint`;
    const [innerVisible, setInnerVisible] = useState(defaultVisible);
    const visible = visibleProp ?? innerVisible;
    const [inner, setInner] = useState(String(defaultValue ?? ''));
    const current = value !== undefined ? String(value) : inner;
    const [caps, setCaps] = useState(false);
    const note = error ?? (caps ? 'Caps Lock is on' : hint);

    const toggle = () => {
      setInnerVisible(!visible);
      onVisibleChange?.(!visible);
    };
    const readCaps = (e: KeyboardEvent<HTMLInputElement>) =>
      setCaps(e.getModifierState?.('CapsLock') ?? false);

    return (
      <div className={cx('vz-input-wrap vz-password', wrapperClassName)}>
        <div className="vz-field has-end" data-invalid={error ? '' : undefined}>
          <input
            ref={ref}
            id={inputId}
            className={cx('vz-input', className)}
            type={visible ? 'text' : 'password'}
            placeholder=" "
            autoCapitalize="off"
            spellCheck={false}
            value={value}
            defaultValue={value === undefined ? defaultValue : undefined}
            minLength={minLength}
            aria-invalid={error ? true : undefined}
            aria-describedby={note ? hintId : undefined}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setInner(e.target.value);
              onChange?.(e);
            }}
            onKeyDown={(e) => {
              readCaps(e);
              onKeyDown?.(e);
            }}
            onKeyUp={(e) => {
              readCaps(e);
              onKeyUp?.(e);
            }}
            onBlur={(e) => {
              setCaps(false);
              onBlur?.(e);
            }}
            {...rest}
          />
          <label htmlFor={inputId} className="vz-field-label">
            {label}
          </label>
          <button
            type="button"
            className="vz-password-toggle"
            aria-label="Show password"
            aria-pressed={visible}
            aria-controls={inputId}
            onClick={toggle}
          >
            <Eye open={visible} />
          </button>
        </div>
        {note && (
          <p
            id={hintId}
            className={cx('vz-field-hint', !!(error || caps) && 'is-error')}
            aria-live={caps && !error ? 'polite' : undefined}
          >
            {note}
          </p>
        )}
        {meter && <PasswordStrength password={current} minLength={minLength ?? 8} />}
      </div>
    );
  },
);

// ——————————————————————————— Auth panel ———————————————————————————

export type AuthMode = 'sign-in' | 'sign-up';

export interface AuthProvider {
  id: string;
  label: string;
  icon: ReactNode;
}

export interface AuthSubmitData {
  mode: AuthMode;
  email: string;
  password: string;
  /** Only on sign-up, when the name field is shown. */
  name?: string;
}

export interface AuthPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSubmit' | 'title'> {
  mode?: AuthMode;
  defaultMode?: AuthMode;
  onModeChange?: (mode: AuthMode) => void;
  /** Built-ins 'google' and 'github', or your own. Default ['google']. */
  providers?: (('google' | 'github') | AuthProvider)[];
  /** Called with the provider id; return a promise to show a spinner on its button. */
  onProvider?: (id: string) => void | Promise<unknown>;
  /** Return a promise: resolve for the success state, reject with an Error to show its message. */
  onSubmit?: (data: AuthSubmitData) => void | Promise<unknown>;
  /** Your logo above the title. */
  brand?: ReactNode;
  /** Headings for each mode. */
  title?: { signIn?: ReactNode; signUp?: ReactNode };
  /** Ask for a name on sign-up. Default true. */
  nameField?: boolean;
  /** Minimum password length on sign-up. Default 8. */
  minLength?: number;
  /** Shown under "Password" on sign-in; omit to hide. */
  onForgot?: () => void;
  /** Confetti from the button on success. Default true. */
  celebrate?: boolean;
  /** Small print under the form (terms, privacy). */
  footer?: ReactNode;
}

const GoogleIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
    />
  </svg>
);

const GithubIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 .5a11.5 11.5 0 0 0-3.64 22.42c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"
    />
  </svg>
);

const BUILT_IN: Record<'google' | 'github', AuthProvider> = {
  google: { id: 'google', label: 'Google', icon: GoogleIcon },
  github: { id: 'github', label: 'GitHub', icon: GithubIcon },
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = Partial<Record<'name' | 'email' | 'password', string>>;

/**
 * A sign-in / sign-up card made of liquid glass. The mode switch stretches like a drop between
 * its two sides, the name field pours in for sign-up, the password eye watches you, a strength
 * tube fills as you type, and the button melts into a spinner, then a check — with confetti.
 */
export const AuthPanel = /* @__PURE__ */ forwardRef<HTMLDivElement, AuthPanelProps>(
  function AuthPanel(
    {
      mode: modeProp,
      defaultMode = 'sign-in',
      onModeChange,
      providers = ['google'],
      onProvider,
      onSubmit,
      brand,
      title,
      nameField = true,
      minLength = 8,
      onForgot,
      celebrate = true,
      footer,
      className,
      ...rest
    },
    ref,
  ) {
    const uid = useId();
    const [innerMode, setInnerMode] = useState<AuthMode>(defaultMode);
    const mode = modeProp ?? innerMode;
    const signUp = mode === 'sign-up';
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<Errors>({});
    const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [shake, setShake] = useState(0);
    const [busyProvider, setBusyProvider] = useState<string | null>(null);
    const submitRef = useRef<HTMLButtonElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const setMode = (m: AuthMode) => {
      if (m === mode) return;
      setInnerMode(m);
      setErrors({});
      setMessage('');
      setState('idle');
      onModeChange?.(m);
    };
    const edit =
      (field: keyof Errors, set: (v: string) => void) => (e: ChangeEvent<HTMLInputElement>) => {
        set(e.target.value);
        if (errors[field]) setErrors((x) => ({ ...x, [field]: undefined }));
        if (state === 'error' || state === 'success') setState('idle');
      };
    const fail = (msg: string) => {
      setState('error');
      setMessage(msg);
      setShake((n) => n + 1);
    };

    const submit = async (e: FormEvent) => {
      e.preventDefault();
      if (state === 'loading') return;
      const next: Errors = {};
      if (signUp && nameField && !name.trim()) next.name = 'Tell us your name';
      if (!EMAIL.test(email.trim())) next.email = 'Enter a valid email';
      if (!password) next.password = 'Enter your password';
      else if (signUp && password.length < minLength)
        next.password = `Use at least ${minLength} characters`;
      setErrors(next);
      const first = (['name', 'email', 'password'] as const).find((k) => next[k]);
      if (first) {
        fail('Check the highlighted fields');
        formRef.current?.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
        return;
      }
      setState('loading');
      setMessage(signUp ? 'Creating your account…' : 'Signing you in…');
      try {
        await onSubmit?.({
          mode,
          email: email.trim(),
          password,
          ...(signUp && nameField ? { name: name.trim() } : {}),
        });
        setState('success');
        setMessage(signUp ? 'Account created — welcome!' : 'Signed in — welcome back!');
        if (celebrate && submitRef.current) void confetti(submitRef.current, { count: 70 });
      } catch (err) {
        fail(err instanceof Error && err.message ? err.message : 'Something went wrong');
      }
    };

    const provider = async (id: string) => {
      const r = onProvider?.(id);
      if (r && typeof (r as Promise<unknown>).then === 'function') {
        setBusyProvider(id);
        try {
          await r;
        } catch (err) {
          fail(err instanceof Error && err.message ? err.message : 'Something went wrong');
        } finally {
          setBusyProvider(null);
        }
      }
    };

    const strength = signUp && password ? scorePassword(password, minLength).score : undefined;
    const heading = signUp
      ? (title?.signUp ?? 'Create your account')
      : (title?.signIn ?? 'Welcome back');

    return (
      <div
        ref={ref}
        className={cx('vz-auth', className)}
        data-mode={mode}
        data-strength={strength}
        {...rest}
      >
        <span className="vz-auth-aura" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <div className="vz-auth-card" data-shake={shake ? (shake % 2 ? 'a' : 'b') : undefined}>
          {brand && <div className="vz-auth-brand">{brand}</div>}
          <h2 id={`${uid}-title`} className="vz-auth-title">
            {heading}
          </h2>

          <div className="vz-auth-switch" role="group" aria-label="Choose">
            <span className="vz-auth-pill" aria-hidden="true" />
            <button type="button" aria-pressed={!signUp} onClick={() => setMode('sign-in')}>
              Sign in
            </button>
            <button type="button" aria-pressed={signUp} onClick={() => setMode('sign-up')}>
              Sign up
            </button>
          </div>

          {providers.length > 0 && (
            <>
              <div className="vz-auth-providers">
                {providers.map((p) => {
                  const P = typeof p === 'string' ? BUILT_IN[p] : p;
                  return (
                    <button
                      key={P.id}
                      type="button"
                      className="vz-auth-provider"
                      data-provider={P.id}
                      data-loading={busyProvider === P.id ? '' : undefined}
                      aria-busy={busyProvider === P.id || undefined}
                      disabled={!!busyProvider}
                      onClick={() => void provider(P.id)}
                    >
                      <span className="vz-auth-provider-icon">{P.icon}</span>
                      Continue with {P.label}
                    </button>
                  );
                })}
              </div>
              <p className="vz-auth-or">
                <span>or with email</span>
              </p>
            </>
          )}

          <form ref={formRef} noValidate onSubmit={submit} aria-labelledby={`${uid}-title`}>
            {nameField && (
              <div
                className="vz-auth-reveal"
                data-open={signUp ? '' : undefined}
                aria-hidden={!signUp}
              >
                <div>
                  <Input
                    label="Name"
                    name="name"
                    autoComplete="name"
                    value={name}
                    onChange={edit('name', setName)}
                    error={errors.name}
                    disabled={!signUp}
                  />
                </div>
              </div>
            )}
            <Input
              label="Email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={edit('email', setEmail)}
              error={errors.email}
            />
            <PasswordInput
              name="password"
              autoComplete={signUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={edit('password', setPassword)}
              error={errors.password}
              meter={signUp}
              minLength={signUp ? minLength : undefined}
            />
            {!signUp && onForgot && (
              <button type="button" className="vz-auth-forgot" onClick={onForgot}>
                Forgot password?
              </button>
            )}
            <button
              ref={submitRef}
              type="submit"
              className="vz-auth-submit"
              data-state={state}
              aria-busy={state === 'loading' || undefined}
            >
              <span className="vz-auth-submit-label">{signUp ? 'Create account' : 'Sign in'}</span>
              <span className="vz-auth-spinner" aria-hidden="true" />
              <svg className="vz-auth-check" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
            </button>
            <p className="vz-auth-status" role="status" data-tone={state}>
              {message}
            </p>
          </form>
          {footer && <div className="vz-auth-footer">{footer}</div>}
        </div>
      </div>
    );
  },
);
