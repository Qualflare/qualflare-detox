import type QualflareJestReporterClass from '@qualflare/jest/reporter';
import * as qualflareJestReporterModule from '@qualflare/jest/reporter';

import { withDetoxDefaults, type QualflareDetoxOptions } from './defaults.js';
import { resolveDefaultExport } from './interop.js';

/** Only the fields the Jest reporter reads; mirrors its own local interface
 * rather than importing Jest's types, so this package needs no dependency on
 * `@jest/types` to describe a parameter it only passes along. */
interface JestGlobalConfig {
  rootDir?: string;
  shard?: { shardIndex: number; shardCount: number };
}

/** The Jest reporter's constructor, unwrapped from whichever module shape the
 * running build resolved — see interop.ts. */
const QualflareJestReporter = resolveDefaultExport(
  qualflareJestReporterModule,
) as typeof QualflareJestReporterClass;

/**
 * The Qualflare reporter for a Detox run.
 *
 * This package USES `@qualflare/jest`'s reporter; it does not extend it. The
 * distinction is deliberate and worth stating, because an earlier version did
 * subclass it:
 *
 *   - A subclass depends on the base's constructor signature and on its own
 *     ability to `super()` into it across a package boundary. That is a private
 *     contract between two independently versioned packages, and a change to
 *     @qualflare/jest's constructor becomes a break here rather than a bump.
 *   - `class X extends <value imported from another package>` is also the exact
 *     construct that failed at runtime in the CJS build, where the interop
 *     wrapper made the imported default an object rather than a constructor.
 *     Composition removes the construct, not just that instance of the bug.
 *
 * So the Jest reporter is INSTANTIATED with Detox's defaults applied, and that
 * instance is what Jest talks to. The constructor returns it directly, which is
 * legal and is the whole trick: Jest calls `new` on whatever the `reporters`
 * entry resolves to and then calls hooks on the result, so handing back a
 * configured Jest reporter forwards every hook — including any hook a future
 * Jest or @qualflare/jest adds — with no forwarding surface to keep in step.
 *
 * Hand-written delegation was the alternative and is worse here: it would have
 * to enumerate onRunStart / onTestStart / onTestCaseResult / onTestResult /
 * onRunComplete / getLastError and stay correct as that list changes, and a
 * missed hook fails silently by doing nothing.
 *
 * Registration works in both forms, and the string form is the one Detox's own
 * documentation uses (and the only one available in a CommonJS jest.config):
 *
 * ```js
 * // e2e/jest.config.js
 * module.exports = {
 *   reporters: ['detox/runners/jest/reporter', '@qualflare/detox/reporter'],
 * };
 * ```
 *
 * There is no Detox-specific REPORTING logic here, and there should not be:
 * Detox drives Jest, so a Jest reporter already sees its statuses, durations,
 * per-attempt retry history and steps. What Detox adds that Jest cannot see is
 * its artifacts directory, and those are attached by `qf collect
 * --artifacts-dir` out of process — because Detox finalises video in
 * `detox.cleanup()`, which Jest calls from `globalTeardown`, AFTER every
 * reporter's `onRunComplete`.
 */
export default class QualflareDetoxReporter {
  constructor(globalConfig?: JestGlobalConfig, options: QualflareDetoxOptions = {}) {
    // Returning an object from a constructor replaces `this`. The caller gets a
    // fully configured @qualflare/jest reporter, so nothing about this package
    // sits in the hot path of reporting a test result.
    return new QualflareJestReporter(globalConfig, withDetoxDefaults(options));
  }
}
