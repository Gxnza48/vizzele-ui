import type { DocEntry } from './types';

const SITE = 'https://vizzele-ui.vercel.app';

const fence = (lang: string, code: string) => '```' + lang + '\n' + code.trim() + '\n```';

const RULES = `Rules:
- Use only the exports, props and class names shown here — do not invent APIs.
- Import the stylesheet once at the app root: \`import '@vizzele/css';\`
- In the Next.js App Router, put the code that uses it in a file that starts with 'use client'.
- Keep the accessibility behaviour (labels, keyboard support, live regions). Vizzele already respects prefers-reduced-motion — don't remove that.
- Theme it with CSS variables (e.g. --vz-accent, --vz-radius-md) instead of overriding internals. Dark is the default; <html data-theme="light"> switches to light.`;

/** A ready-to-paste prompt that tells an AI assistant how to add this component to a project. */
export function componentPrompt(entry: DocEntry): string {
  const usesGl = /@vizzele\/react\/gl|@vizzele\/core\/gl/.test(entry.code.react);
  const parts = [
    `Add the "${entry.title}" component from Vizzele UI to my project.`,
    `What it is: ${entry.description}`,
    `Docs: ${SITE}/docs/${entry.slug}`,
    `1. Install (skip if already installed):\n${fence('bash', 'npm install @vizzele/react @vizzele/css')}`,
    `2. Use it in React:\n${fence('tsx', entry.code.react)}`,
  ];
  if (entry.code.vanilla)
    parts.push(`Without React (npm install @vizzele/core):\n${fence('ts', entry.code.vanilla)}`);
  if (entry.code.html) parts.push(`Plain HTML alternative:\n${fence('html', entry.code.html)}`);
  if (entry.code.css) parts.push(`Related CSS:\n${fence('css', entry.code.css)}`);
  if (entry.props?.length)
    parts.push(
      'Props:\n' +
        entry.props
          .map(
            (p) =>
              `- ${p.name}: ${p.type}${p.default ? ` (default ${p.default})` : ''} — ${p.description}`,
          )
          .join('\n'),
    );
  if (entry.a11y?.length)
    parts.push(
      'Accessibility it provides (keep it):\n' + entry.a11y.map((a) => `- ${a}`).join('\n'),
    );
  if (usesGl)
    parts.push(
      'Note: this is a WebGL background. Place it inside a positioned parent (position: relative); it fills that parent and falls back to a static gradient without WebGL2.',
    );
  parts.push(RULES);
  return parts.join('\n\n');
}

/** Prompt for a whole block: the exact component and stylesheet, to adapt to the project. */
export function blockPrompt(
  title: string,
  description: string,
  file: string,
  tsx: string,
  css: string,
) {
  return [
    `Add the "${title}" block from Vizzele UI to my project, adapting the copy and data to my app.`,
    `What it is: ${description}`,
    `Source: ${SITE}/blocks`,
    `1. Install (skip if already installed):\n${fence('bash', 'npm install @vizzele/react @vizzele/css')}`,
    `2. Create ${file}.tsx:\n${fence('tsx', tsx)}`,
    `3. Create ${file}.css next to it and import it from the component (or your global CSS):\n${fence('css', css)}`,
    RULES,
  ].join('\n\n');
}
