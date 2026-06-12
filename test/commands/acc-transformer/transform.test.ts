'use strict';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

let shouldSimulateReadFailureForAccountTrigger = false;

vi.mock('node:fs/promises', async () => {
  const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
  return {
    ...actual,
    readFile: (path: string, ...args: unknown[]) => {
      if (shouldSimulateReadFailureForAccountTrigger && path.includes('AccountTrigger.trigger')) {
        return Promise.reject(new Error('Simulated read failure'));
      }
      return actual.readFile(path as never, ...(args as never[]));
    },
  };
});

import { transformCoverageReport } from '../../../src/transformers/coverageTransformer.js';
import { formatOptions } from '../../../src/utils/constants.js';
import {
  inputJsons,
  invalidJson,
  deployCoverage,
  testCoverage,
  samplesPackagePath,
} from '../../utils/testConstants.js';
import { postTestCleanup } from '../../utils/testCleanup.js';
import { preTestSetup } from '../../utils/testSetup.js';

describe('acc-transformer transform unit tests', () => {
  beforeAll(async () => {
    await preTestSetup();
  });

  afterAll(async () => {
    await postTestCleanup();
  });

  inputJsons.forEach(({ label, path }) => {
    it(`transforms the ${label} command JSON file into all output formats`, async () => {
      await transformCoverageReport(path, `${label}.xml`, formatOptions, [samplesPackagePath]);
    });
  });
  it('confirms a failure on an invalid JSON file.', async () => {
    try {
      await transformCoverageReport(invalidJson, 'coverage.xml', ['sonar'], []);
      throw new Error('Command did not fail as expected');
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toContain(
          'The provided JSON does not match a known coverage data format from the Salesforce deploy or test command.',
        );
      } else {
        throw new Error('An unknown error type was thrown.');
      }
    }
  });
  it('confirms a warning with a JSON file that does not exist.', async () => {
    const result = await transformCoverageReport('nonexistent.json', 'coverage.xml', ['sonar'], []);
    expect(result.warnings).toContain('Failed to read nonexistent.json. Confirm file exists.');
  });
  it('ignore a package directory and produce a warning on the deploy command report.', async () => {
    const result = await transformCoverageReport(
      deployCoverage,
      'coverage.xml',
      ['sonar'],
      ['packaged', 'force-app', samplesPackagePath],
    );
    expect(result.warnings).toContain('The file name AccountTrigger was not found in any package directory.');
    // All files are ignored so processed=0 → emits the empty-report warning
    expect(result.warnings).toContain(
      'None of the files listed in the coverage JSON were processed. The coverage report will be empty.',
    );
  });
  it('ignore a package directory and produce a warning on the test command report.', async () => {
    const result = await transformCoverageReport(
      testCoverage,
      'coverage.xml',
      ['sonar'],
      ['packaged', samplesPackagePath],
    );
    expect(result.warnings).toContain('The file name AccountTrigger was not found in any package directory.');
  });
  it('create a cobertura report using only 1 package directory', async () => {
    await transformCoverageReport(deployCoverage, 'coverage.xml', ['cobertura'], ['packaged', 'force-app']);
  });
  it('create a jacoco report using only 1 package directory', async () => {
    await transformCoverageReport(deployCoverage, 'coverage.xml', ['jacoco'], ['packaged', 'force-app']);
  });
  it('returns the overall line rate in the result', async () => {
    const result = await transformCoverageReport(deployCoverage, 'coverage.xml', ['sonar'], [samplesPackagePath]);
    expect(result.lineRate).toBeGreaterThanOrEqual(0);
    expect(result.lineRate).toBeLessThanOrEqual(1);
  });
  it('does not throw when coverage meets the minCoverage threshold', async () => {
    await expect(
      transformCoverageReport(deployCoverage, 'coverage.xml', ['sonar'], [samplesPackagePath], { minCoverage: 0 }),
    ).resolves.toBeDefined();
  });
  it('throws when overall coverage is below the minCoverage threshold', async () => {
    await expect(
      transformCoverageReport(deployCoverage, 'coverage.xml', ['sonar'], [samplesPackagePath], { minCoverage: 100 }),
    ).rejects.toThrow(/below the required minimum of 100%/);
  });
  it('passes maxAnnotations through to the github-actions generator', async () => {
    const result = await transformCoverageReport(
      deployCoverage,
      'coverage.xml',
      ['github-actions'],
      [samplesPackagePath],
      { maxAnnotations: 1 },
    );
    expect(result.finalPaths.length).toBeGreaterThan(0);
  });
  it('handles source file read failure gracefully when generating HTML from test coverage', async () => {
    shouldSimulateReadFailureForAccountTrigger = true;
    try {
      const result = await transformCoverageReport(testCoverage, 'read-fail-test.xml', ['html'], [samplesPackagePath]);
      expect(result.finalPaths.length).toBeGreaterThan(0);
    } finally {
      shouldSimulateReadFailureForAccountTrigger = false;
    }
  });
  it('does NOT throw when lineRate=0 and minCoverage=0 (strict < not <=)', async () => {
    // When all dirs ignored, no files processed → lineRate=0.
    // With minCoverage=0: "0 < 0" is false → no throw. If mutated to "<=", "0 <= 0" is true → throws.
    await expect(
      transformCoverageReport(
        deployCoverage,
        'coverage.xml',
        ['sonar'],
        ['packaged', 'force-app', samplesPackagePath],
        {
          minCoverage: 0,
        },
      ),
    ).resolves.toBeDefined();
  });
  it('produces one finalPath entry per format', async () => {
    const result = await transformCoverageReport(
      deployCoverage,
      'coverage.xml',
      ['sonar', 'cobertura'],
      [samplesPackagePath],
    );
    expect(result.finalPaths).toHaveLength(2);
  });
  it('returns lineRate=0 and includes path in finalPaths when JSON cannot be read', async () => {
    const result = await transformCoverageReport('nonexistent-file.json', 'coverage.xml', ['sonar'], []);
    expect(result.lineRate).toBe(0);
    expect(result.finalPaths).toContain('coverage.xml');
  });
  it('excludes matching files from deploy coverage using excludePatterns', async () => {
    const result = await transformCoverageReport(deployCoverage, 'coverage.xml', ['sonar'], [samplesPackagePath], {
      excludePatterns: ['*.trigger', '*.cls'],
    });
    expect(result.warnings).toContain(
      'None of the files listed in the coverage JSON were processed. The coverage report will be empty.',
    );
    expect(result.lineRate).toBe(0);
  });
  it('excludes matching files from test coverage using excludePatterns', async () => {
    const result = await transformCoverageReport(testCoverage, 'coverage.xml', ['sonar'], [samplesPackagePath], {
      excludePatterns: ['*.trigger', '*.cls'],
    });
    expect(result.warnings).toContain(
      'None of the files listed in the coverage JSON were processed. The coverage report will be empty.',
    );
    expect(result.lineRate).toBe(0);
  });
});
