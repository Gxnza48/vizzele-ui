// Builds @vizzele/css: generates spring easings from the core physics, copies each
// stylesheet to dist/ and bundles everything into vizzele.css / vizzele.min.css.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { springToCss, springs } from '@vizzele/core';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const dist = join(root, 'dist');
const check = process.argv.includes('--check');

const kebab = (s) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
let springCss = '/* Generated from @vizzele/core spring physics — do not edit. */\n:root {\n';
for (const [name, cfg] of Object.entries(springs)) {
  const { easing, duration } = springToCss(cfg, 48);
  springCss += `  --vz-spring-${kebab(name)}: ${easing};\n  --vz-spring-${kebab(name)}-duration: ${duration}ms;\n`;
}
springCss += '}\n';
writeFileSync(join(src, 'springs.css'), springCss);

const order = [
  'tokens.css',
  'springs.css',
  'themes.css',
  'base.css',
  'components.css',
  'utilities.css',
];
const minify = (css) =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    // ':' is left alone: `.a :focus` and `.a:focus` are different selectors.
    .replace(/\s*([{};,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();

if (!existsSync(dist)) mkdirSync(dist, { recursive: true });
let bundle = '/*! @vizzele/css — MIT */\n';
for (const file of order) {
  const css = readFileSync(join(src, file), 'utf8');
  // Unbalanced braces are the most common hand-written CSS mistake; fail loudly.
  const open = (css.match(/{/g) || []).length;
  const close = (css.match(/}/g) || []).length;
  if (open !== close) throw new Error(`${file}: unbalanced braces (${open} vs ${close})`);
  if (!check) writeFileSync(join(dist, file), css);
  bundle += `\n/* ${file} */\n${css}`;
}
if (!check) {
  writeFileSync(join(dist, 'vizzele.css'), bundle);
  writeFileSync(join(dist, 'vizzele.min.css'), '/*! @vizzele/css — MIT */' + minify(bundle));
}
console.log(check ? 'css ok' : `built ${order.length} stylesheets + bundle`);
