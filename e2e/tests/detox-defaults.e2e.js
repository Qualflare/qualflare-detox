// What this package contributes, exercised through a real Jest run.
//
// These tests assert almost nothing themselves — the assertions that matter are
// in verify-report.mjs, which reads the report this run produces. A test here
// exists to CREATE a case with a known shape; the verifier checks the reporter
// described it correctly.

const { qualflare } = require('../../dist/index.cjs');

describe('Detox defaults', () => {
  it('labels the launch as detox without being told to', () => {
    // The report's `framework` field is the assertion, checked by the verifier.
    // Nothing in jest.config.cjs sets it, so if it says detox, this package put
    // it there.
    qualflare.label('area', 'defaults');
    expect(true).toBe(true);
  });

  it('resolves the platform from Detox’s session snapshot', () => {
    // The dogfood run sets DETOX_CONFIG_SNAPSHOT_PATH to a synthesised snapshot
    // (see package.json's test:e2e), because a real `detox test` needs a
    // simulator this CI job does not have. What is under test is this package's
    // READING of that file, which is the part that is ours.
    expect(process.env.DETOX_CONFIG_SNAPSHOT_PATH).toBeTruthy();
  });
});

describe('the re-exported runtime API', () => {
  it('records metadata through the qualflare export', async () => {
    // Re-exported from @qualflare/jest. Worth a dogfood case because a bundler
    // that inlined a second copy of that package would still export something
    // callable here, while writing to a channel the reporter is not reading —
    // the failure would be silent and would look like "metadata just vanished".
    qualflare.label('team', 'mobile');
    qualflare.tag('dogfood');
    qualflare.parameter('platform-source', 'session-snapshot');

    await qualflare.step('an outer step', async () => {
      await qualflare.step('a nested step', async () => {
        expect(1 + 1).toBe(2);
      });
    });

    qualflare.attachment('notes.txt', 'attached from the dogfood suite', {
      mimeType: 'text/plain',
    });
  });

  it('carries a link through to the report', () => {
    // link(url, opts) — the URL is FIRST. Worth spelling out: the natural guess
    // is link(name, url), which would silently record "docs" as the URL.
    qualflare.link('https://qualflare.com/detox-test-reporting/', {
      type: 'custom',
      name: 'Detox test reporting',
    });
    expect(true).toBe(true);
  });
});
