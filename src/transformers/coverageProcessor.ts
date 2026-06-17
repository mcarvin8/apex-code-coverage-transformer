/* eslint-disable no-await-in-loop */
'use strict';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { matchesGlob } from '../utils/globMatcher.js';
import { getCoverageHandler } from '../handlers/getHandler.js';
import {
  DeployCoverageData,
  TestCoverageData,
  CoverageProcessingContext,
  LineTotals,
  ProcessResult,
} from '../utils/types.js';
import { findFilePath } from '../utils/findFilePath.js';
import { setCoveredLines, type SetCoveredLinesResult } from '../utils/setCoveredLines.js';
import { mapLimit } from '../utils/mapLimit.js';

export function createHandlers(formats: string[]): Map<string, ReturnType<typeof getCoverageHandler>> {
  const handlers = new Map<string, ReturnType<typeof getCoverageHandler>>();
  for (const format of formats) {
    handlers.set(format, getCoverageHandler(format));
  }
  return handlers;
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

export function countLines(lines: Record<string, number>): LineTotals {
  const totalLines = Object.keys(lines).length;
  const coveredLines = Object.values(lines).filter((v) => v === 1).length;
  return { totalLines, coveredLines };
}

export async function processDeployCoverage(
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

    if (context.excludePatterns.some((pattern) => matchesGlob(path, pattern, { matchBase: true }))) {
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

export async function processTestCoverage(
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

    if (context.excludePatterns.some((pattern) => matchesGlob(path, pattern, { matchBase: true }))) {
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
