'use strict';

import { JaCoCoCoverageObject, JaCoCoPackage, JaCoCoSourceFile, JaCoCoLine } from '../utils/types.js';
import { BaseHandler } from './BaseHandler.js';
import { HandlerRegistry } from './HandlerRegistry.js';

/**
 * Handler for generating JaCoCo XML coverage reports.
 *
 * JaCoCo is the standard code coverage library for Java projects.
 * The format is also accepted by Codecov and other coverage tools.
 *
 * Compatible with:
 * - Codecov
 * - Jenkins
 * - Maven
 * - Gradle
 * - IntelliJ IDEA
 *
 * @see https://www.jacoco.org/
 */
export class JaCoCoCoverageHandler extends BaseHandler {
  private readonly coverageObj: JaCoCoCoverageObject;
  private packageMap: Record<string, JaCoCoPackage>;

  public constructor() {
    super();
    this.coverageObj = {
      report: {
        '@name': 'JaCoCo',
        package: [],
        counter: [],
      },
    };
    this.packageMap = {}; // Stores packages by directory
  }

  public processFile(filePath: string, fileName: string, lines: Record<string, number>): void {
    const pathParts = filePath.split('/');
    const fileNamewithExt = pathParts.pop()!;
    const packageName = pathParts.join('/');

    const packageObj = this.getOrCreatePackage(packageName);

    // Ensure source file only contains the filename, not the full path
    const sourceFileObj: JaCoCoSourceFile = {
      '@name': fileNamewithExt,
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

    packageObj.sourcefile.push(sourceFileObj);
  }

  public finalize(): JaCoCoCoverageObject {
    let overallCovered = 0;
    let overallMissed = 0;

    // Sort packages by name for consistent output
    const sortedPackages = Object.keys(this.packageMap).sort();

    for (const packageName of sortedPackages) {
      const packageObj = this.packageMap[packageName];
      packageObj.sourcefile.sort((a, b) => a['@name'].localeCompare(b['@name']));

      let packageCovered = 0;
      let packageMissed = 0;

      for (const sf of packageObj.sourcefile) {
        packageCovered += sf.counter[0]['@covered'];
        packageMissed += sf.counter[0]['@missed'];
      }

      packageObj.counter.push({
        '@type': 'LINE',
        '@missed': packageMissed,
        '@covered': packageCovered,
      });

      overallCovered += packageCovered;
      overallMissed += packageMissed;
    }

    // Rebuild the package array in sorted order
    this.coverageObj.report.package = sortedPackages.map((name) => this.packageMap[name]);

    this.coverageObj.report.counter.push({
      '@type': 'LINE',
      '@missed': overallMissed,
      '@covered': overallCovered,
    });

    return this.coverageObj;
  }

  private getOrCreatePackage(packageName: string): JaCoCoPackage {
    if (!this.packageMap[packageName]) {
      this.packageMap[packageName] = {
        '@name': packageName,
        sourcefile: [],
        counter: [],
      };
      this.coverageObj.report.package.push(this.packageMap[packageName]);
    }
    return this.packageMap[packageName];
  }
}

// Self-register this handler
HandlerRegistry.register({
  name: 'jacoco',
  description: 'JaCoCo XML format for Java projects',
  fileExtension: '.xml',
  handler: () => new JaCoCoCoverageHandler(),
  compatibleWith: ['Codecov', 'Jenkins', 'Maven', 'Gradle'],
});
