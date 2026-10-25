import Link from 'next/link';
import { Code } from '@/components/Code';
import { categoryOrder, entries } from '@/content/nav';

export const metadata = { title: 'Introduction' };

export default function DocsIndex() {
  return (
    <article className="doc">
      <header className="doc-header">
        <p className="doc-eyebrow">Getting started</p>
        <h1 className="vz-heading doc-title">Introduction</h1>
        <p className="doc-lead">
          Vizzele UI is a library of components, gestures and effects built around one idea:{' '}
          <strong>liquid light</strong>. Everything moves with real spring physics, can be thrown,
          stretches like rubber and settles with weight — and every surface reacts to light and to
          you.
        </p>
      </header>

      <section className="doc-section">
        <h2 className="vz-heading">Three packages, one engine</h2>
        <ul className="a11y-list">
          <li>
            <code>@vizzele/core</code> — the zero-dependency engine: springs, inertia, drag, effects
            and <code>data-vz-*</code> attributes. Works with any framework, or none.
          </li>
          <li>
            <code>@vizzele/react</code> — components and hooks built on the core.
          </li>
          <li>
            <code>@vizzele/css</code> — tokens, themes, materials and pure-CSS motion utilities.
          </li>
        </ul>
        <Code
          lang="bash"
          code={`pnpm add @vizzele/react @vizzele/css
# or, without React
pnpm add @vizzele/core @vizzele/css`}
        />
      </section>

      <section className="doc-section">
        <h2 className="vz-heading">Browse</h2>
        {categoryOrder.map((cat) => {
          const items = entries.filter((e) => e.category === cat);
          if (!items.length) return null;
          return (
            <div key={cat} className="browse-group">
              <h3 className="browse-title">{cat}</h3>
              <div className="browse-grid">
                {items.map((e) => (
                  <Link
                    key={e.slug}
                    href={`/docs/${e.slug}`}
                    className="browse-card vz-spotlight"
                    data-vz-spotlight
                  >
                    <span className="browse-name">{e.title}</span>
                    <span className="browse-desc">{e.description}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </article>
  );
}
