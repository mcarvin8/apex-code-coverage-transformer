'use strict';
/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */

import { CloverCoverageObject, CloverFile, CoverageHandler } from '../helpers/types.js';
import { setCoveredLinesClover } from '../helpers/setCoveredLinesClover.js';
import { normalizePathToUnix } from '../helpers/normalizePathToUnix.js';

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
            '@files': 0,
            '@complexity': 0,
            '@loc': 0,
            '@ncloc': 0,
            '@packages': 0,
            '@classes': 0,
          },
          file: [],
        },
      },
    };
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
    const fileObj: CloverFile = {
      '@name': fileName,
      '@path': normalizePathToUnix(filePath),
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

    if (reportType === 'test') {
      for (const [lineNumber, isCovered] of Object.entries(lines)) {
        fileObj.line.push({
          '@num': Number(lineNumber),
          '@count': isCovered === 1 ? 1 : 0,
          '@type': 'stmt',
        });
      }
    } else if (reportType === 'deploy') {
      // Process uncovered lines first
      fileObj.line = [...uncoveredLines.map((lineNumber) => ({ '@num': lineNumber, '@count': 0, '@type': 'stmt' }))];

      // Process covered lines using `setCoveredLinesClover`
      await setCoveredLinesClover(coveredLines, uncoveredLines, repoRoot, filePath, fileObj);

      // Then, add covered lines
      fileObj.line.push(...coveredLines.map((lineNumber) => ({ '@num': lineNumber, '@count': 1, '@type': 'stmt' })));
    }

    // Add the processed file object to the Clover project
    this.coverageObj.coverage.project.file.push(fileObj);
  }

  public finalize(): CloverCoverageObject {
    return this.coverageObj;
  }
}
