import { codeToHtml } from 'shiki';
import { CodeTabs } from './CodeTabs';

async function highlight(code: string, lang: string) {
  return codeToHtml(code.trim(), {
    lang,
    themes: { dark: 'vesper', light: 'github-light' },
    defaultColor: false,
  });
}

/** Server-highlighted code block. */
export async function Code({ code, lang = 'tsx' }: { code: string; lang?: string }) {
  const html = await highlight(code, lang);
  return <CodeTabs tabs={[{ label: lang, html, raw: code.trim() }]} />;
}

/** Several code variants (React / Vanilla / HTML…) behind tabs. */
export async function MultiCode({
  variants,
}: {
  variants: { label: string; lang: string; code: string }[];
}) {
  const tabs = await Promise.all(
    variants.map(async (v) => ({
      label: v.label,
      html: await highlight(v.code, v.lang),
      raw: v.code.trim(),
    })),
  );
  return <CodeTabs tabs={tabs} />;
}
