'use strict';

import { JsonSummaryCoverageObject, JsonSummaryFileCoverage } from '../utils/types.js';
import { BaseHandler } from './BaseHandler.js';
import { HandlerRegistry } from './HandlerRegistry.js';

/**
 * Handler for generating JSON Summary coverage reports.
 *
 * This format provides a concise summary of coverage statistics,
 * ideal for badges, PR comments, and quick analysis.
 *
 * Compatible with:
 * - GitHub Actions (for badges and PR comments)
 * - GitLab CI (for MR comments)
 * - Custom reporting dashboards
 *
 * @example
 * ```json
 * {
 *   "total": {
 *     "lines": { "total": 100, "covered": 75, "skipped": 0, "pct": 75 }
 *   },
 *   "files": {
 *     "path/to/file.cls": {
 *       "lines": { "total": 50, "covered": 40, "skipped": 0, "pct": 80 }
 *     }
 *   }
 * }
 * ```
 */
export class JsonSummaryCoverageHandler extends BaseHandler {
  private readonly coverageObj: JsonSummaryCoverageObject;

  public constructor() {
    super();
    this.coverageObj = {
      total: {
        lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
        statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
      },
      files: {},
    };
  }

  public processFile(filePath: string, _fileName: string, lines: Record<string, number>): void {
    const { totalLines, coveredLines } = this.calculateCoverage(lines);
    const pct = totalLines > 0 ? Number(((coveredLines / totalLines) * 100).toFixed(2)) : 0;

    const fileCoverage: JsonSummaryFileCoverage = {
      lines: {
        total: totalLines,
        covered: coveredLines,
        skipped: 0,
        pct,
      },
      statements: {
        total: totalLines,
        covered: coveredLines,
        skipped: 0,
        pct,
      },
    };

    this.coverageObj.files[filePath] = fileCoverage;

    // Update totals
    this.coverageObj.total.lines.total += totalLines;
    this.coverageObj.total.lines.covered += coveredLines;
    this.coverageObj.total.statements.total += totalLines;
    this.coverageObj.total.statements.covered += coveredLines;
  }

  public finalize(): JsonSummaryCoverageObject {
    // Calculate total percentages
    const totalLines = this.coverageObj.total.lines.total;
    const totalCovered = this.coverageObj.total.lines.covered;

    if (totalLines > 0) {
      const pct = Number(((totalCovered / totalLines) * 100).toFixed(2));
      this.coverageObj.total.lines.pct = pct;
      this.coverageObj.total.statements.pct = pct;
    }

    return this.coverageObj;
  }
}

// Self-register this handler
HandlerRegistry.register({
  name: 'json-summary',
  description: 'JSON Summary format for badges and quick analysis',
  fileExtension: '.json',
  handler: () => new JsonSummaryCoverageHandler(),
  compatibleWith: ['GitHub Actions', 'GitLab CI', 'Custom Dashboards'],
});
