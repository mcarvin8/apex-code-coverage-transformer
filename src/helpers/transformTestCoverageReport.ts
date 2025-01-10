'use strict';
/* eslint-disable no-await-in-loop */

import { getCoverageHandler } from '../handlers/getCoverageHandler.js';
import { TestCoverageData } from './types.js';
import { getPackageDirectories } from './getPackageDirectories.js';
import { findFilePath } from './findFilePath.js';
import { generateReport } from './generateReport.js';

export async function transformTestCoverageReport(
  testCoverageData: TestCoverageData[],
  format: string
): Promise<{ xml: string; warnings: string[]; filesProcessed: number }> {
  const warnings: string[] = [];
  let filesProcessed = 0;
  const { repoRoot, packageDirectories } = await getPackageDirectories();
  const handler = getCoverageHandler(format);

  let coverageData = testCoverageData;
  if (!Array.isArray(coverageData)) {
    coverageData = [coverageData]; // Ensure the data is an array
  }

  for (const data of coverageData) {
    const name = data?.name;
    const lines = data?.lines;

    if (!name || !lines) continue;

    const formattedFileName = name.replace(/no-map[\\/]+/, '');
    const relativeFilePath = await findFilePath(formattedFileName, packageDirectories, repoRoot);

    if (relativeFilePath === undefined) {
      warnings.push(`The file name ${formattedFileName} was not found in any package directory.`);
      continue;
    }

    handler.processFile(
      relativeFilePath,
      formattedFileName,
      lines,
    );

    filesProcessed++;
  }

  const coverageObj = handler.finalize();
  const xml = generateReport(coverageObj, format);

  return { xml, warnings, filesProcessed };
}
