'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Agent,
  AgentSteps,
  AreaChart,
  BarChart,
  Button,
  DonutChart,
  StatCard,
  TextReveal,
  type AgentState,
  type AgentStep,
} from '@vizzele/react';
import { makeRows } from '@/demos/data';

const plan = [
  { label: 'Pull last quarter’s numbers', detail: 'warehouse · 3 tables' },
  { label: 'Find what changed', detail: 'compare · 12 months' },
  { label: 'Draft the summary', detail: 'report.md' },
];

/** One scripted run: listen → think → work through the plan → speak → done. */
const script: { state: AgentState; at: number; label?: string }[] = [
  { state: 'listening', at: 0, label: '“Why did signups jump in March?”' },
  { state: 'thinking', at: 0 },
  { state: 'working', at: 0 },
  { state: 'working', at: 1 },
  { state: 'working', at: 2 },
  { state: 'speaking', at: 3, label: 'Paid social doubled in March…' },
  { state: 'success', at: 3 },
  { state: 'idle', at: 3 },
];

export function HomeDashboard() {
  const [seed, setSeed] = useState(0);
  const rows = useMemo(() => makeRows(seed), [seed]);
  const weeks = useMemo(() => makeRows(seed + 3, 8), [seed]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % script.length), 2300);
    return () => clearInterval(id);
  }, []);

  const step = script[tick]!;
  const steps: AgentStep[] = plan.map((p, i) => ({
    ...p,
    status:
      step.state === 'working'
        ? i < step.at
          ? 'done'
          : i === step.at
            ? 'running'
            : 'pending'
        : step.at > i
          ? 'done'
          : 'pending',
  }));
  const total = rows.reduce((a, r) => a + r.web + r.app, 0);

  return (
    <section className="home-section" aria-labelledby="dash-title">
      <div className="home-section-head">
        <p className="home-eyebrow">New · charts &amp; agents</p>
        <TextReveal as="h2" by="words" className="vz-display home-h2" id="dash-title">
          Data with a pulse. Agents with a face.
        </TextReveal>
        <p className="home-sub">
          Charts that grow in and morph between datasets on springs, with a colorblind-safe palette.
          An agent orb that shows what your AI is doing — before it says a word.
        </p>
      </div>

      <div className="home-dash">
        <aside className="home-dash-agent vz-glass" aria-label="Agent demo">
          <Agent
            state={step.state}
            name="Analyst"
            size={132}
            label={step.label}
            className="home-dash-status"
            layout="stack"
          />
          <AgentSteps steps={steps} aria-label="Agent progress" />
          <div className="home-dash-states" aria-hidden="true">
            {(['listening', 'thinking', 'working', 'speaking', 'success'] as const).map((s) => (
              <span key={s} data-on={step.state === s ? '' : undefined}>
                {s}
              </span>
            ))}
          </div>
        </aside>

        <div className="home-dash-main">
          <div className="home-dash-stats">
            <StatCard
              label="Signups"
              value={Math.round(total / 10)}
              delta={12.4}
              deltaLabel="vs last quarter"
              trend={rows.slice(-8).map((r) => r.web)}
            />
            <StatCard
              label="Conversion"
              value={4.8}
              suffix="%"
              delta={0.6}
              trend={rows.slice(-8).map((r) => r.app)}
              trendColor="var(--vz-chart-2)"
            />
            <StatCard
              label="Time to value"
              value={3.2}
              suffix=" days"
              delta={-14}
              upIsGood={false}
              trend={rows
                .slice(-8)
                .map((r) => r.partners)
                .reverse()}
              trendColor="var(--vz-chart-5)"
            />
          </div>

          <div className="home-dash-card">
            <div className="home-dash-card-head">
              <h3>Visitors</h3>
              <Button size="sm" onClick={() => setSeed((s) => s + 1)}>
                Shuffle data
              </Button>
            </div>
            <AreaChart
              title="Visitors per month"
              data={rows}
              index="month"
              series={[
                { key: 'web', label: 'Web' },
                { key: 'app', label: 'App' },
              ]}
              height={240}
            />
          </div>

          <div className="home-dash-row">
            <div className="home-dash-card">
              <h3>Signups by channel</h3>
              <BarChart
                title="Signups by channel"
                data={weeks}
                index="month"
                series={[
                  { key: 'web', label: 'Organic' },
                  { key: 'app', label: 'Paid' },
                  { key: 'api', label: 'Referral' },
                ]}
                stacked
                height={220}
              />
            </div>
            <div className="home-dash-card">
              <h3>Traffic sources</h3>
              <DonutChart
                title="Traffic sources"
                size={180}
                thickness={18}
                legend={false}
                data={[
                  { label: 'Search', value: weeks[0]!.web },
                  { label: 'Direct', value: weeks[1]!.app },
                  { label: 'Social', value: weeks[2]!.api },
                  { label: 'Other', value: weeks[3]!.partners },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="home-ctas home-ctas-center">
        <Button as={Link} href="/docs/line-chart" variant="ghost">
          Explore the charts →
        </Button>
        <Button as={Link} href="/docs/agent" variant="ghost">
          Meet the agent →
        </Button>
      </div>
    </section>
  );
}
