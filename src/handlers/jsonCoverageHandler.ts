import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

import { CoverageHandler } from '../helpers/types.js';
import { IstanbulFileCoverage } from '../helpers/types.js';

export class IstanbulJsonCoverageHandler implements CoverageHandler {
  private statementId = 0;

  private coverageObj: {
    coverage: {
      project: {
        file: IstanbulFileCoverage[];
      };
    };
  } = {
    coverage: {
      project: {
        file: [],
      },
    },
  };

  private static async computeFileHash(filePath: string): Promise<string> {
    const fileBuffer = await readFile(filePath);
    const hash = createHash('sha1');
    hash.update(fileBuffer);
    return hash.digest('hex');
  }

  public async processFile(filePath: string, fileName: string, lines: Record<string, number>): Promise<void> {
    const fileHash = await IstanbulJsonCoverageHandler.computeFileHash(filePath);

    const fileCoverage: IstanbulFileCoverage = {
      path: filePath,
      statementMap: {},
      fnMap: {},
      branchMap: {},
      s: {},
      f: {},
      b: {},
      _coverageSchema: '1a1cf5c040b70cfc75ec2b2c4aab8e59',
      hash: fileHash,
    };

    for (const [lineStr, hits] of Object.entries(lines)) {
      const line = parseInt(lineStr, 10);
      const id = String(this.statementId++);
      fileCoverage.statementMap[id] = {
        start: { line, column: 0 },
        end: { line, column: 100 },
      };
      fileCoverage.s[id] = hits;
    }

    this.coverageObj.coverage.project.file.push(fileCoverage);
  }

  public finalize(): typeof this.coverageObj {
    return this.coverageObj;
  }
}
