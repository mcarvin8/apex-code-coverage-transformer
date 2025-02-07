'use strict';

import { JaCoCoCoverageObject, JaCoCoPackage, JaCoCoClass, JaCoCoLine, CoverageHandler } from '../helpers/types.js';

export class JaCoCoCoverageHandler implements CoverageHandler {
  private readonly coverageObj: JaCoCoCoverageObject;
  private packageObj: JaCoCoPackage;

  public constructor() {
    this.coverageObj = {
      report: {
        '@name': 'JaCoCo Coverage Report',
        sessionInfo: [],
        packages: { package: [] },
      },
    };
    this.packageObj = {
      '@name': 'main',
      classes: { class: [] },
    };
    this.coverageObj.report.packages.package.push(this.packageObj);
  }

  public processFile(filePath: string, fileName: string, lines: Record<string, number>): void {
    const classObj: JaCoCoClass = {
      '@name': fileName,
      '@sourcefile': filePath,
      lines: { line: [] },
      counters: { counter: [] },
    };

    let coveredLines = 0;
    let totalLines = 0;

    for (const [lineNumber, isCovered] of Object.entries(lines)) {
      totalLines++;
      if (isCovered === 1) coveredLines++;

      const lineObj: JaCoCoLine = {
        '@nr': Number(lineNumber),
        '@mi': isCovered === 0 ? 1 : 0,
        '@ci': isCovered === 1 ? 1 : 0,
      };
      classObj.lines.line.push(lineObj);
    }

    classObj.counters.counter.push({
      '@type': 'LINE',
      '@missed': totalLines - coveredLines,
      '@covered': coveredLines,
    });

    this.packageObj.classes.class.push(classObj);
  }

  public finalize(): JaCoCoCoverageObject {
    if (this.coverageObj.report?.packages?.package) {
      this.coverageObj.report.packages.package.sort((a, b) => a['@name'].localeCompare(b['@name']));
      for (const pkg of this.coverageObj.report.packages.package) {
        if (pkg.classes?.class) {
          pkg.classes.class.sort((a, b) => a['@sourcefile'].localeCompare(b['@sourcefile']));
        }
      }
    }
    return this.coverageObj;
  }
}
