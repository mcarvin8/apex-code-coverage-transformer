'use strict';

import { MarkdownCoverageObject, MarkdownFileRow, MarkdownPackageRow } from '../utils/types.js';
import { BaseHandler } from './BaseHandler.js';
import { HandlerRegistry } from './HandlerRegistry.js';

type PackageAccumulator = { totalLines: number; coveredLines: number; fileCount: number };

/**
 * Handler for generating Markdown coverage summaries.
 *
 * Designed for pipeline PR / MR comments and job summary blocks
 * (e.g. `$GITHUB_STEP_SUMMARY`, GitLab MR widgets, Bitbucket comments).
 *
 * The report includes:
 * - An overall coverage summary block
 * - A per-package-directory coverage table
 * - A file coverage table sorted with the lowest coverage first
 *
 * Compatible with:
 * - GitHub Actions (job summary, sticky PR comments)
 * - GitLab CI (MR comments)
 * - Bitbucket / Azure DevOps PR comments
 * - Any tool that renders GitHub-flavored Markdown
 */
export class MarkdownCoverageHandler extends BaseHandler {
  private readonly coverageObj: MarkdownCoverageObject;
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
        fileCount: 0,
      },
      packages: [],
      files: [],
    };
  }

  public processFile(filePath: string, _fileName: string, lines: Record<string, number>): void {
    const { totalLines, coveredLines, uncoveredLines, lineRate } = this.calculateCoverage(lines);

    const fileRow: MarkdownFileRow = {
      filePath,
      totalLines,
      coveredLines,
      uncoveredLines,
      lineRate,
    };

    this.coverageObj.files.push(fileRow);

    this.totalLinesAccumulator += totalLines;
    this.coveredLinesAccumulator += coveredLines;

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

  public finalize(): MarkdownCoverageObject {
    const totalLines = this.totalLinesAccumulator;
    const coveredLines = this.coveredLinesAccumulator;
    const uncoveredLines = totalLines - coveredLines;
    const lineRate = totalLines > 0 ? coveredLines / totalLines : 0;

    this.coverageObj.summary = {
      totalLines,
      coveredLines,
      uncoveredLines,
      lineRate,
      fileCount: this.coverageObj.files.length,
    };

    this.coverageObj.packages = Array.from(this.packageMap.entries())
      .map(([directory, acc]): MarkdownPackageRow => {
        const pkgUncovered = acc.totalLines - acc.coveredLines;
        const pkgLineRate = acc.totalLines > 0 ? acc.coveredLines / acc.totalLines : 0;
        return {
          directory,
          fileCount: acc.fileCount,
          totalLines: acc.totalLines,
          coveredLines: acc.coveredLines,
          uncoveredLines: pkgUncovered,
          lineRate: pkgLineRate,
        };
      })
      .sort((a, b) => a.directory.localeCompare(b.directory));

    // Worst-covered files first (most actionable in a PR comment), tiebreak by path
    this.coverageObj.files.sort((a, b) => {
      if (a.lineRate !== b.lineRate) return a.lineRate - b.lineRate;
      return a.filePath.localeCompare(b.filePath);
    });

    return this.coverageObj;
  }
}

HandlerRegistry.register({
  name: 'markdown',
  description: 'Markdown summary for PR comments and CI job summaries',
  fileExtension: '.md',
  handler: () => new MarkdownCoverageHandler(),
  compatibleWith: ['GitHub Actions', 'GitLab CI', 'Bitbucket', 'Azure DevOps'],
});
