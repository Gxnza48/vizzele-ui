import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/bricolage-grotesque/standard.css';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@vizzele/css';
import './globals.css';
import './demos-ui.css';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteEffects } from '@/components/SiteEffects';

const url = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vizzele-ui.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: { default: 'Vizzele UI — liquid light for the web', template: '%s · Vizzele UI' },
  description:
    'A UI, physics and animation library with its own aesthetic: liquid light, iridescent materials, springs, inertia and gestures that feel alive.',
  applicationName: 'Vizzele UI',
  keywords: [
    'react',
    'animation',
    'spring physics',
    'drag',
    'ui library',
    'webgl',
    'iridescent',
    'magnetic',
  ],
  openGraph: {
    type: 'website',
    siteName: 'Vizzele UI',
    title: 'Vizzele UI — liquid light for the web',
    description: 'Springs, inertia, gestures and iridescent materials that feel alive.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Vizzele UI' }],
  },
  twitter: { card: 'summary_large_image', images: ['/og.png'] },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#05070d' },
    { media: '(prefers-color-scheme: light)', color: '#f3f0ea' },
  ],
};

// Applies the saved theme before first paint (no flash).
const themeScript = `try{var t=localStorage.getItem('vz-theme');document.documentElement.dataset.theme=t==='light'||t==='dark'?t:(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark')}catch(e){document.documentElement.dataset.theme='dark'}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="vz-body vz-grain vz-grain-fixed">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <div id="main">{children}</div>
        <SiteEffects />
      </body>
    </html>
  );
}
