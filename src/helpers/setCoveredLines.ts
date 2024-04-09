'use strict';

import { getTotalLines } from './getTotalLines.js';

export async function setCoveredLines(
  coveredLines: number[],
  uncoveredLines: number[],
  filePath: string
): Promise<string> {
  let formattedCoveredLines: string = '';
  const randomLines: number[] = [];
  const totalLines = await getTotalLines(filePath);
  for (const coveredLine of coveredLines) {
    if (coveredLine > totalLines) {
      for (let randomLineNumber = 1; randomLineNumber <= totalLines; randomLineNumber++) {
        if (
          !uncoveredLines.includes(randomLineNumber) &&
          !coveredLines.includes(randomLineNumber) &&
          !randomLines.includes(randomLineNumber)
        ) {
          formattedCoveredLines += `\t\t<lineToCover lineNumber="${randomLineNumber}" covered="true"/>\n`;
          randomLines.push(randomLineNumber);
          break;
        }
      }
    } else {
      formattedCoveredLines += `\t\t<lineToCover lineNumber="${coveredLine}" covered="true"/>\n`;
    }
  }
  return formattedCoveredLines;
}
