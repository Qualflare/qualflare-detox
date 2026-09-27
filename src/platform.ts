/** Reading the platform a Detox run targeted, without asking Detox.
 *
 * Everything here was settled by reading detox@20.51.4's source rather than its
 * documentation, because the documentation does not describe any of it and the
 * one time this family trusted Detox's docs over its source, the docs were
 * wrong in a way that would have shipped a bug.
 */

import * as fs from 'node:fs';

/** The platform values `@qualflare/jest` accepts that a Detox run can be. */
export type DetoxPlatform = 'ios' | 'android';

/** Detox's own env var, set in `DetoxPrimaryContext` (`src/realms/
 * DetoxPrimaryContext.js`) before it spawns the test runner, so the Jest
 * process — and therefore a reporter constructed inside it — inherits it. */
export const SNAPSHOT_PATH_ENV_VAR = 'DETOX_CONFIG_SNAPSHOT_PATH';

interface PlatformDeps {
  env?: NodeJS.ProcessEnv;
  readFile?: (path: string) => string;
}

/** Resolves `ios` or `android` from Detox's session snapshot, or `undefined`
 * when it cannot be known.
 *
 * `undefined` is a first-class answer, not a failure: the caller then leaves
 * `platform` unset and the report carries no claim about the platform, which is
 * correct and is what happens today. Every branch here degrades to it, because
 * a WRONG platform on a launch is materially worse than an absent one — it is
 * invisible in the dashboard and silently mis-attributes a whole run.
 *
 * Deliberately NOT done two other ways:
 *
 *   - `device.getPlatform()`, the documented API, exists only in the worker
 *     where Detox installed its globals. A Jest reporter runs in the main
 *     process, where `device` is not defined.
 *   - `SessionState.parse`, Detox's own reader for this file, revives functions
 *     by running them through `vm.runInContext` (see `src/utils/
 *     SessionState.js`). Reading a config file must not execute its contents,
 *     so this parses the JSON directly and ignores the `{"$fn": "..."}`
 *     placeholders that a plain parse leaves behind.
 */
export function detectDetoxPlatform(deps: PlatformDeps = {}): DetoxPlatform | undefined {
  const env = deps.env ?? process.env;
  const readFile = deps.readFile ?? ((p: string) => fs.readFileSync(p, 'utf8'));

  const snapshotPath = env[SNAPSHOT_PATH_ENV_VAR];
  if (!snapshotPath) {
    // Not running under `detox test` at all — a plain `jest` run, or a Detox
    // version that stopped setting this. Either way there is nothing to read.
    return undefined;
  }

  let deviceType: unknown;
  try {
    const parsed: unknown = JSON.parse(readFile(snapshotPath));
    deviceType = readDeviceType(parsed);
  } catch {
    // Unreadable, mid-write, or not JSON. The platform is a nicety; the report
    // is not. Never throw from here — this runs inside a reporter constructor,
    // and a throw there takes down the run it was supposed to be observing.
    return undefined;
  }

  return platformForDeviceType(deviceType);
}

function readDeviceType(snapshot: unknown): unknown {
  if (typeof snapshot !== 'object' || snapshot === null) return undefined;
  const config = (snapshot as { detoxConfig?: unknown }).detoxConfig;
  if (typeof config !== 'object' || config === null) return undefined;
  const device = (config as { device?: unknown }).device;
  if (typeof device !== 'object' || device === null) return undefined;
  return (device as { type?: unknown }).type;
}

/** Maps a Detox `device.type` onto a platform BY PREFIX.
 *
 * Prefix rather than an enum of the six known types (`ios.simulator`,
 * `ios.none`, `android.emulator`, `android.attached`, `android.genycloud`,
 * `android.apk`) for a reason visible in Detox's source: `composeDeviceConfig.js`
 * checks `if (!KNOWN_TYPES.has(deviceConfig.type)) return;` — it RETURNS rather
 * than throwing, so a type outside that set is legal. Third-party device
 * drivers are registered by module path, and an enum would read every one of
 * them as "no platform".
 *
 * Prefix matching is also what Detox itself does when it needs the platform
 * from a type (`DetoxConfigErrorComposer.js` uses `startsWith('android.')` /
 * `startsWith('ios.')`).
 *
 * A custom driver whose name starts with neither returns undefined, which is
 * the honest answer: its platform is not knowable from its name.
 */
function platformForDeviceType(type: unknown): DetoxPlatform | undefined {
  if (typeof type !== 'string') return undefined;
  if (type.startsWith('ios.')) return 'ios';
  if (type.startsWith('android.')) return 'android';
  return undefined;
}
