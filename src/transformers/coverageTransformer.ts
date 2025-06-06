import { readFile } from 'node:fs/promises';
import { mapLimit } from 'async';

import { getCoverageHandler } from '../handlers/getHandler.js';
import { DeployCoverageData, TestCoverageData } from '../utils/types.js';
import { getPackageDirectories } from '../utils/getPackageDirectories.js';
import { findFilePath } from '../utils/findFilePath.js';
import { setCoveredLines } from '../utils/setCoveredLines.js';
import { getConcurrencyThreshold } from '../utils/getConcurrencyThreshold.js';
import { checkCoverageDataType } from '../utils/setCoverageDataType.js';
import { generateAndWriteReport } from './reportGenerator.js';

type CoverageInput = DeployCoverageData | TestCoverageData[];

export async function transformCoverageReport(
  jsonFilePath: string,
  outputReportPath: string,
  format: string,
  ignoreDirs: string[]
): Promise<{ finalPath: string; warnings: string[] }> {
  const warnings: string[] = [];
  let filesProcessed = 0;
  let jsonData: string;
  try {
    jsonData = await readFile(jsonFilePath, 'utf-8');
  } catch (error) {
    warnings.push(`Failed to read ${jsonFilePath}. Confirm file exists.`);
    return { finalPath: outputReportPath, warnings };
  }

  const parsedData = JSON.parse(jsonData) as CoverageInput;

  const { repoRoot, packageDirectories } = await getPackageDirectories(ignoreDirs);
  const handler = getCoverageHandler(format);
  const commandType = checkCoverageDataType(parsedData);

  const concurrencyLimit = getConcurrencyThreshold();

  if (commandType === 'DeployCoverageData') {
    await mapLimit(Object.keys(parsedData as DeployCoverageData), concurrencyLimit, async (fileName: string) => {
      const fileInfo = (parsedData as DeployCoverageData)[fileName];
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
    await mapLimit(parsedData as TestCoverageData[], concurrencyLimit, async (entry: TestCoverageData) => {
      const name = entry?.name;
      const lines = entry?.lines;

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
    throw new Error(
      'The provided JSON does not match a known coverage data format from the Salesforce deploy or test command.'
    );
  }

  if (filesProcessed === 0) {
    warnings.push('None of the files listed in the coverage JSON were processed. The coverage report will be empty.');
  }

  const coverageObj = handler.finalize();
  const finalPath = await generateAndWriteReport(outputReportPath, coverageObj, format);
  return { finalPath, warnings };
}
