/* eslint-disable no-await-in-loop */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { mapLimit } from 'async';

import { getCoverageHandler } from '../handlers/getHandler.js';
import { DeployCoverageData, TestCoverageData, CoverageProcessingContext } from '../utils/types.js';
import { getPackageDirectories } from '../utils/getPackageDirectories.js';
import { findFilePath } from '../utils/findFilePath.js';
import { buildFilePathCache } from '../utils/buildFilePathCache.js';
import { setCoveredLines, type SetCoveredLinesResult } from '../utils/setCoveredLines.js';
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
  const formatAmount: number = formats.length;
  let filesProcessed = 0;

  const jsonData = await tryReadJson(jsonFilePath, warnings);
  if (!jsonData) return { finalPaths: [outputReportPath], warnings };

  const parsedData = JSON.parse(jsonData) as CoverageInput;
  const { repoRoot, packageDirectories } = await getPackageDirectories(ignoreDirs);
  const handlers = createHandlers(formats);
  const commandType = checkCoverageDataType(parsedData);
  const concurrencyLimit = getConcurrencyThreshold();

  // Build file path cache upfront to avoid O(n*m) directory traversals
  const filePathCache = await buildFilePathCache(packageDirectories, repoRoot);

  const context: CoverageProcessingContext = {
    handlers,
    packageDirs: packageDirectories,
    repoRoot,
    concurrencyLimit,
    warnings,
    filePathCache,
  };

  if (commandType === 'DeployCoverageData') {
    filesProcessed = await processDeployCoverage(parsedData as DeployCoverageData, context);
  } else if (commandType === 'TestCoverageData') {
    filesProcessed = await processTestCoverage(parsedData as TestCoverageData[], context);
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
    const finalPath = await generateAndWriteReport(outputReportPath, coverageObj, format, formatAmount);
    finalPaths.push(finalPath);
  }

  return { finalPaths, warnings };
}

function hasSourceContent(
  result: SetCoveredLinesResult
): result is { updatedLines: Record<string, number>; sourceContent: string } {
  return typeof result === 'object' && result !== null && 'sourceContent' in result;
}

async function readSourceFile(absolutePath: string): Promise<string | undefined> {
  try {
    return await readFile(absolutePath, 'utf-8');
  } catch {
    return undefined;
  }
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

async function processDeployCoverage(data: DeployCoverageData, context: CoverageProcessingContext): Promise<number> {
  let processed = 0;
  await mapLimit(Object.keys(data), context.concurrencyLimit, async (fileName: string) => {
    const fileInfo = data[fileName];
    const formattedName = fileName.replace(/no-map[\\/]+/, '');
    const path = findFilePath(formattedName, context.filePathCache);

    if (!path) {
      context.warnings.push(`The file name ${formattedName} was not found in any package directory.`);
      return;
    }

    const setCoveredResult = await setCoveredLines(path, context.repoRoot, fileInfo.s, context.handlers.has('html'));
    const updatedLines = hasSourceContent(setCoveredResult) ? setCoveredResult.updatedLines : setCoveredResult;
    const sourceContent = hasSourceContent(setCoveredResult) ? setCoveredResult.sourceContent : undefined;
    fileInfo.s = updatedLines;
    for (const handler of context.handlers.values()) {
      handler.processFile(path, formattedName, updatedLines, sourceContent);
    }
    processed++;
  });
  return processed;
}

async function processTestCoverage(data: TestCoverageData[], context: CoverageProcessingContext): Promise<number> {
  let processed = 0;
  // eslint-disable-next-line @typescript-eslint/require-await
  await mapLimit(data, context.concurrencyLimit, async (entry: TestCoverageData) => {
    const formattedName = entry.name.replace(/no-map[\\/]+/, '');
    const path = findFilePath(formattedName, context.filePathCache);

    if (!path) {
      context.warnings.push(`The file name ${formattedName} was not found in any package directory.`);
      return;
    }

    const sourceContent = context.handlers.has('html') ? await readSourceFile(join(context.repoRoot, path)) : undefined;
    for (const handler of context.handlers.values()) {
      handler.processFile(path, formattedName, entry.lines, sourceContent);
    }
    processed++;
  });
  return processed;
}
