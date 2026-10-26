'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AvatarStack,
  BorderLight,
  Button,
  GooeyMenu,
  LiquidGauge,
  LiquidRating,
  LiquidStepper,
  NumberScrubber,
  PullToRefresh,
  SignaturePad,
  StreamText,
  toast,
  Toaster,
  type SignaturePadHandle,
} from '@vizzele/react';
import type { ControlValues } from '@/lib/types';

type P = { values: ControlValues };

const icon = (d: string) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

export function GooeyMenuDemo({ values }: P) {
  const direction = values.direction as 'up';
  return (
    <div className="lk-stage" data-dir={direction}>
      <Toaster position="bottom-right" />
      <GooeyMenu
        key={direction}
        label="Create"
        direction={direction}
        gap={Number(values.gap)}
        items={[
          { label: 'New note', icon: icon('M12 5v14M5 12h14'), onSelect: () => toast('New note') },
          {
            label: 'Upload',
            icon: icon('M12 16V4m0 0-4 4m4-4 4 4M4 20h16'),
            onSelect: () => toast('Upload'),
          },
          {
            label: 'Share',
            icon: icon('M4 12v7h16v-7M12 3v12m0-12-4 4m4-4 4 4'),
            onSelect: () => toast('Share'),
          },
          {
            label: 'Favourite',
            icon: icon('m12 20-7-7a4.5 4.5 0 0 1 7-6 4.5 4.5 0 0 1 7 6z'),
            onSelect: () => toast('Favourite'),
          },
        ]}
      />
    </div>
  );
}

const people = [
  'Ada Lovelace',
  'Alan Turing',
  'Grace Hopper',
  'Katherine Johnson',
  'Linus Torvalds',
  'Margaret Hamilton',
  'Tim Berners-Lee',
  'Hedy Lamarr',
].map((name) => ({ name }));

export function AvatarStackDemo({ values }: P) {
  return (
    <div className="lk-stage">
      <AvatarStack people={people} size={Number(values.size)} max={Number(values.max)} />
      <p className="vz-muted lk-hint">Hover the group — the drop splits.</p>
    </div>
  );
}

const steps = ['Account', 'Profile', { label: 'Plan', description: 'Pick one' }, 'Payment', 'Done'];

export function LiquidStepperDemo() {
  const [at, setAt] = useState(1);
  return (
    <div className="lk-stage lk-col">
      <LiquidStepper steps={steps} current={at} onStepClick={setAt} className="lk-stepper" />
      <div className="lk-row">
        <Button onClick={() => setAt((a) => Math.max(a - 1, 0))} disabled={at === 0}>
          Back
        </Button>
        <Button
          variant="liquid"
          onClick={() => setAt((a) => Math.min(a + 1, steps.length - 1))}
          disabled={at === steps.length - 1}
        >
          Next step
        </Button>
      </div>
    </div>
  );
}

export function LiquidGaugeDemo({ values }: P) {
  const [v, setV] = useState(Number(values.value));
  useEffect(() => setV(Number(values.value)), [values.value]);
  return (
    <div className="lk-stage lk-col">
      <LiquidGauge label="Storage used" value={v} size={Number(values.size)} />
      <div className="lk-row">
        <Button size="sm" onClick={() => setV(Math.round(Math.random() * 100))}>
          Random level
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setV(v > 50 ? 8 : 96)}>
          Slosh it
        </Button>
      </div>
    </div>
  );
}

export function LiquidRatingDemo({ values }: P) {
  const [r, setR] = useState(3);
  return (
    <div className="lk-stage lk-col">
      <LiquidRating
        value={r}
        onChange={setR}
        step={Number(values.step)}
        size={Number(values.size)}
        readOnly={Boolean(values.readOnly)}
        label="Your rating"
      />
      <p className="vz-muted lk-hint">{r} of 5 — hover to preview, click or use the arrow keys.</p>
    </div>
  );
}

export function NumberScrubberDemo() {
  const [opacity, setOpacity] = useState(80);
  const [radius, setRadius] = useState(16);
  const [blur, setBlur] = useState(12);
  return (
    <div className="lk-stage lk-col">
      <div className="lk-row">
        <NumberScrubber
          label="Opacity"
          value={opacity}
          onChange={setOpacity}
          min={0}
          max={100}
          suffix="%"
        />
        <NumberScrubber
          label="Radius"
          value={radius}
          onChange={setRadius}
          min={0}
          max={48}
          step={0.5}
          suffix="px"
        />
        <NumberScrubber label="Blur" value={blur} onChange={setBlur} min={0} max={40} suffix="px" />
      </div>
      <div
        className="lk-preview"
        style={{ opacity: opacity / 100, borderRadius: radius, backdropFilter: `blur(${blur}px)` }}
        aria-hidden="true"
      />
    </div>
  );
}

const feed = [
  'Springs 2.0 shipped',
  'Liquid glass got sharper',
  'New: gooey menu',
  'Docs are faster',
];

export function PullToRefreshDemo() {
  const [items, setItems] = useState(feed);
  const n = useRef(1);
  return (
    <div className="lk-stage">
      <PullToRefresh
        className="lk-ptr"
        onRefresh={() =>
          new Promise<void>((done) =>
            setTimeout(() => {
              setItems((i) => [`Update #${n.current++} just in`, ...i]);
              done();
            }, 1400),
          )
        }
      >
        <p className="lk-ptr-hint vz-muted">Pull down (drag with the mouse) ↓</p>
        <ul className="lk-feed">
          {items.map((t, i) => (
            <li key={t + i}>{t}</li>
          ))}
        </ul>
      </PullToRefresh>
    </div>
  );
}

export function SignaturePadDemo({ values }: P) {
  const pad = useRef<SignaturePadHandle>(null);
  const [empty, setEmpty] = useState(true);
  const [svg, setSvg] = useState('');
  return (
    <div className="lk-stage lk-col lk-wide">
      <SignaturePad
        ref={pad}
        ink={String(values.ink)}
        onChange={setEmpty}
        className="lk-signature"
      />
      <div className="lk-row">
        <Button
          variant="liquid"
          disabled={empty}
          onClick={() => setSvg(pad.current?.toSVG() ?? '')}
        >
          Export SVG
        </Button>
        {svg && (
          <span className="vz-muted lk-hint">{(svg.length / 1024).toFixed(1)} kB of SVG ✓</span>
        )}
      </div>
    </div>
  );
}

const answer =
  'Paid social doubled in March, mostly from two creator campaigns. Organic search held steady, so the jump is real demand — not a tracking glitch. I would keep one campaign running and test a third.';

export function StreamTextDemo({ values }: P) {
  const [run, setRun] = useState(0);
  return (
    <div className="lk-stage lk-col lk-wide">
      <div className="lk-answer">
        <StreamText key={run} text={answer} speed={Number(values.speed)} />
      </div>
      <Button size="sm" onClick={() => setRun((r) => r + 1)}>
        Ask again
      </Button>
    </div>
  );
}

export function BorderLightDemo({ values }: P) {
  return (
    <div className="lk-stage">
      <BorderLight className="lk-card" speed={Number(values.speed)} width={Number(values.width)}>
        <p className="home-eyebrow">Pro</p>
        <p className="lk-price">
          $24<span>/mo</span>
        </p>
        <p className="vz-muted">Bring your pointer near the edge — the light comes to meet you.</p>
        <Button variant="liquid">Upgrade</Button>
      </BorderLight>
    </div>
  );
}
