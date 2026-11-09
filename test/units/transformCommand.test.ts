'use strict';

import { resolve } from 'node:path';
import { Config } from '@oclif/core';
import { afterEach, beforeAll, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

const transformMock = vi.hoisted(() => vi.fn());
vi.mock('../../src/transformers/coverageTransformer.js', () => ({ transformCoverageReport: transformMock }));

import TransformerTransform from '../../src/commands/acc-transformer/transform.js';
import { CoverageError } from '../../src/utils/errors.js';

// Loading the oclif config is slow (seconds on Windows CI), so load it once and reuse it
// rather than letting each run() load it again.
let config: Config;

function runCommand(argv: string[]): ReturnType<typeof TransformerTransform.run> {
  return TransformerTransform.run(argv, config);
}

type CliError = { code?: string; exitCode?: number; message: string; cause?: unknown };

async function runAndCatch(argv: string[] = ['-j', 'coverage.json']): Promise<CliError> {
  return (await runCommand(argv).catch((e: unknown) => e)) as CliError;
}

/** Walks the `cause` chain, since SfCommand may wrap the thrown error. */
function causeChain(error: unknown): unknown[] {
  const chain: unknown[] = [];
  let current = (error as { cause?: unknown } | undefined)?.cause;
  while (current !== undefined && chain.length < 10) {
    chain.push(current);
    current = (current as { cause?: unknown }).cause;
  }
  return chain;
}

function succeed(overrides: Partial<{ finalPaths: string[]; warnings: string[] }> = {}): void {
  transformMock.mockResolvedValue({
    finalPaths: ['coverage.xml'],
    warnings: [],
    lineRate: 0.9,
    success: true,
    ...overrides,
  });
}

describe('transform command', () => {
  beforeAll(async () => {
    config = await Config.load(resolve('.'));
  }, 60_000);

  let logSpy: MockInstance;
  let warnSpy: MockInstance;

  beforeEach(() => {
    logSpy = vi.spyOn(TransformerTransform.prototype, 'log').mockImplementation(() => {});
    warnSpy = vi.spyOn(TransformerTransform.prototype, 'warn').mockImplementation((input) => input);
  });

  afterEach(() => {
    transformMock.mockReset();
    vi.restoreAllMocks();
    // SfCommand.catch sets process.exitCode, and SfCommandError reads it back on the next failure.
    process.exitCode = undefined;
  });

  it('applies defaults when only --coverage-json is given', async () => {
    succeed();

    await runCommand(['--coverage-json', 'coverage.json']);

    expect(transformMock).toHaveBeenCalledWith(['coverage.json'], 'coverage.xml', ['sonar'], [], {
      minCoverage: undefined,
      maxAnnotations: 50,
      excludePatterns: undefined,
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('passes short flags and repeated values through', async () => {
    succeed();

    await runCommand([
      '-j',
      'a.json',
      '-j',
      'b.json',
      '-r',
      'out.xml',
      '-f',
      'sonar',
      '-f',
      'cobertura',
      '-i',
      'force-app',
      '-i',
      'packaged',
      '-e',
      '**/*Test*',
      '-e',
      '**/mock/**',
      '--min-coverage',
      '80',
      '--max-annotations',
      '5',
    ]);

    expect(transformMock).toHaveBeenCalledWith(
      ['a.json', 'b.json'],
      'out.xml',
      ['sonar', 'cobertura'],
      ['force-app', 'packaged'],
      { minCoverage: 80, maxAnnotations: 5, excludePatterns: ['**/*Test*', '**/mock/**'] },
    );
  });

  it('logs every report path and returns them', async () => {
    succeed({ finalPaths: ['coverage-sonar.xml', 'coverage-cobertura.xml'] });

    const result = await runCommand(['-j', 'coverage.json', '-f', 'sonar', '-f', 'cobertura']);

    expect(result).toEqual({ path: ['coverage-sonar.xml', 'coverage-cobertura.xml'] });
    expect(logSpy).toHaveBeenCalledWith(
      'The coverage report has been written to: coverage-sonar.xml, coverage-cobertura.xml',
    );
  });

  it('emits each transform warning', async () => {
    succeed({ warnings: ['first warning', 'second warning'] });

    await runCommand(['-j', 'coverage.json']);

    expect(warnSpy.mock.calls).toEqual([['first warning'], ['second warning']]);
  });

  it('requires --coverage-json', async () => {
    const error = await runAndCatch([]);

    expect(error.message).toContain('Missing required flag');
    expect(transformMock).not.toHaveBeenCalled();
  });

  it('rejects --min-coverage above 100', async () => {
    const error = await runAndCatch(['-j', 'coverage.json', '--min-coverage', '101']);

    expect(error.message).toContain('Expected an integer less than or equal to 100');
    expect(transformMock).not.toHaveBeenCalled();
  });

  it('fails with the coverage message when below --min-coverage', async () => {
    transformMock.mockResolvedValue({ finalPaths: ['coverage.xml'], warnings: [], lineRate: 0.5, success: false });

    const error = await runAndCatch(['-j', 'coverage.json', '--min-coverage', '75']);

    expect(error.message).toBe('Coverage of 50.00% is below the required minimum of 75%.');
  });

  it('does not surface CoverageError codes, keeping CLI output as "Error (1): ..."', async () => {
    const original = new CoverageError('The provided JSON does not match a known coverage data format.', {
      code: 'UNKNOWN_INPUT_FORMAT',
    });
    transformMock.mockRejectedValue(original);

    const error = await runAndCatch();

    expect(error.message).toContain('The provided JSON does not match a known coverage data format');
    expect(error.code).not.toBe('UNKNOWN_INPUT_FORMAT');
    expect(error.exitCode).toBe(1);
    expect(causeChain(error)).toContain(original);
  });

  it('rethrows other errors unchanged', async () => {
    const original = Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' });
    transformMock.mockRejectedValue(original);

    const error = await runAndCatch();

    expect(error.message).toContain('ENOENT: no such file or directory');
    expect(error.code).toBe('ENOENT');
  });
});
