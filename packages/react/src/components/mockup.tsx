import {
  forwardRef,
  useMemo,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import {
  mockup,
  mockupStage,
  mockupTree,
  type MockupDevice,
  type MockupNode,
  type MockupOptions,
} from '@vizzele/core';
import { useVizzeleEffect } from '../hooks/effects';
import { cx, useMergedRef } from '../hooks/utils';
import { _strip as strip } from './pointer';

function render(n: MockupNode, key: number, children: ReactNode): ReactNode {
  return (
    <div
      key={key}
      className={n.c}
      style={n.s as CSSProperties | undefined}
      aria-hidden={n.a || undefined}
      dangerouslySetInnerHTML={n.h ? { __html: n.h } : undefined}
    >
      {n.h ? undefined : (n.t ?? (n.slot ? children : n.k?.map((c, i) => render(c, i, children))))}
    </div>
  );
}

interface BaseMockupProps extends HTMLAttributes<HTMLDivElement>, MockupOptions {
  /** Rendered width, e.g. 320 or "100%". The device scales to fit. */
  width?: number | string;
  /** Finish of the frame and back. */
  finish?: string;
  /** Screen content: an image, a video, or a live React tree. */
  children?: ReactNode;
}

const Mockup = /* @__PURE__ */ forwardRef<
  HTMLDivElement,
  BaseMockupProps & {
    device: MockupDevice;
    statusBar?: boolean;
    statusBarTone?: 'light' | 'dark';
    time?: string;
  }
>(function Mockup(
  {
    device,
    finish,
    width,
    rotate,
    tilt,
    drag,
    float,
    open,
    statusBar,
    statusBarTone = 'light',
    time,
    className,
    style,
    children,
    ...rest
  },
  ref,
) {
  const own = useVizzeleEffect<MockupOptions, HTMLDivElement>(
    mockup,
    strip({ rotate, tilt, drag, float, open } as MockupOptions),
  );
  const tree = useMemo(
    () =>
      mockupTree(device, {
        ...(statusBar === false ? { statusBar } : {}),
        ...(time ? { time } : {}),
      }),
    [device, statusBar, time],
  );
  const stage = mockupStage(device);
  return (
    <div
      ref={useMergedRef(ref, own)}
      className={cx('vz-mockup', className)}
      data-vz-device={device}
      data-vz-finish={finish}
      data-vz-tone={statusBarTone}
      style={
        {
          width,
          aspectRatio: `${stage.w} / ${stage.h}`,
          // Server render at the right size before the effect measures the real width.
          ...(typeof width === 'number' ? { '--vz-m-scale': width / stage.w } : {}),
          ...style,
        } as CSSProperties
      }
      {...rest}
    >
      {tree.map((n, i) => render(n, i, children))}
    </div>
  );
});

export interface PhoneMockupProps extends BaseMockupProps {
  /** `iphone` = Dynamic-Island style with a titanium frame; `galaxy` = punch-hole with flat edges. */
  model?: 'iphone' | 'galaxy';
  /** iPhone style: natural · black · white · blue. Galaxy style: black · gray · violet · cream. */
  finish?: string;
  /** Show the status bar (time, signal, battery). Default true. */
  statusBar?: boolean;
  /** `light` = white status bar text (dark apps), `dark` = black text. Default `light`. */
  statusBarTone?: 'light' | 'dark';
  /** Clock in the status bar. */
  time?: string;
}

/**
 * A 3D phone you can put anything in: the screen is real DOM at the phone's CSS resolution
 * (≈394×836), so a live, clickable demo of your app works inside it. Turns toward the pointer,
 * spins when you drag the frame, floats. Pure CSS 3D — no WebGL, nothing to download.
 */
export const PhoneMockup = /* @__PURE__ */ forwardRef<HTMLDivElement, PhoneMockupProps>(
  function PhoneMockup({ model = 'iphone', ...rest }, ref) {
    return <Mockup ref={ref} device={model} {...rest} />;
  },
);

export interface LaptopMockupProps extends BaseMockupProps {
  /** silver · space · midnight. */
  finish?: string;
}

/**
 * A 3D laptop whose lid opens when it scrolls into view. The screen is real DOM at 1280×800,
 * so a live site or dashboard fits inside. Pure CSS 3D — keyboard, trackpad and all.
 */
export const LaptopMockup = /* @__PURE__ */ forwardRef<HTMLDivElement, LaptopMockupProps>(
  function LaptopMockup(props, ref) {
    return <Mockup ref={ref} device="laptop" {...props} />;
  },
);
