'use client';

import { useState } from 'react';
import { Button, Card, Counter, HoloCard, Tabs } from '@vizzele/react';

const plans = [
  {
    name: 'Starter',
    monthly: 0,
    blurb: 'Everything in the open-source library.',
    features: ['All components & effects', 'Community support', 'MIT license'],
    cta: 'Get started',
  },
  {
    name: 'Pro',
    monthly: 24,
    blurb: 'For teams shipping interfaces with weight.',
    features: [
      'Everything in Starter',
      'Premium blocks & templates',
      'Figma kit',
      'Priority support',
    ],
    cta: 'Start free trial',
    featured: true,
  },
  {
    name: 'Studio',
    monthly: 79,
    blurb: 'For agencies building many products.',
    features: ['Everything in Pro', 'Unlimited projects', 'Custom themes', 'Onboarding call'],
    cta: 'Talk to us',
  },
];

const Check = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
    <path
      d="M5 12.5l4.5 4.5L19 7.5"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </svg>
);

/** Three plans; prices spring between monthly and yearly, the featured plan is holographic. */
export function Pricing() {
  const [cycle, setCycle] = useState('monthly');
  const yearly = cycle === 'yearly';
  return (
    <div className="blk-pricing">
      <Tabs
        label="Billing cycle"
        value={cycle}
        onValueChange={setCycle}
        items={[
          { value: 'monthly', label: 'Monthly' },
          { value: 'yearly', label: 'Yearly · save 20%' },
        ]}
      />
      <div className="blk-pricing-grid">
        {plans.map((p) => {
          const price = yearly ? Math.round(p.monthly * 0.8) : p.monthly;
          const body = (
            <>
              <h3>{p.name}</h3>
              <p className="blk-pricing-blurb">{p.blurb}</p>
              <p className="blk-pricing-price">
                <Counter value={price} prefix="$" />
                <span>/ month{yearly && p.monthly > 0 ? ', billed yearly' : ''}</span>
              </p>
              <ul>
                {p.features.map((f) => (
                  <li key={f}>
                    <Check />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant={p.featured ? 'liquid' : 'default'} magnetic={p.featured}>
                {p.cta}
              </Button>
            </>
          );
          return p.featured ? (
            <HoloCard key={p.name} className="blk-pricing-card is-featured" max={8}>
              <span className="blk-pricing-badge">Most popular</span>
              {body}
            </HoloCard>
          ) : (
            <Card key={p.name} className="blk-pricing-card">
              {body}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
