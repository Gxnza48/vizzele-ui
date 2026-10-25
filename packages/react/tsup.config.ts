import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts', gl: 'src/gl.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  // No rollup treeshake pass: it strips the 'use client' directive. esbuild output is already tree-shakeable.
  splitting: true,
  target: 'es2020',
  external: ['react', 'react-dom', 'react/jsx-runtime', '@vizzele/core', '@vizzele/core/gl'],
  // Components use hooks and the DOM: mark them as client components for the Next.js App Router.
  banner: { js: "'use client';" },
});
