'use strict';

import { LcovCoverageObject, LcovFile } from '../utils/types.js';
import { BaseHandler } from './BaseHandler.js';
import { HandlerRegistry } from './HandlerRegistry.js';

/**
 * Handler for generating LCOV coverage reports.
 *
 * LCOV is a widely-used format for code coverage reporting,
 * particularly common in JavaScript/Node.js projects.
 *
 * Compatible with:
 * - Codecov
 * - Coveralls
 * - GitHub Actions
 * - LCOV analysis tools
 *
 * @see http://ltp.sourceforge.net/coverage/lcov.php
 */
export class LcovCoverageHandler extends BaseHandler {
  private readonly coverageObj: LcovCoverageObject;

  public constructor() {
    super();
    this.coverageObj = { files: [] };
  }

  public processFile(filePath: string, fileName: string, lines: Record<string, number>): void {
    const { totalLines, coveredLines } = this.calculateCoverage(lines);

    const lcovFile: LcovFile = {
      sourceFile: filePath,
      lines: [],
      totalLines,
      coveredLines,
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
    if ('files' in this.coverageObj && Array.isArray(this.coverageObj.files)) {
      this.coverageObj.files.sort((a, b) => a.sourceFile.localeCompare(b.sourceFile));
    }
    return this.coverageObj;
  }
}

// Self-register this handler
HandlerRegistry.register({
  name: 'lcovonly',
  description: 'LCOV format for JavaScript and C/C++ coverage',
  fileExtension: '.info',
  handler: () => new LcovCoverageHandler(),
  compatibleWith: ['Codecov', 'Coveralls', 'GitHub Actions'],
});
