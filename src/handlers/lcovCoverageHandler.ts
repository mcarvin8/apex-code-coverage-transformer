'use strict';

import { CoverageHandler, LcovCoverageObject, LcovFile } from '../helpers/types.js';
import { normalizePathToUnix } from '../helpers/normalizePathToUnix.js';

export class LcovCoverageHandler implements CoverageHandler {
  private readonly coverageObj: LcovCoverageObject;

  public constructor() {
    this.coverageObj = { files: [] };
  }

  public processFile(
    filePath: string,
    fileName: string,
    lines: Record<string, number>,
    uncoveredLines: number[],
    coveredLines: number[],
  ): void {
    const lcovFile: LcovFile = {
      sourceFile: normalizePathToUnix(filePath),
      lines: [],
      totalLines: uncoveredLines.length + coveredLines.length,
      coveredLines: coveredLines.length,
    };

    for (const [lineNumber, isCovered] of Object.entries(lines)) {
      lcovFile.lines.push({
        lineNumber: Number(lineNumber),
        hitCount: isCovered === 1 ? 1 : 0,
      });
    }

    this.coverageObj.files.push(lcovFile);
  }

  public finalize(): LcovCoverageObject {
    return this.coverageObj;
  }
}
