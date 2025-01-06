'use strict';
/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */

import { CoberturaCoverageObject, CoberturaPackage, CoberturaClass, CoverageHandler } from '../helpers/types.js';
import { setCoveredLinesCobertura } from '../helpers/setCoveredLinesCobertura.js';
import { normalizePathToUnix } from '../helpers/normalizePathToUnix.js';

export class CoberturaCoverageHandler implements CoverageHandler {
  private coverageObj: CoberturaCoverageObject;
  private packageObj: CoberturaPackage;

  public constructor() {
    this.coverageObj = {
      coverage: {
        '@lines-valid': 0,
        '@lines-covered': 0,
        '@line-rate': 0,
        '@branches-valid': 0,
        '@branches-covered': 0,
        '@branch-rate': 1,
        '@timestamp': Date.now(),
        '@complexity': 0,
        '@version': '0.1',
        sources: { source: ['.'] },
        packages: { package: [] },
      },
    };
    this.packageObj = {
      '@name': 'main',
      '@line-rate': 0,
      '@branch-rate': 1,
      classes: { class: [] },
    };
    this.coverageObj.coverage.packages.package.push(this.packageObj);
  }

  public async processFile(
    filePath: string,
    fileName: string,
    lines: Record<string, number>,
    uncoveredLines: number[],
    coveredLines: number[],
    repoRoot: string,
    reportType: 'test' | 'deploy'
  ): Promise<void> {
    const classObj: CoberturaClass = {
      '@name': fileName,
      '@filename': normalizePathToUnix(filePath),
      '@line-rate': '0',
      '@branch-rate': '1',
      methods: {},
      lines: { line: [] },
    };

    if (reportType === 'test') {
      for (const [lineNumber, isCovered] of Object.entries(lines)) {
        classObj.lines.line.push({
          '@number': Number(lineNumber),
          '@hits': isCovered === 1 ? 1 : 0,
          '@branch': 'false',
        });
      }
    } else if (reportType === 'deploy') {
      // Process uncovered lines first
      classObj.lines.line = uncoveredLines.map((lineNumber) => ({
        '@number': lineNumber,
        '@hits': 0,
        '@branch': 'false',
      }));
      // Process covered lines using `setCoveredLinesCobertura`
      await setCoveredLinesCobertura(coveredLines, uncoveredLines, repoRoot, filePath, classObj);
    }

    // Update coverage metrics
    const totalLines = uncoveredLines.length + coveredLines.length;
    const coveredLineCount = coveredLines.length;

    this.coverageObj.coverage['@lines-valid'] += totalLines;
    this.coverageObj.coverage['@lines-covered'] += coveredLineCount;

    this.packageObj['@line-rate'] = Number(
      (this.coverageObj.coverage['@lines-covered'] / this.coverageObj.coverage['@lines-valid']).toFixed(4)
    );
    this.coverageObj.coverage['@line-rate'] = this.packageObj['@line-rate'];

    this.packageObj.classes.class.push(classObj);
  }

  public finalize(): CoberturaCoverageObject {
    return this.coverageObj;
  }
}
