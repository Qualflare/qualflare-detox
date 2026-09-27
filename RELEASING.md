# Releasing

Same shape as the other reporters in the family.

1. `npm run lint && npm run typecheck && npm test && npm run build`
2. Bump `version` in `package.json`, update `CHANGELOG.md`.
3. Verify the tarball contains only `dist`, `README.md`, `LICENSE`:
   `npm pack --dry-run`
4. Commit, tag `v<version>`, push the tag.
5. Publish from CI with provenance (`publishConfig.provenance` is already set),
   or `npm publish` locally with an OTP.

## Before the first publish

- [ ] The `Qualflare/qualflare-detox` GitHub repo exists and this tree is pushed
      to it — `repository.url`, `bugs.url` and the provenance attestation all
      reference it, so publishing without it produces broken metadata.
- [ ] `@qualflare/jest`'s version range in `dependencies` is one that is
      actually published.
- [ ] `qf collect --artifacts-dir` is released in qualflare-cli. Without it the
      README's central command does not exist, and the package's whole reason to
      exist is unreachable.
- [ ] The landing page at `homepage` resolves.

## After the release

Listings worth submitting, in the pattern used for the Espresso release:

- `atinfo/awesome-test-automation` — mobile section, near Detox.
- Detox's own ecosystem docs, if they accept third-party reporters.

Do not refile anywhere that has already closed a Qualflare submission.
