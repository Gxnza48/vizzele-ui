'use client';

import { useEffect, useRef, useState } from 'react';
import { Spring, springs, type SpringPreset } from '@vizzele/core';
import { Button, Select, TextReveal } from '@vizzele/react';

const presets = Object.keys(springs) as SpringPreset[];

/**
 * The pitch in two lanes: a CSS ease-in-out transition vs a Vizzele spring, driven by the same
 * button. Interrupt them mid-flight and only one keeps its momentum.
 */
export function SpringVsKeyframes() {
  const [on, setOn] = useState(false);
  const [preset, setPreset] = useState<SpringPreset>('jelly');
  const [auto, setAuto] = useState(false);
  const cssBall = useRef<HTMLDivElement>(null);
  const springBall = useRef<HTMLDivElement>(null);
  const lane = useRef<HTMLDivElement>(null);
  const spring = useRef<Spring | null>(null);

  useEffect(() => {
    const s = new Spring({
      ...springs.jelly,
      from: 0,
      onUpdate: (v) => {
        const el = springBall.current;
        if (!el) return;
        // Stretch along the motion like a liquid drop.
        const k = Math.min(Math.abs(s.velocity) / 4000, 0.35);
        el.style.transform = `translateX(${v}px) scaleX(${1 + k}) scaleY(${1 - k * 0.6})`;
      },
    });
    spring.current = s;
    return () => void s.stop();
  }, []);

  useEffect(() => {
    spring.current?.setConfig(springs[preset]);
  }, [preset]);

  const flip = (next: boolean) => {
    setOn(next);
    const w = (lane.current?.clientWidth ?? 400) - 56;
    spring.current?.set(next ? w : 0);
  };

  useEffect(() => {
    if (!auto) return;
    // Retarget faster than the CSS transition can finish — the whole point.
    const id = setInterval(() => flip(!on), 380);
    return () => clearInterval(id);
  });

  return (
    <section className="home-section" aria-labelledby="svk-title">
      <div className="home-section-head">
        <p className="home-eyebrow">Physics, not keyframes</p>
        <TextReveal as="h2" by="words" className="vz-display home-h2" id="svk-title">
          Interrupt it. Feel the difference.
        </TextReveal>
        <p className="home-sub">
          Same button, two engines. Hit it again before the motion ends: the keyframe restarts from
          a standstill, the spring keeps its momentum and simply changes its mind.
        </p>
      </div>
      <div className="svk">
        <div className="svk-lanes" ref={lane}>
          <div className="svk-lane">
            <span className="svk-label vz-mono">CSS · ease-in-out · 600ms</span>
            <div
              ref={cssBall}
              className="svk-ball svk-ball-css"
              style={{
                transform: on
                  ? `translateX(calc(${lane.current?.clientWidth ?? 400}px - 56px))`
                  : 'translateX(0)',
              }}
            />
          </div>
          <div className="svk-lane">
            <span className="svk-label vz-mono">Vizzele · spring · {preset}</span>
            <div ref={springBall} className="svk-ball svk-ball-spring" />
          </div>
        </div>
        <div className="svk-controls">
          <Button variant="liquid" size="lg" magnetic onClick={() => flip(!on)}>
            {on ? '← Send back' : 'Send it →'}
          </Button>
          <Button
            variant={auto ? 'glow' : 'default'}
            onClick={() => setAuto((a) => !a)}
            aria-pressed={auto}
          >
            {auto ? 'Stop spamming' : 'Spam the button'}
          </Button>
          <div className="svk-select">
            <Select
              label="Spring preset"
              size="sm"
              options={presets}
              value={preset}
              onValueChange={(v) => setPreset(v as SpringPreset)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
