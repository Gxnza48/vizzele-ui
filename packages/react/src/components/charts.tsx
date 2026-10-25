import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Spring, springs } from '@vizzele/core';
import { cx, useMergedRef } from '../hooks/utils';
import { Counter } from './text';

// ——————————————————————————— Shared ———————————————————————————

export type ChartRow = Record<string, string | number | null | undefined>;

export interface ChartSeries {
  /** Key of the value in each data row. */
  key: string;
  /** Name shown in the legend, tooltip and table. Defaults to `key`. */
  label?: string;
  /** Any CSS color. Defaults to the next slot of the validated chart palette. */
  color?: string;
}

type Format = (value: number) => string;

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const full = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
const defaultFormat: Format = (v) => (Math.abs(v) >= 1000 ? compact.format(v) : full.format(v));

/**
 * Categorical colors are assigned in a fixed order and never cycled: the palette has five
 * colorblind-safe slots, and anything past them is the neutral "other" color.
 */
export const chartColor = (i: number) =>
  i < 5 ? `var(--vz-chart-${i + 1})` : 'var(--vz-chart-other)';

const seriesColor = (s: ChartSeries, i: number) => s.color ?? chartColor(i);
const seriesLabel = (s: ChartSeries) => s.label ?? s.key;
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** Rounds `x` up to 1, 2, 2.5 or 5 × a power of ten. */
function niceStep(x: number) {
  const exp = 10 ** Math.floor(Math.log10(x));
  const f = x / exp;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * exp;
}

function niceTicks(max: number, count = 4) {
  if (!(max > 0)) return [0, 1];
  const step = niceStep(max / count);
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(v);
  if (ticks[ticks.length - 1]! < max) ticks.push(ticks[ticks.length - 1]! + step);
  return ticks;
}

/** Measures the element's width; 0 on the server and before the first layout. */
function useWidth() {
  const ref = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * Springs between datasets. Values grow out of the baseline the first time the chart scrolls
 * into view, and every later change morphs from what is on screen — with a liquid overshoot.
 */
function useMorph(target: number[][]) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(() => target.map((r) => r.map(() => 0)));
  const from = useRef(shown);
  const to = useRef(target);
  const live = useRef(shown);
  const spring = useRef<Spring | null>(null);
  const [visible, setVisible] = useState(false);
  const key = JSON.stringify(target);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return setVisible(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    from.current = live.current;
    to.current = target;
    const s =
      spring.current ??
      (spring.current = new Spring({
        ...springs.liquid,
        onUpdate: (t) => {
          const next = to.current.map((row, i) =>
            row.map((v, j) => {
              const a = from.current[i]?.[j] ?? 0;
              return a + (v - a) * t;
            }),
          );
          live.current = next;
          setShown(next);
        },
      }));
    s.jump(0);
    s.set(1);
    // `key` captures the data; `target` itself is a new array every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, visible]);

  useEffect(() => () => void spring.current?.stop(), []);
  return [ref, shown] as const;
}

/** Arrow-key inspection shared by every chart: ←/→ (or ↑/↓) move, Home/End jump, Escape clears. */
function useInspect(count: number) {
  const [active, setActive] = useState<number | null>(null);
  const onKeyDown = (e: KeyboardEvent) => {
    if (!count) return;
    const cur = active ?? -1;
    const map: Record<string, number> = {
      ArrowRight: Math.min(count - 1, cur + 1),
      ArrowDown: Math.min(count - 1, cur + 1),
      ArrowLeft: Math.max(0, cur < 0 ? count - 1 : cur - 1),
      ArrowUp: Math.max(0, cur < 0 ? count - 1 : cur - 1),
      Home: 0,
      End: count - 1,
    };
    if (e.key === 'Escape') return setActive(null);
    if (e.key in map) {
      e.preventDefault();
      setActive(map[e.key]!);
    }
  };
  return { active, setActive, onKeyDown };
}

function Legend({ items, shape }: { items: ChartSeries[]; shape: 'line' | 'rect' }) {
  return (
    <ul className="vz-chart-legend">
      {items.map((s, i) => (
        <li key={s.key}>
          <span
            className={cx('vz-chart-key', shape === 'line' && 'is-line')}
            style={{ background: seriesColor(s, i) }}
            aria-hidden="true"
          />
          {seriesLabel(s)}
        </li>
      ))}
    </ul>
  );
}

interface TooltipRow {
  label: string;
  value: string;
  color: string;
}

function Tooltip({
  title,
  rows,
  x,
  width,
}: {
  title: ReactNode;
  rows: TooltipRow[];
  x: number;
  width: number;
}) {
  // Flip to the left of the crosshair past the middle so it never leaves the chart.
  const flip = x > width / 2;
  return (
    <div
      className="vz-chart-tooltip"
      style={{ left: x, transform: `translateX(${flip ? 'calc(-100% - 12px)' : '12px'})` }}
      aria-hidden="true"
    >
      <div className="vz-chart-tooltip-title">{title}</div>
      {rows.map((r) => (
        <div className="vz-chart-tooltip-row" key={r.label}>
          <span className="vz-chart-key is-line" style={{ background: r.color }} />
          <strong>{r.value}</strong>
          <span>{r.label}</span>
        </div>
      ))}
    </div>
  );
}

function DataTable({
  caption,
  head,
  rows,
}: {
  caption?: string | undefined;
  head: string[];
  rows: (string | number)[][];
}) {
  return (
    <table className="vz-sr-only">
      {caption && <caption>{caption}</caption>}
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h} scope="col">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) =>
              j === 0 ? (
                <th key={j} scope="row">
                  {c}
                </th>
              ) : (
                <td key={j}>{c}</td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Monotone cubic interpolation: smooth, but never overshoots the data. */
function monotonePath(pts: [number, number][]) {
  const n = pts.length;
  if (n < 2) return n ? `M${pts[0]![0]},${pts[0]![1]}` : '';
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1]![0] - pts[i]![0];
    m[i] = (pts[i + 1]![1] - pts[i]![1]) / (dx[i] || 1);
  }
  const t: number[] = [m[0]!];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1]! * m[i]! <= 0 ? 0 : (m[i - 1]! + m[i]!) / 2;
  t[n - 1] = m[n - 2]!;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i]! / m[i]!;
    const b = t[i + 1]! / m[i]!;
    const h = a * a + b * b;
    if (h > 9) {
      const k = 3 / Math.sqrt(h);
      t[i] = k * a * m[i]!;
      t[i + 1] = k * b * m[i]!;
    }
  }
  let d = `M${pts[0]![0]},${pts[0]![1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i]!;
    const [x1, y1] = pts[i + 1]!;
    const h = dx[i]! / 3;
    d += `C${x0 + h},${y0 + t[i]! * h} ${x1 - h},${y1 - t[i + 1]! * h} ${x1},${y1}`;
  }
  return d;
}

const linearPath = (pts: [number, number][]) =>
  pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join('');

/** A bar with 4px rounded data-end and a square base. */
function barPath(x: number, y: number, w: number, h: number) {
  if (h <= 0.01) return '';
  const r = Math.min(4, h, w / 2);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

const textWidth = (s: string) => s.length * 6.6 + 4;

interface CartesianBase extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** One object per x position. */
  data: ChartRow[];
  /** Key holding the x value (category or date label). */
  index: string;
  /** Up to five series in the palette's fixed order. */
  series: ChartSeries[];
  /** Plot height in px. Default 260. */
  height?: number;
  /** Accessible name of the chart; also the caption of its data table. */
  title?: string;
  valueFormatter?: Format;
  xFormatter?: (value: string | number) => string;
  /** Show the legend. Default: when there are two or more series. */
  legend?: boolean;
  /** Fix the top of the y scale (default: fits the data). */
  yMax?: number;
}

interface Layout {
  left: number;
  right: number;
  top: number;
  bottom: number;
  plotW: number;
  plotH: number;
  ticks: number[];
  y: (v: number) => number;
}

function useLayout(width: number, height: number, max: number, format: Format, rightPad: number) {
  return useMemo<Layout>(() => {
    const ticks = niceTicks(max);
    const top = 10;
    const bottom = 28;
    const left = Math.max(...ticks.map((t) => textWidth(format(t)))) + 10;
    const right = rightPad;
    const plotW = Math.max(0, width - left - right);
    const plotH = Math.max(0, height - top - bottom);
    const yMax = ticks[ticks.length - 1]!;
    return {
      left,
      right,
      top,
      bottom,
      plotW,
      plotH,
      ticks,
      y: (v: number) => top + plotH - (v / yMax) * plotH,
    };
  }, [width, height, max, format, rightPad]);
}

function Axes({
  layout,
  width,
  labels,
  xAt,
  format,
}: {
  layout: Layout;
  width: number;
  labels: string[];
  xAt: (i: number) => number;
  format: Format;
}) {
  const { ticks, y, left, plotW, top, plotH } = layout;
  // Thin the x labels until they stop colliding.
  const longest = Math.max(1, ...labels.map(textWidth));
  const slot = labels.length > 1 ? plotW / (labels.length - 1) : plotW;
  const every = Math.max(1, Math.ceil((longest + 12) / Math.max(slot, 1)));
  return (
    <g className="vz-chart-axes" aria-hidden="true">
      {ticks.map((t) => (
        <g key={t}>
          <line className="vz-chart-grid" x1={left} x2={width - layout.right} y1={y(t)} y2={y(t)} />
          <text x={left - 10} y={y(t)} dy="0.32em" textAnchor="end">
            {format(t)}
          </text>
        </g>
      ))}
      {labels.map((l, i) =>
        i % every === 0 ? (
          <text key={i} x={xAt(i)} y={top + plotH + 19} textAnchor="middle">
            {l}
          </text>
        ) : null,
      )}
    </g>
  );
}

// ——————————————————————————— Line & area ———————————————————————————

export interface LineChartProps extends CartesianBase {
  /** Fill a soft wash under each line. */
  area?: boolean;
  curve?: 'smooth' | 'linear';
  /** Value labels at the end of each line (skipped automatically when they would collide). */
  endLabels?: boolean;
}

/**
 * Lines that spring between datasets. A crosshair snaps to the nearest x and one tooltip
 * lists every series; the keyboard can inspect each point and a hidden table carries all values.
 */
export const LineChart = /* @__PURE__ */ forwardRef<HTMLElement, LineChartProps>(function LineChart(
  {
    data,
    index,
    series,
    height = 260,
    title,
    valueFormatter = defaultFormat,
    xFormatter = String,
    legend = series.length > 1,
    yMax,
    area = false,
    curve = 'smooth',
    endLabels = series.length <= 4,
    className,
    ...rest
  },
  ref,
) {
  const uid = useId().replace(/:/g, '');
  const [box, width] = useWidth();
  const target = useMemo(() => series.map((s) => data.map((r) => num(r[s.key]))), [data, series]);
  const [morphRef, values] = useMorph(target);
  const setRefs = useMergedRef(ref, box, morphRef);
  const labels = data.map((r) => xFormatter(r[index] ?? ''));
  const max = yMax ?? Math.max(0, ...target.flat());
  const lastValues = target.map((s) => s[s.length - 1] ?? 0);
  const rightPad = endLabels
    ? Math.max(...lastValues.map((v) => textWidth(valueFormatter(v)))) + 14
    : 12;
  const layout = useLayout(width, height, max, valueFormatter, rightPad);
  const { left, plotW, top, plotH, y } = layout;
  const n = data.length;
  const xAt = (i: number) => left + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2);
  const { active, setActive, onKeyDown } = useInspect(n);
  const path = curve === 'smooth' ? monotonePath : linearPath;
  const points = values.map((s) => s.map((v, i) => [xAt(i), y(v)] as [number, number]));

  // Direct end labels only when they sit at least 14px apart; otherwise legend + tooltip carry it.
  const ends = points.map((p) => p[p.length - 1]?.[1] ?? 0).sort((a, b) => a - b);
  const labelsFit = endLabels && ends.every((v, i) => i === 0 || v - ends[i - 1]! >= 14);

  const tooltipRows =
    active === null
      ? []
      : series.map((s, i) => ({
          label: seriesLabel(s),
          value: valueFormatter(target[i]?.[active] ?? 0),
          color: seriesColor(s, i),
        }));

  return (
    <figure ref={setRefs} className={cx('vz-chart', className)} {...rest}>
      {legend && <Legend items={series} shape="line" />}
      <div
        className="vz-chart-plot"
        style={{ height }}
        tabIndex={0}
        role="group"
        aria-label={`${title ?? 'Line chart'}. Use the arrow keys to read each point.`}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const i = Math.round(((e.clientX - r.left - left) / Math.max(plotW, 1)) * (n - 1));
          setActive(Math.min(n - 1, Math.max(0, i)));
        }}
        onPointerLeave={() => setActive(null)}
      >
        {width > 0 && (
          <svg width={width} height={height} aria-hidden="true">
            <defs>
              {series.map((s, i) => (
                <linearGradient key={s.key} id={`${uid}-a${i}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor={seriesColor(s, i)} stopOpacity="0.2" />
                  <stop offset="1" stopColor={seriesColor(s, i)} stopOpacity="0" />
                </linearGradient>
              ))}
            </defs>
            <Axes layout={layout} width={width} labels={labels} xAt={xAt} format={valueFormatter} />
            {active !== null && (
              <line
                className="vz-chart-crosshair"
                x1={xAt(active)}
                x2={xAt(active)}
                y1={top}
                y2={top + plotH}
              />
            )}
            {points.map((p, i) => {
              const s = series[i]!;
              const d = path(p);
              return (
                <g key={s.key} style={{ color: seriesColor(s, i) } as CSSProperties}>
                  {area && p.length > 1 && (
                    <path
                      className="vz-chart-area"
                      d={`${d}L${p[p.length - 1]![0]},${top + plotH}L${p[0]![0]},${top + plotH}Z`}
                      fill={`url(#${uid}-a${i})`}
                    />
                  )}
                  <path className="vz-chart-line" d={d} />
                  {active === null && p.length > 0 && (
                    <circle
                      className="vz-chart-dot"
                      cx={p[p.length - 1]![0]}
                      cy={p[p.length - 1]![1]}
                      r={4}
                    />
                  )}
                  {active !== null && p[active] && (
                    <circle
                      className="vz-chart-dot is-active"
                      cx={p[active]![0]}
                      cy={p[active]![1]}
                      r={5}
                    />
                  )}
                  {labelsFit && p.length > 0 && (
                    <text
                      className="vz-chart-value"
                      x={p[p.length - 1]![0] + 10}
                      y={p[p.length - 1]![1]}
                      dy="0.32em"
                    >
                      {valueFormatter(target[i]![target[i]!.length - 1] ?? 0)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
        {active !== null && width > 0 && (
          <Tooltip title={labels[active]} rows={tooltipRows} x={xAt(active)} width={width} />
        )}
      </div>
      <span className="vz-sr-only" aria-live="polite">
        {active !== null
          ? `${labels[active]}: ${tooltipRows.map((r) => `${r.label} ${r.value}`).join(', ')}`
          : ''}
      </span>
      <DataTable
        caption={title}
        head={[index, ...series.map(seriesLabel)]}
        rows={data.map((r, i) => [labels[i]!, ...series.map((s) => valueFormatter(num(r[s.key])))])}
      />
    </figure>
  );
});

/** A `LineChart` with a wash under each line. */
export const AreaChart = /* @__PURE__ */ forwardRef<HTMLElement, LineChartProps>(
  function AreaChart(props, ref) {
    return <LineChart ref={ref} area {...props} />;
  },
);

// ——————————————————————————— Bars ———————————————————————————

export interface BarChartProps extends CartesianBase {
  /** Stack the series instead of grouping them side by side. */
  stacked?: boolean;
  /** Value on each column cap (single series only, when there is room). Default true. */
  valueLabels?: boolean;
}

/**
 * Columns that grow out of the baseline on a spring and morph when the data changes.
 * Each category is a hit target the width of its band; hover or arrow keys show its values.
 */
export const BarChart = /* @__PURE__ */ forwardRef<HTMLElement, BarChartProps>(function BarChart(
  {
    data,
    index,
    series,
    height = 260,
    title,
    valueFormatter = defaultFormat,
    xFormatter = String,
    legend = series.length > 1,
    yMax,
    stacked = false,
    valueLabels = true,
    className,
    ...rest
  },
  ref,
) {
  const [box, width] = useWidth();
  const target = useMemo(() => series.map((s) => data.map((r) => num(r[s.key]))), [data, series]);
  const [morphRef, values] = useMorph(target);
  const setRefs = useMergedRef(ref, box, morphRef);
  const labels = data.map((r) => xFormatter(r[index] ?? ''));
  const n = data.length;
  const totals = data.map((_, j) => target.reduce((a, s) => a + (s[j] ?? 0), 0));
  const max = yMax ?? Math.max(0, ...(stacked ? totals : target.flat()));
  const layout = useLayout(width, height, max, valueFormatter, 8);
  const { left, plotW, top, plotH, y } = layout;
  const band = n ? plotW / n : 0;
  const xAt = (i: number) => left + band * (i + 0.5);
  const { active, setActive, onKeyDown } = useInspect(n);
  const k = series.length;
  const gap = 2;
  const barW = stacked
    ? Math.min(24, band * 0.6)
    : Math.min(24, Math.max(2, (band * 0.72 - gap * (k - 1)) / Math.max(k, 1)));
  const groupW = stacked ? barW : barW * k + gap * (k - 1);
  const base = top + plotH;
  const showValues = valueLabels && k === 1 && !stacked && band >= 34;

  const tooltipRows =
    active === null
      ? []
      : series.map((s, i) => ({
          label: seriesLabel(s),
          value: valueFormatter(target[i]?.[active] ?? 0),
          color: seriesColor(s, i),
        }));

  return (
    <figure ref={setRefs} className={cx('vz-chart', className)} {...rest}>
      {legend && <Legend items={series} shape="rect" />}
      <div
        className="vz-chart-plot"
        style={{ height }}
        tabIndex={0}
        role="group"
        aria-label={`${title ?? 'Bar chart'}. Use the arrow keys to read each bar.`}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const i = Math.floor((e.clientX - r.left - left) / Math.max(band, 1));
          setActive(i >= 0 && i < n ? i : null);
        }}
        onPointerLeave={() => setActive(null)}
        data-active={active !== null ? '' : undefined}
      >
        {width > 0 && (
          <svg width={width} height={height} aria-hidden="true">
            {active !== null && (
              <rect
                className="vz-chart-band"
                x={left + band * active + 2}
                y={top}
                width={Math.max(0, band - 4)}
                height={plotH}
                rx={8}
              />
            )}
            <Axes layout={layout} width={width} labels={labels} xAt={xAt} format={valueFormatter} />
            {data.map((_, j) => {
              const x0 = xAt(j) - groupW / 2;
              let stackTop = base;
              return (
                <g key={j} className={cx('vz-chart-bars', active === j && 'is-active')}>
                  {series.map((s, i) => {
                    const v = Math.max(0, values[i]?.[j] ?? 0);
                    const h = base - y(v);
                    let d: string;
                    if (stacked) {
                      // 2px surface gap between stacked segments; only the top one is rounded.
                      const isTop = series.slice(i + 1).every((o) => num(data[j]?.[o.key]) <= 0);
                      const y1 = stackTop - h;
                      const segH = Math.max(0, h - (i > 0 && h > 0 ? gap : 0));
                      d = isTop
                        ? barPath(x0, y1, barW, segH)
                        : `M${x0},${y1}h${barW}v${segH}h${-barW}Z`;
                      stackTop = y1;
                    } else {
                      d = barPath(x0 + i * (barW + gap), base - h, barW, h);
                    }
                    return d ? (
                      <path key={s.key} className="vz-chart-bar" d={d} fill={seriesColor(s, i)} />
                    ) : null;
                  })}
                  {showValues && (
                    <text
                      className="vz-chart-value"
                      x={xAt(j)}
                      y={y(values[0]?.[j] ?? 0) - 8}
                      textAnchor="middle"
                    >
                      {valueFormatter(target[0]?.[j] ?? 0)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
        {active !== null && width > 0 && (
          <Tooltip
            title={labels[active]}
            rows={stacked ? [...tooltipRows].reverse() : tooltipRows}
            x={xAt(active) + (xAt(active) > width / 2 ? -groupW / 2 : groupW / 2)}
            width={width}
          />
        )}
      </div>
      <span className="vz-sr-only" aria-live="polite">
        {active !== null
          ? `${labels[active]}: ${tooltipRows.map((r) => `${r.label} ${r.value}`).join(', ')}`
          : ''}
      </span>
      <DataTable
        caption={title}
        head={[index, ...series.map(seriesLabel)]}
        rows={data.map((r, i) => [labels[i]!, ...series.map((s) => valueFormatter(num(r[s.key])))])}
      />
    </figure>
  );
});

// ——————————————————————————— Donut ———————————————————————————

export interface DonutSlice {
  label: string;
  value: number;
  color?: string;
}

export interface DonutChartProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Parts of a whole — keep it to five; fold the rest into "Other". */
  data: DonutSlice[];
  title?: string;
  /** Diameter in px. Default 220. */
  size?: number;
  /** Ring thickness in px. Default 22. */
  thickness?: number;
  valueFormatter?: Format;
  /** Caption under the center figure. Default "Total". */
  centerLabel?: string;
  /** Show the legend with values and shares. Default true. */
  legend?: boolean;
}

function arc(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const p = (r: number, a: number) => `${cx + r * Math.sin(a)},${cy - r * Math.cos(a)}`;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${p(r1, a0)}A${r1},${r1} 0 ${large} 1 ${p(r1, a1)}L${p(r0, a1)}A${r0},${r0} 0 ${large} 0 ${p(r0, a0)}Z`;
}

/**
 * Part-to-whole in a ring that sweeps in on a spring. Hovering a slice (or its legend row, or
 * arrowing through them) lifts it out and puts its value in the center.
 */
export const DonutChart = /* @__PURE__ */ forwardRef<HTMLElement, DonutChartProps>(
  function DonutChart(
    {
      data,
      title,
      size = 220,
      thickness = 22,
      valueFormatter = defaultFormat,
      centerLabel = 'Total',
      legend = true,
      className,
      ...rest
    },
    ref,
  ) {
    const target = useMemo(() => [data.map((d) => Math.max(0, d.value))], [data]);
    const [morphRef, values] = useMorph(target);
    const setRefs = useMergedRef(ref, morphRef);
    const { active, setActive, onKeyDown } = useInspect(data.length);
    const shown = values[0] ?? [];
    const total = data.reduce((a, d) => a + Math.max(0, d.value), 0);
    const shownTotal = shown.reduce((a, v) => a + v, 0);
    const r1 = size / 2 - 6;
    const r0 = r1 - thickness;
    // Angle gap that leaves 2px of surface between slices at the outer edge.
    const gapA = 2 / r1;
    // Grow the sweep with the morph progress (shown total vs real total).
    const sweep = total > 0 ? Math.min(1, shownTotal / total) * Math.PI * 2 : 0;
    let a = 0;
    const pct = (v: number) => (total > 0 ? `${Math.round((v / total) * 100)}%` : '0%');
    const color = (d: DonutSlice, i: number) => d.color ?? chartColor(i);
    const current = active !== null ? data[active] : undefined;

    return (
      <figure ref={setRefs} className={cx('vz-chart vz-donut', className)} {...rest}>
        <div
          className="vz-donut-ring"
          style={{ width: size, height: size }}
          tabIndex={0}
          role="group"
          aria-label={`${title ?? 'Donut chart'}. Use the arrow keys to read each slice.`}
          onKeyDown={onKeyDown}
          onBlur={() => setActive(null)}
          data-active={active !== null ? '' : undefined}
        >
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
            <circle
              className="vz-donut-track"
              cx={size / 2}
              cy={size / 2}
              r={(r0 + r1) / 2}
              strokeWidth={thickness}
            />
            {data.map((d, i) => {
              const v = shown[i] ?? 0;
              const span = shownTotal > 0 ? (v / shownTotal) * sweep : 0;
              const a0 = a;
              a += span;
              if (span <= gapA) return null;
              const mid = a0 + span / 2;
              const lift = active === i ? 6 : 0;
              return (
                <path
                  key={d.label}
                  className={cx('vz-donut-slice', active === i && 'is-active')}
                  d={arc(size / 2, size / 2, r0, r1, a0 + gapA / 2, a0 + span - gapA / 2)}
                  fill={color(d, i)}
                  style={{
                    transform: `translate(${Math.sin(mid) * lift}px, ${-Math.cos(mid) * lift}px)`,
                  }}
                  onPointerEnter={() => setActive(i)}
                  onPointerLeave={() => setActive(null)}
                />
              );
            })}
          </svg>
          <div className="vz-donut-center" aria-hidden="true">
            <strong>{current ? valueFormatter(current.value) : valueFormatter(total)}</strong>
            <span>{current ? `${current.label} · ${pct(current.value)}` : centerLabel}</span>
          </div>
        </div>
        {legend && (
          <ul className="vz-donut-legend">
            {data.map((d, i) => (
              <li
                key={d.label}
                className={cx(active === i && 'is-active')}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
              >
                <span
                  className="vz-chart-key"
                  style={{ background: color(d, i) }}
                  aria-hidden="true"
                />
                <span className="vz-donut-legend-label">{d.label}</span>
                <strong>{valueFormatter(d.value)}</strong>
                <span className="vz-donut-legend-pct">{pct(d.value)}</span>
              </li>
            ))}
          </ul>
        )}
        <span className="vz-sr-only" aria-live="polite">
          {current
            ? `${current.label}: ${valueFormatter(current.value)}, ${pct(current.value)}`
            : ''}
        </span>
        <DataTable
          caption={title}
          head={['Slice', 'Value', 'Share']}
          rows={data.map((d) => [d.label, valueFormatter(d.value), pct(d.value)])}
        />
      </figure>
    );
  },
);

// ——————————————————————————— Sparkline & stat ———————————————————————————

export interface SparklineProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  data: number[];
  /** Height in px. Default 36. The width fills the container. */
  height?: number;
  color?: string | undefined;
  /** Wash under the line. Default true. */
  area?: boolean;
  /** Accessible description, e.g. "Revenue, last 12 weeks". */
  label?: string;
}

/** A tiny trend line with an end dot — no axes, all signal. */
export const Sparkline = /* @__PURE__ */ forwardRef<HTMLDivElement, SparklineProps>(
  function Sparkline(
    {
      data,
      height = 36,
      color = 'var(--vz-chart-1)',
      area = true,
      label,
      className,
      style,
      ...rest
    },
    ref,
  ) {
    const uid = useId().replace(/:/g, '');
    const [box, width] = useWidth();
    const target = useMemo(() => [data], [data]);
    const [morphRef, values] = useMorph(target);
    const setRefs = useMergedRef(ref, box, morphRef);
    const shown = values[0] ?? [];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const pad = 5;
    const pts = shown.map(
      (v, i) =>
        [
          pad + (shown.length > 1 ? (i / (shown.length - 1)) * (width - pad * 2) : 0),
          pad + (height - pad * 2) * (1 - (max > min ? (v - min) / (max - min) : 0.5)),
        ] as [number, number],
    );
    const d = monotonePath(pts);
    const last = pts[pts.length - 1];
    const trend = data.length > 1 ? data[data.length - 1]! - data[0]! : 0;
    return (
      <div
        ref={setRefs}
        className={cx('vz-sparkline', className)}
        style={{ height, color, ...style }}
        role="img"
        aria-label={
          label ??
          `Trend ${trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat'}, from ${data[0] ?? 0} to ${data[data.length - 1] ?? 0}`
        }
        {...rest}
      >
        {width > 0 && pts.length > 1 && (
          <svg width={width} height={height} aria-hidden="true">
            <defs>
              <linearGradient id={`${uid}-s`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="currentColor" stopOpacity="0.22" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            {area && (
              <path
                d={`${d}L${last![0]},${height}L${pts[0]![0]},${height}Z`}
                fill={`url(#${uid}-s)`}
              />
            )}
            <path className="vz-chart-line" d={d} />
            <circle className="vz-chart-dot" cx={last![0]} cy={last![1]} r={3.5} />
          </svg>
        )}
      </div>
    );
  },
);

export interface StatCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Sentence-case label, no trailing colon. */
  label: string;
  /** A number counts up on a spring; anything else renders as is. */
  value: number | ReactNode;
  prefix?: string;
  suffix?: string;
  /** Change in percent, e.g. 12.4 or -3. */
  delta?: number;
  /** What the delta compares against. Default "vs last period". */
  deltaLabel?: string;
  /** Set false when going down is the good direction (latency, churn…). */
  upIsGood?: boolean;
  /** Recent values for a sparkline. */
  trend?: number[];
  trendColor?: string;
}

/** A metric: label, a number that counts up, a signed delta with an arrow and an optional trend. */
export const StatCard = /* @__PURE__ */ forwardRef<HTMLDivElement, StatCardProps>(function StatCard(
  {
    label,
    value,
    prefix,
    suffix,
    delta,
    deltaLabel = 'vs last period',
    upIsGood = true,
    trend,
    trendColor,
    className,
    ...rest
  },
  ref,
) {
  const tone =
    delta === undefined || delta === 0 ? 'flat' : delta > 0 === upIsGood ? 'good' : 'bad';
  const decimals = typeof value === 'number' && !Number.isInteger(value) ? 1 : 0;
  return (
    <div ref={ref} className={cx('vz-stat', className)} {...rest}>
      <div className="vz-stat-label">{label}</div>
      <div className="vz-stat-value">
        {typeof value === 'number' ? (
          <Counter
            value={value}
            decimals={decimals}
            {...(prefix !== undefined && { prefix })}
            {...(suffix !== undefined && { suffix })}
          />
        ) : (
          <>
            {prefix}
            {value}
            {suffix}
          </>
        )}
      </div>
      {delta !== undefined && (
        <div className="vz-stat-delta" data-tone={tone}>
          <span className="vz-stat-arrow" aria-hidden="true">
            {delta > 0 ? '↑' : delta < 0 ? '↓' : '→'}
          </span>
          <strong>
            {delta > 0 ? '+' : ''}
            {delta}%
          </strong>
          <span>{deltaLabel}</span>
        </div>
      )}
      {trend && trend.length > 1 && (
        <Sparkline
          className="vz-stat-trend"
          data={trend}
          color={trendColor}
          label={`${label} trend`}
        />
      )}
    </div>
  );
});
