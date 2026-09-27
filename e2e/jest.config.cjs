// The dogfood suite: @qualflare/detox reporting on tests of itself.
//
// CommonJS on purpose. This config is the only place in the repo that loads the
// reporter the way a real Detox project does — Detox's own docs use a CJS
// `e2e/jest.config.js` — and that path is exactly where the reporter once threw
// "Class extends value #<Object> is not a constructor or null" while every unit
// test passed. A .mjs config here would exercise the ESM build and prove nothing
// about the half that broke.
//
// The reporter is loaded from BUILT dist/, so `npm run build` is a prerequisite
// and the suite exercises what actually ships.
//
// Every test here is meant to PASS. Status mapping is @qualflare/jest's concern
// and is covered in that repo; this suite is uploaded to Qualflare, so red has
// to mean a real regression rather than expected fixture noise. Please do not
// add a failing test here.
module.exports = {
  rootDir: '..',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/e2e/tests/**/*.e2e.js'],
  reporters: [
    'default',
    [
      '<rootDir>/dist/reporter/index.cjs',
      {
        // Relative to rootDir, which is the repo root.
        outputDir: process.env.QUALFLARE_OUTPUT_DIR ?? './e2e-results',
        // Recorded in the report itself rather than passed at collect time, so
        // there is one source of truth for the environment.
        environment: 'production',
        branch: null,
        commit: null,
        // framework and platform are deliberately NOT set. They are what this
        // package contributes, and the verifier asserts the reporter supplied
        // them — setting them here would test the config file instead.
      },
    ],
  ],
};
