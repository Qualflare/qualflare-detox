// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      // Plain JS, not part of the TS project graph — no type-aware linting
      // needed for the flat config file itself.
      'eslint.config.js',
      // The dogfood suite: a standalone Jest project that loads the reporter
      // from built dist/. It sits outside tsconfig's `include: ['src']`, so the
      // type-aware parser cannot resolve it — same treatment as the sibling
      // reporters give their own e2e trees.
      'e2e/**',
      'e2e-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
);
