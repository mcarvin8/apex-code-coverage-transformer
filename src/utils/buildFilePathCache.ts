'use strict';

import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { normalizePathToUnix } from './normalizePathToUnix.js';

export type FilePathCacheResult = {
  cache: Map<string, string>;
  warnings: string[];
};

export async function buildFilePathCache(packageDirectories: string[], repoRoot: string): Promise<FilePathCacheResult> {
  const cache = new Map<string, string>();
  const warnings: string[] = [];
  const extensions = ['cls', 'trigger'];

  await Promise.all(
    packageDirectories.map(async (directory) => {
      await scanDirectory(directory, repoRoot, extensions, cache, warnings);
    }),
  );

  return { cache, warnings };
}

async function scanDirectory(
  directory: string,
  repoRoot: string,
  extensions: string[],
  cache: Map<string, string>,
  warnings: string[],
): Promise<void> {
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
      subdirPromises.push(scanDirectory(fullPath, repoRoot, extensions, cache, warnings));
    } else {
      processApexFile(entry, fullPath, repoRoot, extensions, cache, warnings);
    }
  }

  await Promise.all(subdirPromises);
}

function processApexFile(
  entry: string,
  fullPath: string,
  repoRoot: string,
  extensions: string[],
  cache: Map<string, string>,
  warnings: string[],
): void {
  const ext = entry.split('.').pop();
  if (!ext || !extensions.includes(ext)) return;

  const relativePath = normalizePathToUnix(relative(repoRoot, fullPath));
  const nameWithoutExt = entry.substring(0, entry.lastIndexOf('.'));

  if (cache.has(entry)) {
    warnings.push(
      `Duplicate Apex file "${entry}" found in multiple package directories. Using "${cache.get(entry)!}"; ignoring "${relativePath}".`,
    );
    return;
  }

  cache.set(entry, relativePath);
  if (!cache.has(nameWithoutExt)) {
    cache.set(nameWithoutExt, relativePath);
  }
}
