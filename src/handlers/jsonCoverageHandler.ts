import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

import { CoverageHandler } from '../helpers/types.js';
import { IstanbulFileCoverage } from '../helpers/types.js';

export class IstanbulJsonCoverageHandler implements CoverageHandler {
  private coverageMap: Record<string, IstanbulFileCoverage> = {};
  private statementId = 0;

  private static async computeFileHash(filePath: string): Promise<string> {
    const fileBuffer = await readFile(filePath);
    const hash = createHash('sha1');
    hash.update(fileBuffer);
    return hash.digest('hex');
  }

  public async processFile(filePath: string, fileName: string, lines: Record<string, number>): Promise<void> {
    const fileHash = await IstanbulJsonCoverageHandler.computeFileHash(filePath);

    const coverage: IstanbulFileCoverage = {
      path: filePath,
      statementMap: {},
      fnMap: {},
      branchMap: {},
      s: {},
      f: {},
      b: {},
      hash: fileHash,
    };

    for (const [lineStr, hits] of Object.entries(lines)) {
      const line = parseInt(lineStr, 10);
      const id = String(this.statementId++);
      coverage.statementMap[id] = {
        start: { line, column: 0 },
        end: { line, column: 100 },
      };
      coverage.s[id] = hits;
    }

    this.coverageMap[filePath] = coverage;
  }

  public finalize(): Record<string, IstanbulFileCoverage> {
    return this.coverageMap;
  }
}
