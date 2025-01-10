'use strict';
/* eslint-disable no-await-in-loop */

import { getCoverageHandler } from '../handlers/getCoverageHandler.js';
import { DeployCoverageData } from './types.js';
import { getPackageDirectories } from './getPackageDirectories.js';
import { findFilePath } from './findFilePath.js';
import { generateReport } from './generateReport.js';
import { renumberLines } from './setCoveredLines.js';

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

    const updatedLines = await renumberLines(relativeFilePath, repoRoot, fileInfo.s);
    fileInfo.s = updatedLines; // Safe reassignment outside the function


    handler.processFile(
      relativeFilePath,
      formattedFileName,
      fileInfo.s,
    );
    filesProcessed++;
  }

  const coverageObj = handler.finalize();
  const xml = generateReport(coverageObj, format);

  return { xml, warnings, filesProcessed };
}
