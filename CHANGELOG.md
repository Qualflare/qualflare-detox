# Changelog

## 0.1.0 — 2026-09-27

Initial release.

- `@qualflare/detox/reporter`: the Qualflare reporter for a Detox suite, with
  Detox's defaults applied — `framework: 'detox'`, and `platform` resolved to
  `ios`/`android` from Detox's own session snapshot. It USES `@qualflare/jest`'s
  reporter rather than extending it, so the two packages version independently.
- `qualflareDetoxReporter()` for a type-checked registration in a TypeScript
  Jest config.
- `qualflare` runtime API re-exported, so a Detox project has one import.
- `detectDetoxPlatform()` exported for anyone who wants the platform without the
  reporter.

Detox artifacts (screenshots, videos, device logs) are attached by
`qf collect --artifacts-dir`, which needs qualflare-cli **v0.1.32 or newer**.
Nothing in this package scans them — see the README for why that cannot work from
inside a Jest reporter.

Known limitation: no `detox test` run against a real simulator has exercised this
yet. The directory-naming rule is confirmed from Detox 20.51.4's own source on
both sides, and the CLI join is verified end to end against Detox's own
`constructSafeFilename`, but runtime behaviour on a device is unconfirmed.
