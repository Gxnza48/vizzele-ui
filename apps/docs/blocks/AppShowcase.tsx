'use client';

import { useState } from 'react';
import { Button, Counter, PhoneMockup, Sparkline, Switch } from '@vizzele/react';

const habits = [
  { name: 'Morning run', streak: 12 },
  { name: 'Read 20 pages', streak: 31 },
  { name: 'No sugar', streak: 5 },
  { name: 'Meditate', streak: 18 },
];

/** Screen 1: a live habit tracker — tick a habit and the score springs. */
function HabitScreen() {
  const [done, setDone] = useState<Record<string, boolean>>({ 'Read 20 pages': true });
  const score = Object.values(done).filter(Boolean).length;
  return (
    <div className="blk-app-screen">
      <p className="blk-app-dim">Tuesday</p>
      <h3>Today</h3>
      <div className="blk-app-score">
        <Counter value={Math.round((score / habits.length) * 100)} suffix="%" />
        <span>of your habits done</span>
      </div>
      <ul>
        {habits.map((h) => (
          <li key={h.name}>
            <Switch
              label={h.name}
              checked={!!done[h.name]}
              onCheckedChange={(v) => setDone((d) => ({ ...d, [h.name]: v }))}
            />
            <small>🔥 {h.streak}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Screen 2: weekly stats. */
function StatsScreen() {
  return (
    <div className="blk-app-screen">
      <p className="blk-app-dim">This week</p>
      <h3>Focus</h3>
      <div className="blk-app-score">
        <Counter value={21.5} decimals={1} suffix=" h" />
        <span>+3.2 h vs last week</span>
      </div>
      <Sparkline
        data={[2.1, 3.4, 2.8, 4.2, 3.9, 2.6, 2.5]}
        height={120}
        label="Focus hours per day"
      />
      <Button variant="liquid">Share your week</Button>
    </div>
  );
}

/** App landing hero: copy on the left, two live phones on the right. */
export function AppShowcase() {
  return (
    <div className="blk-app">
      <div className="blk-app-copy">
        <p className="blk-app-eyebrow">Habit, the app</p>
        <h3>Small streaks, big changes.</h3>
        <p>
          Track what matters in two taps. The phones here are live — tick a habit, or drag a phone
          by its frame to spin it.
        </p>
        <div className="blk-app-cta">
          <Button variant="liquid" size="lg" magnetic>
            Download for iOS
          </Button>
          <Button size="lg">Get it on Android</Button>
        </div>
      </div>
      <div className="blk-app-phones">
        <PhoneMockup model="galaxy" finish="violet" rotate={[-4, 24]} className="blk-app-back">
          <StatsScreen />
        </PhoneMockup>
        <PhoneMockup model="iphone" finish="natural" rotate={[-2, -16]} className="blk-app-front">
          <HabitScreen />
        </PhoneMockup>
      </div>
    </div>
  );
}
