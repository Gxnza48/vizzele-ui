import { useId } from 'react';

const V =
  'M7.16 19.92L26.25 53.74A6.6 6.6 0 0 0 37.75 53.74L56.84 19.92A9 9 0 1 0 40.68 12.07L32.84 31.12Q32 33.16 31.16 31.12L23.32 12.07A9 9 0 1 0 7.16 19.92Z';

/** Vector isotype: a liquid V of two droplet arms meeting in a rounded point, filled with the iridescent spectrum. */
export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`g${id}`} x1="8" y1="18" x2="58" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#00e5ff" />
          <stop offset="0.36" stopColor="#ff2bd6" />
          <stop offset="0.68" stopColor="#ffb238" />
          <stop offset="1" stopColor="#a8ff3e" />
        </linearGradient>
        <linearGradient id={`c${id}`} x1="0" y1="6" x2="0" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.42" />
          <stop offset="0.38" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.78" stopColor="#05070d" stopOpacity="0" />
          <stop offset="1" stopColor="#05070d" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id={`h${id}`} x1="0" y1="8" x2="0" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`k${id}`}>
          <path d={V} />
        </clipPath>
      </defs>
      <path d={V} fill={`url(#g${id})`} />
      <path d={V} fill={`url(#c${id})`} />
      <g clipPath={`url(#k${id})`}>
        <path d={V} fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.1" />
      </g>
      <path
        d="M11.2 12.6L19.2 30"
        stroke={`url(#h${id})`}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M45.6 12.2L44.4 15.2"
        stroke={`url(#h${id})`}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      <circle cx="53.2" cy="12.4" r="1.5" fill="#fff" fillOpacity="0.8" />
    </svg>
  );
}
