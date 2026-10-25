import { useId } from 'react';

/** Vector isotype: a liquid V formed by two droplets meeting, filled with the iridescent spectrum. */
export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`g${id}`} x1="6" y1="8" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#00e5ff" />
          <stop offset="0.38" stopColor="#ff2bd6" />
          <stop offset="0.7" stopColor="#ffb238" />
          <stop offset="1" stopColor="#a8ff3e" />
        </linearGradient>
        <linearGradient id={`s${id}`} x1="32" y1="6" x2="32" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M8.5 9.5c4.6-2.4 9.6-.6 12.2 4.1L32 34.6l11.3-21c2.6-4.7 7.6-6.5 12.2-4.1 4.5 2.4 5.6 7.7 3 12.5L39.6 53.1c-1.6 2.9-4.4 4.5-7.6 4.5s-6-1.6-7.6-4.5L5.5 22c-2.6-4.8-1.5-10.1 3-12.5Z"
        fill={`url(#g${id})`}
      />
      <path
        d="M10.6 12.3c2.6-1.3 5.6-.4 7.2 2.4l8.1 15c-3.9-3.4-9.6-9.4-15.9-12.7-.8-2 -.2-3.8.6-4.7Z"
        fill={`url(#s${id})`}
        opacity="0.9"
      />
      <path
        d="M46.2 14.7c1.6-2.8 4.6-3.7 7.2-2.4.8.9 1.4 2.7.6 4.7-4.4 2.3-8.4 5.9-11.8 9.6l4-11.9Z"
        fill={`url(#s${id})`}
        opacity="0.7"
      />
    </svg>
  );
}
