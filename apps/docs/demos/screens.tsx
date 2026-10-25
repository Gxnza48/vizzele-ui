'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  AgentOrb,
  AreaChart,
  Button,
  Counter,
  ElasticSlider,
  Sidebar,
  Sparkline,
  StatCard,
  Switch,
  Tabs,
  type AgentState,
} from '@vizzele/react';
import { Aurora } from '@vizzele/react/gl';

/* Small, real apps that run inside the device screens. Each one fills its screen and leaves
   room for the status bar with var(--vz-safe-top). */

const week = [820, 960, 900, 1180, 1090, 1320, 1410];
const month = [3200, 2900, 3600, 3400, 4100, 3900, 4500, 4800, 4400, 5200, 5600, 5900];

export function WalletApp() {
  const [range, setRange] = useState('week');
  const [sent, setSent] = useState(false);
  const data = range === 'week' ? week : month;
  return (
    <div className="scr scr-wallet">
      <p className="scr-dim">Good evening, Ada</p>
      <p className="scr-balance">
        <Counter value={range === 'week' ? 12480.32 : 48210.5} decimals={2} prefix="$" />
      </p>
      <p className="scr-up">▲ 8.2% this {range}</p>
      <Tabs
        label="Range"
        value={range}
        onValueChange={setRange}
        items={[
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
        ]}
      />
      <div className="scr-chart">
        <Sparkline data={data} height={92} label={`Balance this ${range}`} />
      </div>
      <div className="scr-actions">
        <Button variant="liquid" onClick={() => setSent(true)}>
          {sent ? 'Sent ✓' : 'Send'}
        </Button>
        <Button onClick={() => setSent(false)}>Request</Button>
      </div>
      <ul className="scr-list">
        {[
          ['Blue Bottle Coffee', '−$6.50', 'Today'],
          ['Salary · Northwind', '+$4,200', 'Yesterday'],
          ['Spotify', '−$11.99', 'Mon'],
          ['Transfer from Lin', '+$45.00', 'Sun'],
        ].map(([name, amount, when]) => (
          <li key={name}>
            <span className="scr-avatar" aria-hidden="true">
              {name![0]}
            </span>
            <span>
              {name}
              <small>{when}</small>
            </span>
            <b className={amount!.startsWith('+') ? 'scr-pos' : undefined}>{amount}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MusicApp() {
  const [playing, setPlaying] = useState(true);
  const [pos, setPos] = useState(38);
  const [level, setLevel] = useState(0.4);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setLevel(0.25 + Math.random() * 0.75);
      setPos((p) => (p >= 100 ? 0 : p + 0.25));
    }, 180);
    return () => clearInterval(id);
  }, [playing]);
  const time = (v: number) => {
    const s = Math.round((v / 100) * 214);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  return (
    <div className="scr scr-music">
      <p className="scr-dim scr-center">Now playing</p>
      <div className="scr-art">
        <AgentOrb state={playing ? 'speaking' : 'idle'} level={playing ? level : 0} size={190} />
      </div>
      <h3 className="scr-title">Liquid Light</h3>
      <p className="scr-dim scr-center">Vizzele Ensemble</p>
      <ElasticSlider label="Position" value={pos} onChange={setPos} formatValue={time} showValue />
      <div className="scr-controls">
        <Button aria-label="Previous" onClick={() => setPos(0)}>
          ⏮
        </Button>
        <Button variant="liquid" size="lg" onClick={() => setPlaying((p) => !p)}>
          {playing ? 'Pause' : 'Play'}
        </Button>
        <Button aria-label="Next" onClick={() => setPos(0)}>
          ⏭
        </Button>
      </div>
      <Switch label="Shuffle" defaultChecked />
    </div>
  );
}

const replies = [
  'Done — I moved your 3pm to Thursday and told the team.',
  'Your balance is $12,480. Spending is down 8% this week.',
  'Here is a draft: “Thanks for the quick turnaround — shipping Friday.”',
];

export function ChatApp() {
  const [state, setState] = useState<AgentState>('idle');
  const [messages, setMessages] = useState([
    { me: false, text: 'Hi Ada — what can I do for you?' },
    { me: true, text: 'Move my 3pm meeting' },
    { me: false, text: replies[0]! },
  ]);
  const [text, setText] = useState('');
  const n = useRef(1);
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' });
  }, [messages, state]);
  const send = (e: FormEvent) => {
    e.preventDefault();
    const q = text.trim() || 'How am I doing this week?';
    setText('');
    setMessages((m) => [...m, { me: true, text: q }]);
    setState('thinking');
    setTimeout(() => setState('speaking'), 900);
    setTimeout(() => {
      setMessages((m) => [...m, { me: false, text: replies[n.current++ % replies.length]! }]);
      setState('success');
      setTimeout(() => setState('idle'), 900);
    }, 1700);
  };
  return (
    <div className="scr scr-chat">
      <header className="scr-chat-head">
        <AgentOrb state={state} size={40} />
        <div>
          <b>Assistant</b>
          <small>
            {state === 'idle' ? 'Online' : state === 'thinking' ? 'Thinking…' : 'Typing…'}
          </small>
        </div>
      </header>
      <div className="scr-chat-list" ref={list}>
        {messages.map((m, i) => (
          <p key={i} className={m.me ? 'scr-bubble scr-me' : 'scr-bubble'}>
            {m.text}
          </p>
        ))}
        {state === 'thinking' && <p className="scr-bubble scr-typing">• • •</p>}
      </div>
      <form className="scr-chat-input" onSubmit={send}>
        <input
          aria-label="Message"
          placeholder="Ask anything…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button type="submit" variant="liquid" size="sm">
          Send
        </Button>
      </form>
    </div>
  );
}

const traffic = Array.from({ length: 12 }, (_, i) => ({
  month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]!,
  visitors: Math.round(4200 + 1600 * Math.sin(i / 1.8) + i * 260),
  signups: Math.round(900 + 400 * Math.cos(i / 1.5) + i * 60),
}));

export function DashboardSite() {
  const [page, setPage] = useState('/');
  return (
    <div className="scr-site scr-dash">
      <Sidebar
        active={page}
        onNavigate={setPage}
        label="Dashboard"
        header={<b className="scr-brand">Northwind</b>}
        linkAs={StayLink}
        sections={[
          {
            title: 'Overview',
            items: [
              { href: '/', label: 'Dashboard' },
              { href: '/customers', label: 'Customers', badge: 12 },
              { href: '/revenue', label: 'Revenue' },
            ],
          },
          { title: 'Settings', items: [{ href: '/team', label: 'Team' }] },
        ]}
      />
      <main>
        <h2>Good morning, Ada</h2>
        <div className="scr-dash-stats">
          <StatCard label="Revenue" value={48210} prefix="$" delta={12.4} trend={month} />
          <StatCard
            label="Visitors"
            value={62400}
            delta={8.1}
            trend={week}
            trendColor="var(--vz-chart-2)"
          />
          <StatCard
            label="Churn"
            value={2.1}
            suffix="%"
            delta={-0.4}
            upIsGood={false}
            trend={[3, 2.8, 2.6, 2.4, 2.1]}
            trendColor="var(--vz-chart-3)"
          />
        </div>
        <div className="scr-dash-card">
          <AreaChart
            title="Traffic"
            data={traffic}
            index="month"
            series={[
              { key: 'visitors', label: 'Visitors' },
              { key: 'signups', label: 'Signups' },
            ]}
            height={300}
          />
        </div>
      </main>
    </div>
  );
}

function StayLink(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...props}
      onClick={(e) => {
        e.preventDefault();
        props.onClick?.(e);
      }}
    />
  );
}

export function LandingSite() {
  return (
    <div className="scr-site scr-landing">
      <Aurora />
      <nav>
        <b className="scr-brand">Tide</b>
        <span>Product</span>
        <span>Pricing</span>
        <span>Blog</span>
        <Button size="sm" variant="liquid">
          Get the app
        </Button>
      </nav>
      <div className="scr-landing-hero">
        <h1>Money that moves like water.</h1>
        <p>Send, save and spend from one calm place. Built with Vizzele.</p>
        <div>
          <Button variant="liquid" size="lg" magnetic>
            Download
          </Button>
          <Button size="lg">See how it works</Button>
        </div>
      </div>
    </div>
  );
}
