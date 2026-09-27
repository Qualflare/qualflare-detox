# Changelog

## 0.1.0 — unreleased

Initial release.

- `@qualflare/detox/reporter`: `@qualflare/jest`'s reporter with Detox defaults —
  `framework: 'detox'`, and `platform` resolved to `ios`/`android` from Detox's
  own session snapshot.
- `qualflareDetoxReporter()` for a type-checked registration in a TypeScript
  Jest config.
- `qualflare` runtime API re-exported from `@qualflare/jest`.

Detox artifacts (screenshots, videos, device logs) are attached by
`qf collect --artifacts-dir`, which needs qualflare-cli with Detox artifact
support. Nothing in this package scans them — see the README for why that
cannot work from a reporter.
