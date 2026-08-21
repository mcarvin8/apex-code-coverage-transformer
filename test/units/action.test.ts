import * as core from '@actions/core';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { run } from '../../src/action/main.js';
import { transformCoverageReport } from '../../src/transformers/coverageTransformer.js';

vi.mock('@actions/core');
vi.mock('../../src/transformers/coverageTransformer.js');

const transformMock = transformCoverageReport as unknown as Mock;
const getInputMock = core.getInput as unknown as Mock;
const getMultilineInputMock = core.getMultilineInput as unknown as Mock;

function stubInputs(inputs: Record<string, string>, multilineInputs: Record<string, string[]> = {}): void {
  getInputMock.mockImplementation((name: string) => inputs[name] ?? '');
  getMultilineInputMock.mockImplementation((name: string) => multilineInputs[name] ?? []);
}

describe('GitHub Action entrypoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps inputs to transformCoverageReport, defaulting format to sonar and trimming multiline values', async () => {
    stubInputs(
      { 'output-report': 'coverage.xml', 'min-coverage': '', 'max-annotations': '50' },
      {
        'coverage-json': ['  coverage.json  ', '', 'coverage2.json'],
        format: [],
        'ignore-package-directory': ['force-app'],
        'exclude-pattern': [],
      },
    );
    transformMock.mockResolvedValue({ finalPaths: ['coverage.xml'], warnings: [], lineRate: 0.9, success: true });

    await run();

    expect(transformMock).toHaveBeenCalledWith(
      ['coverage.json', 'coverage2.json'],
      'coverage.xml',
      ['sonar'],
      ['force-app'],
      { minCoverage: undefined, maxAnnotations: 50, excludePatterns: [] },
    );
  });

  it('sets outputs on success and does not fail the action', async () => {
    stubInputs(
      { 'output-report': 'coverage.xml', 'min-coverage': '', 'max-annotations': '50' },
      { 'coverage-json': ['coverage.json'], format: ['sonar'] },
    );
    transformMock.mockResolvedValue({
      finalPaths: ['coverage.xml'],
      warnings: ['a warning'],
      lineRate: 0.8532,
      success: true,
    });

    await run();

    expect(core.setOutput).toHaveBeenCalledWith('report-paths', 'coverage.xml');
    expect(core.setOutput).toHaveBeenCalledWith('coverage-percentage', '85.32');
    expect(core.setOutput).toHaveBeenCalledWith('warnings', 'a warning');
    expect(core.warning).toHaveBeenCalledWith('a warning');
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('fails the action when coverage is below the min-coverage threshold', async () => {
    stubInputs(
      { 'output-report': 'coverage.xml', 'min-coverage': '90', 'max-annotations': '50' },
      { 'coverage-json': ['coverage.json'], format: ['sonar'] },
    );
    transformMock.mockResolvedValue({ finalPaths: ['coverage.xml'], warnings: [], lineRate: 0.5, success: false });

    await run();

    expect(core.setOutput).toHaveBeenCalledWith('coverage-percentage', '50.00');
    expect(core.setFailed).toHaveBeenCalledWith(expect.stringMatching(/below the required minimum of 90%/));
  });

  it('fails the action when transformCoverageReport throws', async () => {
    stubInputs({ 'output-report': 'coverage.xml' }, { 'coverage-json': ['coverage.json'] });
    transformMock.mockRejectedValue(new Error('The provided JSON does not match a known coverage data format.'));

    await run();

    expect(core.setFailed).toHaveBeenCalledWith('The provided JSON does not match a known coverage data format.');
  });
});
