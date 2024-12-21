'use strict';
/* eslint-disable no-param-reassign */

import { join } from 'node:path';
import { getTotalLines } from './getTotalLines.js';
import { CloverFile, CloverLine } from './types.js';

export async function setCoveredLinesClover(
  coveredLines: number[],
  uncoveredLines: number[],
  repoRoot: string,
  filePath: string,
  fileObj: CloverFile
): Promise<void> {
  const randomLines: number[] = [];
  const totalLines = await getTotalLines(join(repoRoot, filePath));

  for (const coveredLine of coveredLines) {
    if (coveredLine > totalLines) {
      for (let randomLineNumber = 1; randomLineNumber <= totalLines; randomLineNumber++) {
        if (
          !uncoveredLines.includes(randomLineNumber) &&
          !coveredLines.includes(randomLineNumber) &&
          !randomLines.includes(randomLineNumber)
        ) {
          const randomLine: CloverLine = {
            '@num': randomLineNumber,
            '@count': 1,
            '@type': 'stmt',
          };
          fileObj.line.push(randomLine);
          randomLines.push(randomLineNumber);
          break;
        }
      }
    } else {
      const coveredLineObj: CloverLine = {
        '@num': coveredLine,
        '@count': 1,
        '@type': 'stmt',
      };
      fileObj.line.push(coveredLineObj);
    }
  }

  // Update Clover file-level metrics
  fileObj.metrics['@statements'] += coveredLines.length + uncoveredLines.length;
  fileObj.metrics['@coveredstatements'] += coveredLines.length;

  // Optionally calculate derived metrics
  fileObj.metrics['@conditionals'] ??= 0; // Add default if missing
  fileObj.metrics['@coveredconditionals'] ??= 0;
  fileObj.metrics['@methods'] ??= 0;
  fileObj.metrics['@coveredmethods'] ??= 0;
}
