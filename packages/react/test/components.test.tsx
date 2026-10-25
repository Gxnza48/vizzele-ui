import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import {
  Accordion,
  Button,
  Checkbox,
  DropdownMenu,
  Select,
  ReorderGroup,
  ReorderItem,
  Switch,
  Tabs,
  Toaster,
  Tooltip,
  setReducedMotion,
  toast,
} from '../src';

beforeAll(() => {
  // jsdom lacks these; components only use them for measurements.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  globalThis.IntersectionObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
  // Snap all animation in tests.
  setReducedMotion('always');
});
afterEach(() => {
  cleanup();
  toast.dismiss();
});

describe('Button', () => {
  it('is a real button with type=button and handles clicks', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    const b = screen.getByRole('button', { name: 'Go' });
    expect(b.getAttribute('type')).toBe('button');
    fireEvent.click(b);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('marks loading as busy and disabled', () => {
    render(<Button loading>Save</Button>);
    const b = screen.getByRole('button');
    expect(b.getAttribute('aria-busy')).toBe('true');
    expect((b as HTMLButtonElement).disabled).toBe(true);
  });

  it('renders as a link', () => {
    render(
      <Button as="a" href="/docs">
        Docs
      </Button>,
    );
    expect(screen.getByRole('link', { name: 'Docs' }).getAttribute('href')).toBe('/docs');
  });
});

describe('Switch & Checkbox', () => {
  it('switch exposes role=switch and reports changes', () => {
    const onChange = vi.fn();
    render(<Switch label="Wifi" onCheckedChange={onChange} />);
    const s = screen.getByRole('switch', { name: 'Wifi' });
    fireEvent.click(s);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('checkbox supports indeterminate', () => {
    render(<Checkbox label="All" indeterminate />);
    expect((screen.getByRole('checkbox') as HTMLInputElement).indeterminate).toBe(true);
  });
});

describe('Tabs', () => {
  const items = [
    { value: 'a', label: 'Alpha', content: 'Panel A' },
    { value: 'b', label: 'Beta', content: 'Panel B' },
    { value: 'c', label: 'Gamma', content: 'Panel C', disabled: true },
  ];

  it('follows the WAI-ARIA tabs pattern', () => {
    render(<Tabs label="Greek" items={items} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]!.getAttribute('aria-selected')).toBe('true');
    expect(tabs[0]!.tabIndex).toBe(0);
    expect(tabs[1]!.tabIndex).toBe(-1);
    expect(screen.getByRole('tabpanel').textContent).toBe('Panel A');
  });

  it('moves with arrow keys and skips disabled tabs', () => {
    render(<Tabs label="Greek" items={items} />);
    const list = screen.getByRole('tablist');
    fireEvent.keyDown(list, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { selected: true }).textContent).toBe('Beta');
    fireEvent.keyDown(list, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { selected: true }).textContent).toBe('Alpha');
    fireEvent.keyDown(list, { key: 'End' });
    expect(screen.getByRole('tab', { selected: true }).textContent).toBe('Beta');
  });
});

describe('Accordion', () => {
  it('toggles aria-expanded and makes closed panels inert', () => {
    render(
      <Accordion
        items={[
          { id: 'q1', title: 'Question 1', content: 'Answer 1' },
          { id: 'q2', title: 'Question 2', content: 'Answer 2' },
        ]}
      />,
    );
    const [b1, b2] = screen.getAllByRole('button');
    expect(b1!.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(b1!);
    expect(b1!.getAttribute('aria-expanded')).toBe('true');
    // single mode: opening the second closes the first
    fireEvent.click(b2!);
    expect(b1!.getAttribute('aria-expanded')).toBe('false');
    expect(b2!.getAttribute('aria-expanded')).toBe('true');
    const panel1 = document.getElementById(b1!.getAttribute('aria-controls')!)!;
    expect(panel1.hasAttribute('inert')).toBe(true);
  });
});

describe('Toast', () => {
  it('shows, announces and dismisses', () => {
    render(<Toaster />);
    act(() => {
      toast.success({ title: 'Saved', description: 'All good' });
      toast.error('Broke');
    });
    expect(screen.getByRole('status').textContent).toContain('Saved');
    expect(screen.getByRole('alert').textContent).toContain('Broke');
    act(() => {
      fireEvent.click(screen.getAllByRole('button', { name: 'Dismiss notification' })[0]!);
    });
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('Tooltip', () => {
  it('links the tooltip to its trigger on focus', async () => {
    render(
      <Tooltip content="Copy link">
        <button>Copy</button>
      </Tooltip>,
    );
    const b = screen.getByRole('button', { name: 'Copy' });
    act(() => {
      fireEvent.focus(b);
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    const tip = screen.getByRole('tooltip');
    expect(tip.textContent).toBe('Copy link');
    expect(b.getAttribute('aria-describedby')).toBe(tip.id);
  });
});

describe('ReorderGroup', () => {
  function List() {
    const [items, setItems] = useState(['one', 'two', 'three']);
    return (
      <>
        <ReorderGroup values={items} onReorder={setItems} label="List">
          {items.map((i) => (
            <ReorderItem key={i}>{i}</ReorderItem>
          ))}
        </ReorderGroup>
        <output data-testid="order">{items.join(',')}</output>
      </>
    );
  }

  it('reorders with the keyboard: grab, move, drop', () => {
    render(<List />);
    const first = screen.getAllByRole('listitem')[0]!;
    first.focus();
    fireEvent.keyDown(first, { key: ' ' });
    expect(first.getAttribute('aria-grabbed')).toBe('true');
    fireEvent.keyDown(first, { key: 'ArrowDown' });
    expect(screen.getByTestId('order').textContent).toBe('two,one,three');
    const moved = screen.getAllByRole('listitem')[1]!;
    fireEvent.keyDown(moved, { key: 'ArrowDown' });
    expect(screen.getByTestId('order').textContent).toBe('two,three,one');
    fireEvent.keyDown(screen.getAllByRole('listitem')[2]!, { key: 'Enter' });
    expect(screen.getAllByRole('listitem')[2]!.getAttribute('aria-grabbed')).toBe('false');
  });
});

describe('Select', () => {
  const options = [
    { value: 'liquid', label: 'Liquid' },
    { value: 'jelly', label: 'Jelly' },
    { value: 'heavy', label: 'Heavy', disabled: true },
    { value: 'gentle', label: 'Gentle' },
  ];

  it('is a combobox that opens a listbox and chooses with the keyboard', () => {
    const onChange = vi.fn();
    render(
      <Select label="Spring" options={options} defaultValue="liquid" onValueChange={onChange} />,
    );
    const box = screen.getByRole('combobox', { name: 'Spring' });
    expect(box.textContent).toContain('Liquid');
    fireEvent.keyDown(box, { key: 'ArrowDown' });
    const list = screen.getByRole('listbox');
    expect(box.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('option', { name: 'Liquid' }).getAttribute('aria-selected')).toBe(
      'true',
    );
    fireEvent.keyDown(list, { key: 'ArrowDown' }); // Jelly
    fireEvent.keyDown(list, { key: 'ArrowDown' }); // skips disabled Heavy → Gentle
    expect(list.getAttribute('aria-activedescendant')).toMatch(/opt-3$/);
    fireEvent.keyDown(list, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('gentle');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(box.textContent).toContain('Gentle');
  });

  it('jumps with typeahead and closes on Escape', () => {
    render(<Select label="Spring" options={options} defaultValue="liquid" />);
    const box = screen.getByRole('combobox');
    fireEvent.click(box);
    const list = screen.getByRole('listbox');
    fireEvent.keyDown(list, { key: 'j' });
    expect(list.getAttribute('aria-activedescendant')).toMatch(/opt-1$/);
    fireEvent.keyDown(list, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(box.textContent).toContain('Liquid');
  });
});

describe('DropdownMenu', () => {
  it('opens a menu, runs items and skips disabled ones', () => {
    const rename = vi.fn();
    const remove = vi.fn();
    render(
      <DropdownMenu
        items={[
          { label: 'Rename', onSelect: rename },
          { label: 'Archive', disabled: true },
          { type: 'separator' },
          { label: 'Delete', danger: true, onSelect: remove },
        ]}
      >
        {(p) => <button {...p}>Actions</button>}
      </DropdownMenu>,
    );
    const trigger = screen.getByRole('button', { name: 'Actions' });
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const menu = screen.getByRole('menu');
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    fireEvent.keyDown(menu, { key: 'ArrowDown' }); // Rename → Delete (Archive disabled)
    fireEvent.keyDown(menu, { key: 'Enter' });
    expect(remove).toHaveBeenCalledOnce();
    expect(rename).not.toHaveBeenCalled();
    expect(screen.queryByRole('menu')).toBeNull();
  });
});

describe('floating reopen', () => {
  it('a select reopened during its exit is visible again', async () => {
    setReducedMotion('never');
    render(<Select label="Quick" options={['a', 'b']} defaultValue="a" />);
    const box = screen.getByRole('combobox');
    fireEvent.click(box); // open
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' }); // start closing
    fireEvent.click(box); // reopen immediately
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    const popup = document.querySelector('.vz-select-popup') as HTMLElement;
    expect(popup).not.toBeNull();
    expect(box.getAttribute('aria-expanded')).toBe('true');
    setReducedMotion('always');
  });
});

describe('select reopen keeps keyboard', () => {
  it('moves focus into the list on every open', () => {
    render(<Select label="K" options={['a', 'b', 'c']} defaultValue="a" />);
    const box = screen.getByRole('combobox');
    fireEvent.click(box);
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });
    fireEvent.click(box);
    expect(document.activeElement?.getAttribute('role')).toBe('listbox');
  });
});
