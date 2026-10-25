'use client';

import {
  FluidBackground,
  Grain,
  LensGrid,
  LiquidMetal,
  MeshGradient,
  ParticleField,
} from '@vizzele/react/gl';
import type { ControlValues } from '@/lib/types';

type P = { values: ControlValues };

const Overlay = ({ title, hint }: { title: string; hint: string }) => (
  <div className="bg-overlay">
    <h3 className="vz-display">{title}</h3>
    <p>{hint}</p>
  </div>
);

export function FluidDemo({ values }: P) {
  return (
    <div className="bg-demo">
      <FluidBackground
        curl={Number(values.curl)}
        dissipation={Number(values.dissipation)}
        splatRadius={Number(values.splatRadius)}
        intensity={Number(values.intensity)}
        ambient={Boolean(values.ambient)}
      />
      <Overlay title="Stir me" hint="Move the pointer through the ink" />
    </div>
  );
}

const palettes: Record<string, string[]> = {
  iridescent: ['#00e5ff', '#ff2bd6', '#ffb238', '#a8ff3e'],
  ember: ['#ff3d6e', '#ffb238', '#ff7a2f', '#ffd84d'],
  abyss: ['#00e5ff', '#7c5cff', '#0a2a6b', '#2be0b5'],
};

export function MeshGradientDemo({ values }: P) {
  return (
    <div className="bg-demo">
      <MeshGradient
        speed={Number(values.speed)}
        warp={Number(values.warp)}
        intensity={Number(values.intensity)}
        grain={Number(values.grain)}
        colors={palettes[String(values.palette)]!}
      />
      <Overlay title="Oil on light" hint="The colors bend around your pointer" />
    </div>
  );
}

export function ParticleFieldDemo({ values }: P) {
  return (
    <div className="bg-demo">
      <ParticleField
        key={String(values.count)}
        mode={values.mode as 'repel' | 'attract'}
        count={Number(values.count)}
        radius={Number(values.radius)}
        force={Number(values.force)}
        size={Number(values.size)}
      />
      <Overlay
        title="Stardust"
        hint={values.mode === 'repel' ? 'They part around you' : 'They spiral into you'}
      />
    </div>
  );
}

export function LiquidMetalDemo({ values }: P) {
  return (
    <div className="bg-demo">
      <LiquidMetal
        blobs={Number(values.blobs)}
        size={Number(values.size)}
        iridescence={Number(values.iridescence)}
        speed={Number(values.speed)}
      />
    </div>
  );
}

export function LensGridDemo({ values }: P) {
  return (
    <div className="bg-demo">
      <LensGrid
        cell={Number(values.cell)}
        strength={Number(values.strength)}
        radius={Number(values.radius)}
        aberration={Number(values.aberration)}
      />
      <Overlay title="Lens" hint="Glide over the grid" />
    </div>
  );
}

export function GrainDemo({ values }: P) {
  const css = values.mode === 'css';
  return (
    <div
      className={css ? 'bg-demo grain-demo vz-grain' : 'bg-demo grain-demo'}
      style={{ '--vz-grain-opacity': String(values.opacity) } as React.CSSProperties}
    >
      {!css && <Grain opacity={Number(values.opacity)} size={Number(values.size)} />}
      <Overlay title="Film" hint={css ? 'CSS only — zero JavaScript' : 'Rendered on the GPU'} />
    </div>
  );
}
