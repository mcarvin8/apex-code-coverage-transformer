'use strict';

import { CloverCoverageObject, CloverFile } from '../utils/types.js';
import { BaseHandler } from './BaseHandler.js';
import { HandlerRegistry } from './HandlerRegistry.js';

/**
 * Handler for generating Clover XML coverage reports.
 *
 * Clover is a code coverage tool commonly used with Atlassian tools.
 *
 * Compatible with:
 * - Bamboo
 * - Bitbucket
 * - Jenkins
 * - Atlassian tools
 *
 * @see https://openclover.org/
 */
export class CloverCoverageHandler extends BaseHandler {
  private readonly coverageObj: CloverCoverageObject;

  public constructor() {
    super();
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

  public processFile(filePath: string, fileName: string, lines: Record<string, number>): void {
    const { totalLines, coveredLines } = this.calculateCoverage(lines);

    const fileObj: CloverFile = {
      '@name': fileName,
      '@path': filePath,
      metrics: {
        '@statements': totalLines,
        '@coveredstatements': coveredLines,
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

    projectMetrics['@statements'] += totalLines;
    projectMetrics['@coveredstatements'] += coveredLines;
    projectMetrics['@elements'] += totalLines;
    projectMetrics['@coveredelements'] += coveredLines;
    projectMetrics['@files'] += 1;
    projectMetrics['@classes'] += 1;
    projectMetrics['@loc'] += totalLines;
    projectMetrics['@ncloc'] += totalLines;
  }

  public finalize(): CloverCoverageObject {
    if (this.coverageObj.coverage?.project?.file) {
      this.coverageObj.coverage.project.file = this.sortByPath(this.coverageObj.coverage.project.file);
    }
    return this.coverageObj;
  }
}

// Self-register this handler
HandlerRegistry.register({
  name: 'clover',
  description: 'Clover XML format for Atlassian tools',
  fileExtension: '.xml',
  handler: () => new CloverCoverageHandler(),
  compatibleWith: ['Bamboo', 'Bitbucket', 'Jenkins'],
});
