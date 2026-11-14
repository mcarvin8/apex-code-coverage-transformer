'use strict';

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  getHookTransformOptions,
  HOOK_CONFIG_FILE_NAME,
  isRunningUnderSfdxHardis,
  loadHookConfig,
  markSfdxHardisParent,
  SFDX_HARDIS_PARENT_ENV,
  splitList,
} from '../../src/utils/hookConfig.js';

const dirs: string[] = [];

async function tempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'acc-hook-config-'));
  dirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('sfdx-hardis parent marker', () => {
  it('is only set by sfdx-hardis commands', () => {
    const env: NodeJS.ProcessEnv = {};
    markSfdxHardisParent('project:deploy:start', env);
    expect(isRunningUnderSfdxHardis(env)).toBe(false);
    markSfdxHardisParent('', env);
    expect(isRunningUnderSfdxHardis(env)).toBe(false);
    markSfdxHardisParent('hardis:project:deploy:smart', env);
    expect(env[SFDX_HARDIS_PARENT_ENV]).toBe('true');
    expect(isRunningUnderSfdxHardis(env)).toBe(true);
  });

  it('reads process.env by default', () => {
    expect(isRunningUnderSfdxHardis()).toBe(process.env[SFDX_HARDIS_PARENT_ENV] === 'true');
  });
});

describe('splitList', () => {
  it('trims entries and drops empty ones', () => {
    expect(splitList(' sonar, cobertura ,,')).toEqual(['sonar', 'cobertura']);
    expect(splitList('')).toEqual([]);
    expect(splitList(undefined)).toEqual([]);
  });
});

describe('getHookTransformOptions', () => {
  it('defaults to a sonar coverage.xml report', () => {
    expect(getHookTransformOptions({})).toEqual({
      outputReport: 'coverage.xml',
      formats: ['sonar'],
      ignorePackageDirectories: [],
      excludePatterns: [],
      minCoverage: undefined,
      maxAnnotations: undefined,
    });
    expect(getHookTransformOptions({ format: ' , ' }).formats).toEqual(['sonar']);
  });

  it('parses every config value', () => {
    expect(
      getHookTransformOptions({
        outputReportPath: 'reports/coverage.xml',
        format: 'sonar,cobertura',
        ignorePackageDirectories: 'packaged, force-app',
        excludePatterns: '**/*Test*, **/mock/**',
        minCoverage: 75,
        maxAnnotations: 10,
      }),
    ).toEqual({
      outputReport: 'reports/coverage.xml',
      formats: ['sonar', 'cobertura'],
      ignorePackageDirectories: ['packaged', 'force-app'],
      excludePatterns: ['**/*Test*', '**/mock/**'],
      minCoverage: 75,
      maxAnnotations: 10,
    });
  });
});

describe('loadHookConfig', () => {
  it('returns undefined outside a Salesforce DX project', async () => {
    expect(await loadHookConfig(await tempDir())).toBeUndefined();
  });

  it('returns undefined when the project has no config file', async () => {
    const dir = await tempDir();
    await writeFile(join(dir, 'sfdx-project.json'), '{}');
    expect(await loadHookConfig(dir)).toBeUndefined();
  });

  it('returns undefined when the config file is not valid JSON', async () => {
    const dir = await tempDir();
    await writeFile(join(dir, 'sfdx-project.json'), '{}');
    await writeFile(join(dir, HOOK_CONFIG_FILE_NAME), '{ not json');
    expect(await loadHookConfig(dir)).toBeUndefined();
  });

  it('loads the config from the project root', async () => {
    const dir = await tempDir();
    await writeFile(join(dir, 'sfdx-project.json'), '{}');
    await writeFile(join(dir, HOOK_CONFIG_FILE_NAME), JSON.stringify({ format: 'lcovonly' }));
    expect(await loadHookConfig(dir)).toEqual({ repoRoot: dir, config: { format: 'lcovonly' } });
  });
});
