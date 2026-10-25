'use client';

import { useMemo, useRef, useState } from 'react';
import {
  Spring,
  resolveSpring,
  solveSpring,
  springDuration,
  springs,
  type SpringPreset,
} from '@vizzele/core';

/** Interactive spring explorer: plots the curve and animates a ball with the same config. */
export function SpringLab() {
  const [cfg, setCfg] = useState({ stiffness: 210, damping: 20, mass: 1 });
  const [on, setOn] = useState(false);
  const ball = useRef<HTMLDivElement>(null);
  const spring = useRef<Spring | null>(null);

  const { path, duration } = useMemo(() => {
    const c = resolveSpring(cfg);
    const d = Math.min(springDuration(c), 4);
    const span = Math.max(d, 0.4);
    const pts: string[] = [];
    for (let i = 0; i <= 120; i++) {
      const t = (i / 120) * span;
      const [x] = solveSpring(-1, 0, t, c);
      // Rounded: Node and the browser disagree in the last float digits (hydration mismatch).
      pts.push(`${((i / 120) * 300).toFixed(2)},${(100 - (1 + x) * 70).toFixed(2)}`);
    }
    return { path: `M${pts.join(' L')}`, duration: d };
  }, [cfg]);

  const play = () => {
    spring.current ??= new Spring({
      onUpdate: (v) => {
        if (ball.current) ball.current.style.transform = `translateX(${v}%)`;
      },
    });
    const next = !on;
    setOn(next);
    spring.current.setConfig(cfg).set(next ? 100 : 0);
  };

  const preset = (name: SpringPreset) => setCfg({ ...springs[name] });

  return (
    <div className="spring-lab">
      <div className="spring-lab-viz">
        <svg viewBox="0 0 300 110" className="spring-lab-plot" role="img" aria-label="Spring curve">
          <line x1="0" x2="300" y1="30" y2="30" className="spring-lab-target" />
          <path d={path} className="spring-lab-curve" />
        </svg>
        <div className="spring-lab-track">
          <div ref={ball} className="spring-lab-ball" />
        </div>
        <p className="vz-muted spring-lab-meta">
          Settles in ≈ <strong>{Math.round(duration * 1000)} ms</strong> — nobody chose that number.
        </p>
      </div>
      <div className="spring-lab-controls">
        {(['stiffness', 'damping', 'mass'] as const).map((k) => (
          <label key={k} className="control">
            <span className="control-head">
              <span>{k}</span>
              <output>{cfg[k]}</output>
            </span>
            <input
              type="range"
              min={k === 'mass' ? 0.2 : k === 'damping' ? 2 : 20}
              max={k === 'mass' ? 5 : k === 'damping' ? 80 : 800}
              step={k === 'mass' ? 0.1 : 1}
              value={cfg[k]}
              onChange={(e) => setCfg((c) => ({ ...c, [k]: Number(e.target.value) }))}
            />
          </label>
        ))}
        <div className="spring-lab-presets">
          {(Object.keys(springs) as SpringPreset[]).map((p) => (
            <button
              key={p}
              type="button"
              className="vz-button"
              data-size="sm"
              onClick={() => preset(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <button type="button" className="vz-button" data-variant="liquid" onClick={play}>
          Play
        </button>
      </div>
    </div>
  );
}
