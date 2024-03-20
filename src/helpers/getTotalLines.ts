'use strict';
import * as fs from 'node:fs';

export function getTotalLines(filePath: string): number {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return fileContent.split(/\r\n|\r|\n/).length;
}
