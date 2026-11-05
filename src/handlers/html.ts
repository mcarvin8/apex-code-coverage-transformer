'use strict';

import { HtmlCoverageObject, HtmlFileCoverage, HtmlLineCoverage, HtmlPackageSummary } from '../utils/types.js';
import { BaseHandler } from './BaseHandler.js';
import { HandlerRegistry } from './HandlerRegistry.js';

/** Accumulated stats for a package directory (e.g. force-app) */
type PackageAccumulator = { totalLines: number; coveredLines: number; fileCount: number };

function toExecutableLine(lineNumber: number, hitCount: number, content: string): HtmlLineCoverage {
  return { lineNumber, hitCount, covered: hitCount > 0, content, executable: true };
}

/** Rows for coverage-data lines only. Used when the source file could not be read. */
function buildCoverageOnlyLines(lines: Record<string, number>): HtmlLineCoverage[] {
  return Object.entries(lines)
    .map(([lineNumber, hitCount]) => toExecutableLine(Number(lineNumber), hitCount, ''))
    .sort((a, b) => a.lineNumber - b.lineNumber);
}

/**
 * Rows for every line of the source file, with coverage overlaid on executable lines.
 * Coverage lines numbered past the end of the file are still listed (with empty content)
 * so no reported coverage is dropped from the view.
 */
function buildFullSourceLines(lines: Record<string, number>, sourceContent: string): HtmlLineCoverage[] {
  const sourceLines = sourceContent.split(/\r\n|\r|\n/);
  if (sourceLines.at(-1) === '') {
    sourceLines.pop();
  }

  const lastCoverageLine = Object.keys(lines).reduce((max, key) => Math.max(max, Number(key) || 0), 0);
  const lineCount = Math.max(sourceLines.length, lastCoverageLine);

  const rows: HtmlLineCoverage[] = [];
  for (let lineNumber = 1; lineNumber <= lineCount; lineNumber++) {
    const content = sourceLines[lineNumber - 1] ?? '';
    const hitCount = lines[String(lineNumber)];
    rows.push(
      hitCount === undefined
        ? { lineNumber, hitCount: 0, covered: false, content, executable: false }
        : toExecutableLine(lineNumber, hitCount, content),
    );
  }
  return rows;
}

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

    const fileLines =
      sourceContent === undefined ? buildCoverageOnlyLines(lines) : buildFullSourceLines(lines, sourceContent);

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
