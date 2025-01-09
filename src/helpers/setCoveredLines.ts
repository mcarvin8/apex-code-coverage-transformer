'use strict';

import { join } from 'node:path';
import { getTotalLines } from './getTotalLines.js';

export async function renumberLines(
  filePath: string,
  repoRoot: string,
  lines: Record<string, number>
): Promise<Record<string, number>> {
  const totalLines = await getTotalLines(join(repoRoot, filePath));
  const updatedLines: Record<string, number> = {};
  const usedLines = new Set<number>();

  for (const [line, status] of Object.entries(lines)) {
    const lineNumber = parseInt(line, 10);

    if (status === 1 && lineNumber > totalLines) {
      // Find the first valid line number not already used
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
