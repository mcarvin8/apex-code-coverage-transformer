'use strict';
/* eslint-disable no-param-reassign */

import { SonarCoverageObject, SonarClass } from './types.js';
import { normalizePathToUnix } from './normalizePathToUnix.js';

export function handleSonarFormat(
  filePath: string,
  lines: Record<string, number>,
  coverageObj: SonarCoverageObject
): void {
  const fileObj: SonarClass = {
    '@path': normalizePathToUnix(filePath),
    lineToCover: [],
  };

  for (const lineNumberString in lines) {
    if (!Object.hasOwn(lines, lineNumberString)) continue;
    const covered = lines[lineNumberString] === 1 ? 'true' : 'false';
    fileObj.lineToCover.push({
      '@lineNumber': Number(lineNumberString),
      '@covered': covered,
    });
  }

  coverageObj.coverage.file.push(fileObj);
}
