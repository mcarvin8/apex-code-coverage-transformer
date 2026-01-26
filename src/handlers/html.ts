'use strict';

import { HtmlCoverageObject, HtmlFileCoverage } from '../utils/types.js';
import { BaseHandler } from './BaseHandler.js';
import { HandlerRegistry } from './HandlerRegistry.js';

/**
 * Handler for generating HTML coverage reports.
 *
 * This format provides a human-readable, interactive HTML report
 * with summary statistics and file-by-file coverage details.
 *
 * Compatible with:
 * - Web browsers
 * - CI/CD artifact viewing
 * - Local development review
 *
 * @example
 * The HTML report includes:
 * - Overall coverage summary
 * - File-by-file breakdown
 * - Line-by-line coverage visualization
 * - Color-coded coverage indicators
 */
export class HtmlCoverageHandler extends BaseHandler {
  private readonly coverageObj: HtmlCoverageObject;
  private totalLinesAccumulator = 0;
  private coveredLinesAccumulator = 0;

  public constructor() {
    super();
    this.coverageObj = {
      summary: {
        totalLines: 0,
        coveredLines: 0,
        uncoveredLines: 0,
        lineRate: 0,
      },
      files: [],
    };
  }

  public processFile(filePath: string, fileName: string, lines: Record<string, number>): void {
    const { totalLines, coveredLines, uncoveredLines, lineRate } = this.calculateCoverage(lines);

    const fileLines: HtmlFileCoverage['lines'] = Object.entries(lines)
      .map(([lineNumber, hitCount]) => ({
        lineNumber: Number(lineNumber),
        hitCount,
        covered: hitCount > 0,
      }))
      .sort((a, b) => a.lineNumber - b.lineNumber);

    const fileCoverage: HtmlFileCoverage = {
      filePath,
      fileName,
      totalLines,
      coveredLines,
      uncoveredLines,
      lineRate,
      lines: fileLines,
    };

    this.coverageObj.files.push(fileCoverage);

    // Accumulate totals
    this.totalLinesAccumulator += totalLines;
    this.coveredLinesAccumulator += coveredLines;
  }

  public finalize(): HtmlCoverageObject {
    // Calculate summary
    const uncoveredLines = this.totalLinesAccumulator - this.coveredLinesAccumulator;
    const lineRate = this.totalLinesAccumulator > 0 ? this.coveredLinesAccumulator / this.totalLinesAccumulator : 0;

    this.coverageObj.summary = {
      totalLines: this.totalLinesAccumulator,
      coveredLines: this.coveredLinesAccumulator,
      uncoveredLines,
      lineRate,
    };

    // Sort files by path for deterministic output
    this.coverageObj.files.sort((a, b) => a.filePath.localeCompare(b.filePath));

    return this.coverageObj;
  }
}

// Self-register this handler
HandlerRegistry.register({
  name: 'html',
  description: 'HTML format for human-readable coverage reports',
  fileExtension: '.html',
  handler: () => new HtmlCoverageHandler(),
  compatibleWith: ['Web Browsers', 'CI/CD Artifacts', 'Local Development'],
});
