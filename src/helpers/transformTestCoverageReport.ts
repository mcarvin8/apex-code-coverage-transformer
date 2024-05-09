'use strict';
/* eslint-disable no-await-in-loop */

import { create } from 'xmlbuilder2';

import { TestCoverageData, CoverageObject, FileObject } from './types.js';
import { getPackageDirectories } from './getPackageDirectories.js';
import { findFilePath } from './findFilePath.js';
import { normalizePathToUnix } from './normalizePathToUnix.js';

export async function transformTestCoverageReport(
  testCoverageData: TestCoverageData[]
): Promise<{ xml: string; warnings: string[]; filesProcessed: number }> {
  const coverageObj: CoverageObject = { coverage: { '@version': '1', file: [] } };
  const warnings: string[] = [];
  let filesProcessed: number = 0;
  const { repoRoot, packageDirectories } = await getPackageDirectories();

  if (!Array.isArray(testCoverageData)) {
    testCoverageData = [testCoverageData];
  }

  for (const data of testCoverageData) {
    const { name, lines } = data;
    const formattedFileName = name.replace(/no-map[\\/]+/, '');
    const relativeFilePath = await findFilePath(formattedFileName, packageDirectories, repoRoot);
    if (relativeFilePath === undefined) {
      warnings.push(`The file name ${formattedFileName} was not found in any package directory.`);
      continue;
    }
    const fileObj: FileObject = {
      '@path': normalizePathToUnix(relativeFilePath),
      lineToCover: [],
    };

    for (const [lineNumber, isCovered] of Object.entries(lines)) {
      fileObj.lineToCover.push({
        '@lineNumber': Number(lineNumber),
        '@covered': `${isCovered === 1}`,
      });
    }
    filesProcessed++;
    coverageObj.coverage.file.push(fileObj);
  }
  const xml = create(coverageObj).end({ prettyPrint: true, indent: '  ' });
  return { xml, warnings, filesProcessed };
}
