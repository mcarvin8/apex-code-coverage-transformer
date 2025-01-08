'use strict';

import { CoverageHandler, LcovCoverageObject, LcovFile } from '../helpers/types.js';
import { setCoveredLinesLcov } from '../helpers/setCoveredLinesLcov.js';
import { normalizePathToUnix } from '../helpers/normalizePathToUnix.js';

export class LcovCoverageHandler implements CoverageHandler {
  private readonly coverageObj: LcovCoverageObject;

  public constructor() {
    this.coverageObj = { files: [] };
  }

  public async processFile(
    filePath: string,
    fileName: string,
    lines: Record<string, number>,
    uncoveredLines: number[],
    coveredLines: number[],
    repoRoot: string,
    reportType: 'test' | 'deploy'
  ): Promise<void> {
    const lcovFile: LcovFile = {
      sourceFile: normalizePathToUnix(filePath),
      lines: [],
      totalLines: uncoveredLines.length + coveredLines.length,
      coveredLines: coveredLines.length,
    };

    if (reportType === 'test') {
      for (const [lineNumber, isCovered] of Object.entries(lines)) {
        lcovFile.lines.push({
          lineNumber: Number(lineNumber),
          hitCount: isCovered === 1 ? 1 : 0,
        });
      }
    } else if (reportType === 'deploy') {
      lcovFile.lines = uncoveredLines.map((lineNumber) => ({
        lineNumber: Number(lineNumber),
        hitCount: 0,
      }));
      await setCoveredLinesLcov(coveredLines, uncoveredLines, repoRoot, filePath, lcovFile);
    }

    this.coverageObj.files.push(lcovFile);
  }

  public finalize(): LcovCoverageObject {
    return this.coverageObj;
  }
}
