'use strict';

import { afterEach, describe, expect, it, vi } from 'vitest';

const transformMock = vi.hoisted(() => vi.fn());
vi.mock('../../src/transformers/coverageTransformer.js', () => ({ transformCoverageReport: transformMock }));

import TransformerTransform from '../../src/commands/acc-transformer/transform.js';
import { CoverageError } from '../../src/utils/errors.js';

type CliError = { code?: string; exitCode?: number; message: string };

async function runAndCatch(): Promise<CliError> {
  return (await TransformerTransform.run(['-j', 'coverage.json']).catch((e: unknown) => e)) as CliError;
}

describe('transform command', () => {
  afterEach(() => {
    transformMock.mockReset();
  });

  it('does not surface CoverageError codes, keeping CLI output as "Error (1): ..."', async () => {
    transformMock.mockRejectedValue(
      new CoverageError('The provided JSON does not match a known coverage data format.', {
        code: 'UNKNOWN_INPUT_FORMAT',
      }),
    );

    const error = await runAndCatch();

    expect(error.message).toContain('The provided JSON does not match a known coverage data format');
    expect(error.code).not.toBe('UNKNOWN_INPUT_FORMAT');
    expect(error.exitCode).toBe(1);
  });

  it('returns report paths and passes flags through on success', async () => {
    transformMock.mockResolvedValue({
      finalPaths: ['coverage-sonar.xml'],
      warnings: ['The file name Foo was not found in any package directory.'],
      lineRate: 0.9,
      success: true,
    });

    const result = await TransformerTransform.run(['-j', 'coverage.json', '-f', 'sonar', '--min-coverage', '80']);

    expect(result).toEqual({ path: ['coverage-sonar.xml'] });
    expect(transformMock).toHaveBeenCalledWith(['coverage.json'], 'coverage.xml', ['sonar'], [], {
      minCoverage: 80,
      maxAnnotations: 50,
      excludePatterns: undefined,
    });
  });

  it('fails with the coverage message when below --min-coverage', async () => {
    transformMock.mockResolvedValue({ finalPaths: ['coverage.xml'], warnings: [], lineRate: 0.5, success: false });

    const error = (await TransformerTransform.run(['-j', 'coverage.json', '--min-coverage', '75']).catch(
      (e: unknown) => e,
    )) as CliError;

    expect(error.message).toBe('Coverage of 50.00% is below the required minimum of 75%.');
  });

  it('rethrows other errors unchanged', async () => {
    const original = Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' });
    transformMock.mockRejectedValue(original);

    const error = await runAndCatch();

    expect(error.message).toContain('ENOENT: no such file or directory');
    expect(error.code).toBe('ENOENT');
  });
});
