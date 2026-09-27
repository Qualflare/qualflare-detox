import type { QualflareJestOptions } from '@qualflare/jest';

import { detectDetoxPlatform } from './platform.js';

/** The reporter's options are `@qualflare/jest`'s, unchanged.
 *
 * Exported under a Detox name so that `import type { QualflareDetoxOptions }`
 * reads correctly in a Detox project, and so this package can add an option
 * later without a breaking rename. It is an alias today and says so.
 */
export type QualflareDetoxOptions = QualflareJestOptions;

/** Applies the two defaults that make a Jest report a Detox report.
 *
 * The user's own options always win: they are spread last, so an explicit
 * `platform: 'ios'` beats detection and an explicit `framework` beats `detox`.
 * This is the only place defaults are applied — both registration forms route
 * through the reporter subclass, so there is no second copy to drift.
 *
 * `framework: 'detox'` is what the report carries as its producer identity.
 * What the Qualflare CLI then does with it depends on the CLI's version, and
 * both outcomes are fine:
 *
 *   - A CLI that knows detox categorises the suite as `jest` (Jest is what
 *     produced the report) and records `detox` as the suite's
 *     `sourceFramework` property.
 *   - An older CLI does not recognise the name, so the suite categorises as
 *     `generic`. Degraded, not broken.
 *
 * Neither ever puts `detox` in the wire's `category` field, which is a closed
 * enum server-side that does not include it.
 */
export function withDetoxDefaults(options: QualflareDetoxOptions = {}): QualflareDetoxOptions {
  const platform = detectDetoxPlatform();
  return {
    framework: 'detox',
    ...(platform ? { platform } : {}),
    ...options,
  };
}
