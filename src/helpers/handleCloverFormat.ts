'use strict';
/* eslint-disable no-param-reassign */

import { CloverCoverageObject, CloverFile } from './types.js';
import { normalizePathToUnix } from './normalizePathToUnix.js';

export function handleCloverFormat(
  filePath: string,
  fileName: string,
  lines: Record<string, number>,
  uncoveredLines: number[],
  coveredLines: number[],
  coverageObj: CloverCoverageObject
): void {
  const cloverFile: CloverFile = {
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

  for (const [lineNumber, isCovered] of Object.entries(lines)) {
    cloverFile.line.push({
      '@num': Number(lineNumber),
      '@count': isCovered === 1 ? 1 : 0,
      '@type': 'stmt',
    });
  }

  coverageObj.coverage.project.file.push(cloverFile);
  const projectMetrics = coverageObj.coverage.project.metrics;

  projectMetrics['@statements'] += uncoveredLines.length + coveredLines.length;
  projectMetrics['@coveredstatements'] += coveredLines.length;
  projectMetrics['@elements'] += uncoveredLines.length + coveredLines.length;
  projectMetrics['@coveredelements'] += coveredLines.length;
  projectMetrics['@files'] += 1;
  projectMetrics['@classes'] += 1;
  projectMetrics['@loc'] += uncoveredLines.length + coveredLines.length;
  projectMetrics['@ncloc'] += uncoveredLines.length + coveredLines.length;
}
