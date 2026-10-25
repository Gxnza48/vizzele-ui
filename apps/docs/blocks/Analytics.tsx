'use client';

import { useMemo, useState } from 'react';
import { AreaChart, BarChart, DonutChart, Select, StatCard } from '@vizzele/react';

const ranges = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

/** Replace with your data source; the charts morph whenever the rows change. */
function load(days: number) {
  const n = days === 7 ? 7 : 12;
  const scale = days / 30;
  return Array.from({ length: n }, (_, i) => ({
    label: days === 7 ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]! : `W${i + 1}`,
    visitors: Math.round((3800 + 1400 * Math.sin(i / 1.7 + days) + i * 120) * scale),
    signups: Math.round((420 + 160 * Math.cos(i / 1.3 + days) + i * 14) * scale),
    paid: Math.round((120 + 60 * Math.sin(i / 2 + days * 2) + i * 6) * scale),
  }));
}

/** A dashboard slice: one filter row above, stats, a trend, a breakdown and a share. */
export function Analytics() {
  const [range, setRange] = useState('30');
  const rows = useMemo(() => load(Number(range)), [range]);
  const sum = (k: 'visitors' | 'signups' | 'paid') => rows.reduce((a, r) => a + r[k], 0);
  return (
    <div className="blk-analytics">
      <div className="blk-analytics-filters">
        <Select
          label="Date range"
          size="sm"
          options={ranges}
          value={range}
          onValueChange={setRange}
        />
      </div>
      <div className="blk-analytics-stats">
        <StatCard
          label="Visitors"
          value={sum('visitors')}
          delta={8.2}
          trend={rows.map((r) => r.visitors)}
        />
        <StatCard
          label="Signups"
          value={sum('signups')}
          delta={12.4}
          trend={rows.map((r) => r.signups)}
          trendColor="var(--vz-chart-2)"
        />
        <StatCard
          label="Paid conversions"
          value={sum('paid')}
          delta={-2.1}
          trend={rows.map((r) => r.paid)}
          trendColor="var(--vz-chart-3)"
        />
      </div>
      <div className="blk-analytics-card">
        <h3>Visitors</h3>
        <AreaChart
          title="Visitors"
          data={rows}
          index="label"
          series={[{ key: 'visitors', label: 'Visitors' }]}
          height={220}
        />
      </div>
      <div className="blk-analytics-row">
        <div className="blk-analytics-card">
          <h3>Signups vs paid</h3>
          <BarChart
            title="Signups vs paid"
            data={rows}
            index="label"
            series={[
              { key: 'signups', label: 'Signups' },
              { key: 'paid', label: 'Paid' },
            ]}
            height={200}
          />
        </div>
        <div className="blk-analytics-card">
          <h3>Plan mix</h3>
          <DonutChart
            title="Plan mix"
            size={170}
            thickness={16}
            data={[
              { label: 'Free', value: sum('signups') - sum('paid') },
              { label: 'Pro', value: Math.round(sum('paid') * 0.8) },
              { label: 'Studio', value: Math.round(sum('paid') * 0.2) },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
