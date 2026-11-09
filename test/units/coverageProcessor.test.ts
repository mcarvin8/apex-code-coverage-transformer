import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { getCoverageHandler } from '../../src/handlers/getHandler.js';
import { processDeployCoverage, processTestCoverage } from '../../src/transformers/coverageProcessor.js';
import type { CoverageProcessingContext, DeployCoverageData, TestCoverageData } from '../../src/utils/types.js';

type Handler = ReturnType<typeof getCoverageHandler>;

const repoRoot = resolve('.');
const relativePath = 'test/fixtures/samples/classes/AccountProfile.cls';
// Real AccountProfile.cls lines: 17 (if condition) covered, 18 (early return) uncovered.
const coverageLines = { '17': 1, '18': 0 };

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
      s: { ...coverageLines },
      statementMap: {},
    },
  };
}

describe('coverageProcessor', () => {
  it('passes deploy coverage lines to handlers unchanged', async () => {
    const { context, processFile } = createContext();
    const data = deployData();

    const result = await processDeployCoverage(data, context);

    expect(processFile).toHaveBeenCalledWith(relativePath, 'AccountProfile', coverageLines, undefined);
    expect(data['no-map/AccountProfile'].s).toEqual(coverageLines);
    expect(result).toEqual({
      processed: 1,
      totalLines: 2,
      coveredLines: 1,
      files: [
        {
          path: relativePath,
          name: 'AccountProfile',
          totalLines: 2,
          coveredLines: 1,
          lineRate: 0.5,
          uncoveredLines: [18],
        },
      ],
    });
  });

  it('strips repeated separators after the no-map prefix', async () => {
    const { context, processFile } = createContext();
    const data: TestCoverageData[] = [
      {
        id: '01p',
        name: 'no-map//AccountProfile',
        totalLines: 1,
        lines: { '1': 1 },
        totalCovered: 1,
        coveredPercent: 100,
      },
    ];

    await processTestCoverage(data, context);

    expect(context.warnings).toEqual([]);
    expect(processFile).toHaveBeenCalledWith(relativePath, 'AccountProfile', { '1': 1 }, undefined);
  });

  it('sorts the per-file summary by path regardless of input order', async () => {
    const { context } = createContext();
    context.filePathCache = new Map([
      ['Zeta.cls', 'force-app/classes/Zeta.cls'],
      ['Alpha.cls', 'force-app/classes/Alpha.cls'],
    ]);
    const entry = (name: string): TestCoverageData => ({
      id: name,
      name,
      totalLines: 1,
      lines: { '1': 1 },
      totalCovered: 1,
      coveredPercent: 100,
    });

    const result = await processTestCoverage([entry('Zeta'), entry('Alpha')], context);

    expect(result.files.map((f) => f.path)).toEqual(['force-app/classes/Alpha.cls', 'force-app/classes/Zeta.cls']);
  });

  it('passes test coverage lines to handlers unchanged', async () => {
    const { context, processFile } = createContext();
    const data: TestCoverageData[] = [
      {
        id: '01p000000000000',
        name: 'AccountProfile',
        totalLines: 2,
        lines: { ...coverageLines },
        totalCovered: 1,
        coveredPercent: 50,
      },
    ];

    await processTestCoverage(data, context);

    expect(processFile).toHaveBeenCalledWith(relativePath, 'AccountProfile', coverageLines, undefined);
  });

  it('passes source content to handlers for deploy coverage when html format is requested', async () => {
    const { context, processFile } = createContext(['html']);
    const sourceContent = await readFile(resolve(repoRoot, relativePath), 'utf-8');

    await processDeployCoverage(deployData(), context);

    expect(processFile).toHaveBeenCalledWith(relativePath, 'AccountProfile', coverageLines, sourceContent);
  });

  describe('source read warnings', () => {
    const missingPath = 'test/fixtures/samples/classes/DoesNotExist.cls';

    function missingFileContext(formats: string[]): ReturnType<typeof createContext> {
      const created = createContext(formats);
      created.context.filePathCache = new Map([['AccountProfile.cls', missingPath]]);
      return created;
    }

    it('warns and passes undefined source when the html source file cannot be read', async () => {
      const { context, processFile } = missingFileContext(['html']);

      await processDeployCoverage(deployData(), context);

      expect(context.warnings).toEqual([
        `Could not read source file ${missingPath}; the HTML report will show coverage for this file without line contents.`,
      ]);
      expect(processFile).toHaveBeenCalledWith(missingPath, 'AccountProfile', coverageLines, undefined);
    });

    it('warns for test coverage too', async () => {
      const { context } = missingFileContext(['html']);
      const data: TestCoverageData[] = [
        { id: '01p', name: 'AccountProfile', totalLines: 1, lines: { '1': 1 }, totalCovered: 1, coveredPercent: 100 },
      ];

      await processTestCoverage(data, context);

      expect(context.warnings).toHaveLength(1);
      expect(context.warnings[0]).toContain(missingPath);
    });

    it('does not read or warn when html is not requested', async () => {
      const { context } = missingFileContext(['sonar']);

      await processDeployCoverage(deployData(), context);

      expect(context.warnings).toEqual([]);
    });

    it('does not warn when the source file is read successfully', async () => {
      const { context } = createContext(['html']);

      await processDeployCoverage(deployData(), context);

      expect(context.warnings).toEqual([]);
    });
  });
});
