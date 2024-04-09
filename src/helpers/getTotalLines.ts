'use strict';

import { readFile } from 'node:fs/promises';

export async function getTotalLines(filePath: string): Promise<number> {
  const fileContent = await readFile(filePath, 'utf8');
  return fileContent.split(/\r\n|\r|\n/).length;
}
