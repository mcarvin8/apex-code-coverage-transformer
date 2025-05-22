'use strict';

import { mapLimit } from 'async';

import { getCoverageHandler } from '../handlers/getHandler.js';
import { DeployCoverageData } from '../utils/types.js';
import { getPackageDirectories } from '../utils/getPackageDirectories.js';
import { findFilePath } from '../utils/findFilePath.js';
import { setCoveredLines } from '../utils/setCoveredLines.js';
import { getConcurrencyThreshold } from '../utils/getConcurrencyThreshold.js';
import { generateReport } from './reportGenerator.js';

export async function transformDeployCoverageReport(
  data: DeployCoverageData,
  format: string,
  ignoreDirs: string[]
): Promise<{ xml: string; warnings: string[]; filesProcessed: number }> {
  const warnings: string[] = [];
  let filesProcessed = 0;
  const { repoRoot, packageDirectories } = await getPackageDirectories(ignoreDirs);
  const handler = getCoverageHandler(format);

  const processFile = async (fileName: string): Promise<boolean> => {
    const fileInfo = data[fileName];
    const formattedFileName = fileName.replace(/no-map[\\/]+/, '');
    const relativeFilePath = await findFilePath(formattedFileName, packageDirectories, repoRoot);

    if (!relativeFilePath) {
      warnings.push(`The file name ${formattedFileName} was not found in any package directory.`);
      return false;
    }

    const updatedLines = await setCoveredLines(relativeFilePath, repoRoot, fileInfo.s);
    fileInfo.s = updatedLines;

    handler.processFile(relativeFilePath, formattedFileName, fileInfo.s);
    return true;
  };

  const concurrencyLimit = getConcurrencyThreshold();
  await mapLimit(
    Object.keys(data).filter((fileName) => Object.hasOwn(data, fileName)),
    concurrencyLimit,
    async (fileName: string) => {
      const result = await processFile(fileName);
      if (result) {
        filesProcessed++;
      }
    }
  );

  const coverageObj = handler.finalize();
  const xml = generateReport(coverageObj, format);

  return { xml, warnings, filesProcessed };
}
