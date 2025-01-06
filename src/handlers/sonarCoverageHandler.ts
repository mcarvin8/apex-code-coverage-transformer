'use strict';
/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */

import { SonarCoverageObject, SonarClass, CoverageHandler } from '../helpers/types.js';
import { setCoveredLinesSonar } from '../helpers/setCoveredLinesSonar.js';
import { normalizePathToUnix } from '../helpers/normalizePathToUnix.js';

export class SonarCoverageHandler implements CoverageHandler {
  private readonly coverageObj: SonarCoverageObject;

  public constructor() {
    this.coverageObj = { coverage: { '@version': '1', file: [] } };
  }

  public async processFile(
    filePath: string,
    _fileName: string,
    lines: Record<string, number>,
    uncoveredLines: number[],
    coveredLines: number[],
    repoRoot: string,
    reportType: 'test' | 'deploy'
  ): Promise<void> {
    const fileObj: SonarClass = {
      '@path': normalizePathToUnix(filePath),
      lineToCover: [],
    };

    if (reportType === 'test') {
      for (const lineNumberString in lines) {
        if (!Object.hasOwn(lines, lineNumberString)) continue;
        const covered = lines[lineNumberString] === 1 ? 'true' : 'false';
        fileObj.lineToCover.push({
          '@lineNumber': Number(lineNumberString),
          '@covered': covered,
        });
      }
    } else if (reportType === 'deploy') {
      // Process uncovered lines first
      fileObj.lineToCover = uncoveredLines.map((lineNumber) => ({
        '@lineNumber': lineNumber,
        '@covered': 'false',
      }));

      // Use `setCoveredLinesSonar` for covered lines
      await setCoveredLinesSonar(coveredLines, uncoveredLines, repoRoot, filePath, fileObj);
    }

    this.coverageObj.coverage.file.push(fileObj);
  }

  public finalize(): SonarCoverageObject {
    return this.coverageObj;
  }
}
