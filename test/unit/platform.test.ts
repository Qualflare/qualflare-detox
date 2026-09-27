import { describe, expect, it } from 'vitest';

import { detectDetoxPlatform, SNAPSHOT_PATH_ENV_VAR } from '../../src/platform.js';

/** A snapshot shaped like the one Detox writes.
 *
 * `onError: { $fn: '...' }` is present on purpose: Detox serialises functions
 * that way (`SessionState._stringifier`), and its own reader revives them with
 * `vm.runInContext`. A plain JSON.parse leaves the placeholder as an object and
 * executes nothing, which is what these tests assert by not exploding. */
function snapshot(deviceType: unknown): string {
  return JSON.stringify({
    id: 'abc',
    detoxConfig: {
      device: { type: deviceType, device: { type: 'iPhone 15' } },
      apps: { default: { type: 'ios.app', binaryPath: 'x.app' } },
      behavior: { init: { exposeGlobals: true }, onError: { $fn: '(() => process.exit(1))' } },
    },
    workersCount: 1,
  });
}

function detect(snapshotJSON: string | null, path = '/tmp/detox-session.json') {
  return detectDetoxPlatform({
    env: path ? ({ [SNAPSHOT_PATH_ENV_VAR]: path } as NodeJS.ProcessEnv) : ({} as NodeJS.ProcessEnv),
    readFile: () => {
      if (snapshotJSON === null) throw new Error('ENOENT');
      return snapshotJSON;
    },
  });
}

describe('detectDetoxPlatform', () => {
  it('reads ios from every ios device type', () => {
    for (const type of ['ios.simulator', 'ios.none']) {
      expect(detect(snapshot(type))).toBe('ios');
    }
  });

  it('reads android from every android device type', () => {
    for (const type of ['android.emulator', 'android.attached', 'android.genycloud']) {
      expect(detect(snapshot(type))).toBe('android');
    }
  });

  // composeDeviceConfig.js RETURNS rather than throwing for a type outside
  // KNOWN_TYPES, so a third-party driver registered by module path is legal.
  // Its platform is genuinely unknowable from the name, and guessing one would
  // mis-attribute the whole launch invisibly.
  it('returns undefined for a custom driver rather than guessing', () => {
    expect(detect(snapshot('./drivers/my-custom-driver'))).toBeUndefined();
    expect(detect(snapshot('web.chrome'))).toBeUndefined();
  });

  it('is not fooled by a platform name appearing without the dot separator', () => {
    // 'iosfoo' must not read as ios: the prefix includes the '.' precisely so a
    // driver named after a platform does not inherit its meaning.
    expect(detect(snapshot('iosfoo'))).toBeUndefined();
    expect(detect(snapshot('androidish'))).toBeUndefined();
  });

  it('returns undefined when not running under detox test', () => {
    expect(detectDetoxPlatform({ env: {} as NodeJS.ProcessEnv })).toBeUndefined();
  });

  it('returns undefined rather than throwing when the snapshot is unreadable', () => {
    expect(detect(null)).toBeUndefined();
  });

  it('returns undefined rather than throwing on malformed or unexpected JSON', () => {
    for (const body of [
      'not json at all',
      '',
      'null',
      '[]',
      '{}',
      '{"detoxConfig":null}',
      '{"detoxConfig":{}}',
      '{"detoxConfig":{"device":null}}',
      '{"detoxConfig":{"device":{}}}',
      '{"detoxConfig":{"device":{"type":42}}}',
      // A cycle placeholder, which json-cycle writes for a repeated object: the
      // device is a $ref rather than the object, so the type is not readable.
      '{"detoxConfig":{"device":{"$ref":"$[\\"x\\"]"}}}',
    ]) {
      expect(detect(body), body).toBeUndefined();
    }
  });

  it('does not execute the $fn placeholders detox writes for functions', () => {
    // The guarantee is structural — nothing here calls vm.runInContext — but a
    // test that a malicious-looking $fn is inert is the one a future refactor
    // toward SessionState.parse would break.
    const hostile = JSON.stringify({
      detoxConfig: {
        device: { type: 'android.emulator' },
        behavior: { onError: { $fn: '(() => { throw new Error("executed"); })' } },
      },
    });
    expect(detect(hostile)).toBe('android');
  });
});
