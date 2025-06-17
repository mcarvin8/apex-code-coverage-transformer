'use strict';

import {
  IstanbulCoverageMap,
  IstanbulCoverageFile,
  IstanbulCoverageObject,
  CoverageHandler,
  SourceRange,
} from '../utils/types.js';

export class IstanbulCoverageHandler implements CoverageHandler {
  private coverageMap: IstanbulCoverageMap = {};

  public processFile(filePath: string, fileName: string, lines: Record<string, number>): void {
    const statementMap: Record<string, SourceRange> = {};
    const s: Record<string, number> = {};
    const lineCoverage: Record<string, number> = {};

    for (const [lineNumber, hits] of Object.entries(lines)) {
      const line = Number(lineNumber);
      lineCoverage[lineNumber] = hits;
      statementMap[lineNumber] = {
        start: { line, column: 0 },
        end: { line, column: 0 },
      };
      s[lineNumber] = hits;
    }

    const coverageFile: IstanbulCoverageFile = {
      path: filePath,
      statementMap,
      fnMap: {},
      branchMap: {},
      s,
      f: {},
      b: {},
      l: lineCoverage,
    };

    this.coverageMap[filePath] = coverageFile;
  }

  public finalize(): IstanbulCoverageObject {
    return this.coverageMap;
  }
}
