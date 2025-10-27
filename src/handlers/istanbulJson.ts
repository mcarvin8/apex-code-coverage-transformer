'use strict';

import { IstanbulCoverageMap, IstanbulCoverageFile, IstanbulCoverageObject, SourceRange } from '../utils/types.js';
import { BaseHandler } from './BaseHandler.js';
import { HandlerRegistry } from './HandlerRegistry.js';

/**
 * Handler for generating Istanbul/NYC JSON coverage reports.
 *
 * Istanbul is the most widely-used JavaScript code coverage tool.
 * This format is compatible with NYC, Codecov, and many other tools.
 *
 * Compatible with:
 * - Istanbul/NYC
 * - Codecov
 * - Coveralls
 * - Node.js coverage tools
 *
 * @see https://istanbul.js.org/
 */
export class IstanbulCoverageHandler extends BaseHandler {
  private coverageMap: IstanbulCoverageMap = {};

  public constructor() {
    super();
  }

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
    // Sort coverage map by file path for deterministic output
    const sortedKeys = Object.keys(this.coverageMap).sort();
    const sortedMap: IstanbulCoverageMap = {};

    for (const key of sortedKeys) {
      sortedMap[key] = this.coverageMap[key];
    }

    return sortedMap;
  }
}

// Self-register this handler
HandlerRegistry.register({
  name: 'json',
  description: 'Istanbul JSON format for Node.js and JavaScript tools',
  fileExtension: '.json',
  handler: () => new IstanbulCoverageHandler(),
  compatibleWith: ['Istanbul/NYC', 'Codecov', 'Coveralls', 'Node.js Tools'],
});
