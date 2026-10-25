'use client';

import { LaptopMockup, PhoneMockup } from '@vizzele/react';
import type { ControlValues } from '@/lib/types';
import { ChatApp, DashboardSite, LandingSite, MusicApp, WalletApp } from './screens';

type P = { values: ControlValues };

const apps = { wallet: WalletApp, music: MusicApp, chat: ChatApp };

function Phone({ values, model }: P & { model: 'iphone' | 'galaxy' }) {
  const App = apps[values.app as keyof typeof apps] ?? WalletApp;
  return (
    <div className="mock-demo">
      <PhoneMockup
        model={model}
        finish={String(values.finish)}
        tilt={Number(values.tilt)}
        float={Boolean(values.float)}
        drag={Boolean(values.drag)}
        width={290}
      >
        <App />
      </PhoneMockup>
      <p className="mock-hint">Use the app · drag the frame to spin it</p>
    </div>
  );
}

export const IphoneDemo = ({ values }: P) => <Phone values={values} model="iphone" />;
export const GalaxyDemo = ({ values }: P) => <Phone values={values} model="galaxy" />;

export function LaptopDemo({ values }: P) {
  return (
    <div className="mock-demo mock-demo-laptop">
      <LaptopMockup
        finish={String(values.finish)}
        open={Number(values.open)}
        tilt={Number(values.tilt)}
        drag={Boolean(values.drag)}
      >
        {values.site === 'landing' ? <LandingSite /> : <DashboardSite />}
      </LaptopMockup>
    </div>
  );
}
