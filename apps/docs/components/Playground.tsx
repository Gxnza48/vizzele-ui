'use client';

import { useMemo, useState } from 'react';
import type { Control, ControlValues } from '@/lib/types';
import { demos } from '@/demos';
import { Checkbox, ElasticSlider, Select } from '@vizzele/react';

/** Decimals a step needs, so 0.05 steps read "0.35", not "0.35000000000000003". */
const decimals = (step = 1) => (String(step).split('.')[1] ?? '').length;

const initialValues = (controls: Control[] = []): ControlValues =>
  Object.fromEntries(controls.map((c) => [c.name, c.default]));

/** Live demo + controls panel. Changing a control re-renders the demo with new props. */
export function Playground({
  slug,
  controls,
  height,
  wide,
}: {
  slug: string;
  controls?: Control[];
  height?: number;
  wide?: boolean;
}) {
  const [values, setValues] = useState<ControlValues>(() => initialValues(controls));
  const [key, setKey] = useState(0);
  const Demo = demos[slug];
  const set = (name: string, v: number | string | boolean) =>
    setValues((s) => ({ ...s, [name]: v }));
  const hasControls = !!controls?.length;
  const stageStyle = useMemo(() => ({ minHeight: height ?? 420 }), [height]);

  return (
    <section className={`playground ${hasControls ? 'has-controls' : ''}`} aria-label="Live demo">
      <div className={wide ? 'stage stage-bleed' : 'stage'} style={stageStyle}>
        {Demo ? <Demo key={key} values={values} /> : <p className="vz-muted">Demo coming soon.</p>}
        <button
          type="button"
          className="stage-reset"
          onClick={() => setKey((k) => k + 1)}
          title="Reset demo"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="vz-sr-only">Reset demo</span>
        </button>
      </div>
      {hasControls && (
        <form
          className="controls"
          onSubmit={(e) => e.preventDefault()}
          aria-label="Playground controls"
        >
          {controls!.map((c) => (
            <ControlInput
              key={c.name}
              control={c}
              value={values[c.name]!}
              onChange={(v) => set(c.name, v)}
            />
          ))}
          <button
            type="button"
            className="vz-button"
            data-size="sm"
            onClick={() => {
              setValues(initialValues(controls));
              setKey((k) => k + 1);
            }}
          >
            Reset
          </button>
        </form>
      )}
    </section>
  );
}

function ControlInput({
  control: c,
  value,
  onChange,
}: {
  control: Control;
  value: number | string | boolean;
  onChange: (v: number | string | boolean) => void;
}) {
  const label = c.label ?? c.name;
  const id = `ctl-${c.name}`;
  switch (c.type) {
    case 'range': {
      const d = decimals(c.step);
      return (
        <div className="control">
          <span className="control-head">
            <span>{label}</span>
            <output>{Number(value).toFixed(d)}</output>
          </span>
          <ElasticSlider
            className="control-slider"
            label={label}
            min={c.min}
            max={c.max}
            step={c.step ?? 1}
            value={Number(value)}
            showValue={false}
            onChange={(v) => onChange(Number(v.toFixed(d)))}
          />
        </div>
      );
    }
    case 'select':
      return (
        <div className="control">
          <span className="control-head" id={`${id}-label`}>
            {label}
          </span>
          <Select
            id={id}
            size="sm"
            labelledBy={`${id}-label`}
            options={[...c.options]}
            value={String(value)}
            onValueChange={onChange}
          />
        </div>
      );
    case 'boolean':
      return (
        <Checkbox
          id={id}
          className="control-check"
          label={label}
          checked={Boolean(value)}
          onCheckedChange={onChange}
        />
      );
    case 'color':
      return (
        <label className="control control-inline" htmlFor={id}>
          <input
            id={id}
            type="color"
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
          />
          <span>{label}</span>
        </label>
      );
    case 'text':
      return (
        <label className="control" htmlFor={id}>
          <span className="control-head">{label}</span>
          <input
            id={id}
            type="text"
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      );
  }
}
