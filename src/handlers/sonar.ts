'use strict';

import { SonarCoverageObject, SonarClass } from '../utils/types.js';
import { BaseHandler } from './BaseHandler.js';
import { HandlerRegistry } from './HandlerRegistry.js';

/**
 * Handler for generating SonarQube Generic Coverage reports.
 *
 * This is the default format and is compatible with SonarQube and SonarCloud.
 *
 * @see https://docs.sonarqube.org/latest/analysis/generic-test/
 */
export class SonarCoverageHandler extends BaseHandler {
  private readonly coverageObj: SonarCoverageObject;

  public constructor() {
    super();
    this.coverageObj = { coverage: { '@version': '1', file: [] } };
  }

  public processFile(filePath: string, _fileName: string, lines: Record<string, number>): void {
    const fileObj: SonarClass = {
      '@path': filePath,
      lineToCover: [],
    };
    for (const [lineNumberString, value] of Object.entries(lines)) {
      const covered = value === 1 ? 'true' : 'false';
      fileObj.lineToCover.push({
        '@lineNumber': Number(lineNumberString),
        '@covered': covered,
      });
    }

    this.coverageObj.coverage.file.push(fileObj);
  }

  public finalize(): SonarCoverageObject {
    if (this.coverageObj.coverage?.file) {
      this.coverageObj.coverage.file = this.sortByPath(this.coverageObj.coverage.file);
    }
    return this.coverageObj;
  }
}

// Self-register this handler
HandlerRegistry.register({
  name: 'sonar',
  description: 'SonarQube Generic Coverage format',
  fileExtension: '.xml',
  handler: () => new SonarCoverageHandler(),
  compatibleWith: ['SonarQube', 'SonarCloud'],
});
