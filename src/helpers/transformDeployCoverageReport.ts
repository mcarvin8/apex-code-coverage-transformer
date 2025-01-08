'use strict';
/* eslint-disable no-await-in-loop */

import { getCoverageHandler } from '../handlers/getCoverageHandler.js';
import { DeployCoverageData } from './types.js';
import { getPackageDirectories } from './getPackageDirectories.js';
import { findFilePath } from './findFilePath.js';
import { generateReport } from './generateReport.js';

export async function transformDeployCoverageReport(
  data: DeployCoverageData,
  format: string
): Promise<{ xml: string; warnings: string[]; filesProcessed: number }> {
  const warnings: string[] = [];
  let filesProcessed = 0;
  const { repoRoot, packageDirectories } = await getPackageDirectories();
  const handler = getCoverageHandler(format);

  for (const fileName in data) {
    if (!Object.hasOwn(data, fileName)) continue;

    const fileInfo = data[fileName];
    const formattedFileName = fileName.replace(/no-map[\\/]+/, '');
    const relativeFilePath = await findFilePath(formattedFileName, packageDirectories, repoRoot);

    if (!relativeFilePath) {
      warnings.push(`The file name ${formattedFileName} was not found in any package directory.`);
      continue;
    }

    const uncoveredLines = Object.keys(fileInfo.s)
      .filter((lineNumber) => fileInfo.s[lineNumber] === 0)
      .map(Number);
    const coveredLines = Object.keys(fileInfo.s)
      .filter((lineNumber) => fileInfo.s[lineNumber] === 1)
      .map(Number);

    await handler.processFile(
      relativeFilePath,
      formattedFileName,
      fileInfo.s,
      uncoveredLines,
      coveredLines,
      repoRoot,
      'deploy'
    );
    filesProcessed++;
  }

  const coverageObj = handler.finalize();
  const xml = generateReport(coverageObj, format);

  return { xml, warnings, filesProcessed };
}
