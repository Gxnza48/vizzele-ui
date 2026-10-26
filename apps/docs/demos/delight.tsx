'use client';

import { useEffect, useState } from 'react';
import {
  AuthPanel,
  Button,
  ClickSpark,
  DotGrid,
  HeartButton,
  Orbit,
  PasswordInput,
  PasswordStrength,
  SplitFlap,
  ThemeToggle,
  confetti,
  toast,
  Toaster,
} from '@vizzele/react';
import type { ControlValues } from '@/lib/types';

type P = { values: ControlValues };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const Drop = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
    <defs>
      <linearGradient id="dl-drop" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#00e5ff" />
        <stop offset=".55" stopColor="#7c5cff" />
        <stop offset="1" stopColor="#ff2bd6" />
      </linearGradient>
    </defs>
    <path d="M20 3c6 8 12 14 12 21a12 12 0 0 1-24 0C8 17 14 11 20 3Z" fill="url(#dl-drop)" />
  </svg>
);

export function AuthPanelDemo({ values }: P) {
  const mode = values.mode as 'sign-in';
  return (
    <div className="lk-stage">
      <Toaster position="bottom-right" />
      <AuthPanel
        key={mode}
        defaultMode={mode}
        brand={<Drop />}
        providers={values.github ? ['google', 'github'] : ['google']}
        onProvider={async (id) => {
          await wait(1200);
          toast(`Continue with ${id} — wire this to your auth provider`);
        }}
        onSubmit={async () => {
          await wait(1300);
          if (values.fail) throw new Error('Wrong email or password');
        }}
        onForgot={() => toast('We sent you a reset link')}
        footer={
          <>
            By continuing you agree to the <a href="#terms">Terms</a> and{' '}
            <a href="#privacy">Privacy policy</a>.
          </>
        }
      />
    </div>
  );
}

export function PasswordInputDemo({ values }: P) {
  return (
    <div className="lk-stage">
      <div className="dl-field">
        <PasswordInput meter={Boolean(values.meter)} autoComplete="new-password" />
        <p className="vz-muted lk-hint">Show the password and move your pointer around.</p>
      </div>
    </div>
  );
}

const samples = ['', 'hello', 'hello123', 'Hello123', 'Hello123!', 'Liquid-Light-2026!'];

export function PasswordStrengthDemo({ values }: P) {
  const [pw, setPw] = useState('Hello123');
  return (
    <div className="lk-stage">
      <div className="dl-field">
        <div className="lk-row dl-samples">
          {samples.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={s === pw ? 'liquid' : 'ghost'}
              onClick={() => setPw(s)}
            >
              {s || 'empty'}
            </Button>
          ))}
        </div>
        <PasswordStrength password={pw} showChecks={Boolean(values.checks)} />
      </div>
    </div>
  );
}

export function ConfettiDemo({ values }: P) {
  const opts = {
    count: Number(values.count),
    spread: Number(values.spread),
    power: Number(values.power),
  };
  return (
    <div className="lk-stage lk-col">
      <Button variant="liquid" size="lg" onClick={(e) => void confetti(e.currentTarget, opts)}>
        Ship it 🎉
      </Button>
      <Button
        variant="ghost"
        onClick={() => {
          void confetti({ x: innerWidth * 0.2, y: innerHeight }, { ...opts, angle: -60 });
          void confetti({ x: innerWidth * 0.8, y: innerHeight }, { ...opts, angle: -120 });
        }}
      >
        Both corners
      </Button>
    </div>
  );
}

export function ClickSparkDemo({ values }: P) {
  return (
    <ClickSpark className="dl-spark" count={Number(values.count)} radius={Number(values.radius)}>
      <p>Click anywhere in here.</p>
      <Button>Buttons too</Button>
    </ClickSpark>
  );
}

export function HeartButtonDemo() {
  const [liked, setLiked] = useState(false);
  return (
    <div className="lk-stage lk-col">
      <div className="lk-row">
        <HeartButton count={127} liked={liked} onLikedChange={setLiked} />
        <HeartButton count={9} defaultLiked label="Like reply" />
        <HeartButton label="Favourite" />
      </div>
      <p className="vz-muted lk-hint">{liked ? 'You and 127 others' : '127 people like this'}</p>
    </div>
  );
}

export function ThemeToggleDemo({ values }: P) {
  return (
    <div className="lk-stage lk-col">
      <ThemeToggle wipe={Boolean(values.wipe)} className="dl-tt" />
      <p className="vz-muted lk-hint">This switches the whole site — try it.</p>
    </div>
  );
}

const boards = ['VIZZELE UI', 'NOW BOARDING', 'GATE 7  ON TIME', 'MADE OF LIGHT'];

export function SplitFlapDemo({ values }: P) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % boards.length), 6500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="lk-stage lk-col">
      <SplitFlap
        className="dl-flap"
        value={boards[i]!}
        length={15}
        speed={Number(values.speed)}
        stagger={Number(values.stagger)}
      />
      <Button size="sm" variant="ghost" onClick={() => setI((n) => (n + 1) % boards.length)}>
        Next
      </Button>
    </div>
  );
}

const glyph = (label: string, d: string) => (
  <svg
    viewBox="0 0 24 24"
    role="img"
    aria-label={label}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const inner = [
  glyph('Code', 'm8 8-4 4 4 4M16 8l4 4-4 4'),
  glyph('Chat', 'M4 5h16v11H9l-5 4z'),
  glyph('Cloud', 'M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8z'),
];
const outer = [
  glyph(
    'Music',
    'M9 18V5l11-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3Zm11-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z',
  ),
  glyph('Camera', 'M4 8h4l2-3h4l2 3h4v11H4zM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'),
  glyph('Bolt', 'M13 2 4 14h7l-1 8 9-12h-7z'),
  glyph('Star', 'm12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z'),
  glyph(
    'Globe',
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  ),
];

export function OrbitDemo({ values }: P) {
  return (
    <div className="lk-stage">
      <Orbit
        className="dl-orbit"
        pauseOnHover={Boolean(values.pause)}
        rings={[
          { radius: 74, items: inner },
          { radius: 148, items: outer, reverse: true },
        ]}
      >
        <Drop />
      </Orbit>
    </div>
  );
}

export function DotGridDemo({ values }: P) {
  return (
    <DotGrid
      className="dl-grid"
      gap={Number(values.gap)}
      radius={Number(values.radius)}
      shock={Boolean(values.shock)}
    >
      <p className="home-eyebrow">Dot grid</p>
      <h3>Move. Then click.</h3>
    </DotGrid>
  );
}
