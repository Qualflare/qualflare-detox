# @qualflare/detox

Qualflare reporting for a [Detox](https://wix.github.io/Detox/) suite: your test
results, and Detox's own screenshots, videos and device logs attached to the
tests they came from.

## What this package is, plainly

**Detox runs on Jest**, so the reporter is `@qualflare/jest`'s. This package is
that reporter with Detox's defaults applied and Detox-shaped documentation. It
contains almost no logic, and saying so up front is more useful than implying a
separate Detox engine that does not exist.

That matters because it tells you where to look when something is wrong:
statuses, durations, retry history, steps and the `qualflare.*` API are all
`@qualflare/jest` behaviour, documented there and fixed there.

What is genuinely Detox-specific is **not in this package at all**. Detox writes
its artifacts to disk, one directory per test, and associating them with your
test results is done by the Qualflare CLI:

```bash
qf my-project collect ./qualflare-results --artifacts-dir ./artifacts
```

The reason that is a separate step rather than something the reporter does is not
a limitation we chose. Detox finalises video in its artifact plugin's
`onBeforeCleanup`, which runs inside `detox.cleanup()`, which Detox's Jest
integration calls from Jest's `globalTeardown` — and Jest runs `globalTeardown`
**after** every reporter's `onRunComplete`. A reporter-side scan would therefore
run before Detox had finished writing and would systematically miss videos, the
largest and most useful artifact. No delay or retry inside the reporter fixes
that ordering; it would only make the miss intermittent, which is worse.

## Install

```bash
npm install --save-dev @qualflare/detox
```

Requires Node 18+, Detox 20+, and Jest 29+ (Detox brings its own Jest).

## Quickstart

Add the reporter to the Jest config Detox uses — `e2e/jest.config.js` in a
default Detox layout. Keep Detox's own reporter: it is what prints progress.

```js
/** @type {import('jest').Config} */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.test.js'],
  testTimeout: 120000,
  verbose: true,
  reporters: ['detox/runners/jest/reporter', '@qualflare/detox/reporter'],
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  testEnvironment: 'detox/runners/jest/testEnvironment',
};
```

Then run the suite and upload:

```bash
detox test --configuration ios.sim.debug --take-screenshots failing --record-videos failing

qf login my-project "$QUALFLARE_TOKEN" --force
qf my-project collect ./qualflare-results --artifacts-dir ./artifacts
```

Videos and device logs are large, so they upload only when asked:

```bash
qf my-project collect ./qualflare-results --artifacts-dir ./artifacts --upload-artifacts video,trace
```

Screenshots upload by default.

### With TypeScript

`qualflareDetoxReporter()` is the same registration with the options type
checked — Jest types a reporter's options as `Record<string, unknown>`, so the
plain tuple silently accepts typos:

```ts
import { qualflareDetoxReporter } from '@qualflare/detox';

export default {
  reporters: ['detox/runners/jest/reporter', qualflareDetoxReporter({ environment: 'ci' })],
};
```

Both forms behave identically — the defaults are applied by the reporter itself,
not by the helper.

## What the defaults do

Two, and only two.

**`framework: 'detox'`** — the report records Detox as what produced it. The CLI
turns that into a suite categorised as `jest` (Jest is what actually ran the
tests) plus a `sourceFramework` property of `detox`. On a CLI too old to know the
name, the suite categorises as `generic` instead: degraded, never broken, and
never rejected.

**`platform`** — resolved to `ios` or `android` from the Detox run itself, so a
launch is attributed to the platform it ran on without you configuring it twice.

Detection reads Detox's own session snapshot (`DETOX_CONFIG_SNAPSHOT_PATH`) and
maps `device.type` by prefix. It is deliberately conservative: a third-party
device driver, an unreadable snapshot, or a plain `jest` run with no Detox around
all yield *no* platform rather than a guessed one, because a wrong platform on a
launch is invisible in a dashboard and mis-attributes the whole run, while an
absent one is merely absent. Set `platform` yourself to override it.

The documented `device.getPlatform()` is not usable here: it exists only in the
worker where Detox installed its globals, and a Jest reporter runs in the main
process.

Anything you pass wins over both defaults.

## Enriching your tests

The runtime API is `@qualflare/jest`'s, re-exported so a Detox project has one
import rather than two:

```js
import { qualflare } from '@qualflare/detox';

it('signs in', async () => {
  qualflare.label('suite', 'auth');
  await qualflare.step('tap login', async () => {
    await element(by.id('login')).tap();
  });
  qualflare.attachment('state', JSON.stringify(state), 'application/json');
});
```

See [`@qualflare/jest`](https://www.npmjs.com/package/@qualflare/jest) for the
full API and every configuration option — they are the same functions and the
same options.

## Known limitations

- **Artifacts need `--artifacts-dir`.** Nothing is scanned unless you name the
  directory. `./artifacts` is Detox's default but is never guessed: attaching
  files from a directory you did not name is how a stale run's video ends up on
  today's launch, and that mistake is invisible from the dashboard.
- **Artifacts attach to the case, not to the attempt.** A retried test writes one
  directory per invocation and all of them attach to the one case, with the
  attempt in the attachment name. Per-attempt attachments need a server change.
- **Matching is by test name.** Detox names each artifact directory after the
  test's full name; the CLI computes that name forward from each case and looks
  it up. Two tests with identical full names in the same run are
  indistinguishable to Detox itself, and so to this.
- **`detox test --device-name` and multi-device runs** are untested here.

## Development

```bash
npm install
npm test          # unit tests
npm run build     # dist/ via tsup
npm run lint
npm run typecheck
```

## License

Apache-2.0
