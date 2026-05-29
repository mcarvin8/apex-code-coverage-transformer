'use strict';

import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { normalizePathToUnix } from './normalizePathToUnix.js';

export type FilePathCacheResult = {
  cache: Map<string, string>;
  warnings: string[];
};

type ScanContext = {
  repoRoot: string;
  extensions: string[];
  cache: Map<string, string>;
  warnings: string[];
};

export async function buildFilePathCache(packageDirectories: string[], repoRoot: string): Promise<FilePathCacheResult> {
  const ctx: ScanContext = {
    repoRoot,
    extensions: ['cls', 'trigger'],
    cache: new Map<string, string>(),
    warnings: [],
  };

  await Promise.all(packageDirectories.map(async (directory) => scanDirectory(directory, ctx)));

  return { cache: ctx.cache, warnings: ctx.warnings };
}

async function scanDirectory(directory: string, ctx: ScanContext): Promise<void> {
  let entries: string[];

  try {
    entries = await readdir(directory);
  } catch {
    // Directory doesn't exist or not accessible, skip it
    return;
  }

  const subdirPromises: Array<Promise<void>> = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry);
    let stats;

    try {
      // eslint-disable-next-line no-await-in-loop
      stats = await stat(fullPath);
    } catch {
      // File not accessible, skip it
      continue;
    }

    if (stats.isDirectory()) {
      subdirPromises.push(scanDirectory(fullPath, ctx));
    } else {
      processApexFile(entry, fullPath, ctx);
    }
  }

  await Promise.all(subdirPromises);
}

function processApexFile(entry: string, fullPath: string, ctx: ScanContext): void {
  const ext = entry.split('.').pop();
  if (!ext || !ctx.extensions.includes(ext)) return;

  const relativePath = normalizePathToUnix(relative(ctx.repoRoot, fullPath));
  const nameWithoutExt = entry.substring(0, entry.lastIndexOf('.'));

  if (ctx.cache.has(entry)) {
    ctx.warnings.push(
      `Duplicate Apex file "${entry}" found in multiple package directories. Using "${ctx.cache.get(entry)!}"; ignoring "${relativePath}".`,
    );
    return;
  }

  ctx.cache.set(entry, relativePath);
  if (!ctx.cache.has(nameWithoutExt)) {
    ctx.cache.set(nameWithoutExt, relativePath);
  }
}
