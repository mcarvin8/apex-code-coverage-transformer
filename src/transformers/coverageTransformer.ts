/* eslint-disable no-await-in-loop */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { getCoverageHandler } from '../handlers/getHandler.js';
import { DeployCoverageData, TestCoverageData, CoverageProcessingContext } from '../utils/types.js';
import { getPackageDirectories } from '../utils/getPackageDirectories.js';
import { findFilePath } from '../utils/findFilePath.js';
import { buildFilePathCache } from '../utils/buildFilePathCache.js';
import { setCoveredLines, type SetCoveredLinesResult } from '../utils/setCoveredLines.js';
import { getConcurrencyThreshold } from '../utils/getConcurrencyThreshold.js';
import { checkCoverageDataType } from '../utils/setCoverageDataType.js';
import { mapLimit } from '../utils/mapLimit.js';
import { generateAndWriteReport } from './reportGenerator.js';

type CoverageInput = DeployCoverageData | TestCoverageData[];

type LineTotals = { totalLines: number; coveredLines: number };
type ProcessResult = { processed: number } & LineTotals;

export type TransformOptions = {
  minCoverage?: number;
  maxAnnotations?: number;
};

export async function transformCoverageReport(
  jsonFilePath: string,
  outputReportPath: string,
  formats: string[],
  ignoreDirs: string[],
  options?: TransformOptions,
): Promise<{ finalPaths: string[]; warnings: string[]; lineRate: number }> {
  const warnings: string[] = [];
  const finalPaths: string[] = [];
  const formatAmount: number = formats.length;

  const jsonData = await tryReadJson(jsonFilePath, warnings);
  if (!jsonData) return { finalPaths: [outputReportPath], warnings, lineRate: 0 };

  const parsedData = JSON.parse(jsonData) as CoverageInput;
  const { repoRoot, packageDirectories } = await getPackageDirectories(ignoreDirs);
  const handlers = createHandlers(formats);
  const commandType = checkCoverageDataType(parsedData);
  const concurrencyLimit = getConcurrencyThreshold();

  // Build file path cache upfront to avoid O(n*m) directory traversals
  const { cache: filePathCache, warnings: cacheWarnings } = await buildFilePathCache(packageDirectories, repoRoot);
  warnings.push(...cacheWarnings);

  const context: CoverageProcessingContext = {
    handlers,
    packageDirs: packageDirectories,
    repoRoot,
    concurrencyLimit,
    warnings,
    filePathCache,
  };

  let processResult: ProcessResult;

  if (commandType === 'DeployCoverageData') {
    processResult = await processDeployCoverage(parsedData as DeployCoverageData, context);
  } else if (commandType === 'TestCoverageData') {
    processResult = await processTestCoverage(parsedData as TestCoverageData[], context);
  } else {
    throw new Error(
      'The provided JSON does not match a known coverage data format from the Salesforce deploy or test command.',
    );
  }

  if (processResult.processed === 0) {
    warnings.push('None of the files listed in the coverage JSON were processed. The coverage report will be empty.');
  }

  const lineRate = processResult.totalLines > 0 ? processResult.coveredLines / processResult.totalLines : 0;

  const renderOptions = options?.maxAnnotations !== undefined ? { maxAnnotations: options.maxAnnotations } : undefined;

  for (const [format, handler] of handlers.entries()) {
    const coverageObj = handler.finalize();
    const finalPath = await generateAndWriteReport(outputReportPath, coverageObj, format, formatAmount, renderOptions);
    finalPaths.push(finalPath);
  }

  if (options?.minCoverage !== undefined && lineRate * 100 < options.minCoverage) {
    throw new Error(
      `Coverage of ${(lineRate * 100).toFixed(2)}% is below the required minimum of ${options.minCoverage}%.`,
    );
  }

  return { finalPaths, warnings, lineRate };
}

function hasSourceContent(
  result: SetCoveredLinesResult,
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

function countLines(lines: Record<string, number>): LineTotals {
  const totalLines = Object.keys(lines).length;
  const coveredLines = Object.values(lines).filter((v) => v === 1).length;
  return { totalLines, coveredLines };
}

async function processDeployCoverage(
  data: DeployCoverageData,
  context: CoverageProcessingContext,
): Promise<ProcessResult> {
  let processed = 0;
  let totalLines = 0;
  let coveredLines = 0;

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

    const counts = countLines(updatedLines);
    totalLines += counts.totalLines;
    coveredLines += counts.coveredLines;

    for (const handler of context.handlers.values()) {
      handler.processFile(path, formattedName, updatedLines, sourceContent);
    }
    processed++;
  });

  return { processed, totalLines, coveredLines };
}

async function processTestCoverage(
  data: TestCoverageData[],
  context: CoverageProcessingContext,
): Promise<ProcessResult> {
  let processed = 0;
  let totalLines = 0;
  let coveredLines = 0;

  await mapLimit(data, context.concurrencyLimit, async (entry: TestCoverageData) => {
    const formattedName = entry.name.replace(/no-map[\\/]+/, '');
    const path = findFilePath(formattedName, context.filePathCache);

    if (!path) {
      context.warnings.push(`The file name ${formattedName} was not found in any package directory.`);
      return;
    }

    const counts = countLines(entry.lines);
    totalLines += counts.totalLines;
    coveredLines += counts.coveredLines;

    const sourceContent = context.handlers.has('html') ? await readSourceFile(join(context.repoRoot, path)) : undefined;
    for (const handler of context.handlers.values()) {
      handler.processFile(path, formattedName, entry.lines, sourceContent);
    }
    processed++;
  });

  return { processed, totalLines, coveredLines };
}
