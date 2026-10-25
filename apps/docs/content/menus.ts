import type { DocEntry } from '@/lib/types';

export const menuEntries: DocEntry[] = [
  {
    slug: 'select',
    title: 'Select',
    category: 'Components',
    description:
      'A select in liquid light: the list springs out of the button, options cascade in, and a blob of light slides between them — stretching as it travels.',
    keywords: ['dropdown', 'listbox', 'combobox', 'picker', 'options', 'form'],
    height: 420,
    controls: [
      { type: 'select', name: 'size', options: ['md', 'sm'], default: 'md' },
      { type: 'select', name: 'placement', options: ['bottom', 'top'], default: 'bottom' },
      { type: 'boolean', name: 'icons', label: 'with icons & descriptions', default: true },
      { type: 'boolean', name: 'disabled', default: false },
    ],
    code: {
      react: `import { Select } from '@vizzele/react';

const [spring, setSpring] = useState('liquid');

<Select
  label="Spring"
  value={spring}
  onValueChange={setSpring}
  options={[
    { value: 'liquid', label: 'Liquid', description: 'Quick, a hint of overshoot' },
    { value: 'jelly', label: 'Jelly', description: 'Wobbly' },
    { value: 'heavy', label: 'Heavy', disabled: true },
  ]}
/>

// strings work too
<Select label="Theme" options={['Dark', 'Light', 'Auto']} defaultValue="Dark" name="theme" />`,
    },
    props: [
      {
        name: 'options',
        type: '(SelectOption | string)[]',
        description: '{ value, label, textValue?, description?, icon?, disabled? }',
      },
      {
        name: 'value / defaultValue / onValueChange',
        type: 'string',
        description: 'Controlled or uncontrolled.',
      },
      {
        name: 'label / labelledBy',
        type: 'string',
        description: 'Accessible name (or the id of a visible label).',
      },
      {
        name: 'placeholder',
        type: 'string',
        default: "'Select…'",
        description: 'Shown when nothing is chosen.',
      },
      { name: 'size', type: "'sm' | 'md'", default: "'md'", description: 'Density.' },
      {
        name: 'placement',
        type: "'bottom' | 'top'",
        default: "'bottom'",
        description: 'Preferred side (flips when there is no room).',
      },
      { name: 'name', type: 'string', description: 'Submits the value with forms (hidden input).' },
      { name: 'disabled', type: 'boolean', description: 'Disable the whole control.' },
    ],
    a11y: [
      'WAI-ARIA select-only combobox: role="combobox" button + role="listbox" with aria-activedescendant.',
      '↑/↓ (or Enter/Space) open it; ↑/↓, Home/End move; type letters to jump; Enter/Space/Tab choose; Escape closes and returns focus.',
      'Disabled options are skipped by the keyboard. Reduced motion: no cascade, the highlight jumps.',
    ],
  },
  {
    slug: 'dropdown-menu',
    title: 'Dropdown menu',
    category: 'Components',
    description:
      'An action menu that springs out of its button — icons, shortcuts, sections, separators and destructive items, with the same liquid highlight.',
    keywords: ['menu', 'context menu', 'actions', 'more', 'kebab', 'overflow'],
    height: 440,
    controls: [
      {
        type: 'select',
        name: 'placement',
        options: ['bottom', 'top', 'right', 'left'],
        default: 'bottom',
      },
    ],
    code: {
      react: `import { DropdownMenu, Button } from '@vizzele/react';

<DropdownMenu
  items={[
    { type: 'label', label: 'Project' },
    { label: 'Rename', icon: <PencilIcon />, shortcut: 'R', onSelect: rename },
    { label: 'Duplicate', icon: <CopyIcon />, shortcut: '⌘D', onSelect: duplicate },
    { type: 'separator' },
    { label: 'Delete', icon: <TrashIcon />, danger: true, onSelect: remove },
  ]}
>
  {(props) => <Button {...props} variant="holo">Actions</Button>}
</DropdownMenu>`,
    },
    props: [
      {
        name: 'items',
        type: 'MenuItem[]',
        description:
          "{ label, icon?, shortcut?, onSelect?, disabled?, danger? } | { type: 'separator' } | { type: 'label', label }",
      },
      {
        name: 'children',
        type: '(triggerProps) => ReactNode',
        description: 'Render your trigger and spread the props on it.',
      },
      { name: 'placement', type: 'Placement', default: "'bottom'", description: 'Preferred side.' },
      {
        name: 'label',
        type: 'string',
        description: 'Accessible name of the menu (defaults to the trigger text).',
      },
    ],
    a11y: [
      'WAI-ARIA menu button: aria-haspopup="menu", role="menu" / "menuitem", aria-activedescendant.',
      '↓ / ↑ on the trigger open on the first / last item; arrows, Home/End, typeahead; Enter runs; Escape closes and returns focus.',
    ],
  },
];
