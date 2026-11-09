/* eslint-disable no-await-in-loop */
'use strict';

import { writeFile } from 'node:fs/promises';
import { HandlerRegistry } from '../handlers/HandlerRegistry.js';
import { buildFilePathCache } from '../utils/buildFilePathCache.js';
import { CoverageError } from '../utils/errors.js';
import { getConcurrencyThreshold } from '../utils/getConcurrencyThreshold.js';
import { getPackageDirectories } from '../utils/getPackageDirectories.js';
import { tryReadJson } from '../utils/readJson.js';
import { checkCoverageDataType } from '../utils/setCoverageDataType.js';
import {
  CoverageFormat,
  CoverageInput,
  CoverageProcessingContext,
  DeployCoverageData,
  GeneratedReport,
  TestCoverageData,
  TransformCoverageOptions,
  TransformCoverageResult,
  TransformOptions,
} from '../utils/types.js';
import { mergeDeployCoverageData, mergeTestCoverageData } from './coverageDataMerger.js';
import { createHandlers, processDeployCoverage, processTestCoverage } from './coverageProcessor.js';
import { generateReportContent, getReportPath } from './reportGenerator.js';

export { TransformOptions };

const DEFAULT_OUTPUT_REPORT = 'coverage.xml';

async function loadInputs(inputs: Array<string | CoverageInput>, warnings: string[]): Promise<CoverageInput[]> {
  const loaded = await Promise.all(
    inputs.map(async (input) => {
      if (typeof input !== 'string') return input;
      const raw = await tryReadJson(input, warnings);
      return raw === null ? null : (JSON.parse(raw) as CoverageInput);
    }),
  );
  return loaded.filter((item): item is CoverageInput => item !== null);
}

function validateFormats(formats: string[]): void {
  for (const format of formats) {
    if (!HandlerRegistry.has(format)) {
      throw new CoverageError(
        `Unsupported format: ${format}. Available formats: ${HandlerRegistry.getAvailableFormats().join(', ')}`,
        { code: 'UNSUPPORTED_FORMAT' },
      );
    }
  }
}

function emptyResult(warnings: string[]): TransformCoverageResult {
  return {
    reports: [],
    summary: { lineRate: 0, coveredLines: 0, totalLines: 0, fileCount: 0, files: [] },
    warnings,
    passed: true,
  };
}

/**
 * Transform Salesforce CLI Apex coverage JSON into one or more report formats.
 *
 * @example
 * const { summary, reports } = await transformCoverage({
 *   inputs: ['coverage/coverage/coverage.json'],
 *   formats: ['cobertura', 'markdown'],
 *   write: false,
 * });
 */
export async function transformCoverage(options: TransformCoverageOptions): Promise<TransformCoverageResult> {
  const formats: CoverageFormat[] = options.formats && options.formats.length > 0 ? options.formats : ['sonar'];
  const outputReport = options.outputReport ?? DEFAULT_OUTPUT_REPORT;
  const write = options.write ?? true;
  const warnings: string[] = [];

  validateFormats(formats);

  const parsedItems = await loadInputs(options.inputs, warnings);
  if (parsedItems.length === 0) return emptyResult(warnings);

  const types = parsedItems.map(checkCoverageDataType);

  if (types.some((t) => t === 'Unknown')) {
    throw new CoverageError(
      'The provided JSON does not match a known coverage data format from the Salesforce deploy or test command.',
      { code: 'UNKNOWN_INPUT_FORMAT' },
    );
  }

  const uniqueTypes = [...new Set(types)];
  if (uniqueTypes.length > 1) {
    throw new CoverageError('All coverage JSON files must be the same type (deploy or test).', {
      code: 'MIXED_INPUT_TYPES',
    });
  }

  const commandType = uniqueTypes[0];

  const { repoRoot, packageDirectories } = await getPackageDirectories(
    options.ignorePackageDirectories ?? [],
    options.cwd,
  );
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
    excludePatterns: options.excludePatterns ?? [],
  };

  const processResult =
    commandType === 'DeployCoverageData'
      ? await processDeployCoverage(mergeDeployCoverageData(parsedItems as DeployCoverageData[]), context)
      : await processTestCoverage(mergeTestCoverageData(parsedItems as TestCoverageData[][]), context);

  if (processResult.processed === 0) {
    warnings.push('None of the files listed in the coverage JSON were processed. The coverage report will be empty.');
  }

  const lineRate = processResult.totalLines > 0 ? processResult.coveredLines / processResult.totalLines : 0;

  const renderOptions = options.maxAnnotations !== undefined ? { maxAnnotations: options.maxAnnotations } : undefined;

  const reports: GeneratedReport[] = [];
  for (const [format, handler] of handlers.entries()) {
    const content = generateReportContent(handler.finalize(), format, renderOptions);
    const report: GeneratedReport = { format: format as CoverageFormat, content };
    if (write) {
      report.path = getReportPath(outputReport, format, formats.length);
      await writeFile(report.path, content);
    }
    reports.push(report);
  }

  return {
    reports,
    summary: {
      lineRate,
      coveredLines: processResult.coveredLines,
      totalLines: processResult.totalLines,
      fileCount: processResult.files.length,
      files: processResult.files,
    },
    warnings,
    passed: options.minCoverage === undefined || lineRate * 100 >= options.minCoverage,
  };
}

/**
 * Positional-argument wrapper used by the CLI command and GitHub Action.
 * Library consumers should use {@link transformCoverage}.
 */
export async function transformCoverageReport(
  jsonFilePaths: string[],
  outputReportPath: string,
  formats: string[],
  ignoreDirs: string[],
  options?: TransformOptions,
): Promise<{ finalPaths: string[]; warnings: string[]; lineRate: number; success: boolean }> {
  const result = await transformCoverage({
    inputs: jsonFilePaths,
    outputReport: outputReportPath,
    formats: formats as CoverageFormat[],
    ignorePackageDirectories: ignoreDirs,
    minCoverage: options?.minCoverage,
    maxAnnotations: options?.maxAnnotations,
    excludePatterns: options?.excludePatterns,
  });

  // The wrapper always writes (write defaults to true), so every report has a path.
  const finalPaths = result.reports.map((r) => r.path as string);

  return {
    // Preserve historical behavior: report the requested path even when no inputs could be read.
    finalPaths: finalPaths.length > 0 ? finalPaths : [outputReportPath],
    warnings: result.warnings,
    lineRate: result.summary.lineRate,
    success: result.passed,
  };
}
