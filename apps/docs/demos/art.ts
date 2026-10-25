// Generated iridescent artwork for demos — no external images needed.
const hues = ['#00e5ff', '#ff2bd6', '#ffb238', '#a8ff3e', '#7c5cff'];

export function artSrc(seed: number, w = 1200, h = 800): string {
  const c = (i: number) => hues[(seed + i) % hues.length]!;
  const blobs = Array.from({ length: 6 }, (_, i) => {
    const x = ((seed * 37 + i * 211) % 100) / 100;
    const y = ((seed * 53 + i * 127) % 100) / 100;
    const r = 0.18 + ((seed + i * 7) % 10) / 40;
    return `<circle cx="${x * w}" cy="${y * h}" r="${r * w}" fill="${c(i)}" opacity=".85"/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${w / 14}"/></filter>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c(2)}"/><stop offset="1" stop-color="#05070d"/></linearGradient></defs>
<rect width="100%" height="100%" fill="url(#g)"/><g filter="url(#b)">${blobs}</g>
<g fill="none" stroke="#fff" stroke-opacity=".18">${Array.from({ length: 9 }, (_, i) => `<circle cx="${w * 0.62}" cy="${h * 0.45}" r="${40 + i * 38}"/>`).join('')}</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
