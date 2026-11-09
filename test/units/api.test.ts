'use strict';

import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HandlerRegistry } from '../../src/handlers/HandlerRegistry.js';
import { COVERAGE_FORMATS, CoverageError, type DeployCoverageData, transformCoverage } from '../../src/index.js';
import {
  baselineClassPath,
  baselineTriggerPath,
  deployCoverage,
  invalidJson,
  testCoverage,
} from '../utils/testConstants.js';

let projectDir: string;

async function createProject(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'acc-api-'));
  await mkdir(join(dir, 'force-app/main/default/classes'), { recursive: true });
  await mkdir(join(dir, 'packaged/triggers'), { recursive: true });
  await copyFile(baselineClassPath, join(dir, 'force-app/main/default/classes/AccountProfile.cls'));
  await copyFile(baselineTriggerPath, join(dir, 'packaged/triggers/AccountTrigger.trigger'));
  await writeFile(
    join(dir, 'sfdx-project.json'),
    JSON.stringify({ packageDirectories: [{ path: 'force-app', default: true }, { path: 'packaged' }] }),
  );
  return dir;
}

async function captureError(promise: Promise<unknown>): Promise<CoverageError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(CoverageError);
    return error as CoverageError;
  }
  throw new Error('Expected promise to reject');
}

describe('programmatic API', () => {
  beforeAll(async () => {
    projectDir = await createProject();
  });

  afterAll(async () => {
    await rm(projectDir, { recursive: true, force: true });
  });

  it('exports every registered format and nothing else', () => {
    expect([...COVERAGE_FORMATS]).toEqual(HandlerRegistry.getAvailableFormats());
    expect(Object.isFrozen(COVERAGE_FORMATS)).toBe(true);
  });

  it('returns report contents without writing when write is false', async () => {
    const outputReport = join(projectDir, 'not-written.xml');
    const result = await transformCoverage({
      inputs: [deployCoverage],
      formats: ['cobertura', 'markdown'],
      outputReport,
      write: false,
      cwd: projectDir,
    });

    expect(result.reports.map((r) => r.format)).toEqual(['cobertura', 'markdown']);
    for (const report of result.reports) {
      expect(report.path).toBeUndefined();
      expect(report.content.length).toBeGreaterThan(0);
    }
    expect(result.reports[0].content).toContain('<coverage');
    expect(result.reports[1].content).toContain('# Apex Code Coverage Report');
    await expect(readFile(outputReport)).rejects.toThrow();
  });

  it('writes reports to disk and returns matching content by default', async () => {
    const outputReport = join(projectDir, 'written.xml');
    const result = await transformCoverage({ inputs: [testCoverage], outputReport, cwd: projectDir });

    expect(result.reports).toHaveLength(1);
    const [report] = result.reports;
    expect(report.format).toBe('sonar');
    expect(report.path).toBe(outputReport);
    expect(await readFile(outputReport, 'utf-8')).toBe(report.content);
  });

  it('suffixes paths with the format name when writing multiple formats', async () => {
    const outputReport = join(projectDir, 'multi.xml');
    const result = await transformCoverage({
      inputs: [testCoverage],
      formats: ['sonar', 'lcovonly'],
      outputReport,
      cwd: projectDir,
    });

    expect(result.reports.map((r) => r.path)).toEqual([
      join(projectDir, 'multi-sonar.xml'),
      join(projectDir, 'multi-lcovonly.info'),
    ]);
  });

  it('builds a per-file summary consistent with the totals', async () => {
    const { summary, passed, warnings } = await transformCoverage({
      inputs: [testCoverage],
      write: false,
      cwd: projectDir,
    });

    expect(warnings).toEqual([]);
    expect(passed).toBe(true);
    expect(summary.fileCount).toBe(2);
    expect(summary.files.map((f) => f.name)).toEqual(['AccountProfile', 'AccountTrigger']);
    expect(summary.files.map((f) => f.path)).toEqual([...summary.files.map((f) => f.path)].sort());

    const covered = summary.files.reduce((sum, f) => sum + f.coveredLines, 0);
    const total = summary.files.reduce((sum, f) => sum + f.totalLines, 0);
    expect(summary.coveredLines).toBe(covered);
    expect(summary.totalLines).toBe(total);
    expect(summary.lineRate).toBeCloseTo(covered / total);

    for (const file of summary.files) {
      expect(file.uncoveredLines).toHaveLength(file.totalLines - file.coveredLines);
      expect(file.uncoveredLines).toEqual([...file.uncoveredLines].sort((a, b) => a - b));
      expect(file.lineRate).toBeCloseTo(file.coveredLines / file.totalLines);
    }
  });

  it('accepts already-parsed coverage JSON', async () => {
    const parsed = JSON.parse(await readFile(deployCoverage, 'utf-8')) as DeployCoverageData;
    const fromObject = await transformCoverage({ inputs: [parsed], write: false, cwd: projectDir });
    const fromPath = await transformCoverage({ inputs: [deployCoverage], write: false, cwd: projectDir });

    expect(fromObject.summary).toEqual(fromPath.summary);
  });

  it('reports a file with no coverable lines as lineRate 0', async () => {
    const parsed: DeployCoverageData = {
      'no-map/AccountProfile': {
        fnMap: {},
        branchMap: {},
        path: 'no-map/AccountProfile',
        f: {},
        b: {},
        s: {},
        statementMap: {},
      },
    };
    const { summary } = await transformCoverage({ inputs: [parsed], write: false, cwd: projectDir });

    expect(summary.files).toHaveLength(1);
    expect(summary.files[0]).toMatchObject({ totalLines: 0, coveredLines: 0, lineRate: 0, uncoveredLines: [] });
    expect(summary.lineRate).toBe(0);
  });

  it('sets passed to false when below minCoverage and true at the threshold', async () => {
    const base = await transformCoverage({ inputs: [testCoverage], write: false, cwd: projectDir });
    const pct = base.summary.lineRate * 100;

    const below = await transformCoverage({
      inputs: [testCoverage],
      write: false,
      cwd: projectDir,
      minCoverage: pct + 0.01,
    });
    const atThreshold = await transformCoverage({
      inputs: [testCoverage],
      write: false,
      cwd: projectDir,
      minCoverage: pct,
    });

    expect(below.passed).toBe(false);
    expect(atThreshold.passed).toBe(true);
  });

  it('returns an empty result with a warning when no input can be read', async () => {
    const result = await transformCoverage({
      inputs: [join(projectDir, 'missing.json')],
      write: false,
      cwd: projectDir,
    });

    expect(result.reports).toEqual([]);
    expect(result.summary).toEqual({ lineRate: 0, coveredLines: 0, totalLines: 0, fileCount: 0, files: [] });
    expect(result.passed).toBe(true);
    expect(result.warnings).toEqual([`Failed to read ${join(projectDir, 'missing.json')}. Confirm file exists.`]);
  });

  it('throws UNSUPPORTED_FORMAT for an unknown format', async () => {
    const error = await captureError(
      // @ts-expect-error -- deliberately invalid format
      transformCoverage({ inputs: [testCoverage], formats: ['bogus'], write: false, cwd: projectDir }),
    );
    expect(error.code).toBe('UNSUPPORTED_FORMAT');
    expect(error.message).toBe(`Unsupported format: bogus. Available formats: ${COVERAGE_FORMATS.join(', ')}`);
  });

  it('defaults to sonar when formats is empty', async () => {
    const { reports } = await transformCoverage({ inputs: [testCoverage], formats: [], write: false, cwd: projectDir });
    expect(reports.map((r) => r.format)).toEqual(['sonar']);
  });

  it('applies maxAnnotations to the github-actions format', async () => {
    const countWarnings = (content: string): number =>
      content.split('\n').filter((l) => l.startsWith('::warning')).length;
    const run = (maxAnnotations?: number): ReturnType<typeof transformCoverage> =>
      transformCoverage({
        inputs: [deployCoverage],
        formats: ['github-actions'],
        write: false,
        cwd: projectDir,
        maxAnnotations,
      });

    const unlimited = countWarnings((await run()).reports[0].content);
    const limited = countWarnings((await run(1)).reports[0].content);

    expect(unlimited).toBeGreaterThan(1);
    expect(limited).toBe(1);
  });

  it('names CoverageError and keeps the cause only when given', () => {
    const cause = new Error('root cause');
    const withCause = new CoverageError('boom', { code: 'NO_SFDX_PROJECT', cause });
    const withoutCause = new CoverageError('boom', { code: 'MIXED_INPUT_TYPES' });

    expect(withCause).toBeInstanceOf(Error);
    expect(withCause.name).toBe('CoverageError');
    expect(withCause.message).toBe('boom');
    expect(withCause.code).toBe('NO_SFDX_PROJECT');
    expect(withCause.cause).toBe(cause);
    expect(withoutCause.cause).toBeUndefined();
  });

  it('throws UNKNOWN_INPUT_FORMAT for unrecognized JSON', async () => {
    const error = await captureError(transformCoverage({ inputs: [invalidJson], write: false, cwd: projectDir }));
    expect(error.code).toBe('UNKNOWN_INPUT_FORMAT');
  });

  it('includes file lookup warnings such as duplicate Apex files', async () => {
    const dupDir = await createProject();
    try {
      await mkdir(join(dupDir, 'packaged/classes'), { recursive: true });
      await copyFile(baselineClassPath, join(dupDir, 'packaged/classes/AccountProfile.cls'));

      const { warnings } = await transformCoverage({ inputs: [testCoverage], write: false, cwd: dupDir });

      expect(warnings.some((w) => w.startsWith('Duplicate Apex file "AccountProfile.cls"'))).toBe(true);
    } finally {
      await rm(dupDir, { recursive: true, force: true });
    }
  });

  it('throws UNKNOWN_INPUT_FORMAT when any one input is unrecognized', async () => {
    const error = await captureError(
      transformCoverage({ inputs: [testCoverage, invalidJson], write: false, cwd: projectDir }),
    );
    expect(error.code).toBe('UNKNOWN_INPUT_FORMAT');
  });

  it('throws MIXED_INPUT_TYPES when deploy and test inputs are combined', async () => {
    const error = await captureError(
      transformCoverage({ inputs: [deployCoverage, testCoverage], write: false, cwd: projectDir }),
    );
    expect(error.code).toBe('MIXED_INPUT_TYPES');
  });

  it('throws NO_SFDX_PROJECT when cwd has no sfdx-project.json above it', async () => {
    const emptyDir = await mkdtemp(join(tmpdir(), 'acc-api-empty-'));
    try {
      const error = await captureError(transformCoverage({ inputs: [testCoverage], write: false, cwd: emptyDir }));
      expect(error.code).toBe('NO_SFDX_PROJECT');
    } finally {
      await rm(emptyDir, { recursive: true, force: true });
    }
  });
});
