'use strict';

import { join } from 'node:path';

import { getTotalLines } from './getTotalLines.js';
import { CoberturaClass, CoberturaLine } from './types.js';

export async function setCoveredLinesCobertura(
  coveredLines: number[],
  uncoveredLines: number[],
  repoRoot: string,
  filePath: string,
  classObj: CoberturaClass
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
          const randomLine: CoberturaLine = {
            '@number': randomLineNumber,
            '@hits': 1,
            '@branch': 'false',
          };
          classObj.lines.line.push(randomLine);
          randomLines.push(randomLineNumber);
          break;
        }
      }
    } else {
      const coveredLineObj: CoberturaLine = {
        '@number': coveredLine,
        '@hits': 1,
        '@branch': 'false',
      };
      classObj.lines.line.push(coveredLineObj);
    }
  }
}
