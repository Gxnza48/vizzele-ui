import type { DocEntry } from '@/lib/types';

/** The pieces added in 0.7: sign-in, and small moments of delight. */
export const delightEntries: DocEntry[] = [
  {
    slug: 'auth-panel',
    title: 'Auth panel',
    category: 'Components',
    description:
      'A sign-in and sign-up card made of liquid glass: a mode switch that stretches like a drop, Continue with Google, a password eye that watches you, a strength tube that fills as you type, and a button that melts into a spinner, then a check — with confetti.',
    keywords: ['login', 'sign in', 'sign up', 'register', 'google', 'oauth', 'form', 'password'],
    isNew: true,
    height: 760,
    controls: [
      { type: 'select', name: 'mode', options: ['sign-in', 'sign-up'], default: 'sign-in' },
      { type: 'boolean', name: 'github', label: 'GitHub too', default: false },
      { type: 'boolean', name: 'fail', label: 'Server says no', default: false },
    ],
    code: {
      react: `import { AuthPanel } from '@vizzele/react';

<AuthPanel
  brand={<Logo />}
  providers={['google']}
  onProvider={(id) => signIn(id)}
  onSubmit={async ({ mode, email, password, name }) => {
    const res = await fetch(\`/api/\${mode}\`, {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    // Throw to show the message and shake the card.
    if (!res.ok) throw new Error('Wrong email or password');
  }}
  onForgot={() => router.push('/forgot')}
  footer={<>By continuing you agree to our <a href="/terms">Terms</a>.</>}
/>`,
    },
    props: [
      {
        name: 'onSubmit',
        type: '({ mode, email, password, name? }) => void | Promise',
        description:
          'Resolve for the success state (check + confetti); reject with an Error to show its message.',
      },
      {
        name: 'providers',
        type: "('google' | 'github' | { id, label, icon })[]",
        default: "['google']",
        description: 'Social buttons. Pass [] to hide them.',
      },
      {
        name: 'onProvider',
        type: '(id) => void | Promise',
        description: 'Return a promise to spin the provider icon until it settles.',
      },
      {
        name: 'mode / defaultMode / onModeChange',
        type: "'sign-in' | 'sign-up'",
        default: "'sign-in'",
        description: 'Controlled or not.',
      },
      { name: 'brand', type: 'ReactNode', description: 'Your logo above the title.' },
      { name: 'title', type: '{ signIn?, signUp? }', description: 'Headings for each mode.' },
      {
        name: 'nameField',
        type: 'boolean',
        default: 'true',
        description: 'Ask for a name on sign-up.',
      },
      {
        name: 'minLength',
        type: 'number',
        default: '8',
        description: 'Minimum password length on sign-up.',
      },
      { name: 'onForgot', type: '() => void', description: 'Shows "Forgot password?" on sign-in.' },
      { name: 'celebrate', type: 'boolean', default: 'true', description: 'Confetti on success.' },
      { name: 'footer', type: 'ReactNode', description: 'Small print under the form.' },
    ],
    a11y: [
      'A real form labelled by its heading; Enter submits, the browser can autofill email and password (autocomplete is set per mode).',
      'Invalid fields get aria-invalid and a message tied with aria-describedby, and focus moves to the first one.',
      'Progress, errors and success are read out from one role="status" line; the busy button has aria-busy.',
      'The mode switch is two toggle buttons with aria-pressed. The hidden name field is disabled, so it is out of the tab order.',
      'With reduced motion the aura, rim and confetti stay still; the spinner keeps turning because it carries meaning.',
    ],
  },
  {
    slug: 'password-input',
    title: 'Password input',
    category: 'Components',
    description:
      'A password field whose show/hide button is a living eye: open, it follows your pointer and blinks now and then; hidden, it shuts with its lashes down. Warns when Caps Lock is on, and can carry the strength meter.',
    keywords: ['password', 'show password', 'eye', 'caps lock', 'field', 'input'],
    isNew: true,
    height: 360,
    controls: [{ type: 'boolean', name: 'meter', label: 'Strength meter', default: true }],
    code: {
      react: `import { PasswordInput } from '@vizzele/react';

<PasswordInput
  name="password"
  autoComplete="new-password"
  meter
  minLength={10}
/>`,
    },
    props: [
      { name: 'label', type: 'string', default: "'Password'", description: 'Floating label.' },
      {
        name: 'meter',
        type: 'boolean',
        default: 'false',
        description: 'Show the strength tube and rules.',
      },
      {
        name: 'minLength',
        type: 'number',
        description: 'Used by the meter (default 8) and the input.',
      },
      {
        name: 'visible / defaultVisible / onVisibleChange',
        type: 'boolean',
        description: 'Controlled or not.',
      },
      { name: 'hint / error', type: 'ReactNode', description: 'Message under the field.' },
      { name: '…input props', type: 'InputHTMLAttributes', description: 'Passed to the <input>.' },
    ],
    a11y: [
      'The eye is a button named "Show password" with aria-pressed and aria-controls — its state is spoken, not just drawn.',
      'Caps Lock is announced politely and tied to the field with aria-describedby.',
      'Spellcheck and autocapitalise are off, so the password is never sent to a spelling service.',
      'With reduced motion the eye does not follow the pointer or blink.',
    ],
  },
  {
    slug: 'password-strength',
    title: 'Password strength',
    category: 'Components',
    description:
      'A tube of liquid that fills and changes colour as a password gets stronger — the level overshoots on a spring, its edge wobbles like a meniscus — with a checklist that ticks itself off. scorePassword() is exported too.',
    keywords: ['password meter', 'strength', 'zxcvbn', 'validation', 'rules'],
    isNew: true,
    height: 300,
    controls: [{ type: 'boolean', name: 'checks', label: 'Rules', default: true }],
    code: {
      react: `import { PasswordStrength, scorePassword } from '@vizzele/react';

<PasswordStrength password={password} minLength={8} />

// Or just the numbers:
const { score, checks } = scorePassword(password); // score 0–4`,
    },
    props: [
      { name: 'password', type: 'string', description: 'The text to rate.' },
      { name: 'minLength', type: 'number', default: '8', description: 'First rule.' },
      { name: 'showChecks', type: 'boolean', default: 'true', description: 'List the rules.' },
      {
        name: 'labels',
        type: '[string × 5]',
        default: "['Too weak', 'Weak', 'Fair', 'Strong', 'Excellent']",
        description: 'Words for scores 0–4 (translate them here).',
      },
    ],
    a11y: [
      'The tube is a role="meter" with the strength as aria-valuetext.',
      'Each rule says "done" or "missing" to screen readers, not only with a tick.',
      'The colour is never the only signal: the level and the word change too.',
      'A quick estimate for feedback while typing — always validate on the server.',
    ],
  },
  {
    slug: 'confetti',
    title: 'Confetti',
    category: 'Components',
    description:
      'A burst of paper from any element, point or the middle of the screen: pieces flutter, tumble, slow in the air and fall, then the canvas cleans itself up. One function, no component to mount.',
    keywords: ['celebrate', 'success', 'party', 'burst', 'particles'],
    isNew: true,
    height: 380,
    controls: [
      { type: 'range', name: 'count', min: 20, max: 200, default: 90 },
      { type: 'range', name: 'spread', min: 20, max: 180, default: 70 },
      { type: 'range', name: 'power', min: 0.5, max: 2, step: 0.1, default: 1 },
    ],
    code: {
      react: `import { confetti } from '@vizzele/react';

<button onClick={(e) => confetti(e.currentTarget)}>Publish</button>

// Anywhere, with options — resolves when the last piece lands.
await confetti({ x: 200, y: 120 }, { count: 140, spread: 120, power: 1.4 });`,
    },
    props: [
      {
        name: 'origin',
        type: 'Element | { x, y }',
        description: 'Where it bursts from. Default the middle of the screen.',
      },
      { name: 'count', type: 'number', default: '90', description: 'Pieces of paper.' },
      { name: 'spread', type: 'number', default: '70', description: 'Cone width in degrees.' },
      {
        name: 'angle',
        type: 'number',
        default: '-90',
        description: 'Direction in degrees (−90 is up).',
      },
      { name: 'power', type: 'number', default: '1', description: 'Launch speed.' },
      { name: 'colors', type: 'string[]', description: 'Defaults to the iridescent palette.' },
    ],
    a11y: [
      'Purely decorative: the canvas is aria-hidden and ignores the pointer.',
      'With reduced motion nothing is drawn — announce the success in text as well.',
    ],
  },
  {
    slug: 'click-spark',
    title: 'Click spark',
    category: 'Components',
    description:
      'Wrap anything and every click inside throws a ring of sparks from the exact point — a tiny reward that makes a whole page feel more physical.',
    keywords: ['click effect', 'sparks', 'burst', 'feedback'],
    isNew: true,
    height: 360,
    controls: [
      { type: 'range', name: 'count', min: 4, max: 16, default: 8 },
      { type: 'range', name: 'radius', min: 12, max: 60, default: 26 },
    ],
    code: {
      react: `import { ClickSpark } from '@vizzele/react';

<ClickSpark count={8} radius={26}>
  <main>{/* your page */}</main>
</ClickSpark>`,
    },
    props: [
      { name: 'count', type: 'number', default: '8', description: 'Sparks per click.' },
      { name: 'radius', type: 'number', default: '26', description: 'How far they fly (px).' },
      {
        name: 'color',
        type: 'string',
        description: 'One colour; the iridescent palette by default.',
      },
      { name: 'duration', type: 'number', default: '450', description: 'Milliseconds.' },
    ],
    a11y: [
      'Sparks are aria-hidden and do not catch the pointer, so clicks reach what is underneath.',
      'Nothing is drawn with reduced motion.',
    ],
  },
  {
    slug: 'heart-button',
    title: 'Heart button',
    category: 'Components',
    description:
      'A like button with a jelly pop: the heart fills, throws a ring and a spray of coloured sparks, and the counter rolls up to its next number (and back down if you change your mind).',
    keywords: ['like', 'favourite', 'love', 'reaction', 'counter'],
    isNew: true,
    height: 300,
    code: {
      react: `import { HeartButton } from '@vizzele/react';

<HeartButton
  count={127}            // likes from everyone else
  liked={liked}
  onLikedChange={setLiked}
/>`,
    },
    props: [
      {
        name: 'liked / defaultLiked / onLikedChange',
        type: 'boolean',
        description: 'Controlled or not.',
      },
      {
        name: 'count',
        type: 'number',
        description: 'Likes from everyone else; yours is added on top. Omit to hide.',
      },
      { name: 'label', type: 'string', default: "'Like'", description: 'Accessible name.' },
    ],
    a11y: [
      'A toggle button with aria-pressed, named by the label and the count ("Like, 128").',
      'The burst only plays after a press — never on page load — and not at all with reduced motion.',
    ],
  },
  {
    slug: 'theme-toggle',
    title: 'Theme toggle',
    category: 'Components',
    description:
      'A day-to-night switch: the sun rolls across a sky that darkens, clouds drift off, stars come out and a shadow bites the sun into a moon. The page changes inside a circle that grows from the switch.',
    keywords: ['dark mode', 'light mode', 'theme', 'switch', 'view transition', 'sun', 'moon'],
    isNew: true,
    height: 280,
    controls: [{ type: 'boolean', name: 'wipe', label: 'Circle reveal', default: true }],
    code: {
      react: `import { ThemeToggle } from '@vizzele/react';

// Sets data-theme on <html> and reveals the new theme in a growing circle.
<ThemeToggle onThemeChange={(t) => localStorage.setItem('theme', t)} />`,
    },
    props: [
      {
        name: 'theme / defaultTheme / onThemeChange',
        type: "'light' | 'dark'",
        description: 'Controlled or not. Uncontrolled, it reads <html data-theme> or the OS.',
      },
      { name: 'apply', type: 'boolean', default: 'true', description: 'Set data-theme on <html>.' },
      {
        name: 'wipe',
        type: 'boolean',
        default: 'true',
        description: 'Circle reveal with View Transitions (falls back to an instant swap).',
      },
      { name: 'label', type: 'string', default: "'Dark mode'", description: 'Accessible name.' },
    ],
    a11y: [
      'A role="switch" named "Dark mode" with aria-checked.',
      'The circle reveal is skipped with reduced motion and where View Transitions are not supported.',
    ],
  },
  {
    slug: 'split-flap',
    title: 'Split flap',
    category: 'Text',
    description:
      'An airport departures board: each cell flips through its drum letter by letter until it lands on the new text. Great for headlines, prices, scores and status.',
    keywords: ['departure board', 'solari', 'flip', 'ticker', 'text animation'],
    isNew: true,
    height: 320,
    controls: [
      { type: 'range', name: 'speed', min: 30, max: 160, default: 55 },
      { type: 'range', name: 'stagger', min: 0, max: 120, default: 40 },
    ],
    code: {
      react: `import { SplitFlap } from '@vizzele/react';

<SplitFlap value={status} length={12} style={{ fontSize: 40 }} />`,
    },
    props: [
      { name: 'value', type: 'string', description: 'Text to land on.' },
      {
        name: 'length',
        type: 'number',
        description: 'Pad or cut to this many cells (keeps the board steady).',
      },
      { name: 'speed', type: 'number', default: '55', description: 'Milliseconds per flip.' },
      { name: 'stagger', type: 'number', default: '40', description: 'Delay between cells (ms).' },
      { name: 'chars', type: 'string', description: 'The drum each cell flips through, in order.' },
      { name: 'uppercase', type: 'boolean', default: 'true', description: 'Boards shout.' },
    ],
    a11y: [
      'Screen readers get the final text once; the flapping cells are aria-hidden.',
      'With reduced motion each cell shows its letter straight away.',
    ],
  },
  {
    slug: 'orbit',
    title: 'Orbit',
    category: 'Components',
    description:
      'Icons, logos or avatars circling a centre on concentric rings at their own speeds. Items stay upright as they travel, grow on hover, and the orbits pause so they are easy to click.',
    keywords: ['integrations', 'logos', 'solar system', 'circle', 'rotate', 'hero'],
    isNew: true,
    height: 460,
    controls: [{ type: 'boolean', name: 'pause', label: 'Pause on hover', default: true }],
    code: {
      react: `import { Orbit } from '@vizzele/react';

<Orbit
  rings={[
    { radius: 80, items: [<Figma />, <Slack />, <Notion />] },
    { radius: 150, items: [<GitHub />, <Linear />, <Stripe />, <Vercel />], reverse: true },
  ]}
>
  <Logo />
</Orbit>`,
    },
    props: [
      {
        name: 'rings',
        type: '{ items, radius, duration?, reverse? }[]',
        description: 'Each ring; duration in seconds per turn (default radius ÷ 5).',
      },
      { name: 'children', type: 'ReactNode', description: 'What sits in the middle.' },
      { name: 'itemSize', type: 'number', default: '44', description: 'Size of each item (px).' },
      {
        name: 'pauseOnHover',
        type: 'boolean',
        default: 'true',
        description: 'Stop while hovered or focused.',
      },
    ],
    a11y: [
      'Your items keep their own semantics — give icon-only links a name.',
      'Orbits pause on hover and keyboard focus, so nothing moves out from under the pointer or the focus ring.',
      'With reduced motion everything stays in place.',
    ],
  },
  {
    slug: 'dot-grid',
    title: 'Dot grid',
    category: 'Backgrounds',
    description:
      'A field of dots that behaves like a membrane: dots near the pointer swell, light up and lean away on springs, and a click sends a shockwave rolling across the grid. Canvas 2D — no WebGL.',
    keywords: ['dots', 'grid', 'background', 'interactive', 'shockwave', 'canvas'],
    isNew: true,
    wide: true,
    height: 440,
    controls: [
      { type: 'range', name: 'gap', min: 14, max: 40, default: 24 },
      { type: 'range', name: 'radius', min: 60, max: 240, default: 130 },
      { type: 'boolean', name: 'shock', label: 'Click shockwave', default: true },
    ],
    code: {
      react: `import { DotGrid } from '@vizzele/react';

<DotGrid gap={24} radius={130} style={{ minHeight: 480 }}>
  <h1>Your hero</h1>
</DotGrid>`,
      css: `/* Colours follow the theme; override them per grid: */
.my-grid {
  color: rgb(255 255 255 / 0.3); /* resting dots */
  --vz-dot-active: #ff2bd6;       /* lit dots */
}`,
    },
    props: [
      { name: 'gap', type: 'number', default: '24', description: 'Distance between dots (px).' },
      { name: 'size', type: 'number', default: '1.4', description: 'Dot radius (px).' },
      { name: 'radius', type: 'number', default: '130', description: 'Reach of the pointer (px).' },
      {
        name: 'shock',
        type: 'boolean',
        default: 'true',
        description: 'A click sends a shockwave.',
      },
    ],
    a11y: [
      'The canvas is aria-hidden; your content sits on top and stays fully interactive.',
      'It only animates while on screen and while something is moving, then goes idle.',
      'With reduced motion the dots still light up near the pointer but never move.',
    ],
  },
];
