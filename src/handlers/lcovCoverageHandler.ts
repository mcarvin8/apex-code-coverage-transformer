'use strict';

import { CoverageHandler, LcovCoverageObject, LcovFile } from '../helpers/types.js';

export class LcovCoverageHandler implements CoverageHandler {
  private readonly coverageObj: LcovCoverageObject;

  public constructor() {
    this.coverageObj = { files: [] };
  }

  public processFile(
    filePath: string,
    fileName: string,
    lines: Record<string, number>,
  ): void {
    const uncoveredLines = Object.keys(lines)
      .filter((lineNumber) => lines[lineNumber] === 0)
      .map(Number);
    const coveredLines = Object.keys(lines)
      .filter((lineNumber) => lines[lineNumber] === 1)
      .map(Number);

    const lcovFile: LcovFile = {
      sourceFile: filePath,
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
