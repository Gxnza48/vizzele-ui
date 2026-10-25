'use client';

import { useMemo, useRef, useState } from 'react';
import {
  BottomSheet,
  Draggable,
  ElasticSlider,
  InfiniteCanvas,
  PhysicsWorld,
  ReorderGroup,
  ReorderHandle,
  ReorderItem,
  SwipeStack,
  useDragDismiss,
  type PhysicsWorldApi,
  type SpringPreset,
  type SwipeStackHandle,
} from '@vizzele/react';
import type { ControlValues } from '@/lib/types';

type P = { values: ControlValues };

const hues = ['#00e5ff', '#ff2bd6', '#ffb238', '#a8ff3e', '#7c5cff'];
const gradient = (i: number) =>
  `linear-gradient(${(i * 67) % 360}deg, ${hues[i % 5]}, ${hues[(i + 2) % 5]})`;

export function DraggableDemo({ values }: P) {
  const axis = values.axis as 'both' | 'x' | 'y';
  const snap = values.snapGrid
    ? {
        points: [
          { x: 0, y: 0 },
          { x: 400, y: 0 },
          { x: 0, y: 200 },
          { x: 400, y: 200 },
        ],
      }
    : undefined;
  const common = {
    bounds: 'parent' as const,
    axis,
    momentum: Boolean(values.momentum),
    elastic: Number(values.elastic),
    power: Number(values.power),
    rotate: Number(values.rotate),
    stretch: Number(values.stretch),
    ...(snap ? { snap } : {}),
  };
  return (
    <div className="arena">
      {['Throw', 'me', 'around'].map((label, i) => (
        <Draggable
          key={label}
          {...common}
          className="throw-card"
          style={{ left: 24 + i * 150, top: 24 + i * 40, background: gradient(i) }}
          aria-label={`Draggable card ${label}`}
        >
          <span>{label}</span>
        </Draggable>
      ))}
    </div>
  );
}

const initialTasks = [
  { id: 'springs', label: 'Tune the springs', tag: 'physics' },
  { id: 'glass', label: 'Refract the glass', tag: 'materials' },
  { id: 'cursor', label: 'Teach the cursor to stretch', tag: 'pointer' },
  { id: 'fluid', label: 'Pour the fluid shader', tag: 'webgl' },
  { id: 'a11y', label: 'Respect reduced motion', tag: 'a11y' },
];

export function ReorderDemo({ values }: P) {
  const [items, setItems] = useState(initialTasks);
  const axis = values.axis as 'x' | 'y';
  return (
    <div className="demo-center" style={{ width: '100%' }}>
      <ReorderGroup
        values={items}
        onReorder={setItems}
        axis={axis}
        useHandle={Boolean(values.handle)}
        spring={values.spring as SpringPreset}
        label="Roadmap priorities"
        className={axis === 'x' ? 'reorder-demo reorder-demo-x' : 'reorder-demo'}
      >
        {items.map((t, i) => (
          <ReorderItem key={t.id} className="reorder-row">
            {values.handle ? <ReorderHandle /> : null}
            <span className="reorder-index" style={{ background: gradient(i) }} />
            <span className="reorder-label">{t.label}</span>
            <span className="reorder-tag">{t.tag}</span>
          </ReorderItem>
        ))}
      </ReorderGroup>
    </div>
  );
}

const people = [
  { name: 'Iris', role: 'Shader alchemist', i: 0 },
  { name: 'Nova', role: 'Spring whisperer', i: 1 },
  { name: 'Ámbar', role: 'Motion designer', i: 2 },
  { name: 'Lime', role: 'Gesture engineer', i: 3 },
  { name: 'Prism', role: 'Light cartographer', i: 4 },
];

export function SwipeStackDemo({ values }: P) {
  const stack = useRef<SwipeStackHandle>(null);
  const [log, setLog] = useState<string[]>([]);
  return (
    <div className="demo-center demo-col">
      <SwipeStack
        ref={stack}
        items={people}
        getKey={(p) => p.name}
        threshold={Number(values.threshold)}
        depth={Number(values.depth)}
        loop={Boolean(values.loop)}
        onSwipe={(p, d) =>
          setLog((l) => [`${d === 'right' ? '♥' : '✕'} ${p.name}`, ...l].slice(0, 4))
        }
        renderCard={(p) => (
          <div className="person-card" style={{ background: gradient(p.i) }}>
            <div className="person-glass">
              <strong className="vz-heading">{p.name}</strong>
              <span>{p.role}</span>
            </div>
          </div>
        )}
      />
      <div className="demo-row">
        <button type="button" className="vz-button" onClick={() => stack.current?.swipe('left')}>
          ✕ Pass
        </button>
        <button
          type="button"
          className="vz-button"
          data-variant="liquid"
          onClick={() => stack.current?.swipe('right')}
        >
          ♥ Like
        </button>
      </div>
      <p className="demo-hint" aria-live="polite">
        {log.join('  ·  ') || 'Drag the card, flick it, or use ← →'}
      </p>
    </div>
  );
}

const Speaker = ({ loud }: { loud?: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" />
    {loud && (
      <path
        d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    )}
  </svg>
);

export function ElasticSliderDemo({ values }: P) {
  const [v, setV] = useState(40);
  return (
    <div className="demo-center demo-col" style={{ width: 'min(420px, 100%)' }}>
      <ElasticSlider
        label="Volume"
        value={v}
        onChange={setV}
        step={Number(values.step)}
        disabled={Boolean(values.disabled)}
        {...(values.icons ? { startIcon: <Speaker />, endIcon: <Speaker loud /> } : {})}
      />
      <p className="demo-hint">Pull past either end.</p>
    </div>
  );
}

function Toast({
  title,
  text,
  i,
  onClose,
  options,
}: {
  title: string;
  text: string;
  i: number;
  onClose: () => void;
  options: ControlValues;
}) {
  const ref = useDragDismiss<HTMLDivElement>({
    axis: options.axis as 'x' | 'y',
    direction: options.direction as 'both' | 'positive' | 'negative',
    threshold: Number(options.threshold),
    onDismiss: onClose,
  });
  return (
    <div ref={ref} className="vz-card dismiss-card" role="status">
      <span className="dismiss-dot" style={{ background: gradient(i) }} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p className="vz-muted">{text}</p>
      </div>
      <button
        type="button"
        className="dismiss-close"
        onClick={onClose}
        aria-label={`Dismiss ${title}`}
      >
        ✕
      </button>
    </div>
  );
}

const notes = [
  { title: 'Build passed', text: 'All 128 springs settled.' },
  { title: 'New comment', text: '“The glass refraction is unreal.”' },
  { title: 'Deploy ready', text: 'vizzele-ui is live on the edge.' },
];

export function DragDismissDemo({ values }: P) {
  const [list, setList] = useState(notes.map((n, i) => ({ ...n, id: i })));
  return (
    <div className="demo-center demo-col" style={{ width: 'min(420px, 100%)' }}>
      {list.map((n) => (
        <Toast
          key={n.id}
          title={n.title}
          text={n.text}
          i={n.id}
          options={values}
          onClose={() => setList((l) => l.filter((x) => x.id !== n.id))}
        />
      ))}
      {!list.length && (
        <button
          type="button"
          className="vz-button"
          onClick={() => setList(notes.map((n, i) => ({ ...n, id: Date.now() + i })))}
        >
          Bring them back
        </button>
      )}
    </div>
  );
}

export function BottomSheetDemo({ values }: P) {
  const [open, setOpen] = useState(false);
  const snaps = String(values.snaps)
    .split(',')
    .map((s) => Number(s.trim()));
  return (
    <div className="demo-center demo-col">
      <button
        type="button"
        className="vz-button"
        data-variant="liquid"
        data-size="lg"
        onClick={() => setOpen(true)}
      >
        Open sheet
      </button>
      <p className="demo-hint">Drag the top bar. Flick it down to close.</p>
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        snapPoints={snaps}
        dismissible={Boolean(values.dismissible)}
        title="Liquid settings"
      >
        <div className="sheet-demo">
          <ElasticSlider label="Refraction" defaultValue={60} />
          <ElasticSlider label="Grain" defaultValue={20} />
          <p className="vz-muted">
            The sheet rests at {snaps.map((s) => `${Math.round(s * 100)}%`).join(' and ')} of the
            screen. Throw it between them — velocity decides where it lands.
          </p>
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="sheet-row"
              style={{ '--c': hues[i % 5] } as React.CSSProperties}
            >
              Option {i + 1}
            </div>
          ))}
          <button type="button" className="vz-button" onClick={() => setOpen(false)}>
            Done
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

export function InfiniteCanvasDemo({ values }: P) {
  const items = useMemo(() => Array.from({ length: 14 }, (_, i) => i), []);
  const w = Number(values.itemWidth);
  return (
    <InfiniteCanvas
      items={items}
      itemWidth={w}
      itemHeight={Math.round(w * 1.3)}
      gap={Number(values.gap)}
      stagger={Boolean(values.stagger)}
      className="canvas-demo"
      renderItem={(i) => (
        <figure className="art-tile" style={{ background: gradient(i) }}>
          <span className="art-blob" style={{ background: gradient(i + 3) }} />
          <figcaption>No. {String(i + 1).padStart(2, '0')}</figcaption>
        </figure>
      )}
    />
  );
}

const words = ['spring', 'inertia', 'glass', 'holo', 'drag', 'fluid', 'grain', 'chrome', 'light'];

export function PhysicsDemo({ values }: P) {
  const world = useRef<PhysicsWorldApi | null>(null);
  const count = Number(values.count);
  return (
    <div className="physics-wrap">
      <PhysicsWorld
        worldRef={world}
        gravity={{ x: 0, y: Number(values.gravity) }}
        restitution={Number(values.restitution)}
        className="physics-demo"
      >
        {Array.from({ length: count }, (_, i) => {
          const size = 44 + ((i * 37) % 70);
          const isWord = i % 3 === 0;
          return (
            <span
              key={`${count}-${i}`}
              className={isWord ? 'ball ball-word' : 'ball'}
              style={{ width: size, height: size, background: gradient(i) }}
            >
              {isWord ? words[(i / 3) % words.length] : null}
            </span>
          );
        })}
      </PhysicsWorld>
      <button
        type="button"
        className="vz-button physics-shake"
        data-size="sm"
        onClick={(e) => {
          const box = (
            e.currentTarget.previousElementSibling as HTMLElement
          ).getBoundingClientRect();
          world.current?.impulse(box.width / 2, box.height, 2600, box.width);
        }}
      >
        Shake
      </button>
    </div>
  );
}
