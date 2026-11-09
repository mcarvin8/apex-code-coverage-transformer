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
  FileCoverageSummary,
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

async function loadSourceContent(path: string, context: CoverageProcessingContext): Promise<string | undefined> {
  if (!context.handlers.has('html')) {
    return undefined;
  }
  const content = await readSourceFile(join(context.repoRoot, path));
  if (content === undefined) {
    context.warnings.push(
      `Could not read source file ${path}; the HTML report will show coverage for this file without line contents.`,
    );
  }
  return content;
}

export function countLines(lines: Record<string, number>): LineTotals {
  const totalLines = Object.keys(lines).length;
  const coveredLines = Object.values(lines).filter((v) => v === 1).length;
  return { totalLines, coveredLines };
}

type ResolvedLines = { lines: Record<string, number>; sourceContent?: string };

async function processEntries<T>(
  items: T[],
  context: CoverageProcessingContext,
  getName: (item: T) => string,
  resolveLines: (item: T, path: string) => Promise<ResolvedLines>,
): Promise<ProcessResult> {
  let processed = 0;
  let totalLines = 0;
  let coveredLines = 0;
  const files: FileCoverageSummary[] = [];

  await mapLimit(items, context.concurrencyLimit, async (item: T) => {
    const formattedName = getName(item).replace(/no-map[\\/]+/, '');
    const path = findFilePath(formattedName, context.filePathCache);

    if (!path) {
      context.warnings.push(`The file name ${formattedName} was not found in any package directory.`);
      return;
    }

    if (context.excludePatterns.some((pattern) => matchesGlob(path, pattern, { matchBase: true }))) {
      return;
    }

    const { lines, sourceContent } = await resolveLines(item, path);

    const counts = countLines(lines);
    totalLines += counts.totalLines;
    coveredLines += counts.coveredLines;
    files.push(summarizeFile(path, formattedName, lines, counts));

    for (const handler of context.handlers.values()) {
      handler.processFile(path, formattedName, lines, sourceContent);
    }
    processed++;
  });

  files.sort((a, b) => a.path.localeCompare(b.path));
  return { processed, totalLines, coveredLines, files };
}

function summarizeFile(
  path: string,
  name: string,
  lines: Record<string, number>,
  counts: LineTotals,
): FileCoverageSummary {
  const uncoveredLines = Object.entries(lines)
    .filter(([, hit]) => hit !== 1)
    .map(([line]) => Number(line))
    .sort((a, b) => a - b);
  return {
    path,
    name,
    totalLines: counts.totalLines,
    coveredLines: counts.coveredLines,
    lineRate: counts.totalLines > 0 ? counts.coveredLines / counts.totalLines : 0,
    uncoveredLines,
  };
}

export function processDeployCoverage(
  data: DeployCoverageData,
  context: CoverageProcessingContext,
): Promise<ProcessResult> {
  return processEntries(
    Object.keys(data),
    context,
    (fileName) => fileName,
    async (fileName, path) => ({
      lines: data[fileName].s,
      sourceContent: await loadSourceContent(path, context),
    }),
  );
}

export function processTestCoverage(
  data: TestCoverageData[],
  context: CoverageProcessingContext,
): Promise<ProcessResult> {
  return processEntries(
    data,
    context,
    (entry) => entry.name,
    async (entry, path) => ({
      lines: entry.lines,
      sourceContent: await loadSourceContent(path, context),
    }),
  );
}
