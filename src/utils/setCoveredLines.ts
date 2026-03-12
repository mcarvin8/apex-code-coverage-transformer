'use strict';

import { join } from 'node:path';
import { getTotalLines } from './getTotalLines.js';

export type SetCoveredLinesResult =
  | Record<string, number>
  | { updatedLines: Record<string, number>; sourceContent: string };

export async function setCoveredLines(
  filePath: string,
  repoRoot: string,
  lines: Record<string, number>,
  returnSourceContent = false
): Promise<SetCoveredLinesResult> {
  const result = await getTotalLines(join(repoRoot, filePath), returnSourceContent);
  const totalLines = typeof result === 'number' ? result : result.totalLines;
  const updatedLines: Record<string, number> = {};
  const usedLines = new Set<number>();

  const sortedLines = Object.entries(lines).sort(([lineA], [lineB]) => parseInt(lineA, 10) - parseInt(lineB, 10));

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

  if (returnSourceContent && typeof result !== 'number') {
    return { updatedLines, sourceContent: result.content };
  }
  return updatedLines;
}
