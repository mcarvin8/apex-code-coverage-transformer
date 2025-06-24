/* eslint-disable no-await-in-loop */
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
  formats: string[],
  ignoreDirs: string[]
): Promise<{ finalPaths: string[]; warnings: string[] }> {
  const warnings: string[] = [];
  const finalPaths: string[] = [];
  let filesProcessed = 0;

  const jsonData = await tryReadJson(jsonFilePath, warnings);
  if (!jsonData) return { finalPaths: [outputReportPath], warnings };

  const parsedData = JSON.parse(jsonData) as CoverageInput;
  const { repoRoot, packageDirectories } = await getPackageDirectories(ignoreDirs);
  const handlers = createHandlers(formats);
  const commandType = checkCoverageDataType(parsedData);
  const concurrencyLimit = getConcurrencyThreshold();

  if (commandType === 'DeployCoverageData') {
    filesProcessed = await processDeployCoverage(
      parsedData as DeployCoverageData,
      handlers,
      packageDirectories,
      repoRoot,
      concurrencyLimit,
      warnings
    );
  } else if (commandType === 'TestCoverageData') {
    filesProcessed = await processTestCoverage(
      parsedData as TestCoverageData[],
      handlers,
      packageDirectories,
      repoRoot,
      concurrencyLimit,
      warnings
    );
  } else {
    throw new Error(
      'The provided JSON does not match a known coverage data format from the Salesforce deploy or test command.'
    );
  }

  if (filesProcessed === 0) {
    warnings.push('None of the files listed in the coverage JSON were processed. The coverage report will be empty.');
  }

  for (const [format, handler] of handlers.entries()) {
    const coverageObj = handler.finalize();
    const finalPath = await generateAndWriteReport(outputReportPath, coverageObj, format, formats);
    finalPaths.push(finalPath);
  }

  return { finalPaths, warnings };
}

async function tryReadJson(path: string, warnings: string[]): Promise<string | null> {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    warnings.push(`Failed to read ${path}. Confirm file exists.`);
    return null;
  }
}

function createHandlers(formats: string[]): Map<string, ReturnType<typeof getCoverageHandler>> {
  const handlers = new Map<string, ReturnType<typeof getCoverageHandler>>();
  for (const format of formats) {
    handlers.set(format, getCoverageHandler(format));
  }
  return handlers;
}

async function processDeployCoverage(
  data: DeployCoverageData,
  handlers: Map<string, ReturnType<typeof getCoverageHandler>>,
  packageDirs: string[],
  repoRoot: string,
  concurrencyLimit: number,
  warnings: string[]
): Promise<number> {
  let processed = 0;
  await mapLimit(Object.keys(data), concurrencyLimit, async (fileName: string) => {
    const fileInfo = data[fileName];
    const formattedName = fileName.replace(/no-map[\\/]+/, '');
    const path = await findFilePath(formattedName, packageDirs, repoRoot);

    if (!path) {
      warnings.push(`The file name ${formattedName} was not found in any package directory.`);
      return;
    }

    fileInfo.s = await setCoveredLines(path, repoRoot, fileInfo.s);
    for (const handler of handlers.values()) {
      handler.processFile(path, formattedName, fileInfo.s);
    }
    processed++;
  });
  return processed;
}

async function processTestCoverage(
  data: TestCoverageData[],
  handlers: Map<string, ReturnType<typeof getCoverageHandler>>,
  packageDirs: string[],
  repoRoot: string,
  concurrencyLimit: number,
  warnings: string[]
): Promise<number> {
  let processed = 0;
  await mapLimit(data, concurrencyLimit, async (entry: TestCoverageData) => {
    const formattedName = entry.name.replace(/no-map[\\/]+/, '');
    const path = await findFilePath(formattedName, packageDirs, repoRoot);

    if (!path) {
      warnings.push(`The file name ${formattedName} was not found in any package directory.`);
      return;
    }

    for (const handler of handlers.values()) {
      handler.processFile(path, formattedName, entry.lines);
    }
    processed++;
  });
  return processed;
}
