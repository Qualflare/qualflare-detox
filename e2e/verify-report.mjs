// Asserts the dogfood report says what this package is supposed to make it say.
//
// Scope is deliberately narrow. Statuses, durations, retry history and the
// mechanics of steps are @qualflare/jest's behaviour and are verified in that
// repo; re-checking them here would mean two places to update and no extra
// signal. What IS checked is everything this package contributes, plus the
// re-exports it would be possible to break without noticing.

import * as fs from 'node:fs';
import * as path from 'node:path';

const outputDir = process.env.QUALFLARE_OUTPUT_DIR ?? './e2e-results';

const failures = [];
const check = (label, ok, detail = '') => {
  if (!ok) failures.push(detail ? `${label} — ${detail}` : label);
};

if (!fs.existsSync(outputDir)) {
  console.error(`no output directory at ${outputDir}; did the suite run?`);
  process.exit(1);
}

const reports = fs.readdirSync(outputDir).filter((f) => f.endsWith('.json'));
if (reports.length !== 1) {
  console.error(`expected exactly one report in ${outputDir}, found ${reports.length}`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(path.join(outputDir, reports[0]), 'utf8'));
const cases = (report.suites ?? []).flatMap((s) => s.cases ?? []);
const named = (fragment) => cases.find((c) => c.name.includes(fragment));

// A red dogfood suite means the dogfood itself broke. Say so plainly rather than
// letting a downstream assertion fail confusingly.
const notPassed = cases.filter((c) => c.status !== 'passed');
check(
  'every dogfood case passed',
  notPassed.length === 0,
  notPassed.map((c) => `${c.name}=${c.status}`).join(', '),
);
check('the suite produced cases', cases.length >= 4, `found ${cases.length}`);

// -- this package's two defaults -------------------------------------------
// Neither is set in e2e/jest.config.cjs, so their presence proves the reporter
// supplied them.
check(
  'framework is detox',
  report.framework === 'detox',
  `report.framework = ${JSON.stringify(report.framework)}`,
);
check(
  'platform was resolved from the session snapshot',
  report.platform === 'ios' || report.platform === 'android',
  `report.platform = ${JSON.stringify(report.platform)}; expected ios or android`,
);

// -- the re-exported runtime API -------------------------------------------
// A bundler that inlined a second copy of @qualflare/jest would still export a
// callable `qualflare` while writing to a channel the running reporter is not
// reading. That failure is silent and looks like "metadata vanished", so each
// kind of metadata is checked rather than assumed to travel together.
const meta = named('records metadata through the qualflare export');
check('the metadata case is present', Boolean(meta));
if (meta) {
  const labels = meta.labels ?? [];
  check(
    'labels travelled',
    labels.some((l) => l.name === 'team' && l.value === 'mobile'),
    JSON.stringify(labels),
  );
  check(
    'tags travelled',
    (meta.labels ?? []).some((l) => l.name === 'tag' && l.value === 'dogfood') ||
      (meta.tags ?? []).includes('dogfood'),
    JSON.stringify({ labels: meta.labels, tags: meta.tags }),
  );
  // A `parameter()` lands in the case's `properties` MAP, not in a `parameters`
  // array — checked against a real report rather than guessed, because the
  // plausible guess (`case.parameters`) is silently `null` and an assertion
  // written against it fails for the wrong reason.
  check(
    'parameters travelled, into properties',
    (meta.properties ?? {})['platform-source'] === 'session-snapshot',
    JSON.stringify(meta.properties),
  );
  check('steps travelled', (meta.steps ?? []).length > 0, `steps = ${(meta.steps ?? []).length}`);
  check(
    'the nested step is present',
    JSON.stringify(meta.steps ?? []).includes('a nested step'),
    JSON.stringify(meta.steps),
  );
  check(
    'the attachment travelled',
    (meta.attachments ?? []).some((a) => a.name === 'notes.txt'),
    JSON.stringify((meta.attachments ?? []).map((a) => a.name)),
  );
}

const linked = named('carries a link through to the report');
check('the link case is present', Boolean(linked));
if (linked) {
  const links = linked.links ?? [];
  check(
    'the link travelled with its URL in the url field',
    links.some((l) => typeof l.url === 'string' && l.url.startsWith('https://qualflare.com/')),
    JSON.stringify(links),
  );
}

// -- the environment, recorded by the reporter rather than at collect time --
check(
  'environment is production',
  report.environment === 'production',
  `report.environment = ${JSON.stringify(report.environment)}`,
);

if (failures.length > 0) {
  console.error(`dogfood report verification failed (${failures.length}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(
  `dogfood report OK: ${cases.length} cases, framework=${report.framework}, platform=${report.platform}`,
);
