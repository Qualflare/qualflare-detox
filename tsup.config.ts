import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts', 'reporter/index': 'src/reporter.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node18',
  splitting: false,
  shims: false,
  // @qualflare/jest stays EXTERNAL (tsup's default for dependencies). Bundling
  // it would ship a second copy of the reporter, and the runtime metadata API
  // relies on module-level state — two copies means qualflare.step() writing to
  // a channel the reporter that runs is not reading.
});
