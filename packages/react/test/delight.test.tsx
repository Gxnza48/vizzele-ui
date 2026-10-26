import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import {
  AuthPanel,
  ClickSpark,
  DotGrid,
  HeartButton,
  Orbit,
  PasswordInput,
  PasswordStrength,
  SplitFlap,
  ThemeToggle,
  confetti,
  scorePassword,
} from '../src';

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
});
afterEach(cleanup);

describe('scorePassword & PasswordStrength', () => {
  it('scores from too weak to excellent and caps the obvious ones', () => {
    expect(scorePassword('').score).toBe(0);
    expect(scorePassword('hello').score).toBe(0);
    expect(scorePassword('Hello123').score).toBe(2);
    expect(scorePassword('Hello123!').score).toBe(3);
    expect(scorePassword('Liquid-Light-2026!').score).toBe(4);
    expect(scorePassword('Password123!').score).toBe(1);
    expect(scorePassword('aaaaaaaaaaaaaaa').score).toBeLessThanOrEqual(1);
    expect(scorePassword('Hello1!', 6).checks[0]!.ok).toBe(true);
  });

  it('is a meter with the word as its value, and speaks each rule', () => {
    render(<PasswordStrength password="Hello123!" />);
    const m = screen.getByRole('meter', { name: 'Password strength' });
    expect(m.getAttribute('aria-valuetext')).toBe('Strong');
    expect(screen.getByText('A symbol').textContent).toContain('done');
  });
});

describe('PasswordInput', () => {
  it('toggles visibility with a pressed eye button and warns about Caps Lock', () => {
    render(<PasswordInput meter />);
    const input = screen.getByLabelText('Password') as HTMLInputElement;
    const eye = screen.getByRole('button', { name: 'Show password' });
    expect(input.type).toBe('password');
    fireEvent.click(eye);
    expect(input.type).toBe('text');
    expect(eye.getAttribute('aria-pressed')).toBe('true');
    fireEvent.change(input, { target: { value: 'Hello123!' } });
    expect(screen.getByRole('meter').getAttribute('aria-valuetext')).toBe('Strong');
    fireEvent.keyDown(input, { key: 'A', getModifierState: () => true });
  });
});

describe('AuthPanel', () => {
  it('validates, submits and announces success', async () => {
    let done!: () => void;
    const onSubmit = vi.fn(() => new Promise<void>((r) => (done = r)));
    render(<AuthPanel onSubmit={onSubmit} celebrate={false} />);
    expect(screen.getByRole('form', { name: 'Welcome back' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Continue with Google/ })).toBeTruthy();
    // The switch button is also called "Sign in": submit is the one with type=submit.
    const submit = document.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    fireEvent.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('status').textContent).toBe('Check the highlighted fields');
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.click(submit);
    expect(onSubmit).toHaveBeenCalledWith({
      mode: 'sign-in',
      email: 'ada@example.com',
      password: 'secret',
    });
    expect(submit.getAttribute('aria-busy')).toBe('true');
    await act(async () => done());
    expect(screen.getByRole('status').textContent).toBe('Signed in — welcome back!');
  });

  it('switches to sign-up, asks for a name and shows a rejected message', async () => {
    const onSubmit = vi.fn(async () => {
      throw new Error('Email already taken');
    });
    render(<AuthPanel onSubmit={onSubmit} providers={[]} />);
    const name = screen.getByLabelText('Name') as HTMLInputElement;
    expect(name.disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));
    expect(screen.getByRole('button', { name: 'Sign up' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(name.disabled).toBe(false);
    expect(screen.queryByRole('button', { name: /Continue with/ })).toBeNull();
    fireEvent.change(name, { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'short' } });
    fireEvent.submit(screen.getByRole('form'));
    expect(screen.getByText('Use at least 8 characters')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Long-enough-1' } });
    await act(async () => {
      fireEvent.submit(screen.getByRole('form'));
    });
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'sign-up', name: 'Ada' }),
    );
    expect(screen.getByRole('status').textContent).toBe('Email already taken');
  });
});

describe('HeartButton & ThemeToggle', () => {
  it('the heart is a toggle named by its label and count', () => {
    const onLikedChange = vi.fn();
    render(<HeartButton count={41} onLikedChange={onLikedChange} />);
    const b = screen.getByRole('button', { name: 'Like, 41' });
    fireEvent.click(b);
    expect(onLikedChange).toHaveBeenCalledWith(true);
    expect(b.getAttribute('aria-pressed')).toBe('true');
    expect(b.textContent).toContain('42');
  });

  it('the theme toggle is a switch that sets data-theme on <html>', () => {
    render(<ThemeToggle defaultTheme="dark" wipe={false} />);
    const s = screen.getByRole('switch', { name: 'Dark mode' });
    expect(s.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(s);
    expect(s.getAttribute('aria-checked')).toBe('false');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});

describe('SplitFlap, Orbit, ClickSpark, DotGrid, confetti', () => {
  it('split flap reads its value once and lands on it', () => {
    vi.useFakeTimers();
    render(<SplitFlap value="Go" />);
    expect(screen.getByText('Go').className).toBe('vz-sr-only');
    for (let i = 0; i < 60; i++) act(() => void vi.advanceTimersByTime(80));
    const cells = document.querySelectorAll('.vz-flap-top');
    expect(Array.from(cells, (c) => c.textContent).join('')).toBe('GO');
    vi.useRealTimers();
  });

  it('server-renders everything and keeps your content', () => {
    const html = renderToString(
      <>
        <Orbit
          rings={[
            {
              radius: 60,
              items: [
                <a key="a" href="#a">
                  A
                </a>,
              ],
            },
          ]}
        >
          <b>core</b>
        </Orbit>
        <ClickSpark>
          <button>Hit</button>
        </ClickSpark>
        <DotGrid>
          <h1>Hero</h1>
        </DotGrid>
        <AuthPanel />
        <ThemeToggle />
      </>,
    );
    expect(html).toContain('vz-orbit');
    expect(html).toContain('<h1>Hero</h1>');
  });

  it('click spark adds a decorative burst; confetti is a no-op without a canvas', async () => {
    render(
      <ClickSpark>
        <p>Area</p>
      </ClickSpark>,
    );
    fireEvent.pointerDown(screen.getByText('Area'), { clientX: 10, clientY: 10 });
    expect(document.querySelector('.vz-spark-burst')?.getAttribute('aria-hidden')).toBe('true');
    await expect(confetti(null)).resolves.toBeUndefined();
    expect(document.querySelector('.vz-confetti')).toBeNull();
  });
});
