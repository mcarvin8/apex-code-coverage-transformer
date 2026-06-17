/* eslint-disable no-await-in-loop */
'use strict';

import {
  CoverageInput,
  DeployCoverageData,
  TestCoverageData,
  CoverageProcessingContext,
  TransformOptions,
} from '../utils/types.js';
import { getPackageDirectories } from '../utils/getPackageDirectories.js';
import { buildFilePathCache } from '../utils/buildFilePathCache.js';
import { getConcurrencyThreshold } from '../utils/getConcurrencyThreshold.js';
import { checkCoverageDataType } from '../utils/setCoverageDataType.js';
import { tryReadJson } from '../utils/readJson.js';
import { generateAndWriteReport } from './reportGenerator.js';
import { mergeDeployCoverageData, mergeTestCoverageData } from './coverageDataMerger.js';
import { createHandlers, processDeployCoverage, processTestCoverage } from './coverageProcessor.js';

export { TransformOptions };

export async function transformCoverageReport(
  jsonFilePaths: string[],
  outputReportPath: string,
  formats: string[],
  ignoreDirs: string[],
  options?: TransformOptions,
): Promise<{ finalPaths: string[]; warnings: string[]; lineRate: number }> {
  const warnings: string[] = [];
  const finalPaths: string[] = [];
  const formatAmount: number = formats.length;

  const jsonDataItems = await Promise.all(jsonFilePaths.map((p) => tryReadJson(p, warnings)));
  const validData = jsonDataItems.filter((d): d is string => d !== null);

  if (validData.length === 0) return { finalPaths: [outputReportPath], warnings, lineRate: 0 };

  const parsedItems = validData.map((d) => JSON.parse(d) as CoverageInput);
  const types = parsedItems.map(checkCoverageDataType);

  if (types.some((t) => t === 'Unknown')) {
    throw new Error(
      'The provided JSON does not match a known coverage data format from the Salesforce deploy or test command.',
    );
  }

  const uniqueTypes = [...new Set(types)];
  if (uniqueTypes.length > 1) {
    throw new Error('All coverage JSON files must be the same type (deploy or test).');
  }

  const commandType = uniqueTypes[0];

  const { repoRoot, packageDirectories } = await getPackageDirectories(ignoreDirs);
  const handlers = createHandlers(formats);
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
    excludePatterns: options?.excludePatterns ?? [],
  };

  const processResult =
    commandType === 'DeployCoverageData'
      ? await processDeployCoverage(mergeDeployCoverageData(parsedItems as DeployCoverageData[]), context)
      : await processTestCoverage(mergeTestCoverageData(parsedItems as TestCoverageData[][]), context);

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
