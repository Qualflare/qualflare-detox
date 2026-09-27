import QualflareJestReporter from '@qualflare/jest/reporter';

import { withDetoxDefaults, type QualflareDetoxOptions } from './defaults.js';

/** Only the fields the base reporter reads; mirrors its own local interface
 * rather than importing Jest's types, so this package needs no dependency on
 * `@jest/types` to describe a parameter it only forwards. */
interface JestGlobalConfig {
  rootDir?: string;
  shard?: { shardIndex: number; shardCount: number };
}

/**
 * `@qualflare/jest`'s reporter with Detox's defaults applied.
 *
 * This subclass exists so the STRING form works:
 *
 * ```js
 * // jest.config.js
 * module.exports = {
 *   reporters: ['detox/runners/jest/reporter', '@qualflare/detox/reporter'],
 * };
 * ```
 *
 * which is the form Detox's own documentation uses and the only form available
 * in a CommonJS `jest.config.js` without an import. Applying the defaults in the
 * constructor — rather than baking them into an options object at config time —
 * means both registration forms get them from one place.
 *
 * Everything else, including every hook, is inherited untouched. There is no
 * Detox-specific reporting logic here, and there should not be: Detox drives
 * Jest, so a Jest reporter already sees its statuses, durations, retry history
 * and steps. What Detox adds that Jest cannot see is its artifacts directory,
 * and those are attached later by `qf collect --artifacts-dir`, out of process,
 * because Detox finalises video in `detox.cleanup()` — which Jest calls from
 * `globalTeardown`, AFTER every reporter's `onRunComplete`.
 */
export default class QualflareDetoxReporter extends QualflareJestReporter {
  constructor(globalConfig?: JestGlobalConfig, options: QualflareDetoxOptions = {}) {
    super(globalConfig, withDetoxDefaults(options));
  }
}
