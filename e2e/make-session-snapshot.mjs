// Writes a Detox session snapshot for the dogfood run to read.
//
// A real `detox test` writes this file and points DETOX_CONFIG_SNAPSHOT_PATH at
// it. That needs a simulator or emulator, which this CI job does not have — so
// the snapshot is synthesised and the reporter's READING of it is what gets
// exercised, which is the part this package owns.
//
// The shape is taken from detox@20.51.4's own SessionState: a `detoxConfig` with
// a `device.type`, plus a `$fn` placeholder where Detox serialises a function.
// That placeholder is load-bearing in this fixture: Detox's own reader revives it
// with `vm.runInContext`, and this package must NOT — so a snapshot that would
// throw if executed proves the parse stayed inert.

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const deviceType = process.argv[2] ?? 'ios.simulator';

const snapshot = {
  id: 'dogfood',
  detoxConfig: {
    device: { type: deviceType, device: { type: 'iPhone 15' } },
    apps: { default: { type: 'ios.app', binaryPath: 'Example.app' } },
    behavior: {
      init: { exposeGlobals: true },
      // If anything ever executes this, the run fails loudly instead of quietly
      // gaining a code-execution path through a config file.
      onError: { $fn: '(() => { throw new Error("SNAPSHOT $fn WAS EXECUTED") })' },
    },
    artifacts: { rootDir: './artifacts' },
  },
  workersCount: 1,
};

const target = path.join(os.tmpdir(), 'qualflare-detox-dogfood-session.json');
fs.writeFileSync(target, JSON.stringify(snapshot));
// Printed on stdout so the caller can export it without duplicating the path.
process.stdout.write(target);
