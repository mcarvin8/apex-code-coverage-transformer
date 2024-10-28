'use strict';
/* eslint-disable no-param-reassign */

import { CoberturaCoverageObject, CoberturaClass, CoberturaPackage } from './types.js';
import { normalizePathToUnix } from './normalizePathToUnix.js';

export function handleCoberturaFormat(
  filePath: string,
  fileName: string,
  lines: Record<string, number>,
  uncoveredLines: number[],
  coveredLines: number[],
  coverageObj: CoberturaCoverageObject,
  packageObj: CoberturaPackage
): void {
  const classObj: CoberturaClass = {
    '@name': fileName,
    '@filename': normalizePathToUnix(filePath),
    '@line-rate': (coveredLines.length / (coveredLines.length + uncoveredLines.length)).toFixed(4),
    '@branch-rate': '1',
    methods: {},
    lines: {
      line: [],
    },
  };

  for (const [lineNumber, isCovered] of Object.entries(lines)) {
    classObj.lines.line.push({
      '@number': Number(lineNumber),
      '@hits': isCovered === 1 ? 1 : 0,
      '@branch': 'false',
    });
  }

  coverageObj.coverage['@lines-valid'] += uncoveredLines.length + coveredLines.length;
  coverageObj.coverage['@lines-covered'] += coveredLines.length;
  packageObj.classes.class.push(classObj);

  packageObj['@line-rate'] = Number(
    (coverageObj.coverage['@lines-covered'] / coverageObj.coverage['@lines-valid']).toFixed(4)
  );
  coverageObj.coverage['@line-rate'] = packageObj['@line-rate'];
}
