import type { DocEntry } from '@/lib/types';

export const formEntries: DocEntry[] = [
  {
    slug: 'command-palette',
    title: 'Command palette',
    category: 'Components',
    description:
      'A ⌘K palette in liquid light: it drops in over a blurred page, the list springs to fit its results, matched letters glow and a liquid highlight slides between commands.',
    keywords: ['cmdk', 'command menu', 'spotlight', 'search', 'launcher', 'quick actions', 'kbar'],
    height: 420,
    isNew: true,
    controls: [
      { type: 'boolean', name: 'groups', label: 'grouped', default: true },
      { type: 'boolean', name: 'keepOpen', label: 'keep open after running', default: false },
    ],
    code: {
      react: `import { CommandPalette, toast } from '@vizzele/react';

// Mount it once. ⌘K / Ctrl+K opens it from anywhere.
<CommandPalette
  items={[
    { label: 'New file', group: 'File', shortcut: '⌘N', icon: <FileIcon />, onSelect: newFile },
    { label: 'Open recent', group: 'File', onSelect: openRecent },
    {
      label: 'Toggle theme',
      group: 'View',
      keywords: ['dark', 'light'],
      description: 'Switch between deep space and pearl paper',
      onSelect: toggleTheme,
    },
    { label: 'Delete project', group: 'Danger', disabled: true },
  ]}
/>

// Or control it yourself
const [open, setOpen] = useState(false);
<Button onClick={() => setOpen(true)}>Search</Button>
<CommandPalette open={open} onOpenChange={setOpen} items={items} />`,
    },
    props: [
      {
        name: 'items',
        type: 'CommandItem[]',
        description:
          '{ label, onSelect?, group?, description?, icon?, shortcut?, keywords?, disabled?, id? }',
      },
      {
        name: 'open / defaultOpen / onOpenChange',
        type: 'boolean',
        description: 'Controlled or uncontrolled.',
      },
      {
        name: 'hotkey',
        type: 'string | false',
        default: "'k'",
        description: 'Key that toggles it with ⌘ or Ctrl. false turns the shortcut off.',
      },
      {
        name: 'placeholder',
        type: 'string',
        default: "'Type a command or search…'",
        description: 'Search field placeholder (also its accessible name).',
      },
      {
        name: 'empty',
        type: 'ReactNode | (query) => ReactNode',
        description: 'Shown when nothing matches.',
      },
      {
        name: 'keepOpen',
        type: 'boolean',
        default: 'false',
        description: 'Stay open after running a command.',
      },
      {
        name: 'footer',
        type: 'ReactNode | null',
        description: 'Replaces the keyboard hints; null hides the footer.',
      },
    ],
    a11y: [
      'A modal dialog: focus moves to the search field, Tab is trapped, Escape closes and focus returns to whatever was focused before.',
      'The field is a combobox controlling a listbox, with aria-activedescendant — screen readers announce the active command as you arrow.',
      '↑/↓ move (disabled commands are skipped), Enter runs. Reduced motion: no drop-in, cascade or height spring.',
    ],
  },
  {
    slug: 'otp-input',
    title: 'OTP input',
    category: 'Components',
    description:
      'A one-time-code field: a drop of light stretches to the next cell as you type, characters fall into place and a full code sends an iridescent wave across.',
    keywords: ['one-time code', 'pin', 'verification', '2fa', 'mfa', 'sms code', 'passcode'],
    height: 340,
    isNew: true,
    controls: [
      { type: 'range', name: 'length', min: 4, max: 8, step: 1, default: 6 },
      { type: 'select', name: 'type', options: ['numeric', 'alphanumeric'], default: 'numeric' },
      { type: 'boolean', name: 'grouped', label: 'split in two', default: true },
      { type: 'boolean', name: 'mask', default: false },
    ],
    code: {
      react: `import { OTPInput } from '@vizzele/react';

const [code, setCode] = useState('');
const [wrong, setWrong] = useState(false);

<OTPInput
  value={code}
  onValueChange={(v) => {
    setCode(v);
    setWrong(false);
  }}
  onComplete={async (v) => setWrong(!(await verify(v)))}
  invalid={wrong}
  groupSize={3}
  autoFocus
/>`,
    },
    props: [
      { name: 'length', type: 'number', default: '6', description: 'Number of cells.' },
      {
        name: 'value / defaultValue / onValueChange',
        type: 'string',
        description: 'Controlled or uncontrolled.',
      },
      {
        name: 'onComplete',
        type: '(code: string) => void',
        description: 'Fires once, when the last cell is filled.',
      },
      {
        name: 'type',
        type: "'numeric' | 'alphanumeric'",
        default: "'numeric'",
        description: 'Allowed characters; letters are uppercased.',
      },
      { name: 'groupSize', type: 'number', description: 'Draw a gap every n cells.' },
      { name: 'mask', type: 'boolean', description: 'Show dots instead of characters.' },
      { name: 'invalid', type: 'boolean', description: 'Shake once and turn red.' },
      {
        name: 'label',
        type: 'string',
        default: "'One-time code'",
        description: 'Accessible name.',
      },
      { name: 'name', type: 'string', description: 'Submitted with forms.' },
    ],
    a11y: [
      'One real input underneath the cells — paste, SMS autofill (autocomplete="one-time-code"), the numeric keypad and screen readers all work as with any field.',
      'Invalid sets aria-invalid. Reduced motion: characters appear without falling and the wave and shake are off.',
    ],
  },
  {
    slug: 'file-dropzone',
    title: 'File dropzone',
    category: 'Components',
    description:
      'A drop target with a liquid surface: it swells when a file is dragged over, a pool of light follows the file, and a drop sends a splash ring out from where it landed.',
    keywords: ['upload', 'file input', 'drag and drop', 'attachments', 'dropzone'],
    height: 460,
    isNew: true,
    controls: [
      { type: 'select', name: 'accept', options: ['any', 'images', 'pdf'], default: 'any' },
      { type: 'boolean', name: 'multiple', default: true },
      { type: 'boolean', name: 'disabled', default: false },
    ],
    code: {
      react: `import { FileDropzone, toast } from '@vizzele/react';

const [files, setFiles] = useState<File[]>([]);

<FileDropzone
  accept="image/*,.pdf"
  maxSize={5 * 1024 * 1024}
  maxFiles={4}
  files={files}
  onFilesChange={setFiles}
  onReject={(r) => toast.error(\`\${r[0].file.name}: wrong \${r[0].reason}\`)}
  hint="PNG, JPG or PDF — up to 5 MB"
/>`,
    },
    props: [
      { name: 'accept', type: 'string', description: 'Like <input accept>: "image/*,.pdf".' },
      { name: 'multiple', type: 'boolean', default: 'true', description: 'Keep several files.' },
      { name: 'maxSize', type: 'number', description: 'Largest file, in bytes.' },
      { name: 'maxFiles', type: 'number', description: 'Most files kept at once.' },
      {
        name: 'files / onFilesChange',
        type: 'File[]',
        description: 'Controlled list (uncontrolled if omitted).',
      },
      {
        name: 'onReject',
        type: '(FileRejection[]) => void',
        description: "Files turned away: { file, reason: 'type' | 'size' | 'count' }.",
      },
      { name: 'title / hint / icon', type: 'ReactNode', description: 'Content of the zone.' },
      {
        name: 'showFiles',
        type: 'boolean',
        default: 'true',
        description: 'List chosen files with a remove button.',
      },
      {
        name: 'name',
        type: 'string',
        description: 'Submitted with forms — the input holds every chosen file.',
      },
    ],
    a11y: [
      'A real file input inside a <label>: Tab focuses it, Enter or Space opens the picker, and the hint is linked with aria-describedby.',
      'Every chosen file has a labelled remove button. Reduced motion: no splash, swell or shake.',
    ],
  },
];
