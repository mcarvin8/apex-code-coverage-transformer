'use strict';

import { CoberturaCoverageObject, CoberturaPackage, CoberturaClass, CoverageHandler } from '../utils/types.js';

export class CoberturaCoverageHandler implements CoverageHandler {
  private readonly coverageObj: CoberturaCoverageObject;
  private packageMap: Map<string, CoberturaPackage>;

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
    this.packageMap = new Map();
  }

  public processFile(filePath: string, fileName: string, lines: Record<string, number>): void {
    const packageName = filePath.split('/')[0]; // Extract root directory as package name

    if (!this.packageMap.has(packageName)) {
      this.packageMap.set(packageName, {
        '@name': packageName,
        '@line-rate': 0,
        '@branch-rate': 1,
        classes: { class: [] },
      });
    }

    const packageObj = this.packageMap.get(packageName)!;

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

    if (totalLines > 0) {
      classObj['@line-rate'] = (coveredLineCount / totalLines).toFixed(4);
    }

    this.coverageObj.coverage['@lines-valid'] += totalLines;
    this.coverageObj.coverage['@lines-covered'] += coveredLineCount;

    packageObj.classes.class.push(classObj);
    this.packageMap.set(packageName, packageObj);
  }

  public finalize(): CoberturaCoverageObject {
    this.coverageObj.coverage.packages.package = Array.from(this.packageMap.values());

    for (const pkg of this.coverageObj.coverage.packages.package) {
      const totalLines = pkg.classes.class.reduce(
        (sum, cls) => sum + parseFloat(cls['@line-rate']) * cls.lines.line.length,
        0
      );
      const totalClasses = pkg.classes.class.reduce((sum, cls) => sum + cls.lines.line.length, 0);

      pkg['@line-rate'] = parseFloat((totalLines / totalClasses).toFixed(4));
    }

    this.coverageObj.coverage['@line-rate'] = parseFloat(
      (this.coverageObj.coverage['@lines-covered'] / this.coverageObj.coverage['@lines-valid']).toFixed(4)
    );

    this.coverageObj.coverage.packages.package.sort((a, b) => a['@name'].localeCompare(b['@name']));
    for (const pkg of this.coverageObj.coverage.packages.package) {
      if (pkg.classes?.class) {
        pkg.classes.class.sort((a, b) => a['@filename'].localeCompare(b['@filename']));
      }
    }

    return this.coverageObj;
  }
}
