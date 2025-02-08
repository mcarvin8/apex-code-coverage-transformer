'use strict';

import { JaCoCoCoverageObject, JaCoCoPackage, JaCoCoClass, JaCoCoSourceFile, JaCoCoLine, CoverageHandler } from '../helpers/types.js';

export class JaCoCoCoverageHandler implements CoverageHandler {
  private readonly coverageObj: JaCoCoCoverageObject;
  private packageMap: Record<string, JaCoCoPackage>;

  public constructor() {
    this.coverageObj = {
      report: {
        '@name': 'JaCoCo Coverage Report',
        package: [], // List of packages
        counter: [], // Report-level counters
      },
    };
    this.packageMap = {}; // Stores packages by directory
  }

  public processFile(filePath: string, fileName: string, lines: Record<string, number>): void {
    const packageName = filePath.split('/')[0]; // Extract root directory as package name
    const packageObj = this.getOrCreatePackage(packageName);

    const sourceFileObj: JaCoCoSourceFile = {
      '@name': filePath,
      line: [],
      counter: [],
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
        '@mb': 0,
        '@cb': 0,
      };
      sourceFileObj.line.push(lineObj);
    }

    sourceFileObj.counter.push(
      {
        '@type': 'LINE',
        '@missed': totalLines - coveredLines,
        '@covered': coveredLines,
      },
      {
        '@type': 'CLASS',
        '@missed': coveredLines === 0 ? 1 : 0,
        '@covered': coveredLines > 0 ? 1 : 0,
      }
    );

    packageObj.sourcefile.push(sourceFileObj);

    const classObj: JaCoCoClass = {
      '@name': fileName.replace('.cls', ''), // Remove .cls to match SFDX output
      '@sourcefilename': filePath,
    };

    packageObj.class.push(classObj);
  }

  public finalize(): JaCoCoCoverageObject {
    for (const packageObj of Object.values(this.packageMap)) {
      packageObj.class.sort((a, b) => a['@name'].localeCompare(b['@name']));
      packageObj.sourcefile.sort((a, b) => a['@name'].localeCompare(b['@name']));

      const totalCovered = packageObj.sourcefile.reduce((acc, sf) => acc + sf.counter[0]['@covered'], 0);
      const totalMissed = packageObj.sourcefile.reduce((acc, sf) => acc + sf.counter[0]['@missed'], 0);

      packageObj.counter.push(
        {
          '@type': 'LINE',
          '@missed': totalMissed,
          '@covered': totalCovered,
        },
        {
          '@type': 'CLASS',
          '@missed': totalCovered === 0 ? 1 : 0,
          '@covered': totalCovered > 0 ? 1 : 0,
        }
      );
    }

    const overallCovered = Object.values(this.packageMap).reduce((acc, pkg) => acc + pkg.counter[0]['@covered'], 0);
    const overallMissed = Object.values(this.packageMap).reduce((acc, pkg) => acc + pkg.counter[0]['@missed'], 0);

    this.coverageObj.report.counter.push(
      {
        '@type': 'LINE',
        '@missed': overallMissed,
        '@covered': overallCovered,
      }
    );

    return this.coverageObj;
  }

  private getOrCreatePackage(packageName: string): JaCoCoPackage {
    if (!this.packageMap[packageName]) {
      this.packageMap[packageName] = {
        '@name': packageName,
        class: [],
        sourcefile: [],
        counter: [],
      };
      this.coverageObj.report.package.push(this.packageMap[packageName]);
    }
    return this.packageMap[packageName];
  }
}
