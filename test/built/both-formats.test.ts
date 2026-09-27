import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

/** Loads the BUILT package, both formats, and constructs the reporter.
 *
 * This suite is separate from test/unit because it needs `dist` to exist, and it
 * exists because of a bug that every other check passed:
 *
 *   - the unit tests import `src` and never see a bundler's interop
 *   - `tsc --noEmit` type-checks source, and the failure was a runtime value shape
 *   - a smoke test that imported `dist/reporter/index.js` (ESM) worked perfectly
 *
 * while `require('dist/reporter/index.cjs')` — which is what real Jest does from
 * a CommonJS jest.config — threw "Class extends value #<Object> is not a
 * constructor or null". Shipping two formats means testing two formats; testing
 * one proved nothing about the other.
 */

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '../..');
const dist = path.join(root, 'dist');

const SNAPSHOT = path.join(root, 'node_modules', '.cache', 'qfd-test-session.json');

beforeAll(() => {
  if (!fs.existsSync(dist)) {
    throw new Error(`dist/ is missing — run \`npm run build\` before this suite (looked in ${dist})`);
  }
  fs.mkdirSync(path.dirname(SNAPSHOT), { recursive: true });
  fs.writeFileSync(
    SNAPSHOT,
    JSON.stringify({
      detoxConfig: {
        device: { type: 'android.emulator' },
        // Detox serialises functions like this; nothing must execute it.
        behavior: { onError: { $fn: '(() => { throw new Error("EXECUTED") })' } },
      },
    }),
  );
  process.env.DETOX_CONFIG_SNAPSHOT_PATH = SNAPSHOT;
});

interface ReporterCtor {
  new (
    globalConfig?: { rootDir?: string },
    options?: Record<string, unknown>,
  ): { config?: { framework?: string; platform?: string } };
}

function assertUsable(Reporter: unknown, label: string): void {
  expect(typeof Reporter, `${label}: the reporter export must be a constructor`).toBe('function');

  const instance = new (Reporter as ReporterCtor)({ rootDir: root }, { enabled: false });
  expect(instance, label).toBeTruthy();

  // The defaults must survive the interop, not just the construction.
  expect(instance.config?.framework, `${label}: framework default`).toBe('detox');
  expect(instance.config?.platform, `${label}: platform detected from the snapshot`).toBe('android');
}

describe('the built package', () => {
  it('works when required as CommonJS, the way Jest loads a reporter', () => {
    const loaded: unknown = require(path.join(dist, 'reporter/index.cjs'));
    // Jest itself unwraps `default`, so accept either shape here — what must not
    // happen is the module failing to evaluate at all, which is what it did.
    const Reporter =
      typeof loaded === 'function' ? loaded : (loaded as { default?: unknown }).default;
    assertUsable(Reporter, 'CJS');
  });

  it('works when imported as ESM', async () => {
    const loaded = (await import(path.join(dist, 'reporter/index.js'))) as { default?: unknown };
    assertUsable(loaded.default, 'ESM');
  });

  it('exposes the helper and runtime API from both entry formats', async () => {
    const cjs = require(path.join(dist, 'index.cjs')) as Record<string, unknown>;
    const esm = (await import(path.join(dist, 'index.js'))) as Record<string, unknown>;
    for (const [label, mod] of [
      ['CJS', cjs],
      ['ESM', esm],
    ] as const) {
      expect(typeof mod.qualflareDetoxReporter, `${label}: qualflareDetoxReporter`).toBe('function');
      expect(typeof mod.detectDetoxPlatform, `${label}: detectDetoxPlatform`).toBe('function');
      // Re-exported from @qualflare/jest — this is the one most likely to break
      // silently, because a bundler that inlined a second copy would still
      // export something callable.
      expect(mod.qualflare, `${label}: qualflare runtime API`).toBeTruthy();
    }
  });

  it('declares every exports subpath it publishes', () => {
    const pkg = require(path.join(root, 'package.json')) as {
      exports: Record<string, { import?: string; require?: string; types?: string }>;
    };
    for (const [subpath, entry] of Object.entries(pkg.exports)) {
      for (const target of [entry.import, entry.require, entry.types].filter(Boolean)) {
        expect(
          fs.existsSync(path.join(root, target as string)),
          `${subpath} -> ${target} must exist in the published tree`,
        ).toBe(true);
      }
    }
  });
});
