import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { getCoverageHandler } from '../../src/handlers/getHandler.js';
import { processDeployCoverage, processTestCoverage } from '../../src/transformers/coverageProcessor.js';
import type { CoverageProcessingContext, DeployCoverageData, TestCoverageData } from '../../src/utils/types.js';

type Handler = ReturnType<typeof getCoverageHandler>;

const repoRoot = resolve('.');
const relativePath = 'test/fixtures/samples/classes/AccountProfile.cls';
// AccountProfile.cls is ~94 lines, so line 500 is out of range
const outOfRangeLines = { '2': 0, '500': 1 };

function createContext(formats: string[] = ['sonar']): {
  context: CoverageProcessingContext;
  processFile: ReturnType<typeof vi.fn>;
} {
  const processFile = vi.fn();
  const handlers = new Map<string, Handler>();
  for (const format of formats) {
    handlers.set(format, { processFile, finalize: vi.fn() } as unknown as Handler);
  }
  return {
    processFile,
    context: {
      handlers,
      packageDirs: [],
      repoRoot,
      concurrencyLimit: 1,
      warnings: [],
      filePathCache: new Map([['AccountProfile.cls', relativePath]]),
      excludePatterns: [],
    },
  };
}

function deployData(): DeployCoverageData {
  return {
    'no-map/AccountProfile': {
      fnMap: {},
      branchMap: {},
      path: 'no-map/AccountProfile',
      f: {},
      b: {},
      s: { ...outOfRangeLines },
      statementMap: {},
    },
  };
}

describe('coverageProcessor', () => {
  it('remaps out-of-range covered lines for deploy coverage before handlers receive them', async () => {
    const { context, processFile } = createContext();
    const data = deployData();

    const result = await processDeployCoverage(data, context);

    const expectedLines = { '1': 1, '2': 0 };
    expect(processFile).toHaveBeenCalledWith(relativePath, 'AccountProfile', expectedLines, undefined);
    expect(data['no-map/AccountProfile'].s).toEqual(expectedLines);
    expect(result).toEqual({ processed: 1, totalLines: 2, coveredLines: 1 });
  });

  it('does not remap lines for test coverage', async () => {
    const { context, processFile } = createContext();
    const data: TestCoverageData[] = [
      {
        id: '01p000000000000',
        name: 'AccountProfile',
        totalLines: 2,
        lines: { ...outOfRangeLines },
        totalCovered: 1,
        coveredPercent: 50,
      },
    ];

    await processTestCoverage(data, context);

    expect(processFile).toHaveBeenCalledWith(relativePath, 'AccountProfile', outOfRangeLines, undefined);
  });

  it('passes source content to handlers for deploy coverage when html format is requested', async () => {
    const { context, processFile } = createContext(['html']);
    const sourceContent = await readFile(resolve(repoRoot, relativePath), 'utf-8');

    await processDeployCoverage(deployData(), context);

    expect(processFile).toHaveBeenCalledWith(relativePath, 'AccountProfile', { '1': 1, '2': 0 }, sourceContent);
  });
});
