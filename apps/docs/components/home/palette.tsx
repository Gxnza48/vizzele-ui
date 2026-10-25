'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/** A brand palette: the accent plus the five hues every iridescent material is mixed from. */
export interface Palette {
  name: string;
  accent: string;
  cyan: string;
  magenta: string;
  amber: string;
  acid: string;
  violet: string;
}

export const palettes: Palette[] = [
  {
    name: 'Vizzele',
    accent: '#00e5ff',
    cyan: '#00e5ff',
    magenta: '#ff2bd6',
    amber: '#ffb238',
    acid: '#a8ff3e',
    violet: '#7c5cff',
  },
  {
    name: 'Ember',
    accent: '#ff7a2f',
    cyan: '#ffb238',
    magenta: '#ff3d6e',
    amber: '#ff7a2f',
    acid: '#ffd166',
    violet: '#c2185b',
  },
  {
    name: 'Ocean',
    accent: '#2f9bff',
    cyan: '#36e2ff',
    magenta: '#3b5bff',
    amber: '#7cf0d1',
    acid: '#9ad1ff',
    violet: '#1f3bff',
  },
  {
    name: 'Forest',
    accent: '#3ddc84',
    cyan: '#3ddc84',
    magenta: '#0fb5a0',
    amber: '#d7f35a',
    acid: '#a8ff3e',
    violet: '#127a5a',
  },
  {
    name: 'Mono',
    accent: '#9aa5c3',
    cyan: '#e9eefb',
    magenta: '#8a93ad',
    amber: '#c9d2e6',
    acid: '#ffffff',
    violet: '#5b6380',
  },
];

/** The colours a WebGL background should mix, in a pleasing order. */
export const inkOf = (p: Palette) => [p.cyan, p.magenta, p.violet, p.amber];

const keys = ['accent', 'cyan', 'magenta', 'amber', 'acid', 'violet'] as const;

/** The CSS a reader would paste to get this palette. */
export const paletteCss = (p: Palette) =>
  `:root {\n${keys.map((k) => `  --vz-${k}: ${p[k]};`).join('\n')}\n}`;

const Ctx = createContext<{ palette: Palette; setPalette: (p: Palette) => void }>({
  palette: palettes[0]!,
  setPalette: () => {},
});

export const usePalette = () => useContext(Ctx);

/**
 * Holds the home page's palette and writes it to the root as --vz-* variables, so the whole
 * page — header, buttons, materials — recolours. Leaving the page restores the defaults.
 */
export function PaletteProvider({ children }: { children: ReactNode }) {
  const [palette, setPalette] = useState(palettes[0]!);
  useEffect(() => {
    const root = document.documentElement.style;
    if (palette === palettes[0]) keys.forEach((k) => root.removeProperty(`--vz-${k}`));
    else keys.forEach((k) => root.setProperty(`--vz-${k}`, palette[k]));
    // Text in the accent stays readable in both themes: mix it toward the text colour.
    if (palette === palettes[0]) root.removeProperty('--vz-accent-text');
    else
      root.setProperty(
        '--vz-accent-text',
        `color-mix(in oklab, ${palette.accent} 62%, var(--vz-text))`,
      );
  }, [palette]);
  useEffect(
    () => () => {
      const root = document.documentElement.style;
      [...keys, 'accent-text'].forEach((k) => root.removeProperty(`--vz-${k}`));
    },
    [],
  );
  return <Ctx.Provider value={{ palette, setPalette }}>{children}</Ctx.Provider>;
}

/** A row of swatches that switches the page palette. */
export function PalettePicker({ className }: { className?: string }) {
  const { palette, setPalette } = usePalette();
  return (
    <div
      className={className ? `palette-picker ${className}` : 'palette-picker'}
      role="group"
      aria-label="Page colours"
    >
      {palettes.map((p) => (
        <button
          key={p.name}
          type="button"
          aria-pressed={palette.name === p.name}
          className="palette-swatch"
          onClick={() => setPalette(p)}
        >
          <span
            aria-hidden="true"
            style={{
              background: `conic-gradient(${p.cyan}, ${p.magenta}, ${p.amber}, ${p.violet}, ${p.cyan})`,
            }}
          />
          {p.name}
        </button>
      ))}
    </div>
  );
}
