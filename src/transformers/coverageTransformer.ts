import { mapLimit } from 'async';

import { getCoverageHandler } from '../handlers/getHandler.js';
import { DeployCoverageData, TestCoverageData } from '../utils/types.js';
import { getPackageDirectories } from '../utils/getPackageDirectories.js';
import { findFilePath } from '../utils/findFilePath.js';
import { setCoveredLines } from '../utils/setCoveredLines.js';
import { getConcurrencyThreshold } from '../utils/getConcurrencyThreshold.js';
import { checkCoverageDataType } from '../utils/setCoverageDataType.js';
import { generateReport } from './reportGenerator.js';

type CoverageInput = DeployCoverageData | TestCoverageData[];

export async function transformCoverageReport(
  data: CoverageInput,
  format: string,
  ignoreDirs: string[]
): Promise<{ xml: string; warnings: string[]; filesProcessed: number }> {
  const warnings: string[] = [];
  let filesProcessed = 0;
  const { repoRoot, packageDirectories } = await getPackageDirectories(ignoreDirs);
  const handler = getCoverageHandler(format);
  const commandType = checkCoverageDataType(data);

  const concurrencyLimit = getConcurrencyThreshold();

  if (commandType === 'DeployCoverageData') {
    await mapLimit(Object.keys(data as DeployCoverageData), concurrencyLimit, async (fileName: string) => {
      const fileInfo = (data as DeployCoverageData)[fileName];
      const formattedFileName = fileName.replace(/no-map[\\/]+/, '');
      const relativeFilePath = await findFilePath(formattedFileName, packageDirectories, repoRoot);

      if (!relativeFilePath) {
        warnings.push(`The file name ${formattedFileName} was not found in any package directory.`);
        return;
      }

      const updatedLines = await setCoveredLines(relativeFilePath, repoRoot, fileInfo.s);
      fileInfo.s = updatedLines;

      handler.processFile(relativeFilePath, formattedFileName, fileInfo.s);
      filesProcessed++;
    });
  } else if (commandType === 'TestCoverageData') {
    await mapLimit(data as TestCoverageData[], concurrencyLimit, async (entry: TestCoverageData) => {
      const name = entry?.name;
      const lines = entry?.lines;

      if (!name || !lines) return;

      const formattedFileName = name.replace(/no-map[\\/]+/, '');
      const relativeFilePath = await findFilePath(formattedFileName, packageDirectories, repoRoot);

      if (!relativeFilePath) {
        warnings.push(`The file name ${formattedFileName} was not found in any package directory.`);
        return;
      }

      handler.processFile(relativeFilePath, formattedFileName, lines);
      filesProcessed++;
    });
  } else {
    throw new Error('Unknown coverage data type. Cannot generate report.');
  }

  const coverageObj = handler.finalize();
  const xml = generateReport(coverageObj, format);
  return { xml, warnings, filesProcessed };
}
