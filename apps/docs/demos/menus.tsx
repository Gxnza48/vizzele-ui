'use client';

import { useState } from 'react';
import { Button, DropdownMenu, Select, toast, Toaster, type Placement } from '@vizzele/react';
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
  drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  wave: 'M2 12c3 0 3-5 6-5s3 10 6 10 3-5 6-5',
  weight: 'M6 7h12l2 13H4zM9 7a3 3 0 0 1 6 0',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  feather: 'M20 4C10 4 6 10 6 18M6 18l4-4M14 9l-4 4',
  pencil: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  copy: 'M8 8h11v11H8zM5 16V5h11',
  share: 'M12 3v12M7 8l5-5 5 5M5 15v5h14v-5',
  archive: 'M3 5h18v4H3zM5 9v10h14V9M10 13h4',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
};

const springOptions = [
  {
    value: 'liquid',
    label: 'Liquid',
    description: 'Quick, a hint of overshoot',
    icon: <Icon d={icons.drop} />,
  },
  {
    value: 'jelly',
    label: 'Jelly',
    description: 'Wobbly like gelatine',
    icon: <Icon d={icons.wave} />,
  },
  {
    value: 'heavy',
    label: 'Heavy',
    description: 'Slow, with momentum',
    icon: <Icon d={icons.weight} />,
  },
  {
    value: 'snappy',
    label: 'Snappy',
    description: 'Tight and responsive',
    icon: <Icon d={icons.bolt} />,
  },
  {
    value: 'gentle',
    label: 'Gentle',
    description: 'Soft, for large surfaces',
    icon: <Icon d={icons.feather} />,
  },
  {
    value: 'bouncy',
    label: 'Bouncy',
    description: 'Disabled in this demo',
    icon: <Icon d={icons.drop} />,
    disabled: true,
  },
];

export function SelectDemo({ values }: P) {
  const [spring, setSpring] = useState('liquid');
  const opts = values.icons
    ? springOptions
    : springOptions.map(({ value, label, disabled }) => ({
        value,
        label,
        ...(disabled ? { disabled } : {}),
      }));
  return (
    <div
      className="demo-center demo-col"
      style={{ width: 'min(320px, 100%)', alignItems: 'stretch' }}
    >
      <Select
        label="Spring preset"
        options={opts}
        value={spring}
        onValueChange={setSpring}
        size={values.size as 'sm' | 'md'}
        placement={values.placement as 'bottom' | 'top'}
        disabled={Boolean(values.disabled)}
      />
      <Select
        label="Theme"
        options={['Deep space', 'Pearl paper', 'Follow the system']}
        placeholder="Pick a theme…"
      />
      <p className="demo-hint" style={{ textAlign: 'center' }}>
        Selected: <strong>{spring}</strong> — try the keyboard and typing letters
      </p>
    </div>
  );
}

export function DropdownMenuDemo({ values }: P) {
  return (
    <div className="demo-center demo-col">
      <Toaster position="bottom-center" />
      <DropdownMenu
        placement={values.placement as Placement}
        items={[
          { type: 'label', label: 'Project “Aurora”' },
          {
            label: 'Rename',
            icon: <Icon d={icons.pencil} />,
            shortcut: 'R',
            onSelect: () => toast('Rename'),
          },
          {
            label: 'Duplicate',
            icon: <Icon d={icons.copy} />,
            shortcut: '⌘D',
            onSelect: () => toast('Duplicated'),
          },
          {
            label: 'Share',
            icon: <Icon d={icons.share} />,
            shortcut: '⌘S',
            onSelect: () => toast.info('Link copied'),
          },
          { label: 'Archive', icon: <Icon d={icons.archive} />, disabled: true },
          { type: 'separator' },
          {
            label: 'Delete',
            icon: <Icon d={icons.trash} />,
            danger: true,
            onSelect: () => toast.error('Deleted (not really)'),
          },
        ]}
      >
        {(props) => (
          <Button {...props} variant="holo" size="lg">
            Actions
          </Button>
        )}
      </DropdownMenu>
      <p className="demo-hint">Click it, or focus it and press ↓</p>
    </div>
  );
}
