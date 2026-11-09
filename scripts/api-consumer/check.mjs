// Runtime check of the public programmatic API, run as an external consumer.
//
// Copied into a scratch project that installs apex-code-coverage-transformer
// (from an `npm pack` tarball or the npm registry), so the import below resolves
// through the package's `exports` map exactly like it would for a real user.
//
// Usage: node check.mjs <projectDir> <deployCoverage.json> <testCoverage.json> <invalid.json>
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { COVERAGE_FORMATS, CoverageError, transformCoverage } from 'apex-code-coverage-transformer';

const [projectDir, deployJson, testJson, invalidJson] = process.argv.slice(2);
assert.ok(projectDir && deployJson && testJson && invalidJson, 'usage: check.mjs <project> <deploy> <test> <invalid>');

let passed = 0;
async function check(name, fn) {
  await fn();
  passed++;
  console.log(`ok - ${name}`);
}

async function expectCode(promise, code) {
  await assert.rejects(promise, (error) => {
    assert.ok(error instanceof CoverageError, `expected CoverageError, got ${error?.constructor?.name}`);
    assert.equal(error.code, code);
    return true;
  });
}

await check('exports', () => {
  assert.equal(typeof transformCoverage, 'function');
  assert.equal(typeof CoverageError, 'function');
  assert.ok(Array.isArray(COVERAGE_FORMATS) && COVERAGE_FORMATS.length > 0);
  for (const format of ['sonar', 'cobertura', 'jacoco', 'lcovonly', 'json-summary', 'markdown']) {
    assert.ok(COVERAGE_FORMATS.includes(format), `missing format ${format}`);
  }
});

for (const [label, input] of [
  ['deploy', deployJson],
  ['test', testJson],
]) {
  await check(`${label} input: every format renders in memory`, async () => {
    const result = await transformCoverage({
      inputs: [input],
      formats: [...COVERAGE_FORMATS],
      write: false,
      cwd: projectDir,
    });
    assert.equal(result.reports.length, COVERAGE_FORMATS.length);
    for (const report of result.reports) {
      assert.equal(report.path, undefined, `${report.format} should not have a path`);
      assert.ok(report.content.length > 0, `${report.format} rendered empty`);
    }
    assert.ok(result.summary.fileCount > 0, 'no files matched the fixture project');
    assert.ok(result.summary.lineRate > 0 && result.summary.lineRate <= 1);
    const covered = result.summary.files.reduce((sum, f) => sum + f.coveredLines, 0);
    assert.equal(result.summary.coveredLines, covered);
  });
}

await check('parsed object input matches path input', async () => {
  const parsed = JSON.parse(await readFile(deployJson, 'utf-8'));
  const fromPath = await transformCoverage({ inputs: [deployJson], write: false, cwd: projectDir });
  const fromObject = await transformCoverage({ inputs: [parsed], write: false, cwd: projectDir });
  assert.deepEqual(fromObject.summary, fromPath.summary);
});

await check('write: true writes the returned content', async () => {
  const outputReport = join(projectDir, 'api-check.xml');
  const { reports } = await transformCoverage({ inputs: [testJson], outputReport, cwd: projectDir });
  assert.equal(reports.length, 1);
  assert.equal(reports[0].path, outputReport);
  assert.equal(await readFile(outputReport, 'utf-8'), reports[0].content);
});

await check('minCoverage gate', async () => {
  const result = await transformCoverage({ inputs: [testJson], write: false, cwd: projectDir, minCoverage: 100 });
  assert.equal(result.passed, false);
});

await check('CoverageError codes', async () => {
  await expectCode(
    transformCoverage({ inputs: [testJson], formats: ['bogus'], write: false, cwd: projectDir }),
    'UNSUPPORTED_FORMAT',
  );
  await expectCode(transformCoverage({ inputs: [invalidJson], write: false, cwd: projectDir }), 'UNKNOWN_INPUT_FORMAT');
  await expectCode(
    transformCoverage({ inputs: [deployJson, testJson], write: false, cwd: projectDir }),
    'MIXED_INPUT_TYPES',
  );
});

await check('deep imports are blocked by the exports map', async () => {
  await assert.rejects(import('apex-code-coverage-transformer/lib/transformers/coverageTransformer.js'), {
    code: 'ERR_PACKAGE_PATH_NOT_EXPORTED',
  });
});

console.log(`\n${passed} checks passed`);
