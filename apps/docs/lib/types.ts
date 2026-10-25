export type Control =
  | {
      type: 'range';
      name: string;
      label?: string;
      min: number;
      max: number;
      step?: number;
      default: number;
    }
  | { type: 'select'; name: string; label?: string; options: readonly string[]; default: string }
  | { type: 'boolean'; name: string; label?: string; default: boolean }
  | { type: 'color'; name: string; label?: string; default: string }
  | { type: 'text'; name: string; label?: string; default: string };

export type ControlValues = Record<string, number | string | boolean>;

export interface PropRow {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export type Category =
  | 'Getting started'
  | 'Cursor & pointer'
  | 'Drag & physics'
  | 'Backgrounds'
  | 'Text'
  | 'Scroll'
  | 'Components'
  | 'Charts'
  | 'AI'
  | 'Originals'
  | 'Hooks';

export interface DocEntry {
  slug: string;
  title: string;
  category: Category;
  description: string;
  /** Searchable extra words. */
  keywords?: string[];
  controls?: Control[];
  code: { react: string; vanilla?: string; html?: string; css?: string };
  props?: PropRow[];
  a11y?: string[];
  /** Demo needs room (full width stage). */
  wide?: boolean;
  /** Tall stage height in px. */
  height?: number;
  isNew?: boolean;
}
