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
 * **Format Origin**: SimpleCov (Ruby coverage tool)
 *
 * @see https://github.com/simplecov-ruby/simplecov
 * @see https://github.com/vicentllongo/simplecov-json
 * @see https://docs.codecov.com/docs/codecov-uploader
 *
 * **Format Structure**:
 * The format uses an array of hit counts per line, with null for non-executable lines.
 * Array indices are 0-based (index 0 = line 1, index 1 = line 2, etc.)
 *
 * **Apex-Specific Adaptations**:
 * - Only lines present in Apex coverage data are tracked
 * - Lines not in coverage data are marked as `null` (non-executable)
 * - This works well with Apex since Salesforce only reports executable lines
 *
 * **Advantages for Apex**:
 * - Simple, compact format
 * - Direct mapping from Apex line coverage to SimpleCov format
 * - Well-supported by Codecov and similar platforms
 *
 * Compatible with:
 * - Codecov
 * - SimpleCov analyzers
 * - Ruby coverage tools
 * - Custom parsers
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
    // SimpleCov uses null to indicate lines that are not executable/trackable
    const lineArray: Array<number | null> = new Array<number | null>(maxLine).fill(null);

    // Fill in the coverage data
    // SimpleCov arrays are 0-indexed, but line numbers are 1-indexed
    // So line 1 goes into array index 0, line 2 into index 1, etc.
    for (const [lineNumber, hits] of Object.entries(lines)) {
      const lineIdx = Number(lineNumber) - 1; // Convert to 0-index
      lineArray[lineIdx] = hits; // Store hit count (0 = uncovered, >0 = covered)
    }

    this.coverageObj.coverage[filePath] = lineArray;
  }

  public finalize(): SimpleCovCoverageObject {
    // Sort coverage object by file path for deterministic output
    const sortedKeys = Object.keys(this.coverageObj.coverage).sort();
    const sortedCoverage: Record<string, Array<number | null>> = {};

    for (const key of sortedKeys) {
      sortedCoverage[key] = this.coverageObj.coverage[key];
    }

    this.coverageObj.coverage = sortedCoverage;

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
