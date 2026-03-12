'use strict';

import { HtmlCoverageObject, HtmlFileCoverage, HtmlPackageSummary } from '../utils/types.js';
import { BaseHandler } from './BaseHandler.js';
import { HandlerRegistry } from './HandlerRegistry.js';

/** Accumulated stats for a package directory (e.g. force-app) */
type PackageAccumulator = { totalLines: number; coveredLines: number; fileCount: number };

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
  private readonly packageMap = new Map<string, PackageAccumulator>();

  public constructor() {
    super();
    this.coverageObj = {
      summary: {
        totalLines: 0,
        coveredLines: 0,
        uncoveredLines: 0,
        lineRate: 0,
      },
      packageSummaries: [],
      files: [],
    };
  }

  public processFile(filePath: string, fileName: string, lines: Record<string, number>, sourceContent?: string): void {
    const { totalLines, coveredLines, uncoveredLines, lineRate } = this.calculateCoverage(lines);

    const sourceLines = sourceContent ? sourceContent.split(/\r?\n/) : [];

    const fileLines: HtmlFileCoverage['lines'] = Object.entries(lines)
      .map(([lineNumber, hitCount]) => {
        const num = Number(lineNumber);
        const content = sourceLines[num - 1] ?? '';
        return {
          lineNumber: num,
          hitCount,
          covered: hitCount > 0,
          content,
        };
      })
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

    // Accumulate per-package-directory (e.g. force-app)
    const directory = filePath.split('/')[0];
    const existing = this.packageMap.get(directory);
    if (existing) {
      existing.totalLines += totalLines;
      existing.coveredLines += coveredLines;
      existing.fileCount += 1;
    } else {
      this.packageMap.set(directory, { totalLines, coveredLines, fileCount: 1 });
    }
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

    // Sort files by package directory first, then by path (mimics folder structure)
    this.coverageObj.files.sort((a, b) => {
      const dirA = a.filePath.split('/')[0];
      const dirB = b.filePath.split('/')[0];
      if (dirA !== dirB) return dirA.localeCompare(dirB);
      return a.filePath.localeCompare(b.filePath);
    });

    // Build package directory summaries (e.g. force-app)
    this.coverageObj.packageSummaries = Array.from(this.packageMap.entries())
      .map(([directory, acc]): HtmlPackageSummary => {
        const pkgUncoveredLines = acc.totalLines - acc.coveredLines;
        const pkgLineRate = acc.totalLines > 0 ? acc.coveredLines / acc.totalLines : 0;
        return {
          directory,
          totalLines: acc.totalLines,
          coveredLines: acc.coveredLines,
          uncoveredLines: pkgUncoveredLines,
          lineRate: pkgLineRate,
          fileCount: acc.fileCount,
        };
      })
      .sort((a, b) => a.directory.localeCompare(b.directory));

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
