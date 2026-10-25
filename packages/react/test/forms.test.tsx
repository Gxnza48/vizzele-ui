import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { useState } from 'react';
import {
  CommandPalette,
  FileDropzone,
  OTPInput,
  Select,
  acceptsFile,
  formatBytes,
  fuzzyMatch,
  setReducedMotion,
} from '../src';

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  setReducedMotion('always');
});
afterEach(cleanup);

describe('fuzzyMatch', () => {
  it('matches subsequences and ranks prefixes and word starts higher', () => {
    expect(fuzzyMatch('nwf', 'New file')?.indices).toEqual([0, 2, 4]);
    expect(fuzzyMatch('xyz', 'New file')).toBeNull();
    const prefix = fuzzyMatch('set', 'Settings')!.score;
    const inside = fuzzyMatch('set', 'Reset password')!.score;
    expect(prefix).toBeGreaterThan(inside);
    expect(fuzzyMatch('', 'anything')).toEqual({ score: 0, indices: [] });
  });
});

describe('CommandPalette', () => {
  const setup = (onRun = vi.fn()) => {
    render(
      <CommandPalette
        items={[
          { label: 'New file', group: 'File', shortcut: '⌘N', onSelect: () => onRun('new') },
          { label: 'Open recent', group: 'File', onSelect: () => onRun('open') },
          {
            label: 'Toggle theme',
            group: 'View',
            keywords: ['dark', 'light'],
            onSelect: () => onRun('theme'),
          },
          { label: 'Delete project', group: 'Danger', disabled: true },
        ]}
      />,
    );
    return onRun;
  };

  it('opens with ⌘K / Ctrl+K and closes with Escape', () => {
    setup();
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    const dialog = screen.getByRole('dialog', { name: 'Command palette' });
    expect(document.activeElement).toBe(screen.getByRole('combobox'));
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('filters, highlights matches, and runs the active command', () => {
    const onRun = setup();
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'opn' } });
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]!.querySelectorAll('mark').length).toBeGreaterThan(0);
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0]!.id);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onRun).toHaveBeenCalledWith('open');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('finds items by keyword, skips disabled ones and shows an empty state', () => {
    const onRun = setup();
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'dark' } });
    expect(screen.getByRole('option').textContent).toContain('Toggle theme');
    // Labels match fuzzily; keywords only as plain text, so scattered letters don't drag in noise.
    fireEvent.change(input, { target: { value: 'tgl' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'ArrowUp' }); // wraps to the last enabled item
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onRun).toHaveBeenCalledWith('theme');
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzz' } });
    expect(screen.getByRole('status').textContent).toContain('zzz');
  });

  it('can be controlled and renders nothing on the server', () => {
    function Controlled() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <span data-testid="state">{String(open)}</span>
          <CommandPalette
            open={open}
            onOpenChange={setOpen}
            hotkey={false}
            items={[{ label: 'A' }]}
          />
        </>
      );
    }
    render(<Controlled />);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.getByTestId('state').textContent).toBe('false');
    expect(renderToString(<CommandPalette defaultOpen items={[{ label: 'A' }]} />)).toBe('');
  });
});

describe('OTPInput', () => {
  it('keeps only allowed characters and completes once', () => {
    const onComplete = vi.fn();
    const onChange = vi.fn();
    const { container } = render(
      <OTPInput length={4} groupSize={2} onValueChange={onChange} onComplete={onComplete} />,
    );
    const input = screen.getByRole('textbox', { name: 'One-time code' });
    expect(input.getAttribute('autocomplete')).toBe('one-time-code');
    fireEvent.change(input, { target: { value: '1a2' } });
    expect(onChange).toHaveBeenLastCalledWith('12');
    expect(container.querySelectorAll('[data-filled]')).toHaveLength(2);
    expect(container.querySelectorAll('.vz-otp-sep')).toHaveLength(1);
    // A pasted code longer than the field is cut to length.
    fireEvent.change(input, { target: { value: '987654' } });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('9876');
    expect(container.querySelector('.vz-otp')!.hasAttribute('data-complete')).toBe(true);
  });

  it('uppercases alphanumeric codes, masks and reports invalid', () => {
    const { container } = render(<OTPInput type="alphanumeric" mask invalid defaultValue="ab-1" />);
    const input = container.querySelector('input')!;
    expect(input.value).toBe('AB1');
    expect(input.type).toBe('password');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(container.querySelector('.vz-otp-char')!.textContent).toBe('•');
  });
});

describe('FileDropzone', () => {
  const file = (name: string, type: string, size = 10) =>
    new File([new Uint8Array(size)], name, { type, lastModified: 1 });

  it('matches accept strings', () => {
    expect(acceptsFile(file('a.png', 'image/png'), 'image/*')).toBe(true);
    expect(acceptsFile(file('a.PDF', ''), '.pdf, image/*')).toBe(true);
    expect(acceptsFile(file('a.txt', 'text/plain'), 'image/*,.pdf')).toBe(false);
    expect(acceptsFile(file('a.txt', 'text/plain'))).toBe(true);
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  it('adds dropped and chosen files, rejects bad ones and removes on demand', () => {
    const onFiles = vi.fn();
    const onReject = vi.fn();
    const { container } = render(
      <FileDropzone
        accept="image/*"
        maxSize={100}
        onFilesChange={onFiles}
        onReject={onReject}
        hint="Images"
      />,
    );
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(input.getAttribute('aria-describedby')).toBeTruthy();
    fireEvent.change(input, { target: { files: [file('a.png', 'image/png')] } });
    expect(onFiles).toHaveBeenLastCalledWith([expect.objectContaining({ name: 'a.png' })]);

    const zone = container.querySelector('.vz-dropzone')!;
    fireEvent.dragEnter(zone, { dataTransfer: { files: [] } });
    expect(zone.hasAttribute('data-over')).toBe(true);
    fireEvent.drop(zone, {
      dataTransfer: {
        files: [
          file('b.jpg', 'image/jpeg'),
          file('c.txt', 'text/plain'),
          file('d.png', 'image/png', 500),
        ],
      },
    });
    expect(zone.hasAttribute('data-over')).toBe(false);
    expect(container.querySelector('.vz-dropzone-splash')).not.toBeNull();
    expect(onFiles).toHaveBeenLastCalledWith([
      expect.objectContaining({ name: 'a.png' }),
      expect.objectContaining({ name: 'b.jpg' }),
    ]);
    expect(onReject.mock.calls[0]![0].map((r: { reason: string }) => r.reason)).toEqual([
      'type',
      'size',
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Remove a.png' }));
    expect(onFiles).toHaveBeenLastCalledWith([expect.objectContaining({ name: 'b.jpg' })]);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('keeps one file when not multiple', () => {
    const onFiles = vi.fn();
    const { container } = render(<FileDropzone multiple={false} onFilesChange={onFiles} />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [file('a.png', 'image/png')] } });
    fireEvent.change(input, { target: { files: [file('b.png', 'image/png')] } });
    expect(onFiles).toHaveBeenLastCalledWith([expect.objectContaining({ name: 'b.png' })]);
  });
});

describe('liquid highlight', () => {
  it('paints the new highlight after a popup is closed and reopened', () => {
    render(<Select label="Spring" options={['Liquid', 'Jelly']} defaultValue="Liquid" />);
    const box = screen.getByRole('combobox');
    fireEvent.click(box);
    // Reduced motion unmounts the popup at once, so the reopen renders a fresh blob.
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    setReducedMotion('never');
    try {
      act(() => fireEvent.click(box));
      const blob = document.querySelector<HTMLElement>('.vz-option-blob')!;
      expect(blob.style.opacity).toBe('1');
      expect(blob.style.transform).toMatch(/translateY/);
    } finally {
      setReducedMotion('always');
    }
  });
});
