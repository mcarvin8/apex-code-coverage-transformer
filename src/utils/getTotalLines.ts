'use strict';

import { readFile } from 'node:fs/promises';

export type GetTotalLinesResult = number | { totalLines: number; content: string };

export async function getTotalLines(filePath: string, returnContent = false): Promise<GetTotalLinesResult> {
  const content = await readFile(filePath, 'utf8');
  const totalLines = content.split(/\r\n|\r|\n/).length;
  return returnContent ? { totalLines, content } : totalLines;
}
