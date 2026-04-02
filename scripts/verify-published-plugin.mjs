#!/usr/bin/env node
/**
 * Smoke test: real `sf acc-transformer transform` against repo fixtures vs baselines.
 * Run from repository root after `sf plugins install apex-code-coverage-transformer@latest`.
 * Keep FORMAT_OPTIONS in sync with HandlerRegistry-registered formats (see src/handlers/*.ts).
 */
import { strictEqual } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * Run `sf` via the system shell so Windows can resolve npm shims (.cmd).
 * Direct execFile/spawn of `sf` or `sf.cmd` often yields ENOENT or EINVAL.
 */
function runSf(args) {
  const result = spawnSync('sf', args, {
    shell: true,
    stdio: 'inherit',
    encoding: 'utf-8',
    windowsHide: true,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const err = new Error(`sf exited with code ${result.status}`);
    err.status = result.status;
    err.stdout = result.stdout;
    err.stderr = result.stderr;
    throw err;
  }
}

const fixturesDir = 'test/fixtures';
const samplesPackagePath = `${fixturesDir}/samples`;

/** Sorted like HandlerRegistry.getAvailableFormats() */
const FORMAT_OPTIONS = [
  'clover',
  'cobertura',
  'html',
  'jacoco',
  'json',
  'json-summary',
  'lcovonly',
  'opencover',
  'simplecov',
  'sonar',
];

const EXTENSION_BY_FORMAT = {
  sonar: '.xml',
  lcovonly: '.info',
  jacoco: '.xml',
  cobertura: '.xml',
  clover: '.xml',
  json: '.json',
  'json-summary': '.json',
  simplecov: '.json',
  opencover: '.xml',
  html: '.html',
};

const BASELINE_BY_FORMAT = {
  sonar: resolve(fixturesDir, 'baselines/sonar_baseline.xml'),
  lcovonly: resolve(fixturesDir, 'baselines/lcov_baseline.info'),
  jacoco: resolve(fixturesDir, 'baselines/jacoco_baseline.xml'),
  cobertura: resolve(fixturesDir, 'baselines/cobertura_baseline.xml'),
  clover: resolve(fixturesDir, 'baselines/clover_baseline.xml'),
  json: resolve(fixturesDir, 'baselines/json_baseline.json'),
  'json-summary': resolve(fixturesDir, 'baselines/json-summary_baseline.json'),
  simplecov: resolve(fixturesDir, 'baselines/simplecov_baseline.json'),
  opencover: resolve(fixturesDir, 'baselines/opencover_baseline.xml'),
  html: resolve(fixturesDir, 'baselines/html_baseline.html'),
};

const INPUT_JSONS = [
  { label: 'deploy', path: resolve(fixturesDir, 'inputs/deploy_coverage.json') },
  { label: 'test', path: resolve(fixturesDir, 'inputs/test_coverage.json') },
];

const INVALID_JSON = resolve(fixturesDir, 'inputs/invalid.json');

const NORMALIZATION_REQUIRED = new Set([
  'cobertura',
  'clover',
  'json',
  'json-summary',
  'simplecov',
  'opencover',
  'html',
]);
const JSON_FORMATS = new Set(['json', 'json-summary', 'simplecov']);

const SFDX_PROJECT = {
  packageDirectories: [
    { path: 'force-app', default: true },
    { path: 'packaged' },
    { path: samplesPackagePath },
  ],
  namespace: '',
  sfdcLoginUrl: 'https://login.salesforce.com',
  sourceApiVersion: '58.0',
};

function normalizeCoverageReport(content, isJson = false) {
  if (isJson) {
    try {
      const parsed = JSON.parse(content);
      if (parsed.timestamp !== undefined) {
        parsed.timestamp = 0;
      }
      return JSON.stringify(parsed, null, 2);
    } catch {
      // fall through
    }
  }
  return content
    .replace(/timestamp="[\d]+"/g, 'timestamp="NORMALIZED"')
    .replace(/generated="[\d]+"/g, 'generated="NORMALIZED"')
    .replace(/"timestamp":\s*\d+/g, '"timestamp": 0')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');
}

async function preTestSetup() {
  await mkdir('force-app/main/default/classes', { recursive: true });
  await mkdir('packaged/triggers', { recursive: true });
  await copyFile(resolve(fixturesDir, 'samples/classes/AccountProfile.cls'), 'force-app/main/default/classes/AccountProfile.cls');
  await copyFile(resolve(fixturesDir, 'samples/triggers/AccountTrigger.trigger'), 'packaged/triggers/AccountTrigger.trigger');
  await writeFile(resolve('sfdx-project.json'), JSON.stringify(SFDX_PROJECT, null, 2), 'utf-8');
}

/** Remove artifacts created by this script (matches test/utils/testCleanup.ts intent). */
async function postSmokeCleanup() {
  const reportPaths = [];
  for (const format of FORMAT_OPTIONS) {
    const ext = EXTENSION_BY_FORMAT[format];
    for (const { label } of INPUT_JSONS) {
      reportPaths.push(resolve(`${label}-${format}${ext}`));
    }
  }
  for (const p of reportPaths) {
    await rm(p, { force: true }).catch(() => {});
  }
  await rm(resolve('sfdx-project.json'), { force: true }).catch(() => {});
  await rm('force-app', { recursive: true, force: true }).catch(() => {});
  await rm('packaged', { recursive: true, force: true }).catch(() => {});
}

function runTransform(label, coverageJsonPath) {
  const args = [
    'acc-transformer',
    'transform',
    '--coverage-json',
    coverageJsonPath,
    '--output-report',
    `${label}.xml`,
    '-i',
    samplesPackagePath,
  ];
  for (const f of FORMAT_OPTIONS) {
    args.push('--format', f);
  }
  runSf(args);
}

async function compareToBaselines() {
  for (const format of FORMAT_OPTIONS) {
    const baselinePath = BASELINE_BY_FORMAT[format];
    if (!baselinePath) {
      continue;
    }
    const ext = EXTENSION_BY_FORMAT[format];
    for (const { label } of INPUT_JSONS) {
      const outputPath = resolve(`${label}-${format}${ext}`);
      const outputContent = await readFile(outputPath, 'utf-8');
      const baselineContent = await readFile(baselinePath, 'utf-8');
      if (NORMALIZATION_REQUIRED.has(format)) {
        const isJson = JSON_FORMATS.has(format);
        strictEqual(
          normalizeCoverageReport(outputContent, isJson),
          normalizeCoverageReport(baselineContent, isJson),
          `Mismatch between ${outputPath} and ${baselinePath}`
        );
      } else {
        strictEqual(outputContent, baselineContent, `Mismatch between ${outputPath} and ${baselinePath}`);
      }
    }
  }
}

function expectInvalidJsonFails() {
  const msg =
    'The provided JSON does not match a known coverage data format from the Salesforce deploy or test command.';
  const result = spawnSync('sf', ['acc-transformer', 'transform', '--coverage-json', INVALID_JSON], {
    shell: true,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status === 0) {
    throw new Error('Expected acc-transformer transform to fail on invalid JSON');
  }
  const out = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (!out.includes(msg)) {
    throw new Error(`Expected stderr/stdout to include invalid-JSON message. Got:\n${out}`);
  }
}

try {
  await preTestSetup();
  for (const { label, path } of INPUT_JSONS) {
    console.log(`Transform (${label})…`);
    runTransform(label, path);
  }
  await compareToBaselines();
  console.log('Baseline comparison OK.');
  expectInvalidJsonFails();
  console.log('Invalid JSON failure OK.');
  console.log('Published plugin smoke test passed.');
} finally {
  try {
    await postSmokeCleanup();
    console.log('Smoke test artifacts removed.');
  } catch (e) {
    console.error('Smoke test cleanup failed:', e);
  }
}
