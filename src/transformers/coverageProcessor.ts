/* eslint-disable no-await-in-loop */
'use strict';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getCoverageHandler } from '../handlers/getHandler.js';
import { findFilePath } from '../utils/findFilePath.js';
import { matchesGlob } from '../utils/globMatcher.js';
import { mapLimit } from '../utils/mapLimit.js';
import {
  CoverageProcessingContext,
  DeployCoverageData,
  LineTotals,
  ProcessResult,
  TestCoverageData,
} from '../utils/types.js';

export function createHandlers(formats: string[]): Map<string, ReturnType<typeof getCoverageHandler>> {
  const handlers = new Map<string, ReturnType<typeof getCoverageHandler>>();
  for (const format of formats) {
    handlers.set(format, getCoverageHandler(format));
  }
  return handlers;
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

async function processEntries<T>(
  items: T[],
  context: CoverageProcessingContext,
  getEntry: (item: T) => { name: string; lines: Record<string, number> },
): Promise<ProcessResult> {
  let processed = 0;
  let totalLines = 0;
  let coveredLines = 0;

  await mapLimit(items, context.concurrencyLimit, async (item: T) => {
    const { name, lines } = getEntry(item);
    const formattedName = name.replace(/no-map[\\/]+/, '');
    const path = findFilePath(formattedName, context.filePathCache);

    if (!path) {
      context.warnings.push(`The file name ${formattedName} was not found in any package directory.`);
      return;
    }

    if (context.excludePatterns.some((pattern) => matchesGlob(path, pattern, { matchBase: true }))) {
      return;
    }

    const counts = countLines(lines);
    totalLines += counts.totalLines;
    coveredLines += counts.coveredLines;

    const sourceContent = context.handlers.has('html') ? await readSourceFile(join(context.repoRoot, path)) : undefined;
    for (const handler of context.handlers.values()) {
      handler.processFile(path, formattedName, lines, sourceContent);
    }
    processed++;
  });

  return { processed, totalLines, coveredLines };
}

export function processDeployCoverage(
  data: DeployCoverageData,
  context: CoverageProcessingContext,
): Promise<ProcessResult> {
  return processEntries(Object.keys(data), context, (fileName) => ({ name: fileName, lines: data[fileName].s }));
}

export function processTestCoverage(
  data: TestCoverageData[],
  context: CoverageProcessingContext,
): Promise<ProcessResult> {
  return processEntries(data, context, (entry) => ({ name: entry.name, lines: entry.lines }));
}
