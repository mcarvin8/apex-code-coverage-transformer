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

    // Add line coverage counter for the source file
    sourceFileObj.counter.push({
      '@type': 'LINE',
      '@missed': totalLines - coveredLines,
      '@covered': coveredLines,
    });

    // Create and associate the class with the source file
    const classObj: JaCoCoClass = {
      '@name': fileName.split('.')[0], // Get the part before the first period
      '@sourcefilename': filePath,
    };    

    packageObj.sourcefile.push(sourceFileObj);
    packageObj.class.push(classObj);
  }

  public finalize(): JaCoCoCoverageObject {
    let totalClassCovered = 0;
    let totalClassMissed = 0;
    let overallCovered = 0;
    let overallMissed = 0;

    for (const packageObj of Object.values(this.packageMap)) {
      packageObj.class.sort((a, b) => a['@name'].localeCompare(b['@name']));
      packageObj.sourcefile.sort((a, b) => a['@name'].localeCompare(b['@name']));

      let packageClassCovered = 0;
      let packageClassMissed = 0;
      let packageCovered = 0;
      let packageMissed = 0;

      for (const sf of packageObj.sourcefile) {
        packageCovered += sf.counter[0]['@covered'];
        packageMissed += sf.counter[0]['@missed'];
      }

      packageClassCovered = packageCovered > 0 ? packageObj.class.length : 0;
      packageClassMissed = packageCovered === 0 ? packageObj.class.length : 0;

      packageObj.counter.push(
        {
          '@type': 'LINE',
          '@missed': packageMissed,
          '@covered': packageCovered,
        },
        {
          '@type': 'CLASS',
          '@missed': packageClassMissed,
          '@covered': packageClassCovered,
        }
      );

      overallCovered += packageCovered;
      overallMissed += packageMissed;
      totalClassCovered += packageClassCovered;
      totalClassMissed += packageClassMissed;
    }

    this.coverageObj.report.counter.push(
      {
        '@type': 'LINE',
        '@missed': overallMissed,
        '@covered': overallCovered,
      },
      {
        '@type': 'CLASS',
        '@missed': totalClassMissed,
        '@covered': totalClassCovered,
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
