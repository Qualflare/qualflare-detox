# Releasing

Same shape as the other reporters in the family.

1. `npm run lint && npm run typecheck && npm test && npm run build`
2. Bump `version` in `package.json`, update `CHANGELOG.md`.
3. Verify the tarball contains only `dist`, `README.md`, `LICENSE`:
   `npm pack --dry-run`
4. Commit, then tag `v<version>` and push the tag. That is the publish —
   `.github/workflows/npm-publish.yml` fires
   on `v*.*.*`, re-runs typecheck/lint/tests plus `test:built` and the dogfood
   suite, publishes, and then asserts the version resolves AND carries a
   provenance attestation.

   Do NOT publish from a laptop. `publishConfig.provenance` is set, and npm can
   only produce a provenance attestation inside a CI with an OIDC token, so a
   local `npm publish` fails rather than quietly publishing an unattested
   tarball. The workflow needs `NPM_TOKEN` on the repository.

## Before the first publish

Settled as of 2026-09-27, each checked by fetching or resolving it rather than by
reading the config:

- [x] The `Qualflare/qualflare-detox` repo exists and this tree is pushed to it,
      so `repository.url`, `bugs.url` and the provenance attestation all point
      somewhere real. All three return 200.
- [x] `@qualflare/jest`'s range resolves on the registry: `^0.1.2` → `0.1.2`.
- [x] `qf collect --artifacts-dir` is released — qualflare-cli v0.1.32. Verified
      against the PUBLISHED binary, not the tag: it attaches artifacts to a real
      report end to end.
- [x] The landing page at `homepage` resolves. It went live the same day; before
      that this field was a 404, which is indistinguishable from a working one
      until somebody clicks it.

Still outstanding:

- [ ] `NPM_TOKEN` on the repository. Without it the publish job fails at the last
      step, after everything else has passed.
- [ ] A real `detox test` run against a simulator. Not a blocker in my view — the
      directory-naming rule is confirmed from Detox's own source on both sides,
      and the CLI join is proven against Detox's own `constructSafeFilename` —
      but it is the one thing that would confirm runtime behaviour rather than
      derived behaviour, and npm unpublish is restricted.

## After the release

Listings worth submitting, in the pattern used for the Espresso release:

- `atinfo/awesome-test-automation` — mobile section, near Detox.
- Detox's own ecosystem docs, if they accept third-party reporters.

Do not refile anywhere that has already closed a Qualflare submission.
