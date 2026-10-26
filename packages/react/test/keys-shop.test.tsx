import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import {
  AddToCartButton,
  Badge,
  CartButton,
  CompareSlider,
  Countdown,
  FlipCard,
  Kbd,
  LogoMarquee,
  MechanicalKeyboard,
  Modal,
  ShoppingCart,
  StatusBadge,
  Sticker,
  setReducedMotion,
} from '../src';

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});
afterEach(cleanup);

describe('MechanicalKeyboard', () => {
  it.each([
    ['60', 61],
    ['68', 68],
    ['tkl', 87],
    ['full', 104],
  ] as const)('the %s layout has %i keys', (layout, n) => {
    const { container } = render(<MechanicalKeyboard layout={layout} />);
    expect(container.querySelectorAll('.vz-kb-key')).toHaveLength(n);
  });

  it('presses keys typed in the field and types the keys you click', () => {
    const onKeyHit = vi.fn();
    const onValueChange = vi.fn();
    const { container } = render(
      <MechanicalKeyboard layout="60" onKeyHit={onKeyHit} onValueChange={onValueChange} />,
    );
    const input = screen.getByRole('textbox', { name: 'Type to play the keyboard' });
    const a = container.querySelector('[data-code="KeyA"]')!;
    fireEvent.keyDown(input, { code: 'KeyA', key: 'a' });
    expect(a.hasAttribute('data-down')).toBe(true);
    expect(onKeyHit).toHaveBeenCalledWith('KeyA');
    fireEvent.keyUp(input, { code: 'KeyA', key: 'a' });
    expect(a.hasAttribute('data-down')).toBe(false);
    fireEvent.pointerDown(container.querySelector('[data-code="KeyH"] .vz-kb-top')!);
    fireEvent.pointerDown(container.querySelector('[data-code="KeyI"] .vz-kb-top')!);
    expect((input as HTMLInputElement).value).toBe('hi');
    fireEvent.pointerDown(container.querySelector('[data-code="Backspace"]')!);
    expect(onValueChange).toHaveBeenLastCalledWith('h');
    // The board is a picture of the typing; the field is what assistive tech uses.
    expect(container.querySelector('.vz-kb-plate')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('a Kbd presses while its key is held', () => {
    render(<Kbd listen="k">K</Kbd>);
    const k = screen.getByText('K');
    expect(k.tagName).toBe('KBD');
    fireEvent.keyDown(window, { key: 'k', code: 'KeyK' });
    expect(k.hasAttribute('data-down')).toBe(true);
    fireEvent.keyUp(window, { key: 'k', code: 'KeyK' });
    expect(k.hasAttribute('data-down')).toBe(false);
  });
});

describe('ShoppingCart & friends', () => {
  const items = [
    { id: 'a', name: 'Shirt', price: 40, quantity: 1 },
    { id: 'b', name: 'Cap', price: 10, quantity: 2 },
  ];

  it('totals, steps quantities and asks before removing the last one', () => {
    const onQuantityChange = vi.fn();
    render(
      <ShoppingCart
        items={items}
        locale="en-US"
        onQuantityChange={onQuantityChange}
        freeShippingAt={100}
      />,
    );
    expect(screen.getByText('3 items')).toBeTruthy();
    expect(screen.getByText(/away from free shipping/).textContent).toContain('$40.00');
    const cap = screen.getByRole('group', { name: 'Quantity of Cap' });
    fireEvent.click(cap.querySelector('button[aria-label="Increase"]')!);
    expect(onQuantityChange).toHaveBeenCalledWith('b', 3);
    fireEvent.click(cap.querySelector('button[aria-label="Decrease"]')!);
    expect(onQuantityChange).toHaveBeenCalledWith('b', 1);
    expect(screen.getByRole('button', { name: 'Remove Shirt' })).toBeTruthy();
  });

  it('collapses a removed line away, or drops it at once with reduced motion', () => {
    const onRemove = vi.fn();
    const { container, unmount } = render(<ShoppingCart items={items} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Shirt' }));
    expect(container.querySelector('[data-leaving]')).toBeTruthy();
    expect(screen.getByText('2 items')).toBeTruthy();
    unmount();
    setReducedMotion('always');
    render(<ShoppingCart items={items} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Shirt' }));
    expect(onRemove).toHaveBeenCalledWith('a');
    setReducedMotion('system');
  });

  it('an empty cart says so and cannot check out', () => {
    render(<ShoppingCart items={[]} />);
    expect(screen.getByText('Your cart is empty')).toBeTruthy();
    expect((screen.getByRole('button', { name: /Checkout/ }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it('the cart button names its count; add to cart confirms', async () => {
    const onAdd = vi.fn();
    render(
      <>
        <CartButton count={3} />
        <AddToCartButton onAdd={onAdd} />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Cart, 3 items' })).toBeTruthy();
    const add = screen.getByRole('button', { name: /Add to cart/ });
    await act(async () => {
      fireEvent.click(add);
    });
    expect(onAdd).toHaveBeenCalledOnce();
    expect(add.getAttribute('data-state')).toBe('added');
  });
});

describe('Countdown, LogoMarquee, badges', () => {
  it('counts down and writes the time left out for screen readers', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    render(<Countdown to="2026-01-02T01:02:03Z" />);
    const timer = screen.getByRole('timer');
    expect(timer.textContent).toContain('1 day, 1 hour, 2 minutes');
    vi.useRealTimers();
  });

  it('server-renders without guessing the time', () => {
    const html = renderToString(<Countdown to={Date.now() + 1e6} />);
    expect(html).toContain('>-</span>');
  });

  it('logos are named and status is written in words', () => {
    render(
      <>
        <LogoMarquee logos={[{ name: 'Acme', logo: 'A' }]} />
        <StatusBadge status="operational" />
        <StatusBadge status="busy" dotOnly />
        <Badge variant="holo">Pro</Badge>
      </>,
    );
    expect(screen.getAllByRole('img', { name: 'Acme' }).length).toBeGreaterThan(0);
    expect(screen.getByText('All systems operational')).toBeTruthy();
    expect(screen.getByText('Busy').className).toBe('vz-sr-only');
    expect(screen.getByText('Pro').getAttribute('data-variant')).toBe('holo');
  });
});

describe('Sticker, CompareSlider, FlipCard', () => {
  it('the sticker peels and sticks from the keyboard', () => {
    const onStick = vi.fn();
    render(
      <Sticker label="Drop" onStick={onStick}>
        x
      </Sticker>,
    );
    const s = screen.getByRole('button', { name: 'Drop' });
    expect(s.getAttribute('aria-roledescription')).toBe('sticker');
    fireEvent.keyDown(s, { key: 'Enter' });
    expect(s.getAttribute('aria-pressed')).toBe('true');
    fireEvent.keyDown(s, { key: 'ArrowRight' });
    fireEvent.keyDown(s, { key: 'Enter' });
    expect(s.getAttribute('aria-pressed')).toBe('false');
    expect(onStick).toHaveBeenCalledWith({ x: 10, y: 0 });
  });

  it('the compare handle is a slider', () => {
    const onPositionChange = vi.fn();
    render(<CompareSlider before="a" after="b" onPositionChange={onPositionChange} />);
    const s = screen.getByRole('slider', { name: 'Comparison' });
    expect(s.getAttribute('aria-valuenow')).toBe('50');
    fireEvent.keyDown(s, { key: 'ArrowRight' });
    expect(onPositionChange).toHaveBeenLastCalledWith(52);
    fireEvent.keyDown(s, { key: 'End' });
    expect(s.getAttribute('aria-valuenow')).toBe('100');
  });

  it('the flip card toggles and hides the face you cannot see', () => {
    render(<FlipCard label="Plan" front={<p>Front</p>} back={<p>Back</p>} />);
    const card = screen.getByRole('button', { name: 'Plan' });
    const back = screen.getByText('Back').parentElement!;
    expect(back.getAttribute('aria-hidden')).toBe('true');
    fireEvent.keyDown(card, { key: ' ' });
    expect(card.getAttribute('aria-pressed')).toBe('true');
    expect(back.getAttribute('aria-hidden')).toBe('false');
  });

  it('server-renders', () => {
    const html = renderToString(
      <>
        <MechanicalKeyboard />
        <Sticker label="s">x</Sticker>
        <FlipCard front="a" back="b" trigger="hover" />
        <CompareSlider before="a" after="b" />
        <ShoppingCart items={[]} />
      </>,
    );
    expect(html).toContain('vz-kb-plate');
  });
});

describe('ShoppingCart in another language', () => {
  it('speaks the labels it is given and respects each item’s stock', () => {
    render(
      <ShoppingCart
        items={[{ id: 'a', name: 'Uva', price: 10, quantity: 2, max: 2 }]}
        labels={{
          items: (n) => `${n} productos`,
          quantityOf: (name) => `Cantidad de ${name}`,
          increase: 'Sumar',
          subtotal: 'Subtotal',
          total: 'Total a pagar',
        }}
      />,
    );
    expect(screen.getByText('2 productos')).toBeTruthy();
    expect(screen.getByText('Total a pagar')).toBeTruthy();
    const plus = screen
      .getByRole('group', { name: 'Cantidad de Uva' })
      .querySelector<HTMLButtonElement>('button[aria-label="Sumar"]')!;
    expect(plus.disabled).toBe(true);
  });

  it('the cart button can say its count in your words', () => {
    render(<CartButton label="Carrito" count={2} countLabel={(n) => `${n} productos`} />);
    expect(screen.getByRole('button', { name: 'Carrito, 2 productos' })).toBeTruthy();
  });

  it('hidden faces are really inert', () => {
    const { container } = render(<FlipCard front="a" back="b" />);
    expect(container.querySelector('.vz-flip-back')!.hasAttribute('inert')).toBe(true);
  });
});

describe('Modal that must be answered', () => {
  it('has no close button when it is not dismissible, and names it otherwise', () => {
    const { rerender } = render(
      <Modal open onOpenChange={() => {}} dismissible={false} title="Age">
        <button>Yes</button>
      </Modal>,
    );
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    rerender(
      <Modal open onOpenChange={() => {}} closeLabel="Cerrar" title="Age">
        <button>Yes</button>
      </Modal>,
    );
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeTruthy();
  });
});
