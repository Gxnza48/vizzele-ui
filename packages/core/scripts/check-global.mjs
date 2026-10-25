// Guards the CDN build: it must auto-initialize `data-vz-*` attributes on its own.
// (0.1.0 shipped without it — a side-effect import was tree-shaken away.)
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../dist/vizzele.global.js', import.meta.url), 'utf8');
for (const marker of ['vz-ready', 'DOMContentLoaded']) {
  if (!src.includes(marker)) {
    console.error(
      `dist/vizzele.global.js is missing "${marker}": auto-init was dropped from the CDN build.`,
    );
    process.exit(1);
  }
}
console.log('CDN build auto-initializes ✓');
