'use client';

import { useId, useState } from 'react';
import { CopyButton } from '@vizzele/react';

export function CodeTabs({ tabs }: { tabs: { label: string; html: string; raw: string }[] }) {
  const [active, setActive] = useState(0);
  const id = useId();
  const current = tabs[active]!;

  return (
    <div className="code">
      <div className="code-bar">
        {tabs.length > 1 ? (
          <div role="tablist" aria-label="Code variants" className="code-tabs">
            {tabs.map((t, i) => (
              <button
                key={t.label}
                role="tab"
                type="button"
                id={`${id}-tab-${i}`}
                aria-selected={i === active}
                aria-controls={`${id}-panel`}
                tabIndex={i === active ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') setActive((i + 1) % tabs.length);
                  if (e.key === 'ArrowLeft') setActive((i - 1 + tabs.length) % tabs.length);
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : (
          <span className="code-lang">{current.label}</span>
        )}
        <CopyButton value={current.raw} size="sm" className="code-copy">
          Copy
        </CopyButton>
      </div>
      <div
        id={`${id}-panel`}
        role={tabs.length > 1 ? 'tabpanel' : undefined}
        aria-labelledby={tabs.length > 1 ? `${id}-tab-${active}` : undefined}
        className="code-body"
        dangerouslySetInnerHTML={{ __html: current.html }}
      />
    </div>
  );
}
