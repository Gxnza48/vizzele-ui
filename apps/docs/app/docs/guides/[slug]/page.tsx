import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { guides } from '@/content/nav';
import { guideContent } from '@/content/guides';

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const g = guides.find((x) => x.slug === slug);
  return g ? { title: g.title, description: g.description } : {};
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = guides.find((g) => g.slug === slug);
  const Content = guideContent[slug];
  if (!guide || !Content) notFound();
  return (
    <article className="doc">
      <header className="doc-header">
        <p className="doc-eyebrow">Guide</p>
        <h1 className="vz-heading doc-title">{guide.title}</h1>
        <p className="doc-lead">{guide.description}</p>
      </header>
      <Content />
    </article>
  );
}
