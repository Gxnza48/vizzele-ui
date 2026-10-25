import {
  forwardRef,
  useEffect,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { Spring, prefersReducedMotion, springs } from '@vizzele/core';
import { cx, useLatest, useMergedRef } from '../hooks/utils';

export type AgentState =
  'idle' | 'listening' | 'thinking' | 'working' | 'speaking' | 'success' | 'error';

export const agentStateLabels: Record<AgentState, string> = {
  idle: 'Ready',
  listening: 'Listening…',
  thinking: 'Thinking…',
  working: 'Working…',
  speaking: 'Speaking…',
  success: 'Done',
  error: 'Something went wrong',
};

/** Spin speed of the ink inside the orb, in degrees per second, for each state. */
const spin: Record<AgentState, number> = {
  idle: 18,
  listening: 40,
  thinking: 260,
  working: 120,
  speaking: 70,
  success: 30,
  error: 0,
};

export interface AgentOrbProps extends HTMLAttributes<HTMLDivElement> {
  state?: AgentState;
  /**
   * Live audio level 0–1 (mic input while listening, output while speaking). Leave it out and
   * the orb simulates a voice so it still feels alive.
   */
  level?: number | undefined;
  /** Diameter in px. Default 120. */
  size?: number;
}

/**
 * The agent's body: a drop of iridescent ink that breathes when idle, ripples to your voice,
 * swirls while it thinks, orbits while it works, pulses as it speaks — and settles into a check
 * or shakes off an error. Every change of state lands with a jelly pop.
 */
export const AgentOrb = /* @__PURE__ */ forwardRef<HTMLDivElement, AgentOrbProps>(function AgentOrb(
  { state = 'idle', level, size = 120, className, style, ...rest },
  ref,
) {
  const el = useRef<HTMLDivElement>(null);
  const setRefs = useMergedRef(ref, el);
  const live = useLatest({ state, level });
  const pop = useRef<Spring | null>(null);

  // One loop drives the ink's rotation (speed eases between states) and the voice level.
  useEffect(() => {
    const node = el.current;
    if (!node || prefersReducedMotion()) return;
    let raf = 0;
    let last = performance.now();
    let angle = 0;
    let speed = spin[live.current.state];
    let lvl = 0;
    let visible = true;
    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([e]) => {
            visible = !!e?.isIntersecting;
            if (visible && !raf) {
              last = performance.now();
              raf = requestAnimationFrame(tick);
            }
          })
        : null;
    function tick(now: number) {
      raf = 0;
      if (!visible || !node) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const { state: s, level: input } = live.current;
      speed += (spin[s] - speed) * (1 - Math.exp(-dt * 3));
      angle = (angle + speed * dt) % 360;
      const t = now / 1000;
      let goal = 0;
      if (s === 'listening' || s === 'speaking') {
        // Syllable-like bursts when no real level is provided.
        goal =
          input ??
          (s === 'speaking'
            ? Math.abs(Math.sin(t * 8.7) * Math.sin(t * 2.3)) * (0.65 + 0.35 * Math.sin(t * 0.9))
            : 0.18 + 0.22 * Math.abs(Math.sin(t * 3.1) * Math.sin(t * 1.3)));
      }
      lvl += (Math.min(1, Math.max(0, goal)) - lvl) * (1 - Math.exp(-dt * 16));
      node.style.setProperty('--vz-agent-spin', `${angle.toFixed(2)}deg`);
      node.style.setProperty('--vz-agent-level', lvl.toFixed(3));
      raf = requestAnimationFrame(tick);
    }
    io?.observe(node);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, [live]);

  // A jelly pop on every change of state.
  const first = useRef(true);
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    pop.current ??= new Spring({
      ...springs.jelly,
      from: 1,
      onUpdate: (v) => node.style.setProperty('--vz-agent-pop', v.toFixed(4)),
    });
    if (first.current) {
      first.current = false;
      return;
    }
    pop.current.set(1, { velocity: state === 'error' ? -2.5 : 3.5 });
  }, [state]);
  useEffect(() => () => void pop.current?.stop(), []);

  return (
    <div
      ref={setRefs}
      className={cx('vz-agent-orb', className)}
      data-state={state}
      style={{ '--vz-agent-size': `${size}px`, ...style } as CSSProperties}
      aria-hidden="true"
      {...rest}
    >
      <span className="vz-agent-halo" />
      <span className="vz-agent-ripples">
        <i />
        <i />
        <i />
      </span>
      <span className="vz-agent-body">
        <span className="vz-agent-ink">
          <i />
          <i />
          <i />
        </span>
        <span className="vz-agent-gloss" />
      </span>
      <svg className="vz-agent-arc" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="47" pathLength={100} />
      </svg>
      <span className="vz-agent-orbit">
        <i />
        <i />
        <i />
      </span>
      <svg className="vz-agent-glyph" viewBox="0 0 24 24" fill="none">
        <path className="vz-agent-check" d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} />
        <path className="vz-agent-cross" d="M7 7l10 10M17 7L7 17" pathLength={1} />
      </svg>
    </div>
  );
});

export interface AgentProps extends Omit<AgentOrbProps, 'title'> {
  /** The agent's name, shown above its status. */
  name?: ReactNode;
  /** Overrides the status text (e.g. "Searching the docs…"). */
  label?: ReactNode;
  /** Orb beside the text, or stacked above it. Default 'row'. */
  layout?: 'row' | 'stack';
}

/**
 * An agent presence: the orb plus a live status line. The status is a polite live region, so
 * screen readers hear "Thinking…", "Done" and so on as the state changes.
 */
export const Agent = /* @__PURE__ */ forwardRef<HTMLDivElement, AgentProps>(function Agent(
  { state = 'idle', level, size = 56, name, label, layout = 'row', className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx('vz-agent', className)}
      data-state={state}
      data-layout={layout}
      {...rest}
    >
      <AgentOrb state={state} level={level} size={size} />
      <div className="vz-agent-text">
        {name && <span className="vz-agent-name">{name}</span>}
        <span className="vz-agent-status" role="status" aria-live="polite">
          <span className="vz-agent-status-text">{label ?? agentStateLabels[state]}</span>
        </span>
      </div>
    </div>
  );
});

export type AgentStepStatus = 'pending' | 'running' | 'done' | 'error';

export interface AgentStep {
  id?: string;
  label: ReactNode;
  /** Secondary line: a tool name, a file, a duration… */
  detail?: ReactNode;
  status: AgentStepStatus;
}

export interface AgentStepsProps extends HTMLAttributes<HTMLOListElement> {
  steps: AgentStep[];
}

const stepStatusText: Record<AgentStepStatus, string> = {
  pending: 'pending',
  running: 'in progress',
  done: 'done',
  error: 'failed',
};

/**
 * What the agent is doing, step by step: pending steps wait in outline, the running one shimmers
 * with a spinner, finished ones draw a check and fill the thread of light between them.
 */
export const AgentSteps = /* @__PURE__ */ forwardRef<HTMLOListElement, AgentStepsProps>(
  function AgentSteps({ steps, className, ...rest }, ref) {
    return (
      <ol ref={ref} className={cx('vz-agent-steps', className)} {...rest}>
        {steps.map((s, i) => (
          <li key={s.id ?? i} className="vz-agent-step" data-status={s.status}>
            <span className="vz-agent-step-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path className="vz-agent-check" d="M6 12.5l4 4L18 8.5" pathLength={1} />
                <path className="vz-agent-cross" d="M8 8l8 8M16 8l-8 8" pathLength={1} />
              </svg>
            </span>
            <span className="vz-agent-step-body">
              <span className="vz-agent-step-label">{s.label}</span>
              {s.detail && <span className="vz-agent-step-detail">{s.detail}</span>}
              <span className="vz-sr-only">, {stepStatusText[s.status]}</span>
            </span>
          </li>
        ))}
      </ol>
    );
  },
);
