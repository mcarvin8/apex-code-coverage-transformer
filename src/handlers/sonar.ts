'use strict';

import { SonarCoverageObject, SonarClass, CoverageHandler } from '../utils/types.js';

export class SonarCoverageHandler implements CoverageHandler {
  private readonly coverageObj: SonarCoverageObject;

  public constructor() {
    this.coverageObj = { coverage: { '@version': '1', file: [] } };
  }

  public processFile(filePath: string, _fileName: string, lines: Record<string, number>): void {
    const fileObj: SonarClass = {
      '@path': filePath,
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

    this.coverageObj.coverage.file.push(fileObj);
  }

  public finalize(): SonarCoverageObject {
    if (this.coverageObj.coverage?.file) {
      this.coverageObj.coverage.file.sort((a, b) => a['@path'].localeCompare(b['@path']));
    }
    return this.coverageObj;
  }
}
