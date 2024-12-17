'use strict';

import { join } from 'node:path';

import { getTotalLines } from './getTotalLines.js';
import { FileObject } from './types.js';

export async function setCoveredLinesSonar(
  coveredLines: number[],
  uncoveredLines: number[],
  repoRoot: string,
  filePath: string,
  fileObj: FileObject
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
          fileObj.lineToCover.push({
            '@lineNumber': randomLineNumber,
            '@covered': 'true',
          });
          randomLines.push(randomLineNumber);
          break;
        }
      }
    } else {
      fileObj.lineToCover.push({
        '@lineNumber': coveredLine,
        '@covered': 'true',
      });
    }
  }
}
