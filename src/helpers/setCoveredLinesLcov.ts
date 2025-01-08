'use strict';

import { join } from 'node:path';

import { getTotalLines } from './getTotalLines.js';
import { LcovFile } from './types.js';

export async function setCoveredLinesLcov(
  coveredLines: number[],
  uncoveredLines: number[],
  repoRoot: string,
  filePath: string,
  fileObj: LcovFile
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
          fileObj.lines.push({ lineNumber: randomLineNumber, hitCount: 1 });
          randomLines.push(randomLineNumber);
          break;
        }
      }
    } else {
      fileObj.lines.push({ lineNumber: coveredLine, hitCount: 1 });
    }
  }
}
