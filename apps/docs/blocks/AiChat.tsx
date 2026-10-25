'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Agent,
  AgentSteps,
  Button,
  SurfaceTension,
  TextReveal,
  type AgentState,
  type AgentStep,
} from '@vizzele/react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

const suggestions = ['Summarize last week', 'Why did signups jump?', 'Draft a release note'];

// Swap this for your model call; the UI only needs the steps and the final text.
const answers: Record<string, { steps: string[]; text: string }> = {
  'Summarize last week': {
    steps: ['Read 214 events', 'Group by feature'],
    text: 'Busy week: 3 releases, signups up 12%, and the new onboarding cut time-to-value from 4.1 to 3.2 days.',
  },
  'Why did signups jump?': {
    steps: ['Compare channels', 'Check campaigns'],
    text: 'Paid social doubled on March 3rd after the launch video. Organic held steady, so the jump is almost all campaign traffic.',
  },
  'Draft a release note': {
    steps: ['Collect merged PRs', 'Write the summary'],
    text: 'Charts that spring between datasets, an agent with seven states, and five effects you won’t find anywhere else.',
  },
};
const fallback = {
  steps: ['Search the workspace', 'Write an answer'],
  text: 'Here is what I found — this demo answers from a script, so plug in your own model to make it real.',
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A chat panel with an agent that shows what it is doing before it answers. */
export function AiChat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'assistant', text: 'Hi! Ask me anything about your workspace.' },
  ]);
  const [state, setState] = useState<AgentState>('idle');
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [draft, setDraft] = useState('');
  const busy = state !== 'idle' && state !== 'success' && state !== 'error';
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' });
  }, [messages, steps]);

  async function ask(question: string) {
    if (!question.trim() || busy) return;
    const plan = answers[question] ?? fallback;
    setDraft('');
    setMessages((m) => [...m, { id: m.length, role: 'user', text: question }]);
    setState('thinking');
    await wait(900);
    setState('working');
    for (let i = 0; i <= plan.steps.length; i++) {
      setSteps(
        plan.steps.map((label, j) => ({
          label,
          status: j < i ? 'done' : j === i ? 'running' : 'pending',
        })),
      );
      await wait(800);
    }
    setSteps([]);
    setState('speaking');
    setMessages((m) => [...m, { id: m.length, role: 'assistant', text: plan.text }]);
    await wait(1800);
    setState('success');
    await wait(900);
    setState('idle');
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void ask(draft);
  };

  return (
    <div className="blk-chat">
      <header className="blk-chat-head">
        <Agent state={state} name="Vizzele AI" size={36} />
      </header>

      <div className="blk-chat-log" ref={log} role="log" aria-label="Conversation">
        {messages.map((m) => (
          <div key={m.id} className="blk-chat-msg" data-role={m.role}>
            {m.role === 'assistant' && m.id > 0 ? (
              <TextReveal as="span" by="words" variant="blur" stagger={28}>
                {m.text}
              </TextReveal>
            ) : (
              m.text
            )}
          </div>
        ))}
        {steps.length > 0 && <AgentSteps className="blk-chat-steps" steps={steps} />}
      </div>

      <SurfaceTension className="blk-chat-suggest" role="group" aria-label="Suggestions">
        {suggestions.map((s) => (
          <button key={s} type="button" disabled={busy} onClick={() => void ask(s)}>
            {s}
          </button>
        ))}
      </SurfaceTension>

      <form className="blk-chat-form" onSubmit={onSubmit}>
        <input
          aria-label="Message"
          placeholder="Ask anything…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="submit" variant="liquid" disabled={busy || !draft.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
