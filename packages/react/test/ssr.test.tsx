// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import * as V from '../src';
import * as GL from '../src/gl';

/**
 * Every component must render on the server without touching window/document/HTMLElement.
 * Runs in a pure Node environment (no DOM globals at all).
 */
const cases: [string, () => React.ReactElement][] = [
  [
    'Button',
    () => (
      <V.Button variant="liquid" magnetic>
        Hi
      </V.Button>
    ),
  ],
  ['Card', () => <V.Card variant="holo">x</V.Card>],
  ['HoldButton', () => <V.HoldButton onConfirm={() => {}}>Hold</V.HoldButton>],
  ['LiquidFocus', () => <V.LiquidFocus />],
  ['LiquidSelection', () => <V.LiquidSelection>text</V.LiquidSelection>],
  [
    'SurfaceTension',
    () => (
      <V.SurfaceTension>
        <button>a</button>
        <button>b</button>
      </V.SurfaceTension>
    ),
  ],
  ['CausticCard', () => <GL.CausticCard>glass</GL.CausticCard>],
  [
    'LineChart',
    () => (
      <V.LineChart
        title="t"
        index="m"
        area
        data={[
          { m: 'a', v: 1 },
          { m: 'b', v: 3 },
        ]}
        series={[{ key: 'v' }]}
      />
    ),
  ],
  [
    'BarChart',
    () => (
      <V.BarChart
        stacked
        index="m"
        data={[{ m: 'a', v: 1, w: 2 }]}
        series={[{ key: 'v' }, { key: 'w' }]}
      />
    ),
  ],
  [
    'DonutChart',
    () => (
      <V.DonutChart
        data={[
          { label: 'a', value: 2 },
          { label: 'b', value: 1 },
        ]}
      />
    ),
  ],
  ['Sparkline', () => <V.Sparkline data={[1, 3, 2]} />],
  ['StatCard', () => <V.StatCard label="Revenue" value={1200} delta={4.2} trend={[1, 2, 3]} />],
  ['Agent', () => <V.Agent state="thinking" name="Vizzele" />],
  ['AgentOrb', () => <V.AgentOrb state="speaking" level={0.5} />],
  [
    'AgentSteps',
    () => (
      <V.AgentSteps
        steps={[
          { label: 'Read', status: 'done' },
          { label: 'Write', status: 'running' },
          { label: 'Ship', status: 'pending' },
        ]}
      />
    ),
  ],
  ['LiquidGlass', () => <V.LiquidGlass>x</V.LiquidGlass>],
  ['Switch', () => <V.Switch label="s" />],
  ['Checkbox', () => <V.Checkbox label="c" indeterminate />],
  ['RadioGroup', () => <V.RadioGroup label="r" options={[{ value: 'a', label: 'A' }]} />],
  ['Input', () => <V.Input label="Email" hint="h" />],
  ['Skeleton', () => <V.Skeleton lines={3} />],
  ['Magnetic', () => <V.Magnetic>m</V.Magnetic>],
  ['Tilt', () => <V.Tilt>t</V.Tilt>],
  ['HoloCard', () => <V.HoloCard>h</V.HoloCard>],
  ['SpotlightCard', () => <V.SpotlightCard>s</V.SpotlightCard>],
  ['Ripple', () => <V.Ripple>r</V.Ripple>],
  ['Cursor', () => <V.Cursor />],
  ['ParticleTrail', () => <V.ParticleTrail />],
  ['Draggable', () => <V.Draggable bounds="parent">d</V.Draggable>],
  [
    'ReorderGroup',
    () => (
      <V.ReorderGroup values={['a']} onReorder={() => {}}>
        <V.ReorderItem>a</V.ReorderItem>
      </V.ReorderGroup>
    ),
  ],
  ['SwipeStack', () => <V.SwipeStack items={[1, 2]} renderCard={(n) => <b>{n}</b>} />],
  ['ElasticSlider', () => <V.ElasticSlider label="v" />],
  ['BottomSheet', () => <V.BottomSheet open={false} onOpenChange={() => {}} />],
  ['InfiniteCanvas', () => <V.InfiniteCanvas items={[1]} renderItem={(n) => <b>{n}</b>} />],
  [
    'PhysicsWorld',
    () => (
      <V.PhysicsWorld>
        <span />
      </V.PhysicsWorld>
    ),
  ],
  ['ScrambleText', () => <V.ScrambleText>Hello</V.ScrambleText>],
  ['TextReveal', () => <V.TextReveal>Hello world</V.TextReveal>],
  ['ShimmerText', () => <V.ShimmerText>Hi</V.ShimmerText>],
  ['WeightWave', () => <V.WeightWave>Hi</V.WeightWave>],
  ['MorphText', () => <V.MorphText words={['a', 'b']} />],
  ['Counter', () => <V.Counter value={10} />],
  [
    'Reveal',
    () => (
      <V.Reveal stagger={50}>
        <p>x</p>
      </V.Reveal>
    ),
  ],
  ['Parallax', () => <V.Parallax>x</V.Parallax>],
  ['ScrollProgress', () => <V.ScrollProgress />],
  [
    'HorizontalScroll',
    () => (
      <V.HorizontalScroll>
        <div />
      </V.HorizontalScroll>
    ),
  ],
  [
    'StickyStack',
    () => (
      <V.StickyStack>
        <div />
      </V.StickyStack>
    ),
  ],
  ['SmoothScroll', () => <V.SmoothScroll />],
  ['Modal', () => <V.Modal open={false} onOpenChange={() => {}} />],
  [
    'Tooltip',
    () => (
      <V.Tooltip content="t">
        <button>b</button>
      </V.Tooltip>
    ),
  ],
  ['Popover', () => <V.Popover content="c">{(p) => <button {...p}>b</button>}</V.Popover>],
  ['Toaster', () => <V.Toaster />],
  ['Tabs', () => <V.Tabs items={[{ value: 'a', label: 'A', content: 'x' }]} />],
  ['Dock', () => <V.Dock items={[{ label: 'Home', icon: <i /> }]} />],
  ['Navbar', () => <V.Navbar brand="B" links={[{ label: 'L', href: '#' }]} />],
  ['Accordion', () => <V.Accordion items={[{ id: 'a', title: 'A', content: 'x' }]} />],
  ['Marquee', () => <V.Marquee>m</V.Marquee>],
  [
    'Carousel3D',
    () => (
      <V.Carousel3D>
        <div />
        <div />
        <div />
      </V.Carousel3D>
    ),
  ],
  ['ImageReveal', () => <V.ImageReveal src="x.png" alt="x" />],
  ['FluidBackground', () => <GL.FluidBackground />],
  ['MeshGradient', () => <GL.MeshGradient />],
  ['ParticleField', () => <GL.ParticleField />],
  ['LiquidMetal', () => <GL.LiquidMetal />],
  ['LensGrid', () => <GL.LensGrid />],
  ['Grain', () => <GL.Grain />],
  ['Select', () => <V.Select label="s" options={['a', 'b']} defaultValue="a" />],
  [
    'DropdownMenu',
    () => (
      <V.DropdownMenu items={[{ label: 'A' }]}>{(p) => <button {...p}>m</button>}</V.DropdownMenu>
    ),
  ],
];

describe('server rendering', () => {
  it('has no DOM globals in this environment', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof HTMLElement).toBe('undefined');
  });

  it.each(cases)('%s renders to a string', (_, make) => {
    expect(() => renderToString(make())).not.toThrow();
  });

  it('keeps text in the server HTML for text effects', () => {
    expect(renderToString(<V.TextReveal>Visible to crawlers</V.TextReveal>)).toContain(
      'Visible to crawlers',
    );
    expect(renderToString(<V.ScrambleText>Decoded</V.ScrambleText>)).toContain('Decoded');
  });

  it('escapes text rendered as opaque HTML', () => {
    const html = renderToString(<V.ScrambleText>{'<img src=x onerror=alert(1)>'}</V.ScrambleText>);
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });
});

describe('hydration', () => {
  it('Toaster renders nothing on the server (so the first client render matches)', () => {
    expect(renderToString(<V.Toaster />)).toBe('');
  });
});
