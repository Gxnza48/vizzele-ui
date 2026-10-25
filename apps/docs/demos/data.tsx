'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Agent,
  AgentOrb,
  AgentSteps,
  BarChart,
  Button,
  DonutChart,
  LineChart,
  StatCard,
  type AgentState,
  type AgentStep,
} from '@vizzele/react';
import type { ControlValues } from '@/lib/types';

type P = { values: ControlValues };

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const seriesDefs = [
  { key: 'web', label: 'Web' },
  { key: 'app', label: 'App' },
  { key: 'api', label: 'API' },
  { key: 'partners', label: 'Partners' },
];

/** Deterministic, wavy fake data so every "shuffle" is a different but plausible dataset. */
export function makeRows(seed: number, n = 12) {
  return months.slice(0, n).map((month, i) => ({
    month,
    web: Math.round(4200 + 1800 * Math.sin(i / 2 + seed) + i * 260),
    app: Math.round(2600 + 1200 * Math.sin(i / 2.6 + seed * 1.7) + i * 180),
    api: Math.round(1500 + 700 * Math.cos(i / 1.8 + seed * 0.6) + i * 90),
    partners: Math.round(900 + 400 * Math.sin(i / 1.3 + seed * 2.1) + i * 40),
  }));
}

function Shuffle({ onClick }: { onClick: () => void }) {
  return (
    <Button size="sm" onClick={onClick}>
      Shuffle data
    </Button>
  );
}

export function LineChartDemo({ values }: P) {
  const [seed, setSeed] = useState(0);
  const rows = useMemo(() => makeRows(seed), [seed]);
  return (
    <div className="demo-chart">
      <Shuffle onClick={() => setSeed((s) => s + 1)} />
      <LineChart
        title="Visitors per month"
        data={rows}
        index="month"
        series={seriesDefs.slice(0, Number(values.series))}
        area={Boolean(values.area)}
        curve={values.curve as 'smooth' | 'linear'}
      />
    </div>
  );
}

export function BarChartDemo({ values }: P) {
  const [seed, setSeed] = useState(0);
  const rows = useMemo(() => makeRows(seed, 8), [seed]);
  return (
    <div className="demo-chart">
      <Shuffle onClick={() => setSeed((s) => s + 1)} />
      <BarChart
        title="Signups by channel"
        data={rows}
        index="month"
        series={seriesDefs.slice(0, Number(values.series))}
        stacked={Boolean(values.stacked)}
      />
    </div>
  );
}

export function DonutChartDemo({ values }: P) {
  const [seed, setSeed] = useState(0);
  const data = useMemo(
    () =>
      ['Search', 'Direct', 'Social', 'Referral', 'Other'].map((label, i) => ({
        label,
        value: Math.round(600 + 3000 * Math.abs(Math.sin(i * 1.7 + seed))),
      })),
    [seed],
  );
  return (
    <div className="demo-chart demo-chart-center">
      <Shuffle onClick={() => setSeed((s) => s + 1)} />
      <DonutChart title="Traffic sources" data={data} thickness={Number(values.thickness)} />
    </div>
  );
}

export function StatCardDemo() {
  return (
    <div className="demo-stats">
      <StatCard
        label="Revenue"
        value={48210}
        prefix="$"
        delta={12.4}
        deltaLabel="vs last month"
        trend={[31, 34, 33, 38, 41, 40, 46, 48]}
      />
      <StatCard
        label="Active users"
        value={9384}
        delta={3.1}
        trend={[80, 82, 85, 84, 88, 90, 89, 93]}
        trendColor="var(--vz-chart-2)"
      />
      <StatCard
        label="p95 latency"
        value={182}
        suffix=" ms"
        delta={-8}
        upIsGood={false}
        deltaLabel="vs last week"
        trend={[240, 230, 222, 215, 205, 198, 190, 182]}
        trendColor="var(--vz-chart-5)"
      />
    </div>
  );
}

const states: AgentState[] = ['idle', 'listening', 'thinking', 'working', 'speaking', 'success'];

export function AgentDemo({ values }: P) {
  const [cycled, setCycled] = useState(0);
  useEffect(() => {
    if (!values.cycle) return;
    const id = setInterval(() => setCycled((i) => (i + 1) % states.length), 2200);
    return () => clearInterval(id);
  }, [values.cycle]);
  const state = values.cycle ? states[cycled]! : (values.state as AgentState);
  return (
    <div className="demo-agent">
      <AgentOrb state={state} size={Number(values.size)} />
      <Agent state={state} name="Vizzele" size={40} />
    </div>
  );
}

const plan = [
  { label: 'Read the brief', detail: 'brief.md' },
  { label: 'Search the codebase', detail: 'grep · 14 files' },
  { label: 'Write the component', detail: 'charts.tsx' },
  { label: 'Run the tests', detail: 'vitest · 85 passed' },
  { label: 'Ship it', detail: 'git push' },
];

export function AgentStepsDemo({ values }: P) {
  const [at, setAt] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setAt((i) => (i >= plan.length + 2 ? 0 : i + 1)), 1300);
    return () => clearInterval(id);
  }, []);
  const failAt = values.fail ? 3 : -1;
  const steps: AgentStep[] = plan.map((p, i) => ({
    ...p,
    status:
      failAt >= 0 && i === failAt && at > i
        ? 'error'
        : failAt >= 0 && i > failAt && at > failAt
          ? 'pending'
          : i < at
            ? 'done'
            : i === at
              ? 'running'
              : 'pending',
  }));
  const agentState: AgentState = steps.some((s) => s.status === 'error')
    ? 'error'
    : at >= plan.length
      ? 'success'
      : 'working';
  return (
    <div className="demo-steps">
      <Agent
        state={agentState}
        name="Build agent"
        label={agentState === 'working' ? plan[at]?.label + '…' : undefined}
        size={44}
      />
      <AgentSteps steps={steps} aria-label="Agent progress" />
    </div>
  );
}
