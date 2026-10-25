import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { entries, getEntry } from '@/content/nav';
import { Playground } from '@/components/Playground';
import { MultiCode } from '@/components/Code';
import { CopyPrompt } from '@/components/CopyPrompt';
import { componentPrompt } from '@/lib/prompt';

export function generateStaticParams() {
  return entries.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const entry = getEntry((await params).slug);
  if (!entry) return {};
  return { title: entry.title, description: entry.description };
}

export default async function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getEntry(slug);
  if (!entry) notFound();

  const variants = [
    { label: 'React', lang: 'tsx', code: entry.code.react },
    ...(entry.code.vanilla ? [{ label: 'Vanilla JS', lang: 'ts', code: entry.code.vanilla }] : []),
    ...(entry.code.html ? [{ label: 'data-vz-*', lang: 'html', code: entry.code.html }] : []),
    ...(entry.code.css ? [{ label: 'CSS', lang: 'css', code: entry.code.css }] : []),
  ];
  const index = entries.findIndex((e) => e.slug === slug);
  const prev = entries[index - 1];
  const next = entries[index + 1];

  return (
    <article className="doc">
      <header className="doc-header">
        <p className="doc-eyebrow">{entry.category}</p>
        <h1 className="vz-heading doc-title">{entry.title}</h1>
        <p className="doc-lead">{entry.description}</p>
        <div className="doc-actions">
          <CopyPrompt prompt={componentPrompt(entry)} />
          <span className="doc-actions-hint">Paste it into ChatGPT, Claude, Cursor or v0.</span>
        </div>
      </header>

      <Playground
        slug={entry.slug}
        controls={entry.controls}
        height={entry.height}
        wide={entry.wide}
      />

      <section className="doc-section" aria-labelledby="usage">
        <h2 id="usage" className="vz-heading">
          Usage
        </h2>
        <MultiCode variants={variants} />
      </section>

      {entry.props?.length ? (
        <section className="doc-section" aria-labelledby="props">
          <h2 id="props" className="vz-heading">
            Props
          </h2>
          <div className="table-wrap">
            <table className="props-table">
              <thead>
                <tr>
                  <th scope="col">Prop</th>
                  <th scope="col">Type</th>
                  <th scope="col">Default</th>
                  <th scope="col">Description</th>
                </tr>
              </thead>
              <tbody>
                {entry.props.map((p) => (
                  <tr key={p.name}>
                    <td>
                      <code>{p.name}</code>
                    </td>
                    <td>
                      <code className="type">{p.type}</code>
                    </td>
                    <td>
                      {p.default ? <code>{p.default}</code> : <span aria-label="none">—</span>}
                    </td>
                    <td>{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {entry.a11y?.length ? (
        <section className="doc-section" aria-labelledby="a11y">
          <h2 id="a11y" className="vz-heading">
            Accessibility
          </h2>
          <ul className="a11y-list">
            {entry.a11y.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav className="doc-pager" aria-label="Pagination">
        {prev ? (
          <Link href={`/docs/${prev.slug}`} className="pager-link">
            <span>Previous</span>
            {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/docs/${next.slug}`} className="pager-link pager-next">
            <span>Next</span>
            {next.title}
          </Link>
        ) : null}
      </nav>
    </article>
  );
}
