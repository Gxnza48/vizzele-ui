import type { DocEntry } from '@/lib/types';

const cartesianProps = [
  { name: 'data', type: 'ChartRow[]', description: 'One object per x position.' },
  { name: 'index', type: 'string', description: 'Key holding the x value (category or date).' },
  {
    name: 'series',
    type: 'ChartSeries[]',
    description:
      '{ key, label?, color? } — up to five, colored in the palette’s fixed order (never cycled).',
  },
  { name: 'title', type: 'string', description: 'Accessible name and caption of the data table.' },
  { name: 'height', type: 'number', default: '260', description: 'Plot height in px.' },
  {
    name: 'valueFormatter',
    type: '(v: number) => string',
    default: 'compact',
    description: 'Formats ticks, labels, tooltip and table (1,284 / 12.9K).',
  },
  { name: 'xFormatter', type: '(x) => string', description: 'Formats the x labels.' },
  { name: 'legend', type: 'boolean', default: '≥ 2 series', description: 'Show the legend.' },
  { name: 'yMax', type: 'number', description: 'Fix the top of the y scale.' },
];

const chartA11y = [
  'The plot is focusable: ←/→ walk the points (Home/End jump) and a polite live region reads each one.',
  'Every value is also in a visually hidden <table>, so nothing is gated behind hover.',
  'Identity never relies on color alone: legend for 2+ series, direct labels when they fit.',
  'The palette is validated for color-vision deficiency and contrast in both themes.',
];

export const dataEntries: DocEntry[] = [
  {
    slug: 'line-chart',
    title: 'Line & area chart',
    category: 'Charts',
    isNew: true,
    description:
      'Lines that grow in when they scroll into view and spring between datasets with a liquid overshoot. A crosshair snaps to the nearest point; one glass tooltip lists every series.',
    keywords: ['chart', 'graph', 'line', 'area', 'time series', 'trend', 'dashboard', 'analytics'],
    height: 420,
    wide: true,
    controls: [
      { type: 'boolean', name: 'area', default: true },
      { type: 'select', name: 'curve', options: ['smooth', 'linear'], default: 'smooth' },
      { type: 'range', name: 'series', min: 1, max: 4, default: 2 },
    ],
    code: {
      react: `import { AreaChart, LineChart } from '@vizzele/react';

<AreaChart
  title="Visitors per month"
  data={[
    { month: 'Jan', web: 4200, app: 2100 },
    { month: 'Feb', web: 5100, app: 2600 },
    { month: 'Mar', web: 4800, app: 3400 },
  ]}
  index="month"
  series={[
    { key: 'web', label: 'Web' },
    { key: 'app', label: 'App' },
  ]}
/>`,
    },
    props: [
      ...cartesianProps,
      { name: 'area', type: 'boolean', default: 'false', description: 'Wash under each line.' },
      {
        name: 'curve',
        type: "'smooth' | 'linear'",
        default: "'smooth'",
        description: 'Monotone curve never overshoots the data.',
      },
      {
        name: 'endLabels',
        type: 'boolean',
        default: '≤ 4 series',
        description: 'Value at the end of each line; skipped when labels would collide.',
      },
    ],
    a11y: chartA11y,
  },
  {
    slug: 'bar-chart',
    title: 'Bar chart',
    category: 'Charts',
    isNew: true,
    description:
      'Columns that grow out of the baseline on a spring — grouped or stacked, thin with rounded caps, separated by 2px of air. Hover a category to lift it.',
    keywords: ['chart', 'bars', 'columns', 'histogram', 'stacked', 'grouped', 'dashboard'],
    height: 420,
    wide: true,
    controls: [
      { type: 'boolean', name: 'stacked', default: false },
      { type: 'range', name: 'series', min: 1, max: 3, default: 2 },
    ],
    code: {
      react: `import { BarChart } from '@vizzele/react';

<BarChart
  title="Signups by channel"
  data={rows}
  index="week"
  series={[
    { key: 'organic', label: 'Organic' },
    { key: 'paid', label: 'Paid' },
  ]}
  stacked
/>`,
    },
    props: [
      ...cartesianProps,
      {
        name: 'stacked',
        type: 'boolean',
        default: 'false',
        description: 'Stack instead of grouping side by side.',
      },
      {
        name: 'valueLabels',
        type: 'boolean',
        default: 'true',
        description: 'Value on each cap (single series, when there is room).',
      },
    ],
    a11y: chartA11y,
  },
  {
    slug: 'donut-chart',
    title: 'Donut chart',
    category: 'Charts',
    isNew: true,
    description:
      'Part-to-whole in a ring that sweeps in on a spring. Hover a slice or its legend row and it lifts out on a bouncy spring while the center shows its value.',
    keywords: ['pie', 'donut', 'share', 'breakdown', 'composition', 'chart'],
    height: 400,
    controls: [{ type: 'range', name: 'thickness', min: 10, max: 40, default: 22 }],
    code: {
      react: `import { DonutChart } from '@vizzele/react';

<DonutChart
  title="Traffic sources"
  data={[
    { label: 'Search', value: 4200 },
    { label: 'Direct', value: 2600 },
    { label: 'Social', value: 1500 },
    { label: 'Other', value: 700 },
  ]}
/>`,
    },
    props: [
      {
        name: 'data',
        type: 'DonutSlice[]',
        description: '{ label, value, color? } — keep it to five; fold the rest into "Other".',
      },
      { name: 'title', type: 'string', description: 'Accessible name.' },
      { name: 'size', type: 'number', default: '220', description: 'Diameter in px.' },
      { name: 'thickness', type: 'number', default: '22', description: 'Ring thickness in px.' },
      {
        name: 'centerLabel',
        type: 'string',
        default: "'Total'",
        description: 'Caption under the center figure.',
      },
      {
        name: 'legend',
        type: 'boolean',
        default: 'true',
        description: 'Legend with values and shares.',
      },
    ],
    a11y: chartA11y,
  },
  {
    slug: 'stat-card',
    title: 'Stat card & sparkline',
    category: 'Charts',
    isNew: true,
    description:
      'A metric that counts up on a spring, a signed delta with an arrow (never color alone) and a sparkline of the recent trend.',
    keywords: ['kpi', 'metric', 'stat', 'sparkline', 'trend', 'dashboard', 'number'],
    height: 340,
    wide: true,
    code: {
      react: `import { StatCard, Sparkline } from '@vizzele/react';

<StatCard
  label="Revenue"
  value={48210}
  prefix="$"
  delta={12.4}
  deltaLabel="vs last month"
  trend={[31, 34, 33, 38, 41, 40, 46, 48]}
/>

// p95 latency: going down is good
<StatCard label="p95 latency" value={182} suffix=" ms" delta={-8} upIsGood={false} />

<Sparkline data={[3, 5, 4, 8, 7, 9]} label="Sessions, last 6 days" />`,
    },
    props: [
      { name: 'label', type: 'string', description: 'Sentence case, no trailing colon.' },
      { name: 'value', type: 'number | ReactNode', description: 'Numbers count up on a spring.' },
      { name: 'prefix / suffix', type: 'string', description: 'Units around the value.' },
      { name: 'delta', type: 'number', description: 'Change in percent.' },
      {
        name: 'upIsGood',
        type: 'boolean',
        default: 'true',
        description: 'Flip for latency, churn…',
      },
      { name: 'trend', type: 'number[]', description: 'Recent values for the sparkline.' },
    ],
    a11y: [
      'The delta carries an arrow and a sign, so its direction never depends on color.',
      'Sparklines are role="img" with a description of the trend.',
    ],
  },
  {
    slug: 'agent',
    title: 'Agent',
    category: 'AI',
    isNew: true,
    description:
      'A face for your AI: a drop of iridescent ink that breathes when idle, ripples to your voice, swirls while thinking, orbits while working, pulses as it speaks — and lands every change of state with a jelly pop.',
    keywords: ['ai', 'assistant', 'agent', 'voice', 'orb', 'siri', 'status', 'thinking', 'llm'],
    height: 420,
    controls: [
      {
        type: 'select',
        name: 'state',
        options: ['idle', 'listening', 'thinking', 'working', 'speaking', 'success', 'error'],
        default: 'thinking',
      },
      { type: 'range', name: 'size', min: 60, max: 200, default: 140 },
      { type: 'boolean', name: 'cycle', label: 'cycle through states', default: false },
    ],
    code: {
      react: `import { Agent, AgentOrb, type AgentState } from '@vizzele/react';

const [state, setState] = useState<AgentState>('idle');

// Orb + live status line ("Thinking…", "Done"…)
<Agent state={state} name="Vizzele" />

// Just the orb, driven by a real mic level (0–1)
<AgentOrb state="listening" level={micLevel} size={160} />`,
    },
    props: [
      {
        name: 'state',
        type: "'idle' | 'listening' | 'thinking' | 'working' | 'speaking' | 'success' | 'error'",
        default: "'idle'",
        description: 'What the agent is doing.',
      },
      {
        name: 'level',
        type: 'number',
        description: 'Audio level 0–1 while listening/speaking. Omit it and a voice is simulated.',
      },
      {
        name: 'size',
        type: 'number',
        default: '56 (Agent) · 120 (AgentOrb)',
        description: 'Orb diameter in px.',
      },
      { name: 'name', type: 'ReactNode', description: 'Agent name above the status.' },
      {
        name: 'label',
        type: 'ReactNode',
        description: 'Custom status text (e.g. "Searching the docs…").',
      },
      {
        name: 'layout',
        type: "'row' | 'stack'",
        default: "'row'",
        description: 'Orb beside or above the text.',
      },
    ],
    a11y: [
      'The status line is a polite live region: screen readers hear each new state.',
      'Each state has its own shape cue (ripples, arc, orbit, check, cross), not only a color.',
      'Reduced motion: no swirl, ripples or shake — colors and glyphs still change.',
    ],
  },
  {
    slug: 'agent-steps',
    title: 'Agent steps',
    category: 'AI',
    isNew: true,
    description:
      'Show an agent’s work as it happens: pending steps wait in outline, the running one spins and shimmers, finished ones pop a check and fill the thread of light to the next.',
    keywords: ['ai', 'agent', 'steps', 'timeline', 'progress', 'tool calls', 'plan', 'tasks'],
    height: 440,
    controls: [{ type: 'boolean', name: 'fail', label: 'make a step fail', default: false }],
    code: {
      react: `import { AgentSteps } from '@vizzele/react';

<AgentSteps
  aria-label="Agent progress"
  steps={[
    { label: 'Read the brief', detail: 'brief.md', status: 'done' },
    { label: 'Search the codebase', detail: 'grep · 14 files', status: 'running' },
    { label: 'Write the component', status: 'pending' },
  ]}
/>`,
    },
    props: [
      {
        name: 'steps',
        type: 'AgentStep[]',
        description: "{ id?, label, detail?, status: 'pending' | 'running' | 'done' | 'error' }",
      },
    ],
    a11y: [
      'An ordered list; each step ends with its status in text ("done", "in progress"…).',
      'Wrap it in a live region or pair it with <Agent> if updates should be announced.',
    ],
  },
];
