'use strict';

import { JaCoCoCoverageObject, JaCoCoPackage, JaCoCoClass, JaCoCoSourceFile, JaCoCoLine, CoverageHandler } from '../helpers/types.js';

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
    const sourceFileObj: JaCoCoSourceFile = {
      '@name': filePath,
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
      sourceFileObj.lines.line.push(lineObj);
    }

    sourceFileObj.counters.counter.push({
      '@type': 'LINE',
      '@missed': totalLines - coveredLines,
      '@covered': coveredLines,
    });

    const classObj: JaCoCoClass = {
      '@name': fileName,
      sourcefile: sourceFileObj,
    };

    this.packageObj.classes.class.push(classObj);
  }

  public finalize(): JaCoCoCoverageObject {
    if (this.coverageObj.report?.packages?.package) {
      this.coverageObj.report.packages.package.sort((a, b) => a['@name'].localeCompare(b['@name']));
      for (const pkg of this.coverageObj.report.packages.package) {
        if (pkg.classes?.class) {
          pkg.classes.class.sort((a, b) => a.sourcefile['@name'].localeCompare(b.sourcefile['@name']));
        }
      }
      
      const totalCovered = this.packageObj.classes.class.reduce(
        (acc, classObj) => acc + classObj.sourcefile.counters.counter[0]['@covered'], 
        0
      );

      const totalMissed = this.packageObj.classes.class.reduce(
        (acc, classObj) => acc + classObj.sourcefile.counters.counter[0]['@missed'], 
        0
      );

      this.packageObj.counters = {
        counter: [{
          '@type': 'PACKAGE',
          '@missed': totalMissed,
          '@covered': totalCovered,
        }],
      };
    }
    return this.coverageObj;
  }
}
