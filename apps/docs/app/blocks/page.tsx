import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ComponentType } from 'react';
import { MultiCode } from '@/components/Code';
import { AiChat } from '@/blocks/AiChat';
import { Analytics } from '@/blocks/Analytics';
import { Pricing } from '@/blocks/Pricing';
import { SignIn } from '@/blocks/SignIn';
import '@/blocks/AiChat.css';
import '@/blocks/Analytics.css';
import '@/blocks/Pricing.css';
import '@/blocks/SignIn.css';

export const metadata = {
  title: 'Blocks',
  description: 'Whole sections built with Vizzele — copy the file and its CSS into your app.',
};

const blocks: {
  id: string;
  file: string;
  title: string;
  description: string;
  Block: ComponentType;
}[] = [
  {
    id: 'ai-chat',
    file: 'AiChat',
    title: 'AI chat',
    description:
      'An assistant that shows what it is doing: the agent thinks, works through visible steps, then answers word by word. Suggestions fuse with surface tension.',
    Block: AiChat,
  },
  {
    id: 'analytics',
    file: 'Analytics',
    title: 'Analytics dashboard',
    description:
      'One filter row above everything it scopes; change the range and every stat, trend and chart springs to the new data.',
    Block: Analytics,
  },
  {
    id: 'pricing',
    file: 'Pricing',
    title: 'Pricing',
    description:
      'Prices count between monthly and yearly on a spring; the featured plan is a holographic card that tilts toward you.',
    Block: Pricing,
  },
  {
    id: 'sign-in',
    file: 'SignIn',
    title: 'Sign in',
    description:
      'A liquid-glass card over a living mesh gradient, with inputs of light, a loading button and a toast.',
    Block: SignIn,
  },
];

// Read the real files so the code shown is always exactly what renders above it.
const source = (name: string) => readFileSync(join(process.cwd(), 'blocks', name), 'utf8');

export default function BlocksPage() {
  return (
    <main className="blocks">
      <header className="blocks-head">
        <p className="home-eyebrow">Blocks</p>
        <h1 className="vz-display blocks-title">Whole sections, ready to paste.</h1>
        <p className="blocks-lead">
          Each block is one component file and one CSS file, built only from{' '}
          <code>@vizzele/react</code>. Copy both, swap the data, ship.
        </p>
        <nav className="blocks-nav" aria-label="Blocks">
          {blocks.map((b) => (
            <a key={b.id} href={`#${b.id}`}>
              {b.title}
            </a>
          ))}
        </nav>
      </header>
      {blocks.map(({ id, file, title, description, Block }) => (
        <section key={id} id={id} className="blocks-item" aria-labelledby={`${id}-title`}>
          <div className="blocks-item-head">
            <h2 id={`${id}-title`} className="vz-heading">
              {title}
            </h2>
            <p>{description}</p>
          </div>
          <div className="blocks-stage">
            <Block />
          </div>
          <details className="blocks-code">
            <summary>View code</summary>
            <MultiCode
              variants={[
                { label: `${file}.tsx`, lang: 'tsx', code: source(`${file}.tsx`) },
                { label: `${file}.css`, lang: 'css', code: source(`${file}.css`) },
              ]}
            />
          </details>
        </section>
      ))}
    </main>
  );
}
