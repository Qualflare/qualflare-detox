/**
 * `@qualflare/detox` — Qualflare reporting for a Detox suite.
 *
 * Detox runs on Jest, so the reporter IS `@qualflare/jest`'s: this package adds
 * Detox's defaults, Detox-shaped documentation, and nothing else. That is stated
 * plainly here rather than hidden, because a package that implied a separate
 * Detox engine would be lying about where the work happens.
 *
 * The Detox-specific half of the feature is not in this package at all — it is
 * `qf collect --artifacts-dir`, which matches Detox's per-test artifact
 * directories to their cases after the run. See the README.
 */

export { default as QualflareDetoxReporter } from './reporter.js';
export { detectDetoxPlatform, SNAPSHOT_PATH_ENV_VAR, type DetoxPlatform } from './platform.js';
export { withDetoxDefaults, type QualflareDetoxOptions } from './defaults.js';

/** The runtime metadata API, re-exported unchanged from `@qualflare/jest`.
 *
 * Re-exported so a Detox project has one Qualflare import rather than two:
 * `qualflare.step()`, `.label()`, `.attachment()` and the rest behave exactly as
 * they do under Jest, because they are the same functions.
 */
export { qualflare } from '@qualflare/jest';

export type {
  Attachment,
  Case,
  CasePriority,
  CaseStatus,
  Collect,
  FrameworkCategory,
  Label,
  Link,
  LinkType,
  Metadata,
  NanosecondDuration,
  Parameter,
  Platform,
  Step,
  Suite,
} from '@qualflare/jest';

import type { QualflareDetoxOptions } from './defaults.js';

/** The tuple form Jest accepts in `reporters`. */
export type QualflareDetoxReporterDescription = ['@qualflare/detox/reporter', QualflareDetoxOptions];

/**
 * Typed helper for registering the reporter.
 *
 * Jest types a custom reporter's options as `Record<string, unknown>`, so
 * writing the tuple by hand gives no autocomplete and silently accepts typos.
 * This returns the same tuple with the options checked:
 *
 * ```ts
 * import { qualflareDetoxReporter } from '@qualflare/detox';
 *
 * export default {
 *   reporters: ['detox/runners/jest/reporter', qualflareDetoxReporter({ environment: 'ci' })],
 * };
 * ```
 *
 * The options are passed through untouched — the defaults are applied by the
 * reporter itself, so this helper and the plain string form behave identically.
 */
export function qualflareDetoxReporter(
  options: QualflareDetoxOptions = {},
): QualflareDetoxReporterDescription {
  return ['@qualflare/detox/reporter', options];
}
