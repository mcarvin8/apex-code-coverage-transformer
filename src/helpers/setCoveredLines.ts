'use strict';

import { join } from 'node:path';
import { getTotalLines } from './getTotalLines.js';

export async function setCoveredLines(
  filePath: string,
  repoRoot: string,
  lines: Record<string, number>
): Promise<Record<string, number>> {
  const totalLines = await getTotalLines(join(repoRoot, filePath));
  const updatedLines: Record<string, number> = {};
  const usedLines = new Set<number>();

  const sortedLines = Object.entries(lines).sort(([lineA], [lineB]) => 
    parseInt(lineA, 10) - parseInt(lineB, 10)
  );

  for (const [line, status] of sortedLines) {
    const lineNumber = parseInt(line, 10);

    if (status === 1 && lineNumber > totalLines) {
      for (let randomLine = 1; randomLine <= totalLines; randomLine++) {
        if (!usedLines.has(randomLine)) {
          updatedLines[randomLine.toString()] = status;
          usedLines.add(randomLine);
          break;
        }
      }
    } else {
      updatedLines[line] = status;
      usedLines.add(lineNumber);
    }
  }

  return updatedLines;
}
