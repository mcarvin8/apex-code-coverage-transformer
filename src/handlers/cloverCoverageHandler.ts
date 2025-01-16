'use strict';

import { CloverCoverageObject, CloverFile, CoverageHandler } from '../helpers/types.js';

export class CloverCoverageHandler implements CoverageHandler {
  private readonly coverageObj: CloverCoverageObject;

  public constructor() {
    this.coverageObj = {
      coverage: {
        '@generated': Date.now(),
        '@clover': '3.2.0',
        project: {
          '@timestamp': Date.now(),
          '@name': 'All files',
          metrics: {
            '@statements': 0,
            '@coveredstatements': 0,
            '@conditionals': 0,
            '@coveredconditionals': 0,
            '@methods': 0,
            '@coveredmethods': 0,
            '@elements': 0,
            '@coveredelements': 0,
            '@complexity': 0,
            '@loc': 0,
            '@ncloc': 0,
            '@packages': 1,
            '@files': 0,
            '@classes': 0,
          },
          file: [],
        },
      },
    };
  }

  public processFile(
    filePath: string,
    fileName: string,
    lines: Record<string, number>,
  ): void {
    const uncoveredLines = Object.keys(lines)
      .filter((lineNumber) => lines[lineNumber] === 0)
      .map(Number);
    const coveredLines = Object.keys(lines)
      .filter((lineNumber) => lines[lineNumber] === 1)
      .map(Number);

    const fileObj: CloverFile = {
      '@name': fileName,
      '@path': filePath,
      metrics: {
        '@statements': uncoveredLines.length + coveredLines.length,
        '@coveredstatements': coveredLines.length,
        '@conditionals': 0,
        '@coveredconditionals': 0,
        '@methods': 0,
        '@coveredmethods': 0,
      },
      line: [],
    };
    for (const [lineNumber, isCovered] of Object.entries(lines)) {
      fileObj.line.push({
        '@num': Number(lineNumber),
        '@count': isCovered === 1 ? 1 : 0,
        '@type': 'stmt',
      });
    }
    this.coverageObj.coverage.project.file.push(fileObj);
    const projectMetrics = this.coverageObj.coverage.project.metrics;

    projectMetrics['@statements'] += uncoveredLines.length + coveredLines.length;
    projectMetrics['@coveredstatements'] += coveredLines.length;
    projectMetrics['@elements'] += uncoveredLines.length + coveredLines.length;
    projectMetrics['@coveredelements'] += coveredLines.length;
    projectMetrics['@files'] += 1;
    projectMetrics['@classes'] += 1;
    projectMetrics['@loc'] += uncoveredLines.length + coveredLines.length;
    projectMetrics['@ncloc'] += uncoveredLines.length + coveredLines.length;
  }

  public finalize(): CloverCoverageObject {
    if (this.coverageObj.coverage?.project?.file) {
      this.coverageObj.coverage.project.file.sort((a, b) =>
        a['@path'].localeCompare(b['@path'])
      );
    }
    return this.coverageObj;
  }
}
