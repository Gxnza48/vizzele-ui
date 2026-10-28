'use client';

import { useEffect, useState } from 'react';
import { Badge, LazyMount, ScratchCard } from '@vizzele/react';
import { MeshGradient } from '@vizzele/react/gl';
import type { ControlValues } from '@/lib/types';

type P = { values: ControlValues };

export function ScratchCardDemo({ values }: P) {
  const [round, setRound] = useState(0);
  const [progress, setProgress] = useState(0);
  const [won, setWon] = useState(false);
  return (
    <div className="lk-stage lk-col">
      <ScratchCard
        key={`${round}-${values.brush}-${values.threshold}`}
        className="sc-card"
        label="Scratch for your code"
        brush={Number(values.brush)}
        threshold={Number(values.threshold)}
        confetti={Boolean(values.confetti)}
        onProgress={setProgress}
        onReveal={() => setWon(true)}
      >
        <div className="sc-prize">
          <span className="home-eyebrow">20% off everything</span>
          <strong>VIZZELE20</strong>
          <span className="vz-muted">Valid until Sunday</span>
        </div>
      </ScratchCard>
      <p className="vz-muted lk-hint">
        {won ? (
          <button
            type="button"
            className="sc-again"
            onClick={() => {
              setRound((r) => r + 1);
              setWon(false);
              setProgress(0);
            }}
          >
            Another one
          </button>
        ) : (
          `${Math.round(progress * 100)}% scratched`
        )}
      </p>
    </div>
  );
}

export function LazyMountDemo() {
  const [mounted, setMounted] = useState(false);
  return (
    <div className="sc-lazy">
      <div className="sc-lazy-status">
        <Badge color={mounted ? 'acid' : 'neutral'} variant={mounted ? 'glow' : undefined}>
          {mounted ? 'Mounted' : 'Not mounted yet'}
        </Badge>
        <span className="vz-muted">Scroll down inside this box ↓</span>
      </div>
      <div className="sc-lazy-scroll">
        <div className="sc-lazy-spacer">
          Nothing below has been rendered — no WebGL context, no JavaScript running.
        </div>
        <LazyMount margin="0px" minHeight={260} className="sc-lazy-slot">
          <Mounted onMount={() => setMounted(true)} />
        </LazyMount>
      </div>
    </div>
  );
}

function Mounted({ onMount }: { onMount: () => void }) {
  useEffect(onMount, [onMount]);
  return <MeshGradient className="sc-lazy-gl" />;
}
