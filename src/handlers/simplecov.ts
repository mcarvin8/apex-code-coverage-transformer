'use strict';

import { SimpleCovCoverageObject } from '../utils/types.js';
import { BaseHandler } from './BaseHandler.js';
import { HandlerRegistry } from './HandlerRegistry.js';

/**
 * Handler for generating SimpleCov JSON coverage reports.
 *
 * SimpleCov is a popular Ruby code coverage tool. This format is also
 * accepted by Codecov and other coverage aggregation tools.
 *
 * The format is an array of hit counts per line, with null for non-executable lines.
 *
 * Compatible with:
 * - Codecov
 * - SimpleCov analyzers
 * - Ruby coverage tools
 * - Custom parsers
 *
 * @see https://github.com/simplecov-ruby/simplecov
 *
 * @example
 * ```json
 * {
 *   "coverage": {
 *     "path/to/file.cls": [1, 1, 0, 1, null, 1]
 *   },
 *   "timestamp": 1234567890
 * }
 * ```
 */
export class SimpleCovCoverageHandler extends BaseHandler {
  private readonly coverageObj: SimpleCovCoverageObject;

  public constructor() {
    super();
    this.coverageObj = {
      coverage: {},
      timestamp: Math.floor(Date.now() / 1000),
    };
  }

  public processFile(filePath: string, _fileName: string, lines: Record<string, number>): void {
    // Find the maximum line number to determine array size
    const lineNumbers = Object.keys(lines).map(Number);
    const maxLine = Math.max(...lineNumbers);

    // Create array with nulls for non-executable lines
    const lineArray: Array<number | null> = new Array<number | null>(maxLine).fill(null);

    // Fill in the coverage data (SimpleCov uses 0-indexed arrays, but line numbers are 1-indexed)
    for (const [lineNumber, hits] of Object.entries(lines)) {
      const lineIdx = Number(lineNumber) - 1; // Convert to 0-index
      lineArray[lineIdx] = hits;
    }

    this.coverageObj.coverage[filePath] = lineArray;
  }

  public finalize(): SimpleCovCoverageObject {
    return this.coverageObj;
  }
}

// Self-register this handler
HandlerRegistry.register({
  name: 'simplecov',
  description: 'SimpleCov JSON format compatible with Ruby coverage tools',
  fileExtension: '.json',
  handler: () => new SimpleCovCoverageHandler(),
  compatibleWith: ['Codecov', 'SimpleCov', 'Ruby Tools'],
});
