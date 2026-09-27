import { afterEach, describe, expect, it } from 'vitest';

import { withDetoxDefaults } from '../../src/defaults.js';
import { SNAPSHOT_PATH_ENV_VAR } from '../../src/platform.js';

const original = process.env[SNAPSHOT_PATH_ENV_VAR];

afterEach(() => {
  if (original === undefined) delete process.env[SNAPSHOT_PATH_ENV_VAR];
  else process.env[SNAPSHOT_PATH_ENV_VAR] = original;
});

describe('withDetoxDefaults', () => {
  it('declares the framework as detox', () => {
    expect(withDetoxDefaults().framework).toBe('detox');
  });

  it('lets the caller override every default', () => {
    // The precedence that matters: someone who deliberately reports a Detox run
    // as plain jest, or pins a platform detection cannot see, must win.
    const out = withDetoxDefaults({ framework: 'jest', platform: 'ios', environment: 'staging' });
    expect(out.framework).toBe('jest');
    expect(out.platform).toBe('ios');
    expect(out.environment).toBe('staging');
  });

  it('passes unrelated options through untouched', () => {
    const out = withDetoxDefaults({ outputDir: './out', maxAttachmentBytes: 123, debug: true });
    expect(out).toMatchObject({ outputDir: './out', maxAttachmentBytes: 123, debug: true });
  });

  // An absent platform must be ABSENT, not `undefined`: the reporter's own
  // resolver treats a present key as a value, and `platform: undefined` would
  // override its default instead of leaving it alone.
  it('omits platform entirely when it cannot be detected', () => {
    delete process.env[SNAPSHOT_PATH_ENV_VAR];
    expect('platform' in withDetoxDefaults()).toBe(false);
  });

  it('never mutates the options it was given', () => {
    const input = { environment: 'ci' } as const;
    withDetoxDefaults(input);
    expect(input).toEqual({ environment: 'ci' });
  });
});
