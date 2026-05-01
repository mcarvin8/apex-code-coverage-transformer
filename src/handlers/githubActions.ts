'use strict';

import { GitHubActionsCoverageObject } from '../utils/types.js';
import { BaseHandler } from './BaseHandler.js';
import { HandlerRegistry } from './HandlerRegistry.js';

/**
 * Handler for generating GitHub Actions workflow command output.
 *
 * Emits one `::warning file=...,line=...` annotation per uncovered Apex line
 * plus a `::notice` summary line. When the resulting file is printed to stdout
 * by a workflow step, the GitHub Actions runner renders the annotations
 * inline on the PR diff and on the workflow run page.
 *
 * Pairs with the existing `sf-cat` plugin's GitHub Actions output for code
 * quality, giving Salesforce teams a unified annotation experience for
 * coverage and quality on the same PR.
 *
 * @see https://docs.github.com/en/actions/reference/workflow-commands-for-github-actions
 *
 * @example
 * ```yaml
 * - name: Transform coverage to GitHub Actions annotations
 *   run: sf acc-transformer transform -j coverage.json -r coverage.txt -f github-actions
 * - name: Emit annotations
 *   run: cat coverage.txt
 * ```
 */
export class GitHubActionsCoverageHandler extends BaseHandler {
  private readonly coverageObj: GitHubActionsCoverageObject;
  private totalLinesAccumulator = 0;
  private coveredLinesAccumulator = 0;
  private fileCount = 0;

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
      uncoveredLines: [],
    };
  }

  public processFile(filePath: string, _fileName: string, lines: Record<string, number>): void {
    const { totalLines, coveredLines } = this.calculateCoverage(lines);

    this.totalLinesAccumulator += totalLines;
    this.coveredLinesAccumulator += coveredLines;
    this.fileCount += 1;

    const uncovered = this.extractLinesByStatus(lines, false);
    for (const lineNumber of uncovered) {
      this.coverageObj.uncoveredLines.push({ filePath, lineNumber });
    }
  }

  public finalize(): GitHubActionsCoverageObject {
    const totalLines = this.totalLinesAccumulator;
    const coveredLines = this.coveredLinesAccumulator;
    const uncoveredLines = totalLines - coveredLines;
    const lineRate = totalLines > 0 ? coveredLines / totalLines : 0;

    this.coverageObj.summary = {
      totalLines,
      coveredLines,
      uncoveredLines,
      lineRate,
      fileCount: this.fileCount,
    };

    this.coverageObj.uncoveredLines.sort((a, b) => {
      const pathCompare = a.filePath.localeCompare(b.filePath);
      if (pathCompare !== 0) return pathCompare;
      return a.lineNumber - b.lineNumber;
    });

    return this.coverageObj;
  }
}

HandlerRegistry.register({
  name: 'github-actions',
  description: 'GitHub Actions workflow command annotations for uncovered lines',
  fileExtension: '.txt',
  handler: () => new GitHubActionsCoverageHandler(),
  compatibleWith: ['GitHub Actions'],
});
