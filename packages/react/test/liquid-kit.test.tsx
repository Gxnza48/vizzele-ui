import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { createRef } from 'react';
import {
  AvatarStack,
  BorderLight,
  GooeyMenu,
  LiquidGauge,
  LiquidRating,
  LiquidStepper,
  NumberScrubber,
  PullToRefresh,
  SignaturePad,
  StreamText,
  type SignaturePadHandle,
} from '../src';

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});
afterEach(cleanup);

describe('GooeyMenu', () => {
  it('is a menu button that opens, focuses, moves and closes', () => {
    const onSelect = vi.fn();
    render(
      <GooeyMenu
        label="Create"
        items={[
          { label: 'Note', icon: 'N', onSelect },
          { label: 'Upload', icon: 'U' },
        ]}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Create' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const items = screen.getAllByRole('menuitem');
    expect(document.activeElement).toBe(items[0]);
    fireEvent.keyDown(items[0]!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[1]);
    fireEvent.keyDown(items[1]!, { key: 'Escape' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Note' }));
    expect(onSelect).toHaveBeenCalledOnce();
  });
});

describe('AvatarStack', () => {
  it('names the whole group once and folds the rest into +N', () => {
    render(
      <AvatarStack
        max={2}
        people={[{ name: 'Ada Lovelace' }, { name: 'Alan Turing' }, { name: 'Grace Hopper' }]}
      />,
    );
    expect(
      screen.getByRole('group', { name: '3 people: Ada Lovelace, Alan Turing, Grace Hopper' }),
    ).toBeTruthy();
    expect(screen.getByText('+1')).toBeTruthy();
    expect(screen.getByText('AL')).toBeTruthy();
  });
});

describe('LiquidStepper', () => {
  it('marks done and current steps, and lets you go back', () => {
    const onStepClick = vi.fn();
    render(<LiquidStepper steps={['One', 'Two', 'Three']} current={1} onStepClick={onStepClick} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('Two').closest('li')!.getAttribute('aria-current')).toBe('step');
    expect(screen.getByText('(completed)')).toBeTruthy();
    fireEvent.click(screen.getByRole('button'));
    expect(onStepClick).toHaveBeenCalledWith(0);
  });
});

describe('LiquidGauge & LiquidRating', () => {
  it('the gauge is a meter with the visible text', () => {
    render(<LiquidGauge label="Storage" value={30} max={60} />);
    const m = screen.getByRole('meter', { name: 'Storage' });
    expect(m.getAttribute('aria-valuetext')).toBe('50%');
    expect(m.getAttribute('aria-valuemax')).toBe('60');
  });

  it('the rating is a slider driven by the keyboard', () => {
    const onChange = vi.fn();
    render(<LiquidRating defaultValue={2} onChange={onChange} />);
    const s = screen.getByRole('slider', { name: 'Rating' });
    expect(s.getAttribute('aria-valuetext')).toBe('2 of 5 stars');
    fireEvent.keyDown(s, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith(3);
    fireEvent.keyDown(s, { key: 'End' });
    expect(onChange).toHaveBeenLastCalledWith(5);
    expect(s.getAttribute('aria-valuetext')).toBe('5 of 5 stars');
  });

  it('a read-only rating is an image', () => {
    render(<LiquidRating value={4.5} step={0.5} readOnly label="Average" />);
    expect(screen.getByRole('img', { name: 'Average: 4.5 of 5 stars' })).toBeTruthy();
  });
});

describe('NumberScrubber', () => {
  it('is a spinbutton: arrows step, Shift ×10, limits hold, Enter edits', () => {
    const onChange = vi.fn();
    render(
      <NumberScrubber label="Radius" defaultValue={10} min={0} max={20} onChange={onChange} />,
    );
    const s = screen.getByRole('spinbutton', { name: 'Radius' });
    fireEvent.keyDown(s, { key: 'ArrowUp' });
    expect(onChange).toHaveBeenLastCalledWith(11);
    fireEvent.keyDown(s, { key: 'ArrowUp', shiftKey: true });
    expect(onChange).toHaveBeenLastCalledWith(20);
    fireEvent.keyDown(s, { key: 'Home' });
    expect(onChange).toHaveBeenLastCalledWith(0);
    fireEvent.keyDown(s, { key: 'Enter' });
    const input = screen.getByRole('textbox', { name: 'Radius' });
    fireEvent.change(input, { target: { value: '7.4' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith(7);
  });

  it('shows decimals that follow the step', () => {
    render(<NumberScrubber label="Blur" defaultValue={2} step={0.25} />);
    expect(screen.getByRole('spinbutton').getAttribute('aria-valuetext')).toBe('2.00');
  });
});

describe('PullToRefresh', () => {
  it('refreshes from the keyboard button and announces it', async () => {
    let done!: () => void;
    const onRefresh = vi.fn(() => new Promise<void>((r) => (done = r)));
    render(
      <PullToRefresh onRefresh={onRefresh}>
        <p>Feed</p>
      </PullToRefresh>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(onRefresh).toHaveBeenCalledOnce();
    expect(screen.getByRole('status').textContent).toBe('Refreshing…');
    await act(async () => done());
    expect(screen.getByRole('status').textContent).toBe('Updated');
  });
});

describe('SignaturePad', () => {
  it('starts empty, offers typing, and exports SVG', () => {
    const ref = createRef<SignaturePadHandle>();
    const onChange = vi.fn();
    render(<SignaturePad ref={ref} onChange={onChange} />);
    expect(screen.getByRole('img', { name: 'Signature: empty' })).toBeTruthy();
    expect(ref.current!.isEmpty()).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Type instead' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Type your signature' }), {
      target: { value: 'Ada' },
    });
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(ref.current!.isEmpty()).toBe(false);
    expect(ref.current!.toSVG()).toMatch(/^<svg/);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(ref.current!.isEmpty()).toBe(true);
  });
});

describe('StreamText & BorderLight', () => {
  it('stream text shows what has arrived and announces only the finished answer', () => {
    const { rerender } = render(<StreamText text="Hello" streaming />);
    expect(screen.getByText('Hello')).toBeTruthy();
    expect(document.querySelector('[aria-live]')!.textContent).toBe('');
    expect(document.querySelector('.vz-stream-caret')).not.toBeNull();
    rerender(<StreamText text="Hello world" />);
    expect(document.querySelector('[aria-live]')!.textContent).toBe('Hello world');
    expect(document.querySelector('.vz-stream-caret')).toBeNull();
  });

  it('border light wraps your content and server-renders', () => {
    render(
      <BorderLight as="section" aria-label="Plan">
        <button>Buy</button>
      </BorderLight>,
    );
    expect(screen.getByRole('region', { name: 'Plan' }).querySelector('button')).toBeTruthy();
    const html = renderToString(
      <>
        <BorderLight>x</BorderLight>
        <LiquidGauge label="L" value={1} />
        <LiquidRating />
        <GooeyMenu items={[{ label: 'A', icon: 'a' }]} />
      </>,
    );
    expect(html).toContain('vz-border-light');
  });
});
