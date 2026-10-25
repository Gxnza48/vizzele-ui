import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

afterEach(cleanup);
import { AgentSteps, BarChart, DonutChart, Agent } from '../src';

describe('charts', () => {
  it('exposes every value in a data table', () => {
    render(
      <BarChart
        title="Signups"
        index="month"
        data={[
          { month: 'Jan', web: 1200, app: 300 },
          { month: 'Feb', web: 1500, app: 450 },
        ]}
        series={[
          { key: 'web', label: 'Web' },
          { key: 'app', label: 'App' },
        ]}
      />,
    );
    const table = screen.getByRole('table', { name: 'Signups' });
    expect(table.textContent).toContain('1.5K');
    expect(table.textContent).toContain('450');
    expect(screen.getByRole('group').getAttribute('aria-label')).toMatch(/Signups/);
  });

  it('donut shares add up', () => {
    render(
      <DonutChart
        data={[
          { label: 'A', value: 50 },
          { label: 'B', value: 30 },
          { label: 'C', value: 20 },
        ]}
      />,
    );
    expect(screen.getByRole('table').textContent).toContain('50%');
    expect(screen.getByRole('table').textContent).toContain('20%');
  });
});

describe('agent', () => {
  it('announces its state in a live region', () => {
    const { rerender } = render(<Agent state="thinking" />);
    expect(screen.getByRole('status').textContent).toBe('Thinking…');
    rerender(<Agent state="error" label="Rate limited" />);
    expect(screen.getByRole('status').textContent).toBe('Rate limited');
  });

  it('steps carry their status in text, not only color', () => {
    render(
      <AgentSteps
        steps={[
          { label: 'Plan', status: 'done' },
          { label: 'Build', status: 'running' },
        ]}
      />,
    );
    const items = screen.getAllByRole('listitem');
    expect(items[0]!.textContent).toContain('done');
    expect(items[1]!.textContent).toContain('in progress');
  });
});
