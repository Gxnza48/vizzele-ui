import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { LazyMount, ScratchCard } from '../src';

let observed: { el: Element; cb: IntersectionObserverCallback; io: IntersectionObserver }[] = [];
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  globalThis.IntersectionObserver = class {
    constructor(private cb: IntersectionObserverCallback) {}
    observe(el: Element) {
      observed.push({ el, cb: this.cb, io: this as unknown as IntersectionObserver });
    }
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
});
afterEach(() => {
  cleanup();
  observed = [];
});

const enter = (el: Element) => {
  for (const o of observed.filter((x) => x.el === el))
    act(() =>
      o.cb(
        [{ target: el, isIntersecting: true, intersectionRatio: 1 } as IntersectionObserverEntry],
        o.io,
      ),
    );
};

describe('LazyMount', () => {
  it('renders the placeholder (and holds the space) until it comes near', () => {
    const { container } = render(
      <LazyMount minHeight={300} placeholder={<i>loading</i>}>
        <p>Heavy</p>
      </LazyMount>,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(screen.queryByText('Heavy')).toBeNull();
    expect(screen.getByText('loading')).toBeTruthy();
    expect(el.style.minHeight).toBe('300px');
    enter(el);
    expect(screen.getByText('Heavy')).toBeTruthy();
    expect(el.hasAttribute('data-mounted')).toBe(true);
    expect(el.style.minHeight).toBe('');
  });

  it('server-renders only the placeholder', () => {
    const html = renderToString(
      <LazyMount placeholder="…">
        <p>Heavy</p>
      </LazyMount>,
    );
    expect(html).not.toContain('Heavy');
    expect(html).toContain('vz-lazy');
  });

  it('can mount when the browser is idle', () => {
    vi.useFakeTimers();
    render(
      <LazyMount idle>
        <p>Later</p>
      </LazyMount>,
    );
    expect(screen.queryByText('Later')).toBeNull();
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByText('Later')).toBeTruthy();
    vi.useRealTimers();
  });
});

describe('ScratchCard', () => {
  it('keeps the prize inert until revealed, with a keyboard Reveal button', () => {
    const onReveal = vi.fn();
    const onProgress = vi.fn();
    const { container } = render(
      <ScratchCard onReveal={onReveal} onProgress={onProgress} revealLabel="Show prize">
        <a href="/coupon">VIZZELE20</a>
      </ScratchCard>,
    );
    const prize = container.querySelector('.vz-scratch-prize')!;
    expect(prize.hasAttribute('inert')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Show prize' }));
    expect(onReveal).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenLastCalledWith(1);
    expect(prize.hasAttribute('inert')).toBe(false);
    expect(container.querySelector('.vz-scratch')!.hasAttribute('data-revealed')).toBe(true);
    expect(screen.queryByRole('button', { name: 'Show prize' })).toBeNull();
  });

  it('hides the canvases from assistive tech', () => {
    const { container } = render(<ScratchCard>Prize</ScratchCard>);
    container
      .querySelectorAll('canvas')
      .forEach((c) => expect(c.getAttribute('aria-hidden')).toBe('true'));
  });

  it('server-renders without touching the DOM', () => {
    expect(() => renderToString(<ScratchCard>Prize</ScratchCard>)).not.toThrow();
  });
});
