'use strict';

import { CoberturaCoverageObject, CoberturaPackage, CoberturaClass, CoverageHandler } from '../helpers/types.js';

export class CoberturaCoverageHandler implements CoverageHandler {
  private readonly coverageObj: CoberturaCoverageObject;
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

  public processFile(
    filePath: string,
    fileName: string,
    lines: Record<string, number>,
  ): void {
    const classObj: CoberturaClass = {
      '@name': fileName,
      '@filename': filePath,
      '@line-rate': '0',
      '@branch-rate': '1',
      methods: {},
      lines: { line: [] },
    };

    const uncoveredLines = Object.keys(lines)
      .filter((lineNumber) => lines[lineNumber] === 0)
      .map(Number);
    const coveredLines = Object.keys(lines)
      .filter((lineNumber) => lines[lineNumber] === 1)
      .map(Number);

    const totalLines = uncoveredLines.length + coveredLines.length;
    const coveredLineCount = coveredLines.length;

    for (const [lineNumber, isCovered] of Object.entries(lines)) {
      classObj.lines.line.push({
        '@number': Number(lineNumber),
        '@hits': isCovered === 1 ? 1 : 0,
        '@branch': 'false',
      });
    }

    // Calculate and set the line rate for this class
    if (totalLines > 0) {
      const lineRate = (coveredLineCount / totalLines).toFixed(4);
      classObj['@line-rate'] = lineRate;
    }

    this.coverageObj.coverage['@lines-valid'] += totalLines;
    this.coverageObj.coverage['@lines-covered'] += coveredLineCount;

    this.packageObj['@line-rate'] = Number(
      (this.coverageObj.coverage['@lines-covered'] / this.coverageObj.coverage['@lines-valid']).toFixed(4)
    );
    this.coverageObj.coverage['@line-rate'] = this.packageObj['@line-rate'];

    this.packageObj.classes.class.push(classObj);
  }

  public finalize(): CoberturaCoverageObject {
    if (this.coverageObj.coverage?.packages?.package) {
      this.coverageObj.coverage.packages.package.sort((a, b) =>
        a['@name'].localeCompare(b['@name'])
      );
      for (const pkg of this.coverageObj.coverage.packages.package) {
        if (pkg.classes?.class) {
          pkg.classes.class.sort((a, b) =>
            a['@filename'].localeCompare(b['@filename'])
          );
        }
      }
    }
    return this.coverageObj;
  }
}
