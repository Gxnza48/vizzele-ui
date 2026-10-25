import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts', gl: 'src/gl/index.ts', auto: 'src/auto.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true,
    splitting: true,
    target: 'es2020',
  },
  {
    entry: { 'vizzele.global': 'src/global.ts' },
    format: ['iife'],
    globalName: 'vizzele',
    minify: true,
    sourcemap: true,
    target: 'es2020',
    outExtension: () => ({ js: '.js' }),
  },
]);
