'use client';

import { CopyButton } from '@vizzele/react';

/** "Copy prompt": everything an AI assistant needs to add this component to a project. */
export function CopyPrompt({ prompt, label = 'Copy prompt' }: { prompt: string; label?: string }) {
  return (
    <CopyButton
      value={prompt}
      className="copy-prompt"
      copiedLabel="Prompt copied"
      announce="Prompt copied to clipboard — paste it into your AI assistant"
      title="Copies a prompt for ChatGPT, Claude, Cursor or v0 with the install, code, props and rules"
    >
      {label}
    </CopyButton>
  );
}
