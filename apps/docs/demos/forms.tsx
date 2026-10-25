'use client';

import { useState } from 'react';
import {
  Button,
  CommandPalette,
  FileDropzone,
  OTPInput,
  toast,
  Toaster,
  type CommandItem,
} from '@vizzele/react';
import type { ControlValues } from '@/lib/types';

type P = { values: ControlValues };

const Icon = ({ d }: { d: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);
const icons = {
  file: 'M6 3h8l4 4v14H6zM14 3v4h4',
  folder: 'M3 6h6l2 2h10v11H3z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  moon: 'M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z',
  drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4',
  key: 'M14 10a4 4 0 1 0-4 4l-6 6M7 17l2 2',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
};

export function CommandPaletteDemo({ values }: P) {
  const [open, setOpen] = useState(false);
  const grouped = Boolean(values.groups);
  const items: CommandItem[] = [
    { label: 'New file', group: 'File', shortcut: '⌘N', icon: <Icon d={icons.file} /> },
    { label: 'Open project…', group: 'File', shortcut: '⌘O', icon: <Icon d={icons.folder} /> },
    { label: 'Find in files', group: 'File', shortcut: '⇧⌘F', icon: <Icon d={icons.search} /> },
    {
      label: 'Toggle theme',
      group: 'View',
      keywords: ['dark', 'light', 'mode'],
      description: 'Deep space ↔ pearl paper',
      icon: <Icon d={icons.moon} />,
    },
    {
      label: 'Spring preset: jelly',
      group: 'View',
      keywords: ['animation', 'physics'],
      icon: <Icon d={icons.drop} />,
    },
    { label: 'Profile', group: 'Account', icon: <Icon d={icons.user} /> },
    { label: 'Notifications', group: 'Account', icon: <Icon d={icons.bell} /> },
    {
      label: 'Change password',
      group: 'Account',
      keywords: ['security'],
      icon: <Icon d={icons.key} />,
    },
    { label: 'Delete workspace', group: 'Account', disabled: true, icon: <Icon d={icons.trash} /> },
  ].map((it) => ({
    ...it,
    group: grouped ? it.group : undefined,
    onSelect: () => toast(it.label),
  }));
  return (
    <div className="demo-center demo-col">
      <Toaster position="bottom-center" />
      <Button variant="holo" size="lg" onClick={() => setOpen(true)}>
        Open the palette
      </Button>
      <p className="demo-hint">Try typing “tgl”, “dark” or “pw”</p>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        items={items}
        hotkey={false}
        keepOpen={Boolean(values.keepOpen)}
        footer={
          <>
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> move
            </span>
            <span>
              <kbd>↵</kbd> run
            </span>
            <span>
              <kbd>esc</kbd> close
            </span>
          </>
        }
      />
    </div>
  );
}

export function OTPInputDemo({ values }: P) {
  const length = Number(values.length);
  const type = values.type as 'numeric' | 'alphanumeric';
  const answer = (type === 'numeric' ? '1234567890' : 'VIZZELE8').slice(0, length);
  const [code, setCode] = useState('');
  const [state, setState] = useState<'idle' | 'ok' | 'wrong'>('idle');
  return (
    <div className="demo-center demo-col" key={`${length}-${type}`}>
      <OTPInput
        length={length}
        type={type}
        groupSize={values.grouped ? Math.ceil(length / 2) : undefined}
        mask={Boolean(values.mask)}
        value={code}
        invalid={state === 'wrong'}
        onValueChange={(v) => {
          setCode(v);
          setState('idle');
        }}
        onComplete={(v) => setState(v === answer ? 'ok' : 'wrong')}
      />
      <p className="demo-hint" role="status">
        {state === 'ok' ? (
          <strong>Verified ✓</strong>
        ) : state === 'wrong' ? (
          'That code isn’t right — try again'
        ) : (
          <>
            The right code is <strong>{answer}</strong> — or paste it
          </>
        )}
      </p>
    </div>
  );
}

const acceptMap: Record<string, { accept?: string; hint: string }> = {
  any: { hint: 'Any file, up to 5 MB' },
  images: { accept: 'image/*', hint: 'PNG, JPG, GIF or WebP — up to 5 MB' },
  pdf: { accept: '.pdf,application/pdf', hint: 'PDF only — up to 5 MB' },
};

export function FileDropzoneDemo({ values }: P) {
  const [files, setFiles] = useState<File[]>([]);
  const { accept, hint } = acceptMap[String(values.accept)] ?? acceptMap.any!;
  return (
    <div
      className="demo-center demo-col"
      style={{ width: 'min(460px, 100%)', alignItems: 'stretch' }}
    >
      <Toaster position="bottom-center" />
      <FileDropzone
        accept={accept}
        multiple={Boolean(values.multiple)}
        disabled={Boolean(values.disabled)}
        maxSize={5 * 1024 * 1024}
        maxFiles={5}
        files={files}
        onFilesChange={setFiles}
        onReject={(rs) =>
          rs.forEach((r) =>
            toast.error(
              r.reason === 'type'
                ? `${r.file.name}: not an accepted type`
                : r.reason === 'size'
                  ? `${r.file.name}: larger than 5 MB`
                  : `${r.file.name}: five files at most`,
            ),
          )
        }
        hint={hint}
      />
    </div>
  );
}
