'use strict';

import { mapLimit } from 'async';

import { getCoverageHandler } from '../handlers/getCoverageHandler.js';
import { TestCoverageData } from './types.js';
import { getPackageDirectories } from './getPackageDirectories.js';
import { findFilePath } from './findFilePath.js';
import { generateReport } from './generateReport.js';
import { getConcurrencyThreshold } from './getConcurrencyThreshold.js';

export async function transformTestCoverageReport(
  testCoverageData: TestCoverageData[],
  format: string,
  ignoreDirs: string[]
): Promise<{ xml: string; warnings: string[]; filesProcessed: number }> {
  const warnings: string[] = [];
  let filesProcessed = 0;
  const { repoRoot, packageDirectories } = await getPackageDirectories(ignoreDirs);
  const handler = getCoverageHandler(format);

  // Ensure testCoverageData is an array
  const coverageData = Array.isArray(testCoverageData) ? testCoverageData : [testCoverageData];

  const processFile = async (data: TestCoverageData): Promise<boolean> => {
    const name = data?.name;
    const lines = data?.lines;

    if (!name || !lines) return false;

    const formattedFileName = name.replace(/no-map[\\/]+/, '');
    const relativeFilePath = await findFilePath(formattedFileName, packageDirectories, repoRoot);

    if (!relativeFilePath) {
      warnings.push(`The file name ${formattedFileName} was not found in any package directory.`);
      return false;
    }

    handler.processFile(relativeFilePath, formattedFileName, lines);
    return true;
  };

  const concurrencyLimit = getConcurrencyThreshold();
  await mapLimit(coverageData, concurrencyLimit, async (data: TestCoverageData) => {
    const result = await processFile(data);
    if (result) {
      filesProcessed++;
    }
  });

  const coverageObj = handler.finalize();
  const xml = generateReport(coverageObj, format);

  return { xml, warnings, filesProcessed };
}
