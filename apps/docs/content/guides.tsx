import type { ComponentType } from 'react';
import { Code } from '@/components/Code';
import { SpringLab } from '@/components/SpringLab';

function Installation() {
  return (
    <div className="prose">
      <h2>React / Next.js</h2>
      <Code lang="bash" code={`pnpm add @vizzele/react @vizzele/css`} />
      <p>
        Import the stylesheet once (e.g. in your root layout) and add the <code>vz-body</code> class
        to <code>&lt;body&gt;</code> to get the page canvas, typography and focus styles.
      </p>
      <Code
        code={`// app/layout.tsx
import '@vizzele/css';

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <body className="vz-body">{children}</body>
    </html>
  );
}`}
      />
      <p>
        Components are client components (they ship with <code>&apos;use client&apos;</code>), so
        they work inside Server Components without wrappers. Nothing touches <code>window</code> at
        import time — SSR is safe.
      </p>

      <h2>Fonts</h2>
      <p>
        The tokens reference <strong>Bricolage Grotesque</strong> (display, variable weight / width
        / optical size), <strong>Geist</strong> (UI) and <strong>Geist Mono</strong>. Install them
        from Fontsource — or override <code>--vz-font-display</code> / <code>--vz-font-sans</code>{' '}
        with your own.
      </p>
      <Code
        lang="bash"
        code={`pnpm add @fontsource-variable/bricolage-grotesque @fontsource-variable/geist @fontsource-variable/geist-mono`}
      />

      <h2>Vanilla JS</h2>
      <Code
        lang="ts"
        code={`import '@vizzele/css';
import { magnetic, draggable, Spring } from '@vizzele/core';

magnetic(document.querySelector('.cta')!, { strength: 0.4 });
draggable(document.querySelector('.card')!, { bounds: 'parent' });`}
      />

      <h2>No build step: data-vz-* attributes</h2>
      <p>
        Drop in the CDN build and describe effects in HTML. Elements added later are picked up
        automatically.
      </p>
      <Code
        lang="html"
        code={`<link rel="stylesheet" href="https://unpkg.com/@vizzele/css/dist/vizzele.min.css" />
<script src="https://unpkg.com/@vizzele/core/dist/vizzele.global.js" defer></script>

<button class="vz-button" data-variant="liquid" data-vz-magnetic="strength: 0.4">Hover</button>
<div class="vz-card vz-holo" data-vz-tilt="max: 14">Holographic</div>
<div class="vz-card" data-vz-drag="bounds: parent; elastic: 0.4">Throw me</div>`}
      />
      <p>
        Options are written like CSS (<code>key: value; key: value</code>) or as JSON. The global
        build also exposes <code>window.vizzele</code> with the full imperative API.
      </p>
    </div>
  );
}

function Theming() {
  return (
    <div className="prose">
      <p>
        Every visual decision in Vizzele is a CSS custom property. Themes are just different values
        for the same variables, so creating your own is a matter of overriding them.
      </p>
      <h2>Switching themes</h2>
      <Code
        lang="html"
        code={`<html data-theme="dark">   <!-- deep space (default) -->
<html data-theme="light">  <!-- pearl paper -->
<html data-theme="auto">   <!-- follows the OS -->`}
      />
      <h2>Make your own</h2>
      <Code
        lang="css"
        code={`[data-theme='ember'] {
  --vz-bg: #0d0806;
  --vz-text: #fff3ea;
  --vz-accent: #ff7a2f;
  /* the iridescent spectrum */
  --vz-cyan: #ffb238;
  --vz-magenta: #ff3d6e;
  --vz-amber: #ffd84d;
  --vz-acid: #ff9a5a;
  --vz-radius-lg: 12px;
}`}
      />
      <h2>Token reference</h2>
      <ul>
        <li>
          <strong>Spectrum</strong>: <code>--vz-cyan</code>, <code>--vz-magenta</code>,{' '}
          <code>--vz-amber</code>, <code>--vz-acid</code> and the gradients built from them:{' '}
          <code>--vz-iridescent</code> (conic, rotates with <code>--vz-angle</code>),{' '}
          <code>--vz-iridescent-linear</code>, <code>--vz-iridescent-film</code>.
        </li>
        <li>
          <strong>Surfaces</strong>: <code>--vz-bg</code>, <code>--vz-bg-elevated</code>,{' '}
          <code>--vz-bg-sunken</code>, <code>--vz-surface(-hover|-strong)</code>,{' '}
          <code>--vz-border(-strong)</code>, <code>--vz-glass-tint</code>.
        </li>
        <li>
          <strong>Text</strong>: <code>--vz-text</code>, <code>--vz-text-muted</code>,{' '}
          <code>--vz-text-dim</code>, <code>--vz-accent-text</code>.
        </li>
        <li>
          <strong>Light</strong>: <code>--vz-shadow</code>, <code>--vz-glow</code>,{' '}
          <code>--vz-ambient</code>.
        </li>
        <li>
          <strong>Motion</strong>: <code>--vz-spring-&lt;preset&gt;</code> and{' '}
          <code>--vz-spring-&lt;preset&gt;-duration</code> (CSS <code>linear()</code> easings
          generated from the real spring physics), <code>--vz-duration-*</code>.
        </li>
        <li>
          <strong>Shape &amp; depth</strong>: <code>--vz-radius-*</code>, <code>--vz-blur-*</code>,{' '}
          <code>--vz-z-*</code>, <code>--vz-grain-opacity</code>.
        </li>
      </ul>
      <h2>Springs from CSS</h2>
      <Code
        lang="css"
        code={`.drawer {
  transition: transform var(--vz-spring-jelly-duration) var(--vz-spring-jelly);
}`}
      />
    </div>
  );
}

function Springs() {
  return (
    <div className="prose">
      <p>
        Vizzele doesn&apos;t use durations and easing curves for motion. It uses{' '}
        <strong>springs</strong>: a mass pulled toward a target by a spring and slowed by friction.
        You never tell it <em>how long</em> to take — you tell it <em>how it feels</em>, and the
        time falls out of the physics. Interrupt a spring halfway and it keeps its velocity, which
        is why everything feels continuous.
      </p>
      <SpringLab />
      <h2>The three knobs</h2>
      <ul>
        <li>
          <strong>Stiffness</strong> — how hard the spring pulls. Higher = faster and snappier.
        </li>
        <li>
          <strong>Damping</strong> — friction. Low damping wobbles; high damping glides in without
          overshoot.
        </li>
        <li>
          <strong>Mass</strong> — weight. Heavier objects take longer to get going and overshoot
          more.
        </li>
      </ul>
      <h2>Exact at any frame rate</h2>
      <p>
        Most libraries integrate springs step by step, so a dropped frame changes the motion.
        Vizzele solves the damped-oscillator equation in closed form: position and velocity are
        computed exactly for whatever time has passed. 30 fps, 60 fps or 144 fps — the curve is the
        same.
      </p>
      <Code
        lang="ts"
        code={`import { Spring, springs } from '@vizzele/core';

const x = new Spring({ ...springs.jelly, onUpdate: (v) => (el.style.translate = \`\${v}px\`) });
x.set(240);                       // animate
x.set(0, { velocity: -3000 });    // retarget mid-flight, with a kick`}
      />
      <h2>Inertia</h2>
      <p>
        When you release a dragged element, its velocity becomes an exponential glide — the same
        model as momentum scrolling. If it would cross a boundary, the glide hands over to a spring
        that bounces it back. Snap points bend the glide so it lands exactly on a point.
      </p>
    </div>
  );
}

function ReducedMotion() {
  return (
    <div className="prose">
      <p>
        Some people get dizzy or sick from motion on screen. When the OS setting{' '}
        <code>prefers-reduced-motion: reduce</code> is on, Vizzele keeps every interface usable and
        beautiful — it just stops moving things around.
      </p>
      <ul>
        <li>Springs jump straight to their target. Inertia lands immediately.</li>
        <li>Magnetic, tilt, cursor, particle trail and parallax switch off.</li>
        <li>Reveals show content immediately; nothing is ever left hidden.</li>
        <li>WebGL backgrounds render a single still frame.</li>
        <li>
          CSS utilities only animate inside{' '}
          <code>@media (prefers-reduced-motion: no-preference)</code>.
        </li>
        <li>Dragging still works — it&apos;s user-driven — but without throwing or bouncing.</li>
      </ul>
      <h2>Your own toggle</h2>
      <Code
        lang="ts"
        code={`import { setReducedMotion } from '@vizzele/core';

setReducedMotion('always'); // or 'never' | 'system'`}
      />
      <Code
        code={`import { useReducedMotion } from '@vizzele/react';

const reduced = useReducedMotion();`}
      />
    </div>
  );
}

export const guideContent: Record<string, ComponentType> = {
  installation: Installation,
  theming: Theming,
  springs: Springs,
  'reduced-motion': ReducedMotion,
};
